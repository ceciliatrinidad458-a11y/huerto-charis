const db = require('../db');

const getAll = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        v.id,
        'venta' AS tipo_movimiento,
        v.total,
        v.tipo_pago,
        v.fecha,
        c.nombre AS cliente_nombre,
        u.nombre AS vendedor_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id
      LEFT JOIN usuarios u ON v.id_usuario = u.id

      UNION ALL

      SELECT
        a.id,
        CASE 
          WHEN a.notas = 'Anticipo inicial' THEN 'anticipo_pedido'
          ELSE 'abono_pedido'
        END AS tipo_movimiento,
        a.monto AS total,
        'contado' AS tipo_pago,
        a.fecha,
        c.nombre AS cliente_nombre,
        u.nombre AS vendedor_nombre
      FROM abonos_pedidos a
      JOIN pedidos p ON a.id_pedido = p.id
      LEFT JOIN clientes c ON p.id_cliente = c.id
      LEFT JOIN usuarios u ON a.id_usuario = u.id

      ORDER BY fecha DESC
      LIMIT 100
    `);

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
    const ventaResult = await db.query(`
      SELECT v.*, c.nombre AS cliente_nombre, c.tipo AS cliente_tipo, u.nombre AS vendedor_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id
      LEFT JOIN usuarios u ON v.id_usuario = u.id
      WHERE v.id = $1
    `, [req.params.id]);

    if (ventaResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Venta no encontrada'
      });
    }

    const detalleResult = await db.query(`
      SELECT dv.*, p.nombre AS producto_nombre
      FROM detalle_ventas dv
      LEFT JOIN productos p ON dv.id_producto = p.id
      WHERE dv.id_venta = $1
    `, [req.params.id]);

    res.json({
      ...ventaResult.rows[0],
      detalle: detalleResult.rows
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error',
      error: err.message
    });
  }
};

const create = async (req, res) => {
  const { id_cliente, tipo_pago, items } = req.body;
  const id_usuario = req.usuario.id;

  if (!items || items.length === 0) {
    return res.status(400).json({
      message: 'La venta debe tener al menos un producto'
    });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const total = items.reduce(
      (sum, item) => sum + Number(item.precio_unitario) * Number(item.cantidad),
      0
    );

    const ventaResult = await client.query(
      `INSERT INTO ventas
      (id_cliente, id_usuario, tipo_pago, total)
      VALUES ($1, $2, $3, $4)
      RETURNING id`,
      [
        id_cliente || null,
        id_usuario,
        tipo_pago || 'contado',
        total
      ]
    );

    const id_venta = ventaResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO detalle_ventas
        (id_venta, id_producto, cantidad, precio_unitario)
        VALUES ($1, $2, $3, $4)`,
        [
          id_venta,
          item.id_producto,
          item.cantidad,
          item.precio_unitario
        ]
      );

      await client.query(
        `UPDATE productos
         SET cantidad = cantidad - $1
         WHERE id = $2`,
        [
          item.cantidad,
          item.id_producto
        ]
      );
    }

    if (tipo_pago === 'credito' && id_cliente) {
      await client.query(
        `UPDATE clientes
         SET saldo_credito = saldo_credito + $1,
             credito_activo = true
         WHERE id = $2`,
        [
          total,
          id_cliente
        ]
      );
    }

    await client.query('COMMIT');

    const ventaCompleta = await db.query(`
      SELECT v.*, c.nombre AS cliente_nombre, u.nombre AS vendedor_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id
      LEFT JOIN usuarios u ON v.id_usuario = u.id
      WHERE v.id = $1
    `, [id_venta]);

    res.status(201).json({
      message: 'Venta registrada',
      venta: {
        ...ventaCompleta.rows[0],
        detalle: items
      },
      total
    });
  } catch (err) {
    await client.query('ROLLBACK');

    res.status(500).json({
      message: 'Error al registrar venta',
      error: err.message
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getAll,
  getOne,
  create
}