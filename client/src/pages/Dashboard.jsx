import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button,
  CircularProgress, Divider, Table, TableHead, TableRow,
  TableCell, TableBody
} from '@mui/material';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AddIcon from '@mui/icons-material/Add';
import api from '../api.js';
import { useNavigate } from 'react-router-dom';

const MetricCard = ({ title, value, subtitle, icon, color, onClick }) => (
  <Card
    onClick={onClick}
    sx={{
      borderRadius: 3,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      cursor: 'pointer',
      transition: '0.2s',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
      }
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>{title}</Typography>
          <Typography variant="h4" fontWeight={700} color={color} mt={0.5}>{value}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Box sx={{ bgcolor: color + '18', borderRadius: 2, p: 1, color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function Dashboard() {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [respaldos, setRespaldos] = useState([]);
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const cargarRespaldos = async () => {
  try {
    const res = await api.get('/backups');
    setRespaldos(res.data);
  } catch (err) {
    console.error('Error al cargar respaldos:', err);
  }
};

const descargarRespaldo = async (respaldo) => {
  try {
    const pdf = await api.get(
      `/backups/${respaldo.id}/descargar`,
      { responseType: 'blob' }
    );

    const url = window.URL.createObjectURL(new Blob([pdf.data]));
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', respaldo.archivo);

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert(err.response?.data?.message || 'Error al descargar respaldo');
  }
};

const generarRespaldo = async () => {
  try {
    const res = await api.post('/backups/generar');

    alert(res.data.message);

    if (res.data.respaldo?.id) {
      const pdf = await api.get(
        `/backups/${res.data.respaldo.id}/descargar`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([pdf.data]));
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute(
        'download',
        res.data.fileName || 'respaldo_huerto_charis.pdf'
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
      cargarRespaldos();
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Error al generar respaldo');
  }
};

  useEffect(() => {
  api.get('/reportes/dashboard')
    .then(res => setData(res.data))
    .catch(console.error)
    .finally(() => setLoading(false));

  cargarRespaldos();
}, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress sx={{ color: '#2E7D32' }} />
    </Box>
  );
  

  const fmt = (n) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  return (
    <Box>
      <Box
  sx={{
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    justifyContent: 'space-between',
    alignItems: { xs: 'stretch', md: 'center' },
    gap: 2,
    mb: 3
  }}
>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1B5E20">
            Buen día, {usuario.nombre?.split(' ')[0]} 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
<Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
  <Button
    variant="contained"
    onClick={generarRespaldo}
    sx={{
      bgcolor: '#1B5E20',
      '&:hover': { bgcolor: '#0B3D0B' },
      borderRadius: 2
    }}
  >
    Generar Respaldo
  </Button>

  <Button
    variant="contained"
    startIcon={<AddIcon />}
    onClick={() => navigate('/admin/ventas/nueva')}
    sx={{
      bgcolor: '#2E7D32',
      '&:hover': { bgcolor: '#1B5E20' },
      borderRadius: 2
    }}
  >
    Nueva Venta
  </Button>

</Box>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
         <MetricCard
  title="Ventas hoy"
  value={fmt(data?.ventasHoy?.total)}
  subtitle={`${data?.ventasHoy?.count || 0} transacciones`}
  icon={<TrendingUpIcon />}
  color="#2E7D32"
  onClick={() => navigate('/admin/ventas')}
/>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
  title="Créditos activos"
  value={fmt(data?.creditosActivos?.total)}
  subtitle={`${data?.creditosActivos?.count || 0} clientes`}
  icon={<PeopleIcon />}
  color="#1565C0"
  onClick={() => navigate('/admin/clientes')}
/>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
  title="Productos"
  value={data?.totalProductos || 0}
  subtitle="en inventario"
  icon={<InventoryIcon />}
  color="#6A1B9A"
  onClick={() => navigate('/admin/productos')}
/>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
  title="Stock crítico"
  value={data?.stockCritico || 0}
  subtitle="por agotarse"
  icon={<WarningAmberIcon />}
  color="#E65100"
  onClick={() => navigate('/admin/productos')}
/>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card
  onClick={() => navigate('/admin/ventas')}
  sx={{
    borderRadius: 3,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: '0.2s',
    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }
  }}
>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} color="#1B5E20" mb={2}>
                Ventas recientes
              </Typography>
              {data?.ventasRecientes?.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  No hay ventas hoy todavía
                </Typography>
              )}
              {data?.ventasRecientes?.map((v, i) => (
                <Box key={v.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{v.cliente_nombre || 'Venta directa'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(v.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={v.tipo_pago}
                        size="small"
                        sx={{
                          bgcolor: v.tipo_pago === 'contado' ? '#E8F5E9' : '#E3F2FD',
                          color: v.tipo_pago === 'contado' ? '#2E7D32' : '#1565C0',
                          fontSize: 11
                        }}
                      />
                      <Typography variant="body2" fontWeight={700} color="#1B5E20">{fmt(v.total)}</Typography>
                    </Box>
                  </Box>
                  {i < data.ventasRecientes.length - 1 && <Divider />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card
  onClick={() => navigate('/admin/productos')}
  sx={{
    borderRadius: 3,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: '0.2s',
    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }
  }}
>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} color="#1B5E20">Stock crítico</Typography>
                <Chip label={`${data?.productosStockBajo?.length || 0} items`}
                  size="small" sx={{ bgcolor: '#FFF3E0', color: '#E65100' }} />
              </Box>
              {data?.productosStockBajo?.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  ✅ Todo el stock está bien
                </Typography>
              )}
              {data?.productosStockBajo?.map((p, i) => (
                <Box key={p.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2 }}>
                    <Typography variant="body2" fontWeight={500}>{p.nombre}</Typography>
                    <Chip
                      label={`${p.cantidad} unid.`}
                      size="small"
                      sx={{
                        bgcolor: p.cantidad <= 5 ? '#FFEBEE' : '#FFF3E0',
                        color: p.cantidad <= 5 ? '#C62828' : '#E65100',
                        fontSize: 11
                      }}
                    />
                  </Box>
                  {i < data.productosStockBajo.length - 1 && <Divider />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mt: 3 }}>
  <CardContent sx={{ p: 2.5 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} color="#1B5E20">
        Historial de respaldos
      </Typography>
      <Chip
        label={`${respaldos.length} registros`}
        size="small"
        sx={{ bgcolor: '#E8F5E9', color: '#2E7D32' }}
      />
    </Box>

    {respaldos.length === 0 ? (
      <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
        Aún no se han generado respaldos
      </Typography>
    ) : (
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
    <Table size="small" sx={{ minWidth: 760 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: '#F1F8E9' }}>
            <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Archivo</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Fecha</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Generado por</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }} align="right">Acción</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {respaldos.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell sx={{ fontSize: 13 }}>{r.archivo}</TableCell>
              <TableCell sx={{ fontSize: 13 }}>
                {new Date(r.fecha).toLocaleString('es-MX')}
              </TableCell>
              <TableCell sx={{ fontSize: 13 }}>
                {r.usuario_nombre || 'Administrador'}
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => descargarRespaldo(r)}
                  sx={{
                    borderColor: '#2E7D32',
                    color: '#2E7D32',
                    '&:hover': {
                      borderColor: '#1B5E20',
                      bgcolor: '#E8F5E9'
                    }
                  }}
                >
                  Descargar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Box>
    )}
  </CardContent>
</Card>
    </Box>
  );
}
