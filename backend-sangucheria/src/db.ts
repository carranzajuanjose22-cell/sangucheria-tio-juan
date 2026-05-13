import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

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

const adapter = new PrismaLibSql({ url, authToken });
export const prisma = new PrismaClient({ adapter });
