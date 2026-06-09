import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, CircularProgress, Divider, Chip } from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import api from '../../api.js';

export default function VendedorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  useEffect(() => {
    api.get('/reportes/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress sx={{ color: '#2E7D32' }} /></Box>;

  const fmt = (n) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1B5E20">Buen día, {usuario.nombre?.split(' ')[0]} 👋</Typography>
          <Typography variant="body2" color="text.secondary">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/vendedor/ventas/nueva')}
          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}>
          Nueva Venta
        </Button>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6}>
          <Card
  onClick={() => navigate('/vendedor/ventas')}
  sx={{
    borderRadius: 3,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: '0.2s',
    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }
  }}
>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Ventas hoy</Typography>
                  <Typography variant="h4" fontWeight={700} color="#2E7D32">{fmt(data?.ventasHoy?.total)}</Typography>
                  <Typography variant="caption" color="text.secondary">{data?.ventasHoy?.count || 0} transacciones</Typography>
                </Box>
                <Box sx={{ bgcolor: '#E8F5E9', borderRadius: 2, p: 1, color: '#2E7D32' }}><PointOfSaleIcon /></Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card
  onClick={() => navigate('/vendedor/inventario')}
  sx={{
    borderRadius: 3,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: '0.2s',
    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }
  }}
>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Productos disponibles</Typography>
                  <Typography variant="h4" fontWeight={700} color="#1565C0">{data?.totalProductos || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">{data?.stockCritico || 0} con stock crítico</Typography>
                </Box>
                <Box sx={{ bgcolor: '#E3F2FD', borderRadius: 2, p: 1, color: '#1565C0' }}><AssignmentIcon /></Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card
  onClick={() => navigate('/vendedor/ventas')}
  sx={{
    borderRadius: 3,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    cursor: 'pointer'
  }}
>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} color="#1B5E20">Ventas recientes</Typography>
                <Button size="small" onClick={() => navigate('/vendedor/ventas')} sx={{ color: '#2E7D32', fontSize: 12 }}>Ver todas</Button>
              </Box>
              {data?.ventasRecientes?.map((v, i) => (
                <Box key={v.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{v.cliente_nombre || 'Venta directa'}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(v.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={v.tipo_pago} size="small" sx={{ bgcolor: v.tipo_pago === 'contado' ? '#E8F5E9' : '#E3F2FD', color: v.tipo_pago === 'contado' ? '#2E7D32' : '#1565C0', fontSize: 11 }} />
                      <Typography variant="body2" fontWeight={700} color="#1B5E20">{fmt(v.total)}</Typography>
                    </Box>
                  </Box>
                  {i < data.ventasRecientes.length - 1 && <Divider />}
                </Box>
              ))}
              {(!data?.ventasRecientes || data.ventasRecientes.length === 0) && (
                <Typography color="text.secondary" textAlign="center" py={3} fontSize={14}>Sin ventas hoy</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card
  onClick={() => navigate('/vendedor/inventario')}
  sx={{
    borderRadius: 3,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    cursor: 'pointer'
  }}
>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} color="#1B5E20" mb={2}>Stock crítico</Typography>
              {data?.productosStockBajo?.map((p, i) => (
                <Box key={p.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2 }}>
                    <Typography variant="body2" fontWeight={500}>{p.nombre}</Typography>
                    <Chip label={`${p.cantidad} unid.`} size="small" sx={{ bgcolor: p.cantidad <= 5 ? '#FFEBEE' : '#FFF3E0', color: p.cantidad <= 5 ? '#C62828' : '#E65100', fontSize: 11 }} />
                  </Box>
                  {i < data.productosStockBajo.length - 1 && <Divider />}
                </Box>
              ))}
              {(!data?.productosStockBajo || data.productosStockBajo.length === 0) && (
                <Typography color="text.secondary" textAlign="center" py={3} fontSize={14}>✅ Todo el stock está bien</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
