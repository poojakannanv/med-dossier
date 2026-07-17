const Product = require('../models/Product');
const Submission = require('../models/Submission');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/search?q=term
// Searches products (name, ingredient), submissions (via linked product name
// and authority) and document filenames. Results grouped by type.
const globalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) {
    return res.status(400).json({ message: 'Search term must be at least 2 characters' });
  }

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  // 1. Products by name or active ingredient
  const products = await Product.find({
    $or: [{ productName: regex }, { activeIngredient: regex }],
  })
    .limit(10)
    .select('productName activeIngredient dosageForm strength manufacturer');

  // 2. Submissions: match by authority directly, or via matching product ids
  const matchingProductIds = await Product.find({ productName: regex }).distinct('_id');
  const submissions = await Submission.find({
    $or: [{ regulatoryAuthority: regex }, { productId: { $in: matchingProductIds } }],
  })
    .populate('productId', 'productName')
    .limit(10)
    .select('productId regulatoryAuthority submissionType targetDate status');

  // 3. Documents by original filename, across all submissions
  const docMatches = await Submission.aggregate([
    { $unwind: '$modules' },
    { $unwind: '$modules.documents' },
    { $match: { 'modules.documents.originalName': regex } },
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        submissionId: '$_id',
        moduleId: '$modules._id',
        moduleCode: '$modules.code',
        documentId: '$modules.documents._id',
        originalName: '$modules.documents.originalName',
        version: '$modules.documents.version',
        isCurrent: '$modules.documents.isCurrent',
        uploadedAt: '$modules.documents.uploadedAt',
        productName: '$product.productName',
        _id: 0,
      },
    },
    { $limit: 10 },
  ]);

  res.json({
    query: q,
    results: {
      products,
      submissions,
      documents: docMatches,
    },
  });
});

module.exports = { globalSearch };
