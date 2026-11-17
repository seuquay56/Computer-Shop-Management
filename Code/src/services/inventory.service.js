const inventoryRepo = require('../repositories/inventory.repository');
const { getClient } = require('../config/db');
const AppError = require('../utils/AppError');

async function listInventory(filters) {
  return inventoryRepo.listInventory(filters);
}

async function getLowStockAlerts() {
  return inventoryRepo.getLowStockAlerts();
}

async function batchRestock(payload, userId) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const updated = await inventoryRepo.batchRestock(
      client,
      payload.items,
      userId,
      payload.notes,
      payload.batchCode
    );
    await client.query('COMMIT');
    const totalUnits = payload.items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      updatedVariants: updated,
      totalUnitsRestocked: totalUnits,
      itemCount: updated.length,
      notes: payload.notes,
      batchCode: payload.batchCode,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw new AppError(`Batch restock transaction failed: ${error.message}`, 400);
  } finally {
    client.release();
  }
}

async function adjustStock(variantId, payload, userId) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const updated = await inventoryRepo.adjustStock(client, variantId, payload, userId);
    await client.query('COMMIT');
    return updated;
  } catch (error) {
    await client.query('ROLLBACK');
    throw new AppError(`Stock adjustment failed: ${error.message}`, 400);
  } finally {
    client.release();
  }
}

async function getHistory(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const variantId = query.variantId ? Number.parseInt(query.variantId, 10) : undefined;
  return inventoryRepo.getTransactionHistory({ page, limit, variantId });
}

module.exports = {
  listInventory,
  getLowStockAlerts,
  batchRestock,
  adjustStock,
  getHistory,
};
