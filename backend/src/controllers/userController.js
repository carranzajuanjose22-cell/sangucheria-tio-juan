'use strict';

const userService = require('../services/userService');

async function getAll(req, res) {
  try {
    const users = await userService.getAllUsers();
    // Ocultar al usuario creador de la lista enviada al frontend
    const filteredUsers = users.filter(user => user.role !== 'Creador');
    res.json(filteredUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios', details: error.message });
  }
}

async function create(req, res) {
  try {
    const user = await userService.createUser(req.body);
    res.json(user);
  } catch (error) {
    res.status(error.status || 400).json({ error: 'Error al crear el usuario', details: error.message });
  }
}

async function update(req, res) {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(error.status || 400).json({ error: 'Error al actualizar el usuario', details: error.message });
  }
}

async function remove(req, res) {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar el usuario', details: error.message });
  }
}

module.exports = { getAll, create, update, remove };
