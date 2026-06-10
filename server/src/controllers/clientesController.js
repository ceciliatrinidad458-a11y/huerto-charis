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
const getCreditos = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.id,
        c.nombre,
        c.telefono,
        c.tipo,
        c.credito_activo,
        c.saldo_credito,
        COALESCE(SUM(v.total), 0) AS total_credito,
        COALESCE(SUM(v.total), 0) - COALESCE(c.saldo_credito, 0) AS abonado
      FROM clientes c
      LEFT JOIN ventas v 
        ON v.id_cliente = c.id 
       AND v.tipo_pago = 'credito'
      WHERE c.credito_activo = true
         OR COALESCE(c.saldo_credito, 0) > 0
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      message: 'Error al obtener créditos',
      error: err.message
    });
  }
};

const getCreditoDetalle = async (req, res) => {
  try {
    const clienteResult = await db.query(
      `SELECT * FROM clientes WHERE id = $1`,
      [req.params.id]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const ventasResult = await db.query(`
      SELECT v.*, u.nombre AS vendedor_nombre
      FROM ventas v
      LEFT JOIN usuarios u ON v.id_usuario = u.id
      WHERE v.id_cliente = $1
        AND v.tipo_pago = 'credito'
      ORDER BY v.fecha DESC
    `, [req.params.id]);

    const abonosResult = await db.query(`
      SELECT a.*, u.nombre AS usuario_nombre
      FROM abonos_credito a
      LEFT JOIN usuarios u ON a.id_usuario = u.id
      WHERE a.id_cliente = $1
      ORDER BY a.fecha DESC
    `, [req.params.id]);

    res.json({
      cliente: clienteResult.rows[0],
      ventas: ventasResult.rows,
      abonos: abonosResult.rows
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error al obtener detalle del crédito',
      error: err.message
    });
  }
};

const registrarAbonoCredito = async (req, res) => {
  const { monto, notas } = req.body;
  const id_cliente = req.params.id;
  const id_usuario = req.usuario.id;

  if (!monto || Number(monto) <= 0) {
    return res.status(400).json({ message: 'El monto del abono debe ser mayor a 0' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const clienteResult = await client.query(
      `SELECT * FROM clientes WHERE id = $1`,
      [id_cliente]
    );

    if (clienteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const cliente = clienteResult.rows[0];
    const saldoActual = Number(cliente.saldo_credito || 0);
    const abono = Number(monto);

    if (abono > saldoActual) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: `El abono no puede ser mayor al saldo pendiente: $${saldoActual.toFixed(2)}`
      });
    }

    await client.query(
      `INSERT INTO abonos_credito (id_cliente, id_usuario, monto, notas)
       VALUES ($1, $2, $3, $4)`,
      [id_cliente, id_usuario, abono, notas || null]
    );

    const nuevoSaldo = saldoActual - abono;

    await client.query(
      `UPDATE clientes
       SET saldo_credito = $1,
           credito_activo = $2
       WHERE id = $3`,
      [
        nuevoSaldo,
        nuevoSaldo > 0,
        id_cliente
      ]
    );

    await client.query('COMMIT');

    res.json({
      message: nuevoSaldo > 0
        ? 'Abono registrado correctamente'
        : 'Crédito liquidado correctamente',
      saldo_credito: nuevoSaldo,
      credito_activo: nuevoSaldo > 0
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({
      message: 'Error al registrar abono',
      error: err.message
    });
  } finally {
    client.release();
  }
};
module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove,
  getCreditos,
  getCreditoDetalle,
  registrarAbonoCredito
};