const Product = require('../models/Product');
const Submission = require('../models/Submission');
const asyncHandler = require('../utils/asyncHandler');
const { logAudit, snapshot } = require('../services/auditService');

// GET /api/products?search=&dosageForm=&page=1&limit=10
const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const { search, dosageForm } = req.query;

  const filter = {};
  if (search) {
    filter.productName = { $regex: search.trim(), $options: 'i' };
  }
  if (dosageForm) {
    filter.dosageForm = dosageForm;
  }

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    products,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

// GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('createdBy', 'name email');
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json({ product });
});

// POST /api/products  (regulatory, admin)
const createProduct = asyncHandler(async (req, res) => {
  const { productName, activeIngredient, dosageForm, strength, manufacturer, mah, atcCode } = req.body;

  const product = await Product.create({
    productName,
    activeIngredient,
    dosageForm,
    strength,
    manufacturer,
    mah,
    atcCode,
    createdBy: req.user._id,
  });

  await logAudit({
    entityType: 'product',
    entityId: product._id,
    action: 'create',
    userId: req.user._id,
    after: snapshot(product),
    summary: `Product "${product.productName}" created`,
  });

  res.status(201).json({ product });
});

// PUT /api/products/:id  (regulatory, admin)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const before = snapshot(product);

  const fields = ['productName', 'activeIngredient', 'dosageForm', 'strength', 'manufacturer', 'mah', 'atcCode'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  await product.save();

  await logAudit({
    entityType: 'product',
    entityId: product._id,
    action: 'update',
    userId: req.user._id,
    before,
    after: snapshot(product),
    summary: `Product "${product.productName}" updated`,
  });

  res.json({ product });
});

// DELETE /api/products/:id  (regulatory, admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const linkedSubmissions = await Submission.countDocuments({ productId: product._id });
  if (linkedSubmissions > 0) {
    return res.status(409).json({
      message: `Cannot delete: ${linkedSubmissions} submission(s) are linked to this product. Delete those first.`,
    });
  }

  const before = snapshot(product);
  await product.deleteOne();

  await logAudit({
    entityType: 'product',
    entityId: req.params.id,
    action: 'delete',
    userId: req.user._id,
    before,
    summary: `Product "${before.productName}" deleted`,
  });

  res.json({ message: 'Product deleted' });
});

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
