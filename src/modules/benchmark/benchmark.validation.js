const { body, param, query } = require('express-validator');

const objectId = (field) =>
  param(field).isMongoId().withMessage(`${field} must be a valid ObjectId`);

const calculateValidators = [
  body('industryId').isMongoId().withMessage('industryId is required'),
  body('financialYear').optional().isString().trim().notEmpty(),
  body('clientInformation').optional().isObject(),
  body('client').optional().isObject(),
  body('financialInputs').optional().isObject(),
  body('inputs').optional().isObject(),
  body('financialInputs.revenue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Revenue must be >= 0'),
  body('inputs.revenue').optional().isFloat({ min: 0 }),
];

const industryCreateValidators = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('categoryId').optional().isMongoId(),
  body('category').optional().isString(),
  body('description').optional().isString(),
  body('ratios').optional().isArray(),
  body('status').optional().isIn(['draft', 'pending', 'published', 'archived']),
];

const industryUpdateValidators = [
  param('id').isMongoId(),
  body('name').optional().isString().trim().notEmpty(),
  body('ratios').optional().isArray(),
  body('status').optional().isIn(['draft', 'pending', 'published', 'archived']),
];

const categoryValidators = [
  body('name').isString().trim().notEmpty().withMessage('Category name is required'),
  body('color').optional().isString(),
  body('icon').optional().isString(),
  body('status').optional().isIn(['active', 'inactive']),
];

const reportValidators = [
  body('industryId').isMongoId(),
  body('financialYear').isString().trim().notEmpty(),
  body('clientInformation').optional().isObject(),
  body('financialInputs').optional().isObject(),
];

const listQueryValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('sort').optional().isString(),
];

module.exports = {
  objectId,
  calculateValidators,
  industryCreateValidators,
  industryUpdateValidators,
  categoryValidators,
  reportValidators,
  listQueryValidators,
};
