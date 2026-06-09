const db = require('../db');

const formatearFecha = (fecha) => {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

const getAll = async (req, res) => {
  const { periodo } = req.query;
  let fechaInicio;
  const ahora = new Date();

  if (periodo === 'semana') {
    fechaInicio = new Date(ahora);
    fechaInicio.setDate(ahora.getDate() - 7);
  } else if (periodo === 'mes') {
    fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  } else {
    fechaInicio = new Date(ahora);
    fechaInicio.setHours(0, 0, 0, 0);
  }

  try {
    const result = await db.query(`
      SELECT p.*, c.nombre AS cliente_nombre, u.nombre AS vendedor_nombre
      FROM pedidos p
      LEFT JOIN clientes c ON p.id_cliente = c.id
      LEFT JOIN usuarios u ON p.id_usuario = u.id
      WHERE p.fecha_pedido >= $1
      ORDER BY p.id DESC
    `, [fechaInicio]);

    res.json(result.rows.map(row => ({
      ...row,
      fecha_entrega: formatearFecha(row.fecha_entrega),
      fecha_pedido: formatearFecha(row.fecha_pedido),
    })));
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const pedidoResult = await db.query(`
      SELECT p.*, c.nombre AS cliente_nombre, u.nombre AS vendedor_nombre
      FROM pedidos p
      LEFT JOIN clientes c ON p.id_cliente = c.id
      LEFT JOIN usuarios u ON p.id_usuario = u.id
      WHERE p.id = $1
    `, [req.params.id]);

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const detalleResult = await db.query(`
      SELECT dp.*, prod.nombre AS producto_nombre
      FROM detalle_pedidos dp
      LEFT JOIN productos prod ON dp.id_producto = prod.id
      WHERE dp.id_pedido = $1
    `, [req.params.id]);

    const pedido = pedidoResult.rows[0];

    res.json({
      ...pedido,
      fecha_entrega: formatearFecha(pedido.fecha_entrega),
      fecha_pedido: formatearFecha(pedido.fecha_pedido),
      detalle: detalleResult.rows,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

const create = async (req, res) => {
  const { id_cliente, fecha_entrega, items, anticipo, notas } = req.body;
  const id_usuario = req.usuario.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Agrega al menos un producto' });
  }

  if (!fecha_entrega) {
    return res.status(400).json({ message: 'La fecha de entrega es requerida' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const total = items.reduce(
      (s, i) => s + Number(i.precio_unitario) * Number(i.cantidad),
      0
    );

    const anticipoInicial = Number(anticipo || 0);

    if (anticipoInicial < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El anticipo no puede ser negativo' });
    }

    if (anticipoInicial > total) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El anticipo no puede ser mayor al total del pedido' });
    }

    const pedidoResult = await client.query(
      `INSERT INTO pedidos
       (id_cliente, id_usuario, fecha_entrega, total, anticipo, notas)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [id_cliente || null, id_usuario, fecha_entrega, total, anticipoInicial, notas || null]
    );

    const id_pedido = pedidoResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO detalle_pedidos
         (id_pedido, id_producto, nombre_producto, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          id_pedido,
          item.id_producto || null,
          item.nombre_producto,
          item.cantidad,
          item.precio_unitario
        ]
      );
    }

    if (anticipoInicial > 0) {
      await client.query(
        `INSERT INTO abonos_pedidos (id_pedido, monto, notas, id_usuario)
         VALUES ($1, $2, $3, $4)`,
        [id_pedido, anticipoInicial, 'Anticipo inicial', id_usuario]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Pedido registrado',
      id: id_pedido,
      total
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error al registrar pedido', error: err.message });
  } finally {
    client.release();
  }
};

const entregar = async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const pedidosResult = await client.query(
      'SELECT * FROM pedidos WHERE id = $1',
      [req.params.id]
    );

    if (pedidosResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const pedido = pedidosResult.rows[0];

    if (pedido.estado === 'entregado') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El pedido ya fue entregado' });
    }

    if (pedido.estado === 'cancelado') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'No puedes entregar un pedido cancelado' });
    }

    const total = Number(pedido.total || 0);
    const pagado = Number(pedido.anticipo || 0);
    const saldo = total - pagado;

    if (saldo > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: `No puedes entregar este pedido porque tiene saldo pendiente de $${saldo.toFixed(2)}`
      });
    }

    const itemsResult = await client.query(
      'SELECT * FROM detalle_pedidos WHERE id_pedido = $1',
      [req.params.id]
    );

    if (itemsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El pedido no tiene productos' });
    }

    for (const item of itemsResult.rows) {
      if (item.id_producto) {
        await client.query(
          `UPDATE productos
           SET cantidad = cantidad - $1
           WHERE id = $2`,
          [Number(item.cantidad), item.id_producto]
        );
      }
    }

    await client.query(
      'UPDATE pedidos SET estado = $1 WHERE id = $2',
      ['entregado', req.params.id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Pedido entregado e inventario descontado correctamente' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error al entregar pedido', error: err.message });
  } finally {
    client.release();
  }
};

const cancelar = async (req, res) => {
  try {
    await db.query(
      'UPDATE pedidos SET estado = $1 WHERE id = $2',
      ['cancelado', req.params.id]
    );

    res.json({ message: 'Pedido cancelado' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

const registrarAbono = async (req, res) => {
  const { monto, notas } = req.body;
  const id_pedido = req.params.id;

  if (!monto || Number(monto) <= 0) {
    return res.status(400).json({ message: 'El monto del abono debe ser mayor a 0' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const pedidoResult = await client.query(
      'SELECT * FROM pedidos WHERE id = $1',
      [id_pedido]
    );

    if (pedidoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const pedido = pedidoResult.rows[0];
    const total = Number(pedido.total || 0);
    const pagadoActual = Number(pedido.anticipo || 0);
    const nuevoAbono = Number(monto);

    if (pagadoActual + nuevoAbono > total) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: `El abono excede el total del pedido. Saldo disponible: $${(total - pagadoActual).toFixed(2)}`
      });
    }

    await client.query(
      `INSERT INTO abonos_pedidos (id_pedido, monto, notas, id_usuario)
       VALUES ($1, $2, $3, $4)`,
      [id_pedido, nuevoAbono, notas || null, req.usuario.id]
    );

    await client.query(
      `UPDATE pedidos
       SET anticipo = COALESCE(anticipo, 0) + $1
       WHERE id = $2`,
      [nuevoAbono, id_pedido]
    );

    await client.query('COMMIT');

    res.json({ message: 'Abono registrado correctamente' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error al registrar abono', error: err.message });
  } finally {
    client.release();
  }
};

const actualizarAnticipo = async (req, res) => {
  const { anticipo } = req.body;
  const id_pedido = req.params.id;

  if (anticipo === undefined || Number(anticipo) < 0) {
    return res.status(400).json({ message: 'El anticipo no puede ser negativo' });
  }

  try {
    await db.query(
      `UPDATE pedidos
       SET anticipo = $1
       WHERE id = $2`,
      [Number(anticipo), id_pedido]
    );

    res.json({ message: 'Anticipo actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al modificar el anticipo', error: err.message });
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  entregar,
  cancelar,
  registrarAbono,
  actualizarAnticipo
};