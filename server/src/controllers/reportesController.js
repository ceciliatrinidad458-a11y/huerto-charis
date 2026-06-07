const db = require('../db');

const formatearFecha = (fecha) => {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

const formatearDatetime = (fecha) => {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};

const getResumen = async (req, res) => {
  const { periodo } = req.query;
  let fechaInicio;
  const ahora = new Date();

  if (periodo === 'semanal') {
    fechaInicio = new Date(ahora);
    fechaInicio.setDate(ahora.getDate() - 7);
  } else if (periodo === 'mensual') {
    fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  } else if (periodo === 'anual') {
    fechaInicio = new Date(ahora.getFullYear(), 0, 1);
  } else {
    fechaInicio = new Date(ahora);
    fechaInicio.setHours(0, 0, 0, 0);
  }

  try {
    const totalesResult = await db.query(`
      SELECT 
        COUNT(*) AS total_ventas,
        COALESCE(SUM(total), 0) AS ingresos_total,
        COALESCE(SUM(CASE WHEN tipo_pago = 'contado' THEN total ELSE 0 END), 0) AS contado,
        COALESCE(SUM(CASE WHEN tipo_pago = 'credito' THEN total ELSE 0 END), 0) AS credito
      FROM ventas 
      WHERE fecha >= $1
    `, [fechaInicio]);

    const porDiaResult = await db.query(`
      SELECT 
        DATE(fecha) AS dia,
        COUNT(*) AS num_ventas,
        COALESCE(SUM(total), 0) AS total
      FROM ventas
      WHERE fecha >= $1
      GROUP BY DATE(fecha)
      ORDER BY dia ASC
    `, [fechaInicio]);

    const topProductosResult = await db.query(`
      SELECT 
        p.nombre,
        SUM(dv.cantidad) AS vendidos,
        SUM(dv.cantidad * dv.precio_unitario) AS ingresos
      FROM detalle_ventas dv
      JOIN ventas v ON dv.id_venta = v.id
      JOIN productos p ON dv.id_producto = p.id
      WHERE v.fecha >= $1
      GROUP BY p.id, p.nombre
      ORDER BY vendidos DESC
      LIMIT 5
    `, [fechaInicio]);

    const stockCriticoResult = await db.query(`
      SELECT id, nombre, cantidad
      FROM productos
      WHERE activo = true AND cantidad <= 10
      ORDER BY cantidad ASC
    `);

    const porDiaFormateado = porDiaResult.rows.map(row => ({
      ...row,
      dia: formatearFecha(row.dia),
      num_ventas: Number(row.num_ventas),
      total: Number(row.total),
    }));

    res.json({
      totales: totalesResult.rows[0],
      porDia: porDiaFormateado,
      topProductos: topProductosResult.rows,
      stockCritico: stockCriticoResult.rows,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error',
      error: err.message
    });
  }
};

const getDashboard = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ventasHoyResult = await db.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(total), 0) AS total
       FROM ventas
       WHERE fecha >= $1`,
      [hoy]
    );

    const creditosActivosResult = await db.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(saldo_credito), 0) AS total
       FROM clientes
       WHERE credito_activo = true`
    );

    const totalProductosResult = await db.query(
      `SELECT COUNT(*) AS count
       FROM productos
       WHERE activo = true`
    );

    const stockCriticoResult = await db.query(
      `SELECT COUNT(*) AS count
       FROM productos
       WHERE activo = true AND cantidad <= 10`
    );

    const ventasRecientesResult = await db.query(`
      SELECT v.id, v.total, v.tipo_pago, v.fecha, c.nombre AS cliente_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id
      ORDER BY v.fecha DESC
      LIMIT 5
    `);

    const productosStockBajoResult = await db.query(
      `SELECT id, nombre, cantidad
       FROM productos
       WHERE activo = true AND cantidad <= 10
       ORDER BY cantidad ASC
       LIMIT 5`
    );

    const ventasFormateadas = ventasRecientesResult.rows.map(v => ({
      ...v,
      fecha: formatearDatetime(v.fecha),
    }));

    res.json({
      ventasHoy: ventasHoyResult.rows[0],
      creditosActivos: creditosActivosResult.rows[0],
      totalProductos: Number(totalProductosResult.rows[0].count),
      stockCritico: Number(stockCriticoResult.rows[0].count),
      ventasRecientes: ventasFormateadas,
      productosStockBajo: productosStockBajoResult.rows,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error',
      error: err.message
    });
  }
};

module.exports = {
  getResumen,
  getDashboard
};