const db = require('../db');

const getAll = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM proveedores WHERE activo = true ORDER BY nombre ASC'
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      message: 'Error',
      error: err.message
    });
  }
};

const create = async (req, res) => {
  const { nombre, telefono, correo, direccion } = req.body;

  if (!nombre) {
    return res.status(400).json({
      message: 'El nombre es requerido'
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO proveedores
       (nombre, telefono, correo, direccion)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        nombre,
        telefono || null,
        correo || null,
        direccion || null
      ]
    );

    res.status(201).json({
      message: 'Proveedor creado',
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
  const { nombre, telefono, correo, direccion } = req.body;

  try {
    await db.query(
      `UPDATE proveedores
       SET nombre = $1,
           telefono = $2,
           correo = $3,
           direccion = $4
       WHERE id = $5`,
      [
        nombre,
        telefono,
        correo,
        direccion,
        req.params.id
      ]
    );

    res.json({
      message: 'Proveedor actualizado'
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
      'UPDATE proveedores SET activo = false WHERE id = $1',
      [req.params.id]
    );

    res.json({
      message: 'Proveedor eliminado'
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error',
      error: err.message
    });
  }
};

// Registrar una compra a proveedor y sumar al inventario
const registrarCompra = async (req, res) => {
  const { id_proveedor, items, notas } = req.body;
  const id_usuario = req.usuario.id;

  if (!items || items.length === 0) {
    return res.status(400).json({
      message: 'Agrega al menos un producto'
    });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const total = items.reduce(
      (s, i) => s + Number(i.precio_unitario || 0) * Number(i.cantidad),
      0
    );

    const compraResult = await client.query(
      `INSERT INTO compras_proveedor
       (id_proveedor, id_usuario, total, notas)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        id_proveedor || null,
        id_usuario,
        total,
        notas || null
      ]
    );

    const id_compra = compraResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO detalle_compras
         (id_compra, id_producto, nombre_producto, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          id_compra,
          item.id_producto || null,
          item.nombre_producto,
          item.cantidad,
          item.precio_unitario || 0
        ]
      );

      if (item.id_producto) {
        await client.query(
          `UPDATE productos
           SET cantidad = cantidad + $1
           WHERE id = $2`,
          [
            item.cantidad,
            item.id_producto
          ]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Compra registrada e inventario actualizado',
      id: id_compra,
      total
    });
  } catch (err) {
    await client.query('ROLLBACK');

    res.status(500).json({
      message: 'Error al registrar compra',
      error: err.message
    });
  } finally {
    client.release();
  }
};

const getCompras = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT cp.*, p.nombre AS proveedor_nombre, u.nombre AS usuario_nombre
      FROM compras_proveedor cp
      LEFT JOIN proveedores p ON cp.id_proveedor = p.id
      LEFT JOIN usuarios u ON cp.id_usuario = u.id
      ORDER BY cp.fecha DESC
      LIMIT 50
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      message: 'Error',
      error: err.message
    });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove,
  registrarCompra,
  getCompras
};