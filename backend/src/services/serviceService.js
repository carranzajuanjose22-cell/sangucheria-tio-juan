'use strict';

const { db } = require('../db');
const { services } = require('../models/schema');
const { eq } = require('drizzle-orm');

function newId() {
  return crypto.randomUUID();
}

async function getAllServices() {
  return db.select().from(services);
}

async function createService(data) {
  const [service] = await db
    .insert(services)
    .values({ ...data, id: newId() })
    .returning();
  return service;
}

async function updateService(id, data) {
  const [service] = await db
    .update(services)
    .set(data)
    .where(eq(services.id, id))
    .returning();
  return service;
}

async function deleteService(id) {
  await db.delete(services).where(eq(services.id, id));
}

module.exports = { getAllServices, createService, updateService, deleteService };
