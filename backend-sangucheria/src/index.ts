// src/index.ts
import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { prisma } from './db';
import { ensureTables } from './bootstrap';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/ping', (_req, res) => {
  res.json({ message: '¡El backend de la sanguchería está funcionando perfectamente!' });
});

app.get('/api/db-test', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    res.json({ message: '¡Conexión a Turso exitosa!', users });
  } catch (error: any) {
    res.status(500).json({ error: 'Error conectando a la base de datos', details: error?.message });
  }
});

// =====================================
// RUTAS DE INSUMOS (Inputs)
// =====================================
app.get('/api/inputs', async (_req, res) => {
  const inputs = await prisma.inputItem.findMany();
  res.json(inputs);
});

app.post('/api/inputs', async (req, res) => {
  const input = await prisma.inputItem.create({ data: req.body });
  res.json(input);
});

app.put('/api/inputs/:id', async (req, res) => {
  const input = await prisma.inputItem.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(input);
});

app.delete('/api/inputs/:id', async (req, res) => {
  await prisma.inputItem.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// =====================================
// RUTAS DE SERVICIOS (Gastos Fijos)
// =====================================
app.get('/api/services', async (_req, res) => {
  const services = await prisma.service.findMany();
  res.json(services);
});

app.post('/api/services', async (req, res) => {
  const service = await prisma.service.create({ data: req.body });
  res.json(service);
});

app.put('/api/services/:id', async (req, res) => {
  const service = await prisma.service.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(service);
});

app.delete('/api/services/:id', async (req, res) => {
  await prisma.service.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// =====================================
// RUTAS DE MÉTODOS DE PAGO (Payments)
// =====================================
app.get('/api/payments', async (_req, res) => {
  const payments = await prisma.paymentMethod.findMany();
  res.json(payments);
});

app.post('/api/payments', async (req, res) => {
  const payment = await prisma.paymentMethod.create({ data: req.body });
  res.json(payment);
});

app.put('/api/payments/:id', async (req, res) => {
  const payment = await prisma.paymentMethod.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(payment);
});

app.delete('/api/payments/:id', async (req, res) => {
  await prisma.paymentMethod.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// =====================================
// RUTAS DEL CATÁLOGO
// =====================================
app.get('/api/catalog/:type', async (req, res) => {
  const catalog = await prisma.catalog.findUnique({ where: { type: req.params.type } });
  if (catalog) res.json(JSON.parse(catalog.data));
  else res.status(404).json({ error: 'Catálogo no encontrado' });
});

app.post('/api/catalog/:type', async (req, res) => {
  const { type } = req.params;
  const dataString = JSON.stringify(req.body);
  const catalog = await prisma.catalog.upsert({
    where: { type },
    update: { data: dataString },
    create: { type, data: dataString },
  });
  res.json({ success: true, catalog });
});

// =====================================
// RUTAS DE AUTENTICACIÓN Y USUARIOS
// =====================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const email = req.body?.email?.toLowerCase();
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Falta email o contraseña' });
    }

    console.log(`Intento de login para: "${email}"`);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log(`❌ El correo ${email} no existe.`);
      return res.status(401).json({ error: 'El correo ingresado no existe' });
    }
    if (user.password !== password) {
      console.log(`❌ Contraseña incorrecta para ${email}.`);
      return res.status(401).json({ error: 'La contraseña es incorrecta' });
    }

    console.log(`✅ Login exitoso para: ${email}`);

    const { password: _omit, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error: any) {
    console.error('❌ Error en /api/auth/login:', error);
    res.status(500).json({ error: 'Error interno al iniciar sesión', details: error?.message });
  }
});

// =====================================
// RUTAS DE USUARIOS (CRUD)
// =====================================
app.get('/api/users', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, status: true, creadoEn: true }
  });
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.email) data.email = data.email.toLowerCase();

    const user = await prisma.user.create({ data });
    const { password: _omit, ...safeUser } = user;
    res.json(safeUser);
  } catch (error: any) {
    res.status(400).json({ error: 'Error al crear el usuario', details: error?.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.email) data.email = data.email.toLowerCase();

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
    });
    const { password: _omit, ...safeUser } = user;
    res.json(safeUser);
  } catch (error: any) {
    res.status(400).json({ error: 'Error al actualizar el usuario', details: error?.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: 'Error al eliminar el usuario', details: error?.message });
  }
});

// Crea el administrador inicial sólo si todavía no existe (no resetea la contraseña).
const seedAdmin = async () => {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@sangucheria.com' } });
  if (existing) {
    console.log('ℹ️  Admin ya existe en la BD (no se modifica).');
    return;
  }
  await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@sangucheria.com',
      password: 'admin',
      role: 'Admin',
    },
  });
  console.log('✅ Usuario Administrador creado (admin@sangucheria.com / admin). CAMBIALA cuanto antes.');
};

// =====================================
// MANEJADOR DE ERRORES GLOBALES
// =====================================
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('\n❌ ERROR INTERNO DEL SERVIDOR:');
  console.error(err);
  res.status(500).json({
    error: 'Fallo interno en la Base de Datos o Servidor',
    details: err?.message ?? String(err),
  });
});

// Arranque
const start = async () => {
  try {
    await ensureTables();
  } catch (error) {
    console.error('❌ No se pudieron asegurar las tablas en Turso:', error);
    process.exit(1);
  }

  try {
    await seedAdmin();
  } catch (error) {
    console.error('❌ No se pudo asegurar el admin inicial:', error);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
};

start();
