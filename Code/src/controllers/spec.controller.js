const specService = require('../services/spec.service');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/http');

const list = asyncHandler(async (_req, res) => {
  const specs = await specService.listSpecs();
  return success(res, { specs });
});

const create = asyncHandler(async (req, res) => {
  const spec = await specService.createSpec(req.body.specName);
  return success(res, { spec }, 201, 'Specification attribute registered successfully.');
});

const getFilterOptions = asyncHandler(async (_req, res) => {
  const options = await specService.getDistinctSpecOptions();
  return success(res, { specOptions: options });
});

module.exports = { list, create, getFilterOptions };
