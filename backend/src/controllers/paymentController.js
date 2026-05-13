'use strict';

const paymentService = require('../services/paymentService');

async function getAll(req, res) {
  try {
    const payments = await paymentService.getAllPayments();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener métodos de pago', details: error.message });
  }
}

async function create(req, res) {
  try {
    const payment = await paymentService.createPayment(req.body);
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear el método de pago', details: error.message });
  }
}

async function update(req, res) {
  try {
    const payment = await paymentService.updatePayment(req.params.id, req.body);
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar el método de pago', details: error.message });
  }
}

async function remove(req, res) {
  try {
    await paymentService.deletePayment(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar el método de pago', details: error.message });
  }
}

module.exports = { getAll, create, update, remove };
