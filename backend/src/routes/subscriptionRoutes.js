'use strict';

const express = require('express');
const { authMiddleware, creatorOnly } = require('../middleware/auth');

function createSubscriptionRouter(service) {
  const router = express.Router();
  router.use(authMiddleware);
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.get('/', async (_req, res, next) => {
    try {
      res.json(await service.getStatus());
    } catch (error) { next(error); }
  });
  router.put('/', creatorOnly, async (req, res, next) => {
    try {
      res.json(await service.update(req.body));
    } catch (error) { next(error); }
  });
  router.use((error, _req, res, _next) => {
    res.status(error.status || 503).json({ error: error.status === 400 ? error.message : 'No se pudo verificar o guardar la suscripción. Intentá nuevamente.' });
  });
  return router;
}

function requireActiveSubscription(service) {
  return async (req, res, next) => {
    if (req.user.role === 'Creador') return next();
    try {
      const subscription = await service.getStatus();
      if (subscription.isExpired) {
        return res.status(403).json({
          code: 'SUBSCRIPTION_EXPIRED', error: 'La suscripción está vencida.', subscription,
        });
      }
      next();
    } catch {
      res.status(503).json({ error: 'No se pudo verificar la suscripción. Intentá nuevamente.' });
    }
  };
}

module.exports = { createSubscriptionRouter, requireActiveSubscription };
