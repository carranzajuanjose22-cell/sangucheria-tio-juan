'use strict';

require('dotenv/config');
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function resetAdmin() {
  console.log('🗑️  Eliminando todos los usuarios...');
  await client.execute('DELETE FROM User');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const id = crypto.randomUUID();

  console.log('👤 Creando nuevo administrador...');
  await client.execute({
    sql: `INSERT INTO User (id, email, name, password, role, status, creadoEn)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    args: [id, 'admin@sangucheria.com', 'Administrador', hashedPassword, 'Admin', 'Activo'],
  });

  console.log('');
  console.log('✅ Listo. Usuario creado:');
  console.log('   Email:      admin@sangucheria.com');
  console.log('   Contraseña: admin123');
  console.log('   Rol:        Admin');
}

resetAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
