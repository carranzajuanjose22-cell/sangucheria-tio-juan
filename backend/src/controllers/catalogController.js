'use strict';

const catalogService = require('../services/catalogService');

async function getByType(req, res) {
  try {
    const entry = await catalogService.getCatalogByType(req.params.type);
    if (!entry) {
      return res.status(404).json({ error: 'Catálogo no encontrado' });
    }
    res.json(JSON.parse(entry.data));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener catálogo', details: error.message });
  }
}

async function upsert(req, res) {
  try {
    const entry = await catalogService.upsertCatalog(req.params.type, req.body);
    res.json({ success: true, catalog: entry });
  } catch (error) {
    res.status(400).json({ error: 'Error al guardar catálogo', details: error.message });
  }
}

module.exports = { getByType, upsert };
