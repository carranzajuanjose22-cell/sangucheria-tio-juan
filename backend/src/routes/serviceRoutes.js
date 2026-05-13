'use strict';

const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, serviceController.getAll);
router.post('/', authMiddleware, serviceController.create);
router.put('/:id', authMiddleware, serviceController.update);
router.delete('/:id', authMiddleware, serviceController.remove);

module.exports = router;
