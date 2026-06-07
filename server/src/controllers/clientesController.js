const db = require('../db');

const getAll = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM clientes ORDER BY nombre ASC'
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      message: 'Error',
      error: err.message
    });
  }
};

const getOne = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM clientes WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Cliente no encontrado'
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      message: 'Error',
      error: err.message
    });
  }
};

const create = async (req, res) => {
  const {
    nombre,
    telefono,
    tipo,
    credito_activo,
    saldo_credito
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO clientes
      (nombre, telefono, tipo, credito_activo, saldo_credito)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [
        nombre,
        telefono || null,
        tipo || 'menudista',
        credito_activo || false,
        saldo_credito || 0
      ]
    );

    res.status(201).json({
      message: 'Cliente creado',
      id: result.rows[0].id
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error',
      error: err.message
    });
  }
};

const update = async (req, res) => {
  const {
    nombre,
    telefono,
    tipo,
    credito_activo,
    saldo_credito
  } = req.body;

  try {
    await db.query(
      `UPDATE clientes
       SET nombre = $1,
           telefono = $2,
           tipo = $3,
           credito_activo = $4,
           saldo_credito = $5
       WHERE id = $6`,
      [
        nombre,
        telefono,
        tipo,
        credito_activo,
        saldo_credito,
        req.params.id
      ]
    );

    res.json({
      message: 'Cliente actualizado'
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error',
      error: err.message
    });
  }
};

const remove = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM clientes WHERE id = $1',
      [req.params.id]
    );

    res.json({
      message: 'Cliente eliminado'
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error',
      error: err.message
    });
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove
};