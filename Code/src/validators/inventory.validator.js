const AppError = require('../utils/AppError');

function parseVariantId(param) {
  const id = Number.parseInt(param, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Invalid variant ID parameter.', 400);
  }
  return id;
}

function validateInventoryQuery(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const status = ['all', 'low_stock', 'out_of_stock', 'in_stock'].includes(query.status)
    ? query.status
    : 'all';

  let categoryId = undefined;
  if (query.categoryId) {
    const cid = Number.parseInt(query.categoryId, 10);
    if (!Number.isInteger(cid) || cid <= 0) {
      throw new AppError('categoryId must be a positive integer.', 400);
    }
    categoryId = cid;
  }

  return { page, limit, search, status, categoryId };
}

function validateBatchRestockPayload(body) {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be a JSON object.', 400);
  }
  const { items, notes, batchCode } = body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Batch restock items array is required and must not be empty.', 400);
  }

  const validatedItems = items.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new AppError(`items[${idx}] must be an object.`, 400);
    }
    let variantId = item.variantId;
    if (variantId !== undefined) {
      variantId = Number.parseInt(variantId, 10);
      if (!Number.isInteger(variantId) || variantId <= 0) {
        throw new AppError(`items[${idx}].variantId must be a positive integer.`, 400);
      }
    }
    const sku = item.sku ? String(item.sku).trim() : undefined;
    if (!variantId && !sku) {
      throw new AppError(`items[${idx}] must provide either variantId or sku.`, 400);
    }

    const qty = Number.parseInt(item.quantity, 10);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new AppError(`items[${idx}].quantity must be a positive integer > 0.`, 400);
    }

    return { variantId, sku, quantity: qty };
  });

  return {
    items: validatedItems,
    notes: notes ? String(notes).trim() : 'Batch import from supplier',
    batchCode: batchCode ? String(batchCode).trim() : null,
  };
}

function validateAdjustStockPayload(body) {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be a JSON object.', 400);
  }
  const { newQuantity, lowStockThreshold, reason } = body;

  let validNewQty = undefined;
  if (newQuantity !== undefined) {
    const qty = Number.parseInt(newQuantity, 10);
    if (!Number.isInteger(qty) || qty < 0) {
      throw new AppError('newQuantity must be an integer >= 0.', 400);
    }
    validNewQty = qty;
  }

  let validThreshold = undefined;
  if (lowStockThreshold !== undefined) {
    const t = Number.parseInt(lowStockThreshold, 10);
    if (!Number.isInteger(t) || t < 0) {
      throw new AppError('lowStockThreshold must be an integer >= 0.', 400);
    }
    validThreshold = t;
  }

  if (validNewQty === undefined && validThreshold === undefined) {
    throw new AppError('Either newQuantity or lowStockThreshold must be provided for adjustment.', 400);
  }

  return {
    newQuantity: validNewQty,
    lowStockThreshold: validThreshold,
    reason: reason ? String(reason).trim() : 'Manual stock adjustment',
  };
}

module.exports = {
  parseVariantId,
  validateInventoryQuery,
  validateBatchRestockPayload,
  validateAdjustStockPayload,
};
