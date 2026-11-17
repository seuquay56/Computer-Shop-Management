const productRepo = require('../repositories/product.repository');
const categoryRepo = require('../repositories/category.repository');
const { query } = require('../config/db');
const AppError = require('../utils/AppError');

async function listProducts(filterParams) {
  return productRepo.listProducts(filterParams);
}

async function getProduct(productId) {
  const product = await productRepo.findById(productId);
  if (!product) {
    throw new AppError('Product not found.', 404);
  }
  return product;
}

async function createProduct(payload) {
  // Validate category
  const category = await categoryRepo.findById(payload.categoryId);
  if (!category) {
    throw new AppError(`Category with ID ${payload.categoryId} does not exist.`, 404);
  }

  // Check SKU uniqueness
  const skus = new Set();
  for (const v of payload.variants) {
    if (skus.has(v.sku.toLowerCase())) {
      throw new AppError(`Duplicate SKU '${v.sku}' in product creation payload.`, 400);
    }
    skus.add(v.sku.toLowerCase());

    const existingVariant = await productRepo.findVariantBySku(v.sku);
    if (existingVariant) {
      throw new AppError(`SKU '${v.sku}' is already in use by another product variant.`, 409);
    }
  }

  return productRepo.createProductWithDetails(payload);
}

async function updateProduct(productId, payload) {
  await getProduct(productId);
  if (payload.categoryId) {
    const category = await categoryRepo.findById(payload.categoryId);
    if (!category) {
      throw new AppError(`Category with ID ${payload.categoryId} does not exist.`, 404);
    }
  }
  return productRepo.updateProduct(productId, payload);
}

async function deleteProduct(productId) {
  await getProduct(productId);

  // Check if any variant of this product is referenced in orders
  const orderRef = await query(
    `SELECT COUNT(*)::int AS count
       FROM order_items oi
       JOIN product_variants pv ON pv.variant_id = oi.variant_id
      WHERE pv.product_id = $1`,
    [productId]
  );
  if (orderRef.rows[0].count > 0) {
    throw new AppError(
      `Cannot delete product because its variants are referenced in existing customer orders.`,
      400
    );
  }

  return productRepo.deleteProduct(productId);
}

async function addVariant(productId, payload) {
  await getProduct(productId);
  const existing = await productRepo.findVariantBySku(payload.sku);
  if (existing) {
    throw new AppError(`SKU '${payload.sku}' is already in use.`, 409);
  }
  return productRepo.addVariant(productId, payload);
}

async function updateVariant(variantId, payload) {
  const current = await productRepo.findVariantById(variantId);
  if (!current) {
    throw new AppError('Product variant not found.', 404);
  }
  if (payload.sku && payload.sku.toLowerCase() !== current.sku.toLowerCase()) {
    const existing = await productRepo.findVariantBySku(payload.sku);
    if (existing && Number(existing.variant_id) !== Number(variantId)) {
      throw new AppError(`SKU '${payload.sku}' is already in use by another variant.`, 409);
    }
  }
  return productRepo.updateVariant(variantId, payload);
}

async function deleteVariant(variantId) {
  const current = await productRepo.findVariantById(variantId);
  if (!current) {
    throw new AppError('Product variant not found.', 404);
  }

  const orderRef = await query(
    `SELECT COUNT(*)::int AS count FROM order_items WHERE variant_id = $1`,
    [variantId]
  );
  if (orderRef.rows[0].count > 0) {
    throw new AppError(
      'Cannot delete variant because it is referenced in customer order history.',
      400
    );
  }

  return productRepo.deleteVariant(variantId);
}

async function getFilterOptions() {
  return productRepo.getFilterOptions();
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  deleteVariant,
  getFilterOptions,
};
