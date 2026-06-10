import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useNavigate } from 'react-router-dom';
import api from '../../api.js';
import Ticket from '../../components/Ticket.jsx';
import TicketPedido from '../../components/TicketPedido.jsx';

export default function VendedorVentas() {
  const [ticketPedido, setTicketPedido] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [ticketVenta, setTicketVenta] = useState(null);
  const navigate = useNavigate();

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    search: '',
    tipoPago: 'todos',
    fechaDesde: '',
    fechaHasta: ''
  });

  useEffect(() => {
    api.get('/ventas').then(res => {
      setVentas(res.data);
      setVentasFiltradas(res.data);
    }).finally(() => setLoading(false));
  }, []);

  // Función para aplicar filtros
  const aplicarFiltros = () => {
    let filtradas = [...ventas];

    // Filtro por búsqueda (ID, Cliente, Vendedor)
    if (filtros.search) {
  const busqueda = String(filtros.search || '').toLowerCase();

  filtradas = filtradas.filter(v => {
    const id = String(v?.id || '');
    const idPedido = String(v?.id_pedido || '');
    const cliente = String(v?.cliente_nombre || '').toLowerCase();
    const vendedor = String(v?.vendedor_nombre || '').toLowerCase();
    const movimiento = String(v?.tipo_movimiento || '').toLowerCase();
    const pago = String(v?.tipo_pago || '').toLowerCase();

    return (
      id.includes(busqueda) ||
      idPedido.includes(busqueda) ||
      cliente.includes(busqueda) ||
      vendedor.includes(busqueda) ||
      movimiento.includes(busqueda) ||
      pago.includes(busqueda)
    );
  });
}

    // Filtro por tipo de pago
    if (filtros.tipoPago !== 'todos') {
      filtradas = filtradas.filter(v => v.tipo_pago === filtros.tipoPago);
    }

    // Filtro por fecha desde
    if (filtros.fechaDesde) {
      const fechaDesde = new Date(filtros.fechaDesde);
      fechaDesde.setHours(0, 0, 0, 0);
      filtradas = filtradas.filter(v => new Date(v.fecha) >= fechaDesde);
    }

    // Filtro por fecha hasta
    if (filtros.fechaHasta) {
      const fechaHasta = new Date(filtros.fechaHasta);
      fechaHasta.setHours(23, 59, 59, 999);
      filtradas = filtradas.filter(v => new Date(v.fecha) <= fechaHasta);
    }

    setVentasFiltradas(filtradas);
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltros({
      search: '',
      tipoPago: 'todos',
      fechaDesde: '',
      fechaHasta: ''
    });
    setVentasFiltradas(ventas);
  };

  // Aplicar filtros cuando cambien
  useEffect(() => {
    aplicarFiltros();
  }, [filtros, ventas]);

  const handleDobleClick = async (venta) => {
  if (
    venta.tipo_movimiento === 'anticipo_pedido' ||
    venta.tipo_movimiento === 'abono_pedido'
  ) {
    try {
      const res = await api.get(`/pedidos/${venta.id_pedido}`);
      setTicketPedido(res.data);
    } catch (err) {
      console.error(err);
    }
    return;
  }

  setLoadingDetalle(true);
  setVentaDetalle({ ...venta, detalle: [] });

  try {
    const res = await api.get(`/ventas/${venta.id}`);
    setVentaDetalle(res.data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoadingDetalle(false);
  }
};

  const fmt = (n) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1B5E20">Historial de Ventas</Typography>
          <Typography variant="body2" color="text.secondary">Doble clic sobre una venta para ver detalles</Typography>
        </Box>
        <Button
  variant="contained"
  startIcon={<AddIcon />}
  onClick={() => navigate('/vendedor/ventas/nueva')}
  sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}
>
  Nueva venta
</Button>
      </Box>

      {/* Panel de filtros */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por #, cliente o vendedor..."
              value={filtros.search}
              onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#2E7D32' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de pago</InputLabel>
              <Select
                value={filtros.tipoPago}
                onChange={(e) => setFiltros({ ...filtros, tipoPago: e.target.value })}
                label="Tipo de pago"
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="contado">Contado</MenuItem>
                <MenuItem value="credito">Crédito</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Fecha desde"
              value={filtros.fechaDesde}
              onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Fecha hasta"
              value={filtros.fechaHasta}
              onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={limpiarFiltros}
              sx={{ borderColor: '#2E7D32', color: '#2E7D32', borderRadius: 2 }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
        
        {/* Mostrar resultados */}
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Mostrando {ventasFiltradas.length} de {ventas.length} ventas
          </Typography>
        </Box>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress sx={{ color: '#2E7D32' }} /></Box>
        ) : (
  <Box sx={{ width: '100%', overflowX: 'auto' }}>
    <Table sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                {['#', 'Cliente', 'Vendedor', 'Fecha', 'Pago', 'Total'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 13 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {ventasFiltradas.map((v) => (
                <TableRow key={`${v.tipo_movimiento || v.tipo_pago}-${v.id}`} hover                  
                onDoubleClick={() => handleDobleClick(v)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F1F8E9' }, userSelect: 'none' }}>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>#{v.id}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{v.cliente_nombre || 'Venta directa'}</TableCell>
                  <TableCell>{v.vendedor_nombre}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {new Date(v.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                   <Chip
  label={
    v.tipo_movimiento === 'anticipo_pedido'
      ? 'Anticipo pedido'
      : v.tipo_movimiento === 'abono_pedido'
        ? 'Abono pedido'
        : v.tipo_pago
  }
  size="small"
                      sx={{ bgcolor: v.tipo_pago === 'contado' ? '#E8F5E9' : '#E3F2FD', color: v.tipo_pago === 'contado' ? '#2E7D32' : '#1565C0', fontSize: 11, textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>{fmt(v.total)}</TableCell>
                </TableRow>
              ))}
              {ventasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No se encontraron ventas con los filtros aplicados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
           </Box>
        )}
      </Card>

      {/* Resto de diálogos igual */}
      <Dialog open={!!ventaDetalle && !ticketVenta} onClose={() => setVentaDetalle(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {/* ... contenido del diálogo igual ... */}
        <DialogTitle sx={{ fontWeight: 700, color: '#1B5E20' }}>
          Detalle de Venta #{ventaDetalle?.id}
        </DialogTitle>
        <DialogContent>
          {loadingDetalle ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress sx={{ color: '#2E7D32' }} /></Box>
          ) : ventaDetalle && (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2"><strong>Cliente:</strong> {ventaDetalle.cliente_nombre || 'Venta directa'}</Typography>
                <Typography variant="body2"><strong>Pago:</strong> {ventaDetalle.tipo_pago}</Typography>
                <Typography variant="body2"><strong>Fecha:</strong> {new Date(ventaDetalle.fecha).toLocaleString('es-MX')}</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ width: '100%', overflowX: 'auto' }}>
  <Table size="small" sx={{ minWidth: 520 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Producto</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Cantidad</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Precio unit.</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ventaDetalle.detalle?.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell>{d.producto_nombre || d.nombre}</TableCell>
                      <TableCell>{d.cantidad}</TableCell>
                      <TableCell>{fmt(d.precio_unitario)}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#2E7D32' }}>{fmt(d.precio_unitario * d.cantidad)}</TableCell>
                    </TableRow>
                    
                  ))}
                </TableBody>
              </Table>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Typography variant="h6" fontWeight={700} color="#2E7D32">Total: {fmt(ventaDetalle.total)}</Typography>
              </Box>
            </Box>
            
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setVentaDetalle(null)} sx={{ color: 'text.secondary' }}>Cerrar</Button>
          <Button variant="contained" startIcon={<PrintIcon />}
            onClick={() => { setTicketVenta(ventaDetalle); setVentaDetalle(null); }}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}>
            Reimprimir ticket
          </Button>
          
        </DialogActions>
      </Dialog>

      <Dialog open={!!ticketVenta} onClose={() => setTicketVenta(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
  <DialogTitle sx={{ textAlign: 'center', color: '#1B5E20', fontWeight: 700 }}>Reimprimir Ticket</DialogTitle>
  <DialogContent>
    <Ticket venta={ticketVenta} onClose={() => setTicketVenta(null)} />
  </DialogContent>
</Dialog>

<Dialog open={!!ticketPedido} onClose={() => setTicketPedido(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
  <DialogTitle sx={{ textAlign: 'center', color: '#1B5E20', fontWeight: 700 }}>
    Reimprimir Ticket de Pedido
  </DialogTitle>
  <DialogContent>
    <TicketPedido pedido={ticketPedido} onClose={() => setTicketPedido(null)} />
  </DialogContent>
</Dialog>
    </Box>
  );
}