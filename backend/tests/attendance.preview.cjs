// Isolated manual QA: never imports production db.js or reads .env.
const { createClient } = require('@libsql/client');
const { createAttendanceService } = require('../src/services/attendanceService');
const { ensureAttendanceTables } = require('../src/models/attendanceSchema');
const { createAttendanceRouter } = require('../src/routes/attendanceRoutes');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tio-juan-preview-'));
  const client = createClient({ url: `file:${path.join(directory, 'preview.db').replaceAll('\\', '/')}` });
  await client.batch([
    'CREATE TABLE User (id TEXT PRIMARY KEY,name TEXT,email TEXT,role TEXT,status TEXT)',
    "INSERT INTO User VALUES ('ana','Ana (prueba)','ana@demo.test','Cajero','Activo'),('admin','Admin (prueba)','admin@demo.test','Admin','Activo')",
    'CREATE TABLE cloud_store(key TEXT PRIMARY KEY,value TEXT)',
    { sql: 'INSERT INTO cloud_store VALUES (?,?)', args: ['pos_registers', JSON.stringify([{ id: 'legacy', openedBy: 'Ana (prueba)', closedBy: 'Ana (prueba)', openedAt: '2026-11-01T12:00:00Z', date: '2026-11-01T20:00:00Z', shiftHours: 8 }])] },
  ], 'write');
  await ensureAttendanceTables(client);
  const app = express(); app.use(express.json());
  app.post('/api/auth/login', async (req, res) => {
    if (req.body.password !== 'prueba') return res.status(401).json({ error: 'Usar clave de prueba' });
    const user = (await client.execute({ sql: 'SELECT * FROM User WHERE email=?', args: [req.body.email] })).rows[0];
    if (!user) return res.status(401).json({ error: 'Usuario de prueba no encontrado' });
    res.json({ success: true, token: jwt.sign({ userId: user.id, role: user.role }, 'local-preview', { expiresIn: '1h' }), user });
  });
  const authenticate = (req, res, next) => {
    try { req.user = jwt.verify((req.headers.authorization || '').split(' ')[1], 'local-preview'); next(); }
    catch { res.status(401).json({ error: 'Ingresar con usuario de prueba' }); }
  };
  app.use('/api/attendance', createAttendanceRouter(createAttendanceService(client), authenticate));
  app.get('/api/store/:key', (req, res) => res.json(req.params.key === 'register_state' ? { isOpen: false } : []));
  app.get('/api/catalog/:type', (_req, res) => res.json({ varieties: [], presentations: [], products: [] }));
  app.get('/api/services', (_req, res) => res.json([]));
  app.get('/api/payments', (_req, res) => res.json([]));
  app.get('/api/users', async (_req, res) => res.json((await client.execute('SELECT * FROM User')).rows));
  const backend = app.listen(0, '127.0.0.1');
  await new Promise(resolve => backend.once('listening', resolve));
  const { createServer } = await import('../../frontend/node_modules/vite/dist/node/index.js');
  const vite = await createServer({ root: path.resolve(__dirname, '../../frontend'), server: {
    host: '127.0.0.1', port: 5175, strictPort: true,
    proxy: { '/api': { target: `http://127.0.0.1:${backend.address().port}`, changeOrigin: true } },
  } });
  await vite.listen();
  console.log('QA aislado: http://127.0.0.1:5175 · ana@demo.test / admin@demo.test · clave: prueba');
  process.on('SIGINT', async () => { await vite.close(); backend.close(); client.close(); process.exit(0); });
})().catch(error => { console.error(error); process.exit(1); });
