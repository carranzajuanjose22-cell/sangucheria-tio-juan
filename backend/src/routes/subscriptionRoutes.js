'use strict';

const express = require('express');
const defaultService = require('../services/subscriptionService');
const { tokenOnlyMiddleware, creatorOnly } = require('../middleware/auth');
const { createSubscriptionController } = require('../controllers/subscriptionController');

function createSubscriptionRouter(service = defaultService) {
  const controller = createSubscriptionController(service);
  const router = express.Router();
  router.use(tokenOnlyMiddleware);
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.get('/status', controller.status);
  router.get('/payments', creatorOnly, controller.payments);
  router.put('/configure', creatorOnly, controller.configure);
  router.post('/renew', creatorOnly, controller.renew);
  router.post('/block', creatorOnly, controller.block);
  router.post('/unblock', creatorOnly, controller.unblock);
  router.put('/payment-warning', creatorOnly, controller.paymentWarning);
  router.use((error, _req, res, _next) => {
    res.status(error.status || 503).json({ error: error.status === 400 ? error.message : 'No se pudo verificar o guardar la suscripción. Intentá nuevamente.' });
  });
  return router;
}

module.exports = createSubscriptionRouter();
module.exports.createSubscriptionRouter = createSubscriptionRouter;
