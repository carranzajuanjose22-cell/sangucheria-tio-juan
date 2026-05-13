'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { users } = require('../models/schema');
const { eq } = require('drizzle-orm');

async function login(email, password) {
  const result = await db.select().from(users).where(eq(users.email, email));
  const user = result[0];

  if (!user) {
    const err = new Error('El correo ingresado no existe');
    err.status = 401;
    throw err;
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    const err = new Error('La contraseña es incorrecta');
    err.status = 401;
    throw err;
  }

  if (user.status === 'Inactivo') {
    const err = new Error('Este usuario está desactivado');
    err.status = 403;
    throw err;
  }

  const { password: _omit, ...safeUser } = user;

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return { token, user: safeUser };
}

module.exports = { login };
