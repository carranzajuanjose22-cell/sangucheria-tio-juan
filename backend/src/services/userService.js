'use strict';

const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { users } = require('../models/schema');
const { eq } = require('drizzle-orm');

function newId() {
  return crypto.randomUUID();
}

async function getAllUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      creadoEn: users.creadoEn,
    })
    .from(users);
}

async function createUser(data) {
  if (!data.password) {
    const err = new Error('La contraseña es requerida');
    err.status = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const id = newId();
  const email = data.email?.toLowerCase();

  const [user] = await db
    .insert(users)
    .values({ ...data, id, email, password: hashedPassword })
    .returning();

  const { password: _omit, ...safeUser } = user;
  return safeUser;
}

async function updateUser(id, data) {
  const updateData = { ...data };
  if (updateData.email) updateData.email = updateData.email.toLowerCase();

  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  } else {
    delete updateData.password;
  }

  const [user] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();

  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }

  const { password: _omit, ...safeUser } = user;
  return safeUser;
}

async function deleteUser(id) {
  await db.delete(users).where(eq(users.id, id));
}

module.exports = { getAllUsers, createUser, updateUser, deleteUser };
