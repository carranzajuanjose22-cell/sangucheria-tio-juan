'use strict';

const { client } = require('../db');

async function ensureTables() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "User" (
       "id"       TEXT PRIMARY KEY,
       "email"    TEXT NOT NULL UNIQUE,
       "name"     TEXT,
       "password" TEXT,
       "role"     TEXT NOT NULL DEFAULT 'Usuario',
       "status"   TEXT NOT NULL DEFAULT 'Activo',
       "creadoEn" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS "InputItem" (
       "id"          TEXT PRIMARY KEY,
       "name"        TEXT NOT NULL,
       "isFood"      INTEGER NOT NULL DEFAULT 1,
       "price"       REAL NOT NULL,
       "creadoEn"    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "actualizado" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS "Service" (
       "id"       TEXT PRIMARY KEY,
       "name"     TEXT NOT NULL,
       "cost"     REAL NOT NULL,
       "creadoEn" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS "PaymentMethod" (
       "id"        TEXT PRIMARY KEY,
       "name"      TEXT NOT NULL,
       "surcharge" REAL NOT NULL DEFAULT 0,
       "creadoEn"  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS "Catalog" (
       "id"          TEXT PRIMARY KEY,
       "type"        TEXT NOT NULL UNIQUE,
       "descripcion" TEXT,
       "data"        TEXT NOT NULL,
       "creadoEn"    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "actualizado" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS "cloud_store" (
       "key"   TEXT PRIMARY KEY,
       "value" TEXT
     )`,
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }
  console.log('✅ Tablas verificadas/creadas en Turso.');
}

module.exports = { ensureTables };
