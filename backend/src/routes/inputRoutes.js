'use strict';

const express = require('express');
const router = express.Router();
const inputController = require('../controllers/inputController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, inputController.getAll);
router.post('/', authMiddleware, inputController.create);
router.put('/:id', authMiddleware, inputController.update);
router.delete('/:id', authMiddleware, inputController.remove);

module.exports = router;
