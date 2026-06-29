'use strict';

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const storeService = require('../services/storeService');

router.use(authMiddleware);

router.post('/operations/close-register', async (req, res) => {
  try {
    const { employee, closedBy } = req.body || {};
    const closeRecord = await storeService.closeRegister({ employee, closedBy });
    res.json({ success: true, closeRecord });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.post('/operations/append-sale', async (req, res) => {
  try {
    const { sale } = req.body || {};
    if (!sale?.id) {
      return res.status(400).json({ error: 'Venta inválida' });
    }
    const result = await storeService.appendToArray('pos_sales', sale);
    res.json({ success: true, sales: result.items, duplicate: result.duplicate });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const value = await storeService.getValue(req.params.key);
    res.json(value);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.post('/:key', async (req, res) => {
  try {
    await storeService.setValue(req.params.key, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

module.exports = router;
