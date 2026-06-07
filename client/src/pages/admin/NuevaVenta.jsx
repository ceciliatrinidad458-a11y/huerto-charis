import { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, TextField, Button, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton,
  Divider, Alert, Autocomplete, CircularProgress, Dialog, DialogContent, DialogTitle
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import api from '../../api.js';
import Ticket from '../../components/Ticket.jsx';

export default function VendedorNuevaVenta() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [tipoPago, setTipoPago] = useState('contado');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ventaRealizada, setVentaRealizada] = useState(null);
  const [ticketOpen, setTicketOpen] = useState(false);
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  useEffect(() => {
    api.get('/clientes').then(res => setClientes(res.data));
    api.get('/productos').then(res => setProductos(res.data));
  }, []);

  const getPrecio = (p) => {
    if (!clienteSeleccionado) return p.precio_menudista;
    if (clienteSeleccionado.tipo === 'mayorista') return p.precio_mayorista;
    if (clienteSeleccionado.tipo === 'especial') return p.precio_especial;
    return p.precio_menudista;
  };

  const agregarProducto = (producto) => {
    if (!producto) return;
    const existe = items.find(i => i.id_producto === producto.id);
    if (existe) {
      setItems(items.map(i => i.id_producto === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setItems([...items, { id_producto: producto.id, nombre: producto.nombre, cantidad: 1, precio_unitario: getPrecio(producto), stock: producto.cantidad }]);
    }
  };

  const updateCantidad = (id, val) => {
    const n = parseInt(val);
    if (n > 0) setItems(items.map(i => i.id_producto === id ? { ...i, cantidad: n } : i));
  };

  const updatePrecio = (id, val) => {
    setItems(items.map(i => i.id_producto === id ? { ...i, precio_unitario: parseFloat(val) || 0 } : i));
  };

  const removeItem = (id) => setItems(items.filter(i => i.id_producto !== id));

  const total = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

  const handleSubmit = async () => {
    if (items.length === 0) return setError('Agrega al menos un producto');
    if (tipoPago === 'credito' && !clienteSeleccionado) return setError('Selecciona un cliente para ventas a crédito');
    setSaving(true); setError('');
    try {
      const res = await api.post('/ventas', {
        id_cliente: clienteSeleccionado?.id || null,
        tipo_pago: tipoPago,
        items: items.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidad, precio_unitario: i.precio_unitario }))
      });
      // Construir venta con nombres para el ticket
      const ventaConNombres = {
        ...res.data.venta,
        detalle: items.map(i => ({ ...i, producto_nombre: i.nombre }))
      };
      setVentaRealizada(ventaConNombres);
      setTicketOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar venta');
    } finally { setSaving(false); }
  };

  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Box>
      {/* ENCABEZADO NOTA DE REMISIÓN */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mb: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h5" fontWeight={700} color="#1B5E20">🌿 Nota de Remisión</Typography>
              <Typography variant="body2" color="text.secondary">{hoy}</Typography>
              <Typography variant="body2" color="text.secondary">Vendedor: <strong>{usuario.nombre}</strong></Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={clientes} getOptionLabel={(c) => `${c.nombre} (${c.tipo})`}
                    value={clienteSeleccionado} onChange={(_, v) => setClienteSeleccionado(v)}
                    renderInput={(params) => <TextField {...params} label="Cliente" size="small" fullWidth />}
                    noOptionsText="Sin resultados"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField select label="Tipo de pago" size="small" fullWidth value={tipoPago} onChange={e => setTipoPago(e.target.value)}>
                    <MenuItem value="contado">Contado</MenuItem>
                    <MenuItem value="credito">Crédito</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* BUSCADOR DE PRODUCTOS */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mb: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} color="#1B5E20" mb={1.5}>Agregar producto</Typography>
          <Autocomplete
            options={productos.filter(p => p.cantidad > 0)}
            getOptionLabel={(p) => `${p.nombre} — Stock: ${p.cantidad} | M: ${fmt(p.precio_menudista)} | May: ${fmt(p.precio_mayorista)}`}
            onChange={(_, v) => { agregarProducto(v); }}
            renderInput={(params) => <TextField {...params} label="Buscar y seleccionar producto..." size="small" fullWidth />}
            noOptionsText="Sin resultados"
            value={null}
          />
        </CardContent>
      </Card>

      {/* TABLA DE PRODUCTOS - ESTILO NOTA */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mb: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, bgcolor: '#1B5E20', borderRadius: '12px 12px 0 0' }}>
            <Typography color="#fff" fontWeight={700}>Detalle de productos</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1B5E20', width: 90 }}>Cantidad</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1B5E20', width: 130 }}>Precio unitario</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Subtotal</TableCell>
                <TableCell sx={{ width: 40 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary', fontStyle: 'italic' }}>
                    Sin productos — busca arriba para agregar
                  </TableCell>
                </TableRow>
              )}
              {items.map((item, idx) => (
                <TableRow key={item.id_producto}>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{idx + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{item.nombre}</TableCell>
                  <TableCell>
                    <TextField type="number" size="small" value={item.cantidad}
                      onChange={e => updateCantidad(item.id_producto, e.target.value)}
                      inputProps={{ min: 1, max: item.stock, style: { width: 56, textAlign: 'center' } }} />
                  </TableCell>
                  <TableCell>
                    <TextField type="number" size="small" value={item.precio_unitario}
                      onChange={e => updatePrecio(item.id_producto, e.target.value)}
                      inputProps={{ min: 0, step: 0.5, style: { width: 80 } }}
                      InputProps={{ startAdornment: <Typography variant="caption" mr={0.5}>$</Typography> }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#2E7D32' }}>{fmt(item.precio_unitario * item.cantidad)}</TableCell>
                  <TableCell>
                    <IconButton size="small" color="error" onClick={() => removeItem(item.id_producto)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* TOTAL */}
          <Box sx={{ p: 2.5, bgcolor: '#F9FBF7' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">Subtotal</Typography>
                <Typography fontWeight={500}>{fmt(total)}</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">TOTAL</Typography>
                <Typography variant="h5" fontWeight={700} color="#2E7D32">{fmt(total)}</Typography>
              </Box>
              <Button variant="contained" size="large" onClick={handleSubmit} disabled={saving || items.length === 0}
                sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2, px: 4, py: 1.3, minWidth: 160 }}>
                {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : `Registrar venta`}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* DIALOG TICKET */}
      <Dialog open={ticketOpen} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ textAlign: 'center', color: '#1B5E20', fontWeight: 700 }}>
          ✅ ¡Venta realizada exitosamente!
        </DialogTitle>
        <DialogContent>
          <Ticket venta={ventaRealizada} onClose={() => { setTicketOpen(false); setItems([]); setClienteSeleccionado(null); setVentaRealizada(null); navigate('/admin/ventas'); }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
