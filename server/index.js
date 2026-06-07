const express = require('express');
const cors = require('cors');
require('dotenv').config();

const backupsRoutes = require('./src/routes/backupsRoutes');
const authRoutes = require('./src/routes/authRoutes');
const clientesRoutes = require('./src/routes/clientesRoutes');
const productosRoutes = require('./src/routes/productosRoutes');
const ventasRoutes = require('./src/routes/ventasRoutes');
const reportesRoutes = require('./src/routes/reportesRoutes');
const proveedoresRoutes = require('./src/routes/proveedoresRoutes');
const pedidosRoutes = require('./src/routes/pedidosRoutes');

const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/backups', backupsRoutes);

app.get('/', (req, res) => res.json({ message: 'Viveros Charis API running' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
