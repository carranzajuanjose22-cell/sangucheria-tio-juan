'use strict';

const serviceService = require('../services/serviceService');

async function getAll(req, res) {
  try {
    const services = await serviceService.getAllServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener servicios', details: error.message });
  }
}

async function create(req, res) {
  try {
    const service = await serviceService.createService(req.body);
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear el servicio', details: error.message });
  }
}

async function update(req, res) {
  try {
    const service = await serviceService.updateService(req.params.id, req.body);
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar el servicio', details: error.message });
  }
}

async function remove(req, res) {
  try {
    await serviceService.deleteService(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar el servicio', details: error.message });
  }
}

module.exports = { getAll, create, update, remove };
