'use strict';

const { db } = require('../db');
const { inputItems } = require('../models/schema');
const { eq } = require('drizzle-orm');

function newId() {
  return crypto.randomUUID();
}

async function getAllInputs() {
  return db.select().from(inputItems);
}

async function createInput(data) {
  const [item] = await db
    .insert(inputItems)
    .values({ ...data, id: newId() })
    .returning();
  return item;
}

async function updateInput(id, data) {
  const [item] = await db
    .update(inputItems)
    .set(data)
    .where(eq(inputItems.id, id))
    .returning();
  return item;
}

async function deleteInput(id) {
  await db.delete(inputItems).where(eq(inputItems.id, id));
}

module.exports = { getAllInputs, createInput, updateInput, deleteInput };
