'use strict';

require('dotenv/config');
const { drizzle } = require('drizzle-orm/libsql');
const { createClient } = require('@libsql/client');
const schema = require('./models/schema');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || url === 'undefined') {
  throw new Error(
    '❌ Falta TURSO_DATABASE_URL en el archivo .env del backend.\n' +
    '   Copia .env.example a .env y completa los valores de Turso.'
  );
}

if (!authToken || authToken === 'undefined') {
  throw new Error(
    '❌ Falta TURSO_AUTH_TOKEN en el archivo .env del backend.\n' +
    '   Copia .env.example a .env y completa los valores de Turso.'
  );
}

const client = createClient({ url, authToken });
const db = drizzle(client, { schema });

module.exports = { db, client };
