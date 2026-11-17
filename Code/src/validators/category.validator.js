const AppError = require('../utils/AppError');

function parseCategoryId(param) {
  const id = Number.parseInt(param, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Invalid category ID parameter.', 400);
  }
  return id;
}

function validateCategoryPayload(body) {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be a JSON object.', 400);
  }
  const { name, description } = body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new AppError('Category name is required and must not be empty.', 400);
  }
  if (name.trim().length > 100) {
    throw new AppError('Category name must not exceed 100 characters.', 400);
  }
  if (description !== undefined && typeof description !== 'string') {
    throw new AppError('Category description must be a string.', 400);
  }
  return {
    name: name.trim(),
    description: description ? description.trim() : null,
  };
}

module.exports = { parseCategoryId, validateCategoryPayload };
