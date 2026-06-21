const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

/**
 * Run validation and return first error if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return next(new AppError(firstError.msg, 400));
  }
  next();
};

// Auth validators
const signupValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

// Monitor validators
const createMonitorValidator = [
  body('name').trim().notEmpty().withMessage('Monitor name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('url')
    .trim()
    .notEmpty()
    .withMessage('URL is required')
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Valid URL with http/https is required'),
  body('type').isIn(['website', 'api']).withMessage('Type must be "website" or "api"'),
  body('interval').isIn([1, 2, 3, 5, 10]).withMessage('Interval must be 1, 2, 3, 5, or 10 minutes'),
  body('threshold')
    .optional()
    .isInt({ min: 100, max: 30000 })
    .withMessage('Threshold must be between 100ms and 30000ms'),
  body('method')
    .optional()
    .isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'])
    .withMessage('Invalid HTTP method'),
];

const updateMonitorValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }),
  body('url')
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Valid URL required'),
  body('interval').optional().isIn([1, 2, 3, 5, 10]).withMessage('Interval must be 1, 2, 3, 5, or 10 minutes'),
  body('threshold').optional().isInt({ min: 100, max: 30000 }).withMessage('Invalid threshold'),
];

const mongoIdValidator = (field = 'id') => [
  param(field).isMongoId().withMessage(`Invalid ${field}`),
];

module.exports = {
  validate,
  signupValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  createMonitorValidator,
  updateMonitorValidator,
  mongoIdValidator,
};
