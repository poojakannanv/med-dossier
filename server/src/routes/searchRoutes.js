const express = require('express');
const { globalSearch } = require('../controllers/searchController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, globalSearch);

module.exports = router;
