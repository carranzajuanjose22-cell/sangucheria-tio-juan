'use strict';

require('dotenv/config');
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const KEYS_TO_CLEAR = [
  { key: 'pos_sales', value: '[]' },
  { key: 'pos_expenses', value: '[]' },
  { key: 'pos_registers', value: '[]' },
  { key: 'pos_pending_orders', value: '[]' },
  { key: 'pos_purchases', value: '[]' },
  { key: 'register_state', value: 'null' },
];

async function upsertKey(key, value) {
  const existing = await client.execute({
    sql: 'SELECT key FROM cloud_store WHERE key = ?',
    args: [key],
  });

  if (existing.rows.length > 0) {
    await client.execute({
      sql: 'UPDATE cloud_store SET value = ? WHERE key = ?',
      args: [value, key],
    });
  } else {
    await client.execute({
      sql: 'INSERT INTO cloud_store (key, value) VALUES (?, ?)',
      args: [key, value],
    });
  }
}

async function resetPosData() {
  console.log('🧹 Limpiando datos operativos del POS...\n');

  for (const { key, value } of KEYS_TO_CLEAR) {
    await upsertKey(key, value);
    console.log(`   ✓ ${key}`);
  }

  console.log('\n✅ Listo. Caja cerrada, historial y balance operativo en cero.');
}

resetPosData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
