const Product = require('../models/Product');
const Submission = require('../models/Submission');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/dashboard
// Returns everything the dashboard page needs in one round trip.
const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [totalProducts, activeSubmissions, byStatus, byMonth, upcoming] = await Promise.all([
    Product.countDocuments(),
    Submission.countDocuments({ status: { $in: ['draft', 'in-review', 'submitted'] } }),

    Submission.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { status: 1 } },
    ]),

    Submission.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      // Most recent 12 months, returned in chronological order.
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          count: 1,
        },
      },
    ]),

    Submission.find({
      targetDate: { $gte: now, $lte: inThirtyDays },
      status: { $in: ['draft', 'in-review'] },
    })
      .populate('productId', 'productName')
      .sort({ targetDate: 1 })
      .limit(10)
      .select('productId regulatoryAuthority submissionType targetDate status'),
  ]);

  res.json({
    totals: {
      products: totalProducts,
      activeSubmissions,
    },
    byStatus,
    byMonth,
    upcomingDeadlines: upcoming,
  });
});

module.exports = { getDashboard };
