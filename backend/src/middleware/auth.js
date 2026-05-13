'use strict';

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
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

function adminOnly(req, res, next) {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores.' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly };
