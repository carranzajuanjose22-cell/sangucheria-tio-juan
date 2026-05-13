import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error(
    '❌ Faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN en .env (necesarios para Prisma CLI).'
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  adapter: () => Promise.resolve(new PrismaLibSql({ url, authToken })),
});
