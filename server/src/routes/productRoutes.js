const express = require('express');
const { body } = require('express-validator');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { verifyToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { DOSAGE_FORMS } = require('../models/Product');

const router = express.Router();

const productValidation = [
  body('productName').trim().notEmpty().withMessage('Product name is required').isLength({ max: 200 }),
  body('activeIngredient').trim().notEmpty().withMessage('Active ingredient is required').isLength({ max: 200 }),
  body('dosageForm').isIn(DOSAGE_FORMS).withMessage(`Dosage form must be one of: ${DOSAGE_FORMS.join(', ')}`),
  body('strength').trim().notEmpty().withMessage('Strength is required').isLength({ max: 100 }),
  body('manufacturer').trim().notEmpty().withMessage('Manufacturer is required').isLength({ max: 200 }),
  body('mah').trim().notEmpty().withMessage('Marketing authorisation holder is required').isLength({ max: 200 }),
  body('atcCode').optional({ values: 'falsy' }).trim().isLength({ max: 10 }).withMessage('ATC code must be 10 characters or fewer'),
];

router.use(verifyToken);

router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', requireRole('regulatory', 'admin'), productValidation, validate, createProduct);
router.put('/:id', requireRole('regulatory', 'admin'), productValidation, validate, updateProduct);
router.delete('/:id', requireRole('regulatory', 'admin'), deleteProduct);

module.exports = router;
