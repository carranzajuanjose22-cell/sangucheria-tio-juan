'use strict';

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, adminOnly, userController.getAll);
router.post('/', authMiddleware, adminOnly, userController.create);
router.put('/:id', authMiddleware, adminOnly, userController.update);
router.delete('/:id', authMiddleware, adminOnly, userController.remove);

module.exports = router;
