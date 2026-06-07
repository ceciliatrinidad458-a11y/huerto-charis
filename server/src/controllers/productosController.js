const db = require('../db');

const getAll = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM productos WHERE activo = true ORDER BY nombre ASC'
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
      'SELECT * FROM productos WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Producto no encontrado'
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
    cantidad,
    precio_menudista,
    precio_mayorista,
    precio_especial
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO productos
      (nombre, cantidad, precio_menudista, precio_mayorista, precio_especial)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [
        nombre,
        cantidad || 0,
        precio_menudista || 0,
        precio_mayorista || 0,
        precio_especial || 0
      ]
    );

    res.status(201).json({
      message: 'Producto creado',
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
    cantidad,
    precio_menudista,
    precio_mayorista,
    precio_especial
  } = req.body;

  try {
    await db.query(
      `UPDATE productos
       SET nombre = $1,
           cantidad = $2,
           precio_menudista = $3,
           precio_mayorista = $4,
           precio_especial = $5
       WHERE id = $6`,
      [
        nombre,
        cantidad,
        precio_menudista,
        precio_mayorista,
        precio_especial,
        req.params.id
      ]
    );

    res.json({
      message: 'Producto actualizado'
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
      'UPDATE productos SET activo = false WHERE id = $1',
      [req.params.id]
    );

    res.json({
      message: 'Producto desactivado'
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