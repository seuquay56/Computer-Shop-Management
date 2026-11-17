const categoryRepo = require('../repositories/category.repository');
const AppError = require('../utils/AppError');

async function listCategories() {
  return categoryRepo.listCategories();
}

async function getCategory(categoryId) {
  const category = await categoryRepo.findById(categoryId);
  if (!category) {
    throw new AppError('Category not found.', 404);
  }
  return category;
}

async function createCategory({ name, description }) {
  const existing = await categoryRepo.findByName(name);
  if (existing) {
    throw new AppError(`Category '${name}' already exists.`, 409);
  }
  return categoryRepo.createCategory({ name, description });
}

async function updateCategory(categoryId, { name, description }) {
  await getCategory(categoryId);
  const existing = await categoryRepo.findByName(name);
  if (existing && Number(existing.category_id) !== Number(categoryId)) {
    throw new AppError(`Category name '${name}' is already taken by another category.`, 409);
  }
  return categoryRepo.updateCategory(categoryId, { name, description });
}

async function deleteCategory(categoryId) {
  await getCategory(categoryId);
  const count = await categoryRepo.countProductsInCategory(categoryId);
  if (count > 0) {
    throw new AppError(
      `Cannot delete category because it contains ${count} active product(s). Please reassign or delete the products first.`,
      400
    );
  }
  return categoryRepo.deleteCategory(categoryId);
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
