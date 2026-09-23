'use strict';

const jwt = require('jsonwebtoken');
const subscriptionService = require('../services/subscriptionService');

function tokenOnlyMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

async function authMiddleware(req, res, next) {
  tokenOnlyMiddleware(req, res, async () => {
    try {
      if (req.user?.role !== 'Creador') {
        const status = await subscriptionService.getStatus();
        if (status.isExpired) {
          return res.status(402).json({
            error: 'La suscripción del sistema está vencida.',
            code: 'SUBSCRIPTION_EXPIRED',
            subscription: status,
          });
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  });
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores.' });
  }
  next();
}

function creatorOnly(req, res, next) {
  if (req.user?.role !== 'Creador') {
    return res.status(403).json({ error: 'Acceso restringido al creador del sistema.' });
  }
  next();
}

module.exports = { tokenOnlyMiddleware, authMiddleware, adminOnly, creatorOnly };
