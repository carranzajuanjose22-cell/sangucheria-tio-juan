'use strict';

const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const email = req.body?.email?.toLowerCase()?.trim();
    const password = req.body?.password?.trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Falta email o contraseña' });
    }

    console.log(`Intento de login para: "${email}"`);
    const result = await authService.login(email, password);
    console.log(`✅ Login exitoso para: ${email}`);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    res.status(error.status || 500).json({ error: error.message || 'Error interno al iniciar sesión' });
  }
}

module.exports = { login };
