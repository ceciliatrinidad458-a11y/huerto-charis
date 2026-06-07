const db = require('../db');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const getBackupDir = () => {
  const backupDir = path.join(__dirname, '../../backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  return backupDir;
};

const generarRespaldo = async (req, res) => {
  try {
    const clientes = await db.query('SELECT * FROM clientes ORDER BY nombre ASC');
    const productos = await db.query('SELECT * FROM productos ORDER BY nombre ASC');
    const ventas = await db.query('SELECT * FROM ventas ORDER BY fecha DESC LIMIT 100');
    const pedidos = await db.query('SELECT * FROM pedidos ORDER BY fecha_pedido DESC LIMIT 100');
    const proveedores = await db.query('SELECT * FROM proveedores ORDER BY nombre ASC');

    const backupDir = getBackupDir();
    const fileName = `respaldo_huerto_charis_${Date.now()}.pdf`;
    const filePath = path.join(backupDir, fileName);

const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
const stream = fs.createWriteStream(filePath);
doc.pipe(stream);

const verde = '#1B5E20';
const verdeMedio = '#2E7D32';
const verdeClaro = '#E8F5E9';
const gris = '#555555';
const grisClaro = '#F7F7F7';
const naranja = '#E65100';
const rojo = '#C62828';
const azul = '#1565C0';

// ==============================
// DISEÑO COMPACTO EN UNA HOJA
// ==============================

const logoPath = path.join(__dirname, '../../assets/logo-corte-caja.png');

const pageWidth = doc.page.width;
const pageHeight = doc.page.height;
const margin = 30;
const contentWidth = pageWidth - margin * 2;

const leftX = margin;
const rightX = pageWidth / 2 + 10;
const colWidth = (contentWidth / 2) - 15;

const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const fechaActual = new Date().toLocaleString('es-MX');

const ventasTotal = ventas.rows.reduce((s, v) => s + Number(v.total || 0), 0);
const pedidosTotal = pedidos.rows.reduce((s, p) => s + Number(p.total || 0), 0);
const stockCritico = productos.rows.filter(p => Number(p.cantidad || 0) <= 10).length;

const colors = {
  verde: '#1B5E20',
  verdeMedio: '#2E7D32',
  verdeClaro: '#E8F5E9',
  gris: '#555555',
  grisClaro: '#F7F7F7',
  naranja: '#E65100',
  rojo: '#C62828',
  blanco: '#FFFFFF',
  negro: '#000000'
};

const textoCorto = (txt, max = 38) => {
  if (!txt) return 'N/A';
  return txt.length > max ? txt.substring(0, max - 3) + '...' : txt;
};

const sectionTitle = (title, x, y, w) => {
  doc.fillColor(colors.verde).fontSize(11).text(title, x, y);
  doc.strokeColor(colors.verdeClaro)
    .lineWidth(1.3)
    .moveTo(x, y + 15)
    .lineTo(x + w, y + 15)
    .stroke();
};

const metric = (x, y, w, title, value, color = colors.verde) => {
  doc.roundedRect(x, y, w, 40, 7).fill(colors.verdeClaro);
  doc.fillColor(colors.gris).fontSize(7).text(title, x + 8, y + 7, { width: w - 16 });
  doc.fillColor(color).fontSize(13).text(String(value), x + 8, y + 22, { width: w - 16 });
};

const compactLine = (x, y, text, color = colors.negro, size = 7.2) => {
  doc.fillColor(color).fontSize(size).text(text, x, y, {
    width: colWidth,
    ellipsis: true
  });
};

// ENCABEZADO
doc.rect(0, 0, pageWidth, 74).fill(colors.verde);

if (fs.existsSync(logoPath)) {
  doc.image(logoPath, margin, 12, { width: 48 });
}

doc.fillColor(colors.blanco).fontSize(20).text('Huerto Charis', 88, 18);
doc.fontSize(9).text('Respaldo general de información del sistema', 88, 44);

doc.fontSize(8).text(`Generado: ${fechaActual}`, pageWidth - 310, 23, {
  width: 280,
  align: 'right'
});

doc.text(`Administrador: ${req.usuario.nombre}`, pageWidth - 310, 39, {
  width: 280,
  align: 'right'
});

// MÉTRICAS
let y = 92;
const cardW = (contentWidth - 35) / 6;

metric(margin, y, cardW, 'Clientes', clientes.rows.length);
metric(margin + (cardW + 7) * 1, y, cardW, 'Productos', productos.rows.length);
metric(margin + (cardW + 7) * 2, y, cardW, 'Proveedores', proveedores.rows.length);
metric(margin + (cardW + 7) * 3, y, cardW, 'Ventas', ventas.rows.length);
metric(margin + (cardW + 7) * 4, y, cardW, 'Pedidos', pedidos.rows.length, colors.naranja);
metric(
  margin + (cardW + 7) * 5,
  y,
  cardW,
  'Stock crítico',
  stockCritico,
  stockCritico > 0 ? colors.rojo : colors.verde
);

y += 50;

metric(margin, y, cardW * 2 + 7, 'Total ventas recientes', money(ventasTotal));
metric(margin + cardW * 2 + 14, y, cardW * 2 + 7, 'Total pedidos recientes', money(pedidosTotal), colors.naranja);
metric(margin + cardW * 4 + 28, y, cardW * 2 + 7, 'Estado del respaldo', 'Generado');

// COLUMNAS
const topColumnsY = 200;

// IZQUIERDA: INVENTARIO
sectionTitle('Inventario esencial', leftX, topColumnsY, colWidth);

let invY = topColumnsY + 24;

productos.rows.slice(0, 11).forEach((p) => {
  const stock = Number(p.cantidad || 0);
  const colorStock = stock <= 5 ? colors.rojo : stock <= 10 ? colors.naranja : colors.verde;

  compactLine(
    leftX,
    invY,
    `• ${textoCorto(p.nombre, 28)} | Stock: ${p.cantidad} | $${Number(p.precio_menudista || 0).toFixed(2)}`,
    colorStock,
    7.1
  );

  invY += 13;
});

// IZQUIERDA: VENTAS
sectionTitle('Ventas recientes', leftX, 370, colWidth);

let ventasY = 394;

if (ventas.rows.length === 0) {
  compactLine(leftX, ventasY, 'Sin ventas recientes', colors.gris);
} else {
  ventas.rows.slice(0, 5).forEach((v) => {
    compactLine(
      leftX,
      ventasY,
      `• Venta #${v.id} | ${money(v.total)} | ${v.tipo_pago} | ${new Date(v.fecha).toLocaleDateString('es-MX')}`,
      colors.negro
    );
    ventasY += 13;
  });
}

// DERECHA: CLIENTES
sectionTitle('Clientes principales', rightX, topColumnsY, colWidth);

let clientesY = topColumnsY + 24;

clientes.rows.slice(0, 7).forEach((c) => {
  compactLine(
    rightX,
    clientesY,
    `• ${textoCorto(c.nombre, 29)} | ${c.telefono || 'N/A'} | ${c.tipo}`,
    colors.negro,
    7.1
  );
  clientesY += 13;
});

// DERECHA: PEDIDOS
sectionTitle('Pedidos recientes', rightX, 315, colWidth);

let pedidosY = 339;

if (pedidos.rows.length === 0) {
  compactLine(rightX, pedidosY, 'Sin pedidos recientes', colors.gris);
} else {
  pedidos.rows.slice(0, 5).forEach((p) => {
    const saldo = Number(p.total || 0) - Number(p.anticipo || 0);
    const colorSaldo = saldo > 0 ? colors.naranja : colors.verde;

    compactLine(
      rightX,
      pedidosY,
      `• Pedido #${p.id} | Total: ${money(p.total)} | Saldo: ${money(saldo)} | ${p.estado}`,
      colorSaldo
    );
    pedidosY += 13;
  });
}

// DERECHA: PROVEEDORES
sectionTitle('Proveedores', rightX, 430, colWidth);

let provY = 454;

proveedores.rows.slice(0, 4).forEach((p) => {
  compactLine(
    rightX,
    provY,
    `• ${textoCorto(p.nombre, 30)} | ${p.telefono || 'N/A'}`,
    colors.negro
  );
  provY += 13;
});

// FIRMA
doc.roundedRect(leftX, 510, colWidth, 58, 7).fill(colors.verdeClaro);

doc.fillColor(colors.verde).fontSize(9.5).text('Observación administrativa', leftX + 12, 522);

doc.fillColor(colors.gris).fontSize(7.2).text(
  'Este respaldo concentra información esencial para la recuperación, revisión y control administrativo del sistema.',
  leftX + 12,
  538,
  { width: colWidth - 24 }
);

doc.roundedRect(rightX, 510, colWidth, 58, 7).fill(colors.verdeClaro);

doc.fillColor(colors.verde).fontSize(9.5).text('Firma digital del sistema', rightX + 12, 522);

doc.fillColor(colors.gris).fontSize(7.2).text(
  `Sistema Huerto Charis v1.0\nResponsable: ${req.usuario.nombre}\nDocumento confidencial.`,
  rightX + 12,
  538,
  { width: colWidth - 24 }
);

// FOOTER
doc.fillColor(colors.gris).fontSize(7).text(
  'Huerto Charis © 2026 | Respaldo administrativo | Información confidencial',
  margin,
  575,
  { width: contentWidth, align: 'center' }
);
doc.end();

    stream.on('finish', async () => {
      let enviadoCorreo = false;
      let emailError = null;

      try {
        if (process.env.ADMIN_EMAIL && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
       const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

          await transporter.sendMail({
            from: `"Huerto Charis" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: 'Respaldo de información - Huerto Charis',
            text: 'Se adjunta el respaldo generado del sistema Huerto Charis.',
            attachments: [
              {
                filename: fileName,
                path: filePath
              }
            ]
          });

          enviadoCorreo = true;
        }
      } catch (err) {
        emailError = err.message;
      }

      const respaldoResult = await db.query(
        `INSERT INTO respaldos
         (archivo, ruta, usuario_id)
         VALUES ($1, $2, $3)
         RETURNING id, archivo, fecha`,
        [fileName, filePath, req.usuario.id]
      );

      res.json({
        message: enviadoCorreo
          ? 'Respaldo generado y enviado correctamente'
          : 'Respaldo generado correctamente, pero no se pudo enviar por correo',
        respaldo: respaldoResult.rows[0],
        fileName,
        enviadoCorreo,
        emailError
      });
    });

    stream.on('error', (err) => {
      res.status(500).json({
        message: 'Error al guardar el PDF',
        error: err.message
      });
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error al generar respaldo',
      error: err.message
    });
  }
};

const listarRespaldos = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        r.id,
        r.archivo,
        r.fecha,
        u.nombre AS usuario_nombre
      FROM respaldos r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      ORDER BY r.fecha DESC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      message: 'Error al obtener respaldos',
      error: err.message
    });
  }
};

const descargarRespaldo = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM respaldos WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Respaldo no encontrado' });
    }

    const respaldo = result.rows[0];

    if (!fs.existsSync(respaldo.ruta)) {
      return res.status(404).json({
        message: 'El archivo PDF ya no existe en el servidor'
      });
    }

    res.download(respaldo.ruta, respaldo.archivo);
  } catch (err) {
    res.status(500).json({
      message: 'Error al descargar respaldo',
      error: err.message
    });
  }
};

module.exports = {
  generarRespaldo,
  listarRespaldos,
  descargarRespaldo
};