const categoryService = require('../services/category.service');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/http');
const { parseCategoryId, validateCategoryPayload } = require('../validators/category.validator');

const list = asyncHandler(async (_req, res) => {
  const categories = await categoryService.listCategories();
  return success(res, { categories });
});

const getOne = asyncHandler(async (req, res) => {
  const categoryId = parseCategoryId(req.params.categoryId);
  const category = await categoryService.getCategory(categoryId);
  return success(res, { category });
});

const create = asyncHandler(async (req, res) => {
  const payload = validateCategoryPayload(req.body);
  const category = await categoryService.createCategory(payload);
  return success(res, { category }, 201, 'Category created successfully.');
});

const update = asyncHandler(async (req, res) => {
  const categoryId = parseCategoryId(req.params.categoryId);
  const payload = validateCategoryPayload(req.body);
  const category = await categoryService.updateCategory(categoryId, payload);
  return success(res, { category }, 200, 'Category updated successfully.');
});

const remove = asyncHandler(async (req, res) => {
  const categoryId = parseCategoryId(req.params.categoryId);
  await categoryService.deleteCategory(categoryId);
  return success(res, null, 200, 'Category deleted successfully.');
});

module.exports = { list, getOne, create, update, remove };
