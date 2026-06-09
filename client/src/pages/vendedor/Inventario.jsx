import { useEffect, useState } from 'react';
import { Box, Typography, Card, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../api.js';

export default function VendedorInventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    api.get('/productos').then(res => setProductos(res.data)).finally(() => setLoading(false));
  }, []);

  const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1B5E20">Inventario</Typography>
        <TextField size="small" placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ width: 240 }} />
      </Box>
      <Card
  sx={{
    mb: 2.5,
    borderRadius: 3,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid #E8F5E9',
    background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FBF7 100%)'
  }}
>
  <Box sx={{ p: 2.4 }}>
    <Typography variant="subtitle1" fontWeight={800} color="#1B5E20" mb={0.5}>
      Guía de estado del inventario
    </Typography>

    <Typography variant="body2" color="text.secondary" mb={2}>
      El sistema clasifica automáticamente cada producto según su cantidad disponible.
    </Typography>

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
      <Box sx={{ p: 1.8, borderRadius: 2.5, bgcolor: '#E8F5E9', border: '1px solid #C8E6C9' }}>
        <Typography fontWeight={800} color="#2E7D32" fontSize={14}>
          Disponible
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Más de 10 unidades en existencia.
        </Typography>
      </Box>

      <Box sx={{ p: 1.8, borderRadius: 2.5, bgcolor: '#FFF8E1', border: '1px solid #FFE082' }}>
        <Typography fontWeight={800} color="#F57F17" fontSize={14}>
          Stock bajo
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Entre 6 y 10 unidades disponibles.
        </Typography>
      </Box>

      <Box sx={{ p: 1.8, borderRadius: 2.5, bgcolor: '#FFEBEE', border: '1px solid #FFCDD2' }}>
        <Typography fontWeight={800} color="#C62828" fontSize={14}>
          Stock crítico
        </Typography>
        <Typography variant="caption" color="text.secondary">
          5 unidades o menos; requiere atención inmediata.
        </Typography>
      </Box>
    </Box>
  </Box>
</Card>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress sx={{ color: '#2E7D32' }} /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                {['Producto', 'Disponible', 'P. Menudista', 'P. Mayorista', 'P. Especial', 'Estado'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 13 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtrados.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{p.nombre}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{p.cantidad}</TableCell>
                  <TableCell>{fmt(p.precio_menudista)}</TableCell>
                  <TableCell>{fmt(p.precio_mayorista)}</TableCell>
                  <TableCell>{fmt(p.precio_especial)}</TableCell>
                  <TableCell>
                    <Chip label={p.cantidad <= 5 ? 'Crítico' : p.cantidad <= 10 ? 'Bajo' : 'Disponible'} size="small"
                      sx={{ bgcolor: p.cantidad <= 5 ? '#FFEBEE' : p.cantidad <= 10 ? '#FFF3E0' : '#E8F5E9', color: p.cantidad <= 5 ? '#C62828' : p.cantidad <= 10 ? '#E65100' : '#2E7D32', fontSize: 11 }} />
                  </TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 && (
                <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>Sin resultados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </Box>
  );
}
