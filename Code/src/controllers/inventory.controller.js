const inventoryService = require('../services/inventory.service');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/http');
const {
  parseVariantId,
  validateInventoryQuery,
  validateBatchRestockPayload,
  validateAdjustStockPayload,
} = require('../validators/inventory.validator');

const list = asyncHandler(async (req, res) => {
  const queryParams = validateInventoryQuery(req.query);
  const result = await inventoryService.listInventory(queryParams);
  return success(res, {
    items: result.items,
    pagination: {
      page: queryParams.page,
      limit: queryParams.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / queryParams.limit),
    },
    stats: result.stats,
    statusFilter: queryParams.status,
  });
});

const getLowStockAlerts = asyncHandler(async (_req, res) => {
  const alerts = await inventoryService.getLowStockAlerts();
  return success(res, {
    alertCount: alerts.length,
    alerts,
  });
});

const restockBatch = asyncHandler(async (req, res) => {
  const payload = validateBatchRestockPayload(req.body);
  const result = await inventoryService.batchRestock(payload, req.user?.userId);
  return success(res, result, 200, 'Batch restock processed successfully.');
});

const adjustStock = asyncHandler(async (req, res) => {
  const variantId = parseVariantId(req.params.variantId);
  const payload = validateAdjustStockPayload(req.body);
  const updated = await inventoryService.adjustStock(variantId, payload, req.user?.userId);
  return success(res, { variant: updated }, 200, 'Stock level adjusted successfully.');
});

const getHistory = asyncHandler(async (req, res) => {
  const result = await inventoryService.getHistory(req.query);
  return success(res, {
    transactions: result.transactions,
    pagination: {
      total: result.total,
    },
  });
});

module.exports = {
  list,
  getLowStockAlerts,
  restockBatch,
  adjustStock,
  getHistory,
};
