const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { cloud_store } = require('../models/schema');
const { eq } = require('drizzle-orm');

router.get('/:key', async (req, res) => {
  try {
    const result = await db.select().from(cloud_store).where(eq(cloud_store.key, req.params.key));
    if (result.length > 0 && result[0].value) {
      res.json(JSON.parse(result[0].value));
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:key', async (req, res) => {
  try {
    const value = JSON.stringify(req.body);
    const existing = await db.select().from(cloud_store).where(eq(cloud_store.key, req.params.key));
    if (existing.length > 0) {
      await db.update(cloud_store).set({ value }).where(eq(cloud_store.key, req.params.key));
    } else {
      await db.insert(cloud_store).values({ key: req.params.key, value });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;