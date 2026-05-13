import { prisma } from './db';

/**
 * Crea las tablas en la base remota (Turso) si no existen.
 * Pensado para arrancar sin depender de `prisma migrate` (que en Prisma 7
 * con adapter libsql no funciona sin shadow DB).
 *
 * Mantenelo sincronizado con prisma/schema.prisma.
 */
export async function ensureTables() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "User" (
       "id"       TEXT PRIMARY KEY,
       "email"    TEXT NOT NULL UNIQUE,
       "name"     TEXT,
       "password" TEXT,
       "role"     TEXT NOT NULL DEFAULT 'Usuario',
       "status"   TEXT NOT NULL DEFAULT 'Activo',
       "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS "InputItem" (
       "id"          TEXT PRIMARY KEY,
       "name"        TEXT NOT NULL,
       "isFood"      INTEGER NOT NULL DEFAULT 1,
       "price"       REAL NOT NULL,
       "creadoEn"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "actualizado" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS "Service" (
       "id"       TEXT PRIMARY KEY,
       "name"     TEXT NOT NULL,
       "cost"     REAL NOT NULL,
       "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS "PaymentMethod" (
       "id"        TEXT PRIMARY KEY,
       "name"      TEXT NOT NULL,
       "surcharge" REAL NOT NULL DEFAULT 0,
       "creadoEn"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS "Catalog" (
       "id"          TEXT PRIMARY KEY,
       "type"        TEXT NOT NULL UNIQUE,
       "descripcion" TEXT,
       "data"        TEXT NOT NULL,
       "creadoEn"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "actualizado" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
  ];

  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
  console.log('✅ Tablas verificadas/creadas en Turso.');
}
