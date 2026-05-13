'use strict';

const { db } = require('../db');
const { catalog } = require('../models/schema');
const { eq } = require('drizzle-orm');

function newId() {
  return crypto.randomUUID();
}

async function getCatalogByType(type) {
  const result = await db.select().from(catalog).where(eq(catalog.type, type));
  return result[0] || null;
}

async function upsertCatalog(type, data) {
  const existing = await getCatalogByType(type);
  const dataString = JSON.stringify(data);

  if (existing) {
    const [updated] = await db
      .update(catalog)
      .set({ data: dataString, actualizado: new Date().toISOString() })
      .where(eq(catalog.type, type))
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(catalog)
      .values({ id: newId(), type, data: dataString })
      .returning();
    return created;
  }
}

module.exports = { getCatalogByType, upsertCatalog };
