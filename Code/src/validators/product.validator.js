const AppError = require('../utils/AppError');

function parseProductId(param) {
  const id = Number.parseInt(param, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Invalid product ID parameter.', 400);
  }
  return id;
}

function parseVariantId(param) {
  const id = Number.parseInt(param, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Invalid variant ID parameter.', 400);
  }
  return id;
}

function parseBoolean(val) {
  if (val === undefined || val === '') return undefined;
  if (val === 'true' || val === true) return true;
  if (val === 'false' || val === false) return false;
  throw new AppError('inStock query parameter must be true or false.', 400);
}

function validateProductQuery(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const brand = typeof query.brand === 'string' ? query.brand.trim() : '';

  let categoryId = undefined;
  if (query.categoryId) {
    const cid = Number.parseInt(query.categoryId, 10);
    if (!Number.isInteger(cid) || cid <= 0) {
      throw new AppError('categoryId must be a positive integer.', 400);
    }
    categoryId = cid;
  }
  const categoryName = typeof query.category === 'string' ? query.category.trim() : undefined;

  let minPrice = undefined;
  if (query.minPrice !== undefined && query.minPrice !== '') {
    const min = Number.parseFloat(query.minPrice);
    if (Number.isNaN(min) || min < 0) {
      throw new AppError('minPrice must be a non-negative number.', 400);
    }
    minPrice = min;
  }

  let maxPrice = undefined;
  if (query.maxPrice !== undefined && query.maxPrice !== '') {
    const max = Number.parseFloat(query.maxPrice);
    if (Number.isNaN(max) || max < 0) {
      throw new AppError('maxPrice must be a non-negative number.', 400);
    }
    maxPrice = max;
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new AppError('minPrice cannot be greater than maxPrice.', 400);
  }

  const inStock = parseBoolean(query.inStock);

  const allowedSort = ['newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc'];
  const sortBy = allowedSort.includes(query.sortBy) ? query.sortBy : 'newest';

  // Extract specs filters from query:
  // e.g., query.specs = { Socket: 'LGA1700' } OR query['spec_Socket'] = 'LGA1700'
  const specs = {};
  if (query.specs && typeof query.specs === 'object') {
    for (const [key, val] of Object.entries(query.specs)) {
      if (typeof val === 'string' && val.trim()) {
        specs[key.trim()] = val.trim();
      }
    }
  }
  for (const [key, val] of Object.entries(query)) {
    if (key.startsWith('spec_') && typeof val === 'string' && val.trim()) {
      const specName = key.replace('spec_', '').trim();
      specs[specName] = val.trim();
    }
  }

  return {
    page,
    limit,
    search,
    categoryId,
    categoryName,
    brand,
    minPrice,
    maxPrice,
    inStock,
    specs,
    sortBy,
  };
}

function normalizeSpecsInput(specs) {
  if (!specs) return [];
  if (Array.isArray(specs)) {
    return specs.map((item, idx) => {
      if (!item || typeof item !== 'object') {
        throw new AppError(`specs[${idx}] must be an object with specName and specValue.`, 400);
      }
      const name = String(item.specName || item.name || '').trim();
      const val = String(item.specValue || item.value || '').trim();
      if (!name || !val) {
        throw new AppError(`specs[${idx}] must have non-empty specName and specValue.`, 400);
      }
      return { specName: name, specValue: val };
    });
  }
  if (typeof specs === 'object') {
    return Object.entries(specs).map(([key, val]) => {
      const name = String(key).trim();
      const value = String(val).trim();
      if (!name || !value) {
        throw new AppError('Spec key and value must not be empty.', 400);
      }
      return { specName: name, specValue: value };
    });
  }
  throw new AppError('specs must be an array or an object map.', 400);
}

function normalizeVariantsInput(variants) {
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    throw new AppError('At least one product variant is required.', 400);
  }
  return variants.map((v, idx) => {
    if (!v || typeof v !== 'object') {
      throw new AppError(`variants[${idx}] must be a valid variant object.`, 400);
    }
    const sku = String(v.sku || '').trim();
    if (!sku) throw new AppError(`variants[${idx}].sku is required.`, 400);
    if (sku.length > 50) throw new AppError(`variants[${idx}].sku exceeds 50 characters.`, 400);

    const price = Number.parseFloat(v.price);
    if (Number.isNaN(price) || price < 0) {
      throw new AppError(`variants[${idx}].price must be a non-negative number.`, 400);
    }

    const stock = v.stockQuantity !== undefined ? Number.parseInt(v.stockQuantity, 10) : 0;
    if (!Number.isInteger(stock) || stock < 0) {
      throw new AppError(`variants[${idx}].stockQuantity must be an integer >= 0.`, 400);
    }

    const threshold = v.lowStockThreshold !== undefined ? Number.parseInt(v.lowStockThreshold, 10) : 5;
    if (!Number.isInteger(threshold) || threshold < 0) {
      throw new AppError(`variants[${idx}].lowStockThreshold must be an integer >= 0.`, 400);
    }

    return {
      sku,
      price,
      stockQuantity: stock,
      lowStockThreshold: threshold,
    };
  });
}

function validateProductCreatePayload(body) {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be a JSON object.', 400);
  }
  const { name, brand, categoryId, description, specs, variants } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new AppError('Product name must be at least 2 characters.', 400);
  }
  if (name.trim().length > 150) {
    throw new AppError('Product name cannot exceed 150 characters.', 400);
  }
  if (!brand || typeof brand !== 'string' || brand.trim().length === 0) {
    throw new AppError('Product brand is required.', 400);
  }
  if (brand.trim().length > 50) {
    throw new AppError('Product brand cannot exceed 50 characters.', 400);
  }
  const catId = Number.parseInt(categoryId, 10);
  if (!Number.isInteger(catId) || catId <= 0) {
    throw new AppError('categoryId is required and must be a positive integer.', 400);
  }

  return {
    name: name.trim(),
    brand: brand.trim(),
    categoryId: catId,
    description: description ? String(description).trim() : null,
    specs: normalizeSpecsInput(specs),
    variants: normalizeVariantsInput(variants),
  };
}

function validateProductUpdatePayload(body) {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be a JSON object.', 400);
  }
  const { name, brand, categoryId, description, specs } = body;

  const result = {};
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      throw new AppError('Product name must be at least 2 characters.', 400);
    }
    if (name.trim().length > 150) {
      throw new AppError('Product name cannot exceed 150 characters.', 400);
    }
    result.name = name.trim();
  }
  if (brand !== undefined) {
    if (typeof brand !== 'string' || brand.trim().length === 0) {
      throw new AppError('Product brand cannot be empty.', 400);
    }
    if (brand.trim().length > 50) {
      throw new AppError('Product brand cannot exceed 50 characters.', 400);
    }
    result.brand = brand.trim();
  }
  if (categoryId !== undefined) {
    const catId = Number.parseInt(categoryId, 10);
    if (!Number.isInteger(catId) || catId <= 0) {
      throw new AppError('categoryId must be a positive integer.', 400);
    }
    result.categoryId = catId;
  }
  if (description !== undefined) {
    result.description = description ? String(description).trim() : null;
  }
  if (specs !== undefined) {
    result.specs = normalizeSpecsInput(specs);
  }
  return result;
}

function validateVariantPayload(body) {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be a JSON object.', 400);
  }
  const { sku, price, stockQuantity, lowStockThreshold } = body;
  const result = {};

  if (sku !== undefined) {
    const trimmedSku = String(sku).trim();
    if (!trimmedSku || trimmedSku.length > 50) {
      throw new AppError('Variant sku must be between 1 and 50 characters.', 400);
    }
    result.sku = trimmedSku;
  }

  if (price !== undefined) {
    const p = Number.parseFloat(price);
    if (Number.isNaN(p) || p < 0) {
      throw new AppError('price must be a non-negative number.', 400);
    }
    result.price = p;
  }

  if (stockQuantity !== undefined) {
    const s = Number.parseInt(stockQuantity, 10);
    if (!Number.isInteger(s) || s < 0) {
      throw new AppError('stockQuantity must be an integer >= 0.', 400);
    }
    result.stockQuantity = s;
  }

  if (lowStockThreshold !== undefined) {
    const t = Number.parseInt(lowStockThreshold, 10);
    if (!Number.isInteger(t) || t < 0) {
      throw new AppError('lowStockThreshold must be an integer >= 0.', 400);
    }
    result.lowStockThreshold = t;
  }

  return result;
}

module.exports = {
  parseProductId,
  parseVariantId,
  validateProductQuery,
  validateProductCreatePayload,
  validateProductUpdatePayload,
  validateVariantPayload,
};
