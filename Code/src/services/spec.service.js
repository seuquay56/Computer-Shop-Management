const specRepo = require('../repositories/spec.repository');
const { pool } = require('../config/db');
const AppError = require('../utils/AppError');

async function listSpecs() {
  return specRepo.listSpecs();
}

async function createSpec(specName) {
  if (!specName || typeof specName !== 'string' || specName.trim().length === 0) {
    throw new AppError('specName is required and must not be empty.', 400);
  }
  if (specName.trim().length > 100) {
    throw new AppError('specName must not exceed 100 characters.', 400);
  }
  return specRepo.getOrCreateSpec(pool, specName.trim());
}

async function getDistinctSpecOptions() {
  return specRepo.getDistinctValuesBySpec();
}

module.exports = {
  listSpecs,
  createSpec,
  getDistinctSpecOptions,
};
