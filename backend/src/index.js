'use strict';

require('dotenv/config');

const express = require('express');
const cors = require('cors');
const { ensureTables } = require('./models/migrate');
const { db } = require('./db');
const { users } = require('./models/schema');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const inputRoutes = require('./routes/inputRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const catalogRoutes = require('./routes/catalogRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/ping', (_req, res) => {
  res.json({ message: '¡El backend de la sanguchería está funcionando!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inputs', inputRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/catalog', catalogRoutes);

app.use((err, _req, res, _next) => {
  console.error('\n❌ ERROR INTERNO DEL SERVIDOR:', err);
  res.status(500).json({
    error: 'Fallo interno en el servidor',
    details: err?.message ?? String(err),
  });
});

async function seedAdmin() {
  const result = await db.select().from(users).where(eq(users.email, 'admin@sangucheria.com'));
  if (result.length > 0) {
    console.log('ℹ️  Admin ya existe en la BD.');
    return;
  }
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await db.insert(users).values({
    id: crypto.randomUUID(),
    name: 'Administrador',
    email: 'admin@sangucheria.com',
    password: hashedPassword,
    role: 'Admin',
  });
  console.log('✅ Admin creado (admin@sangucheria.com / admin123). CAMBIÁ la contraseña cuanto antes.');
}

async function seedCreator() {
  const result = await db.select().from(users).where(eq(users.email, 'creador@sangucheria.com'));
  if (result.length > 0) {
    console.log('ℹ️  Creador ya existe en la BD.');
    return;
  }
  const hashedPassword = await bcrypt.hash('creador123', 10);
  await db.insert(users).values({
    id: crypto.randomUUID(),
    name: 'Creador del Sistema',
    email: 'creador@sangucheria.com',
    password: hashedPassword,
    role: 'Creador',
  });
  console.log('✅ Creador creado (creador@sangucheria.com / creador123). CAMBIÁ la contraseña cuanto antes.');
}

async function initDb() {
  try {
    await ensureTables();
  } catch (error) {
    console.error('❌ No se pudieron asegurar las tablas:', error);
  }

  try {
    await seedAdmin();
  } catch (error) {
    console.error('❌ No se pudo crear el admin inicial:', error);
  }

  try {
    await seedCreator();
  } catch (error) {
    console.error('❌ No se pudo crear el creador inicial:', error);
  }
}

if (process.env.VERCEL) {
  module.exports = app;
} else {
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  });
}
