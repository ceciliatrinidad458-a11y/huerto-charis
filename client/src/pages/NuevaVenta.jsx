import { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, TextField, Button, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip,
  Divider, Alert, Autocomplete, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';

export default function NuevaVenta() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [tipoPago, setTipoPago] = useState('contado');
  const [items, setItems] = useState([]);
  const [productoQuery, setProductoQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/clientes').then(res => setClientes(res.data));
    api.get('/productos').then(res => setProductos(res.data));
  }, []);

  const getPrecio = (producto) => {
    if (!clienteSeleccionado) return producto.precio_menudista;
    if (clienteSeleccionado.tipo === 'mayorista') return producto.precio_mayorista;
    if (clienteSeleccionado.tipo === 'especial') return producto.precio_especial;
    return producto.precio_menudista;
  };

  const agregarProducto = (producto) => {
    if (!producto) return;
    const existe = items.find(i => i.id_producto === producto.id);
    if (existe) {
      setItems(items.map(i => i.id_producto === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setItems([...items, {
        id_producto: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        precio_unitario: getPrecio(producto),
        stock: producto.cantidad
      }]);
    }
    setProductoQuery('');
  };

  const updateCantidad = (id, val) => {
    const n = parseInt(val);
    if (n <= 0 || isNaN(n)) return;
    setItems(items.map(i => i.id_producto === id ? { ...i, cantidad: n } : i));
  };

  const removeItem = (id) => setItems(items.filter(i => i.id_producto !== id));

  const total = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

  const handleSubmit = async () => {
    if (items.length === 0) return setError('Agrega al menos un producto');
    if (tipoPago === 'credito' && !clienteSeleccionado) return setError('Selecciona un cliente para ventas a crédito');
    setSaving(true);
    setError('');
    try {
      await api.post('/ventas', {
        id_cliente: clienteSeleccionado?.id || null,
        tipo_pago: tipoPago,
        items: items.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidad, precio_unitario: i.precio_unitario }))
      });
      setSuccess(true);
      setTimeout(() => navigate('/ventas'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar venta');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  if (success) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
      <CheckCircleIcon sx={{ fontSize: 72, color: '#2E7D32' }} />
      <Typography variant="h5" fontWeight={700} color="#1B5E20">¡Venta registrada!</Typography>
      <Typography color="text.secondary">Total: {fmt(total)}</Typography>
      <Typography variant="caption" color="text.secondary">Redirigiendo...</Typography>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} color="#1B5E20" mb={3}>Nueva Venta</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mb: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} color="#1B5E20" mb={2}>
                Agregar productos
              </Typography>
              <Autocomplete
                options={productos.filter(p => p.cantidad > 0)}
                getOptionLabel={(p) => `${p.nombre} (Stock: ${p.cantidad})`}
                inputValue={productoQuery}
                onInputChange={(_, v) => setProductoQuery(v)}
                onChange={(_, v) => agregarProducto(v)}
                renderInput={(params) => (
                  <TextField {...params} label="Buscar producto..." size="small" fullWidth />
                )}
                noOptionsText="Sin resultados"
              />
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ShoppingCartIcon sx={{ color: '#2E7D32' }} />
                <Typography variant="subtitle1" fontWeight={700} color="#1B5E20">
                  Carrito ({items.length} productos)
                </Typography>
              </Box>

              {items.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={3} fontSize={14}>
                  Sin productos agregados
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                      {['Producto', 'Precio', 'Cantidad', 'Subtotal', ''].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id_producto}>
                        <TableCell sx={{ fontWeight: 500 }}>{item.nombre}</TableCell>
                        <TableCell>{fmt(item.precio_unitario)}</TableCell>
                        <TableCell>
                          <TextField
                            type="number" size="small" value={item.cantidad}
                            onChange={e => updateCantidad(item.id_producto, e.target.value)}
                            inputProps={{ min: 1, max: item.stock, style: { width: 60 } }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#2E7D32' }}>
                          {fmt(item.precio_unitario * item.cantidad)}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => removeItem(item.id_producto)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: 16 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} color="#1B5E20" mb={2}>Resumen</Typography>

              {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Autocomplete
                  options={clientes}
                  getOptionLabel={(c) => `${c.nombre} (${c.tipo})`}
                  value={clienteSeleccionado}
                  onChange={(_, v) => setClienteSeleccionado(v)}
                  renderInput={(params) => <TextField {...params} label="Cliente (opcional)" size="small" fullWidth />}
                  noOptionsText="Sin resultados"
                />

                {clienteSeleccionado && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={clienteSeleccionado.tipo} size="small"
                      sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontSize: 11, textTransform: 'capitalize' }} />
                    {clienteSeleccionado.credito_activo && (
                      <Chip label={`Deuda: ${fmt(clienteSeleccionado.saldo_credito)}`} size="small"
                        sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontSize: 11 }} />
                    )}
                  </Box>
                )}

                <TextField select label="Tipo de pago" size="small" fullWidth value={tipoPago}
                  onChange={e => setTipoPago(e.target.value)}>
                  <MenuItem value="contado">Contado</MenuItem>
                  <MenuItem value="credito">Crédito</MenuItem>
                </TextField>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary" fontSize={13}>Subtotal</Typography>
                  <Typography fontSize={13}>{fmt(total)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography fontWeight={700} fontSize={17}>Total</Typography>
                  <Typography fontWeight={700} fontSize={22} color="#2E7D32">{fmt(total)}</Typography>
                </Box>

                <Button
                  variant="contained" fullWidth size="large"
                  onClick={handleSubmit} disabled={saving || items.length === 0}
                  sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2, py: 1.3 }}
                >
                  {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : `Cobrar ${fmt(total)}`}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
