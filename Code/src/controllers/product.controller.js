const productService = require('../services/product.service');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/http');
const {
  parseProductId,
  parseVariantId,
  validateProductQuery,
  validateProductCreatePayload,
  validateProductUpdatePayload,
  validateVariantPayload,
} = require('../validators/product.validator');

const list = asyncHandler(async (req, res) => {
  const queryParams = validateProductQuery(req.query);
  const result = await productService.listProducts(queryParams);
  return success(res, {
    products: result.products,
    pagination: {
      page: queryParams.page,
      limit: queryParams.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / queryParams.limit),
    },
    appliedFilters: {
      search: queryParams.search || null,
      categoryId: queryParams.categoryId || null,
      categoryName: queryParams.categoryName || null,
      brand: queryParams.brand || null,
      minPrice: queryParams.minPrice ?? null,
      maxPrice: queryParams.maxPrice ?? null,
      inStock: queryParams.inStock ?? null,
      specs: Object.keys(queryParams.specs).length ? queryParams.specs : null,
      sortBy: queryParams.sortBy,
    },
  });
});

const getOne = asyncHandler(async (req, res) => {
  const productId = parseProductId(req.params.productId);
  const product = await productService.getProduct(productId);
  return success(res, { product });
});

const create = asyncHandler(async (req, res) => {
  const payload = validateProductCreatePayload(req.body);
  const product = await productService.createProduct(payload);
  return success(res, { product }, 201, 'Product created successfully with variants and specs.');
});

const update = asyncHandler(async (req, res) => {
  const productId = parseProductId(req.params.productId);
  const payload = validateProductUpdatePayload(req.body);
  const product = await productService.updateProduct(productId, payload);
  return success(res, { product }, 200, 'Product updated successfully.');
});

const remove = asyncHandler(async (req, res) => {
  const productId = parseProductId(req.params.productId);
  await productService.deleteProduct(productId);
  return success(res, null, 200, 'Product deleted successfully.');
});

// Variant endpoints
const addVariant = asyncHandler(async (req, res) => {
  const productId = parseProductId(req.params.productId);
  const payload = validateVariantPayload(req.body);
  if (!payload.sku || payload.price === undefined) {
    return res.status(400).json({ success: false, message: 'sku and price are required for a variant.' });
  }
  const variant = await productService.addVariant(productId, payload);
  return success(res, { variant }, 201, 'Product variant added successfully.');
});

const updateVariant = asyncHandler(async (req, res) => {
  const variantId = parseVariantId(req.params.variantId);
  const payload = validateVariantPayload(req.body);
  const variant = await productService.updateVariant(variantId, payload);
  return success(res, { variant }, 200, 'Product variant updated successfully.');
});

const removeVariant = asyncHandler(async (req, res) => {
  const variantId = parseVariantId(req.params.variantId);
  await productService.deleteVariant(variantId);
  return success(res, null, 200, 'Product variant removed successfully.');
});

const getFilterOptions = asyncHandler(async (_req, res) => {
  const options = await productService.getFilterOptions();
  return success(res, { filterOptions: options });
});

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  addVariant,
  updateVariant,
  removeVariant,
  getFilterOptions,
};
