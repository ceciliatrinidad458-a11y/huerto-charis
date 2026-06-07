import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/ventas').then(res => setVentas(res.data)).finally(() => setLoading(false));
  }, []);

  const fmt = (n) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1B5E20">Ventas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/ventas/nueva')}
          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}>
          Nueva venta
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress sx={{ color: '#2E7D32' }} /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                {['#', 'Cliente', 'Vendedor', 'Fecha', 'Tipo de pago', 'Total'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 13 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {ventas.map((v) => (
                <TableRow key={v.id} hover>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>#{v.id}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{v.cliente_nombre || 'Venta directa'}</TableCell>
                  <TableCell>{v.vendedor_nombre}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {new Date(v.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <Chip label={v.tipo_pago} size="small"
                      sx={{
                        bgcolor: v.tipo_pago === 'contado' ? '#E8F5E9' : '#E3F2FD',
                        color: v.tipo_pago === 'contado' ? '#2E7D32' : '#1565C0',
                        fontSize: 11, textTransform: 'capitalize'
                      }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>{fmt(v.total)}</TableCell>
                </TableRow>
              ))}
              {ventas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No hay ventas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </Box>
  );
}
