'use strict';

const express = require('express');
const controller = require('../controllers/subscriptionController');
const { tokenOnlyMiddleware, creatorOnly } = require('../middleware/auth');

const router = express.Router();
router.use(tokenOnlyMiddleware);
router.get('/status', controller.status);
router.get('/payments', creatorOnly, controller.payments);
router.put('/configure', creatorOnly, controller.configure);
router.post('/renew', creatorOnly, controller.renew);
router.post('/block', creatorOnly, controller.block);
router.post('/unblock', creatorOnly, controller.unblock);
router.put('/payment-warning', creatorOnly, controller.paymentWarning);

module.exports = router;
