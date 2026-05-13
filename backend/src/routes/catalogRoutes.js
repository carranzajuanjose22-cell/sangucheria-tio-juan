'use strict';

const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');
const { authMiddleware } = require('../middleware/auth');

router.get('/:type', authMiddleware, catalogController.getByType);
router.post('/:type', authMiddleware, catalogController.upsert);

module.exports = router;
