'use strict';

const inputService = require('../services/inputService');

async function getAll(req, res) {
  try {
    const inputs = await inputService.getAllInputs();
    res.json(inputs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener insumos', details: error.message });
  }
}

async function create(req, res) {
  try {
    const input = await inputService.createInput(req.body);
    res.json(input);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear el insumo', details: error.message });
  }
}

async function update(req, res) {
  try {
    const input = await inputService.updateInput(req.params.id, req.body);
    res.json(input);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar el insumo', details: error.message });
  }
}

async function remove(req, res) {
  try {
    await inputService.deleteInput(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar el insumo', details: error.message });
  }
}

module.exports = { getAll, create, update, remove };
