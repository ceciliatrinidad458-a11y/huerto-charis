import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, MenuItem, Autocomplete, IconButton, Divider, Alert, ButtonGroup, Tooltip, LinearProgress, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PaymentIcon from '@mui/icons-material/Payment';
import EditIcon from '@mui/icons-material/Edit';
import TicketPedido from '../../components/TicketPedido.jsx';
import api from '../../api.js';
import PrintIcon from '@mui/icons-material/Print';
import {
  alertaConfirmar,
  alertaExito,
  alertaError
} from '../../utils/alerts.js';

export default function VendedorPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('dia');
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [open, setOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [abonoOpen, setAbonoOpen] = useState(false);
  const [editAnticipoOpen, setEditAnticipoOpen] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [ticketPedidoOpen, setTicketPedidoOpen] = useState(false);
  const [ticketPedido, setTicketPedido] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [montoAbono, setMontoAbono] = useState('');
  const [nuevoAnticipo, setNuevoAnticipo] = useState('');
  const [form, setForm] = useState({ id_cliente: null, fecha_entrega: '', anticipo: '', notas: '' });
  const [items, setItems] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const load = () => {
    setLoading(true);
    api.get(`/pedidos?periodo=${periodo}`).then(res => setPedidos(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, [periodo]);
  useEffect(() => {
    api.get('/clientes').then(res => setClientes(res.data));
    api.get('/productos').then(res => setProductos(res.data));
  }, []);

  const agregarItem = (producto) => {
    if (!producto) return;
    const existe = items.find(i => i.id_producto === producto.id);
    if (existe) setItems(items.map(i => i.id_producto === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    else setItems([...items, { id_producto: producto.id, nombre_producto: producto.nombre, cantidad: 1, precio_unitario: producto.precio_menudista }]);
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const date = new Date(fecha + 'T12:00:00');
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleSave = async () => {
    if (items.length === 0) return setError('Agrega al menos un producto');
    if (!form.fecha_entrega) return setError('La fecha de entrega es requerida');
    setSaving(true); setError('');
    try {
      const total = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

const anticipo = parseFloat(form.anticipo) || 0;

if (anticipo < 0) {
  setError('El anticipo no puede ser negativo');
  setSaving(false);
  return;
}


if (anticipo > total) {
  setError(`El anticipo no puede ser mayor al total del pedido (${fmt(total)})`);
  return;
}
      await api.post('/pedidos', {
        id_cliente: form.id_cliente?.id || null,
        fecha_entrega: form.fecha_entrega,
        anticipo: parseFloat(form.anticipo) || 0,
        notas: form.notas,
        items: items.map(i => ({ id_producto: i.id_producto, nombre_producto: i.nombre_producto, cantidad: i.cantidad, precio_unitario: i.precio_unitario }))
      });
      setOpen(false);
      setForm({ id_cliente: null, fecha_entrega: '', anticipo: '', notas: '' });
      setItems([]);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleAbonar = async () => {
    if (!montoAbono || parseFloat(montoAbono) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    const monto = parseFloat(montoAbono);
  const totalPagado =
  Number(pedidoSeleccionado?.anticipo || 0) +
  Number(monto);
    
    if (totalPagado > pedidoSeleccionado?.total) {
      setError(`El monto excede el total del pedido. Monto máximo permitido: $${(pedidoSeleccionado?.total - (pedidoSeleccionado?.anticipo || 0)).toFixed(2)}`);
      return;
    }

    setSaving(true);
    setError('');
    try {
    await api.post(`/pedidos/${pedidoSeleccionado.id}/abonos`, {
  monto,
  notas: 'Abono registrado'
});
      setAbonoOpen(false);
      setMontoAbono('');
      load();
      if (detalleOpen) {
        const res = await api.get(`/pedidos/${pedidoSeleccionado.id}`);
        setPedidoDetalle(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar el abono');
    } finally { setSaving(false); }
  };

  const handleEditarAnticipo = async () => {
    if (!nuevoAnticipo || parseFloat(nuevoAnticipo) < 0) {
      setError('Ingresa un monto válido');
      return;
    }

    const monto = parseFloat(nuevoAnticipo);
    if (monto > pedidoSeleccionado?.total) {
      setError(`El anticipo no puede ser mayor al total del pedido (${fmt(pedidoSeleccionado?.total)})`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.put(`/pedidos/${pedidoSeleccionado.id}/anticipo`, {
  anticipo: monto
});
      setEditAnticipoOpen(false);
      setNuevoAnticipo('');
      load();
      if (detalleOpen) {
        const res = await api.get(`/pedidos/${pedidoSeleccionado.id}`);
        setPedidoDetalle(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al modificar el anticipo');
    } finally { setSaving(false); }
  };

const handleEntregar = async (pedido) => {
  const total = Number(pedido.total || 0);
  const pagado = Number(pedido.anticipo || 0);
  const saldo = total - pagado;

  if (saldo > 0) {
    alertaError(
      `No puedes entregar este pedido porque aún tiene saldo pendiente de ${fmt(saldo)}. Registra el abono completo primero.`
    );
    return;
  }

  const result = await alertaConfirmar(
    '¿Marcar como entregado? Esto restará del inventario.'
  );

  if (!result.isConfirmed) return;

  try {
    await api.put(`/pedidos/${pedido.id}/entregar`);

    alertaExito('Pedido marcado como entregado correctamente');

    load();
  } catch (err) {
    alertaError(
      err.response?.data?.message ||
      'Error al entregar pedido'
    );
  }
};

  const handleCancelar = async (id) => {
  const result = await alertaConfirmar(
    '¿Cancelar este pedido?'
  );

  if (!result.isConfirmed) return;

  try {
    await api.put(`/pedidos/${id}/cancelar`);

    alertaExito(
      'Pedido cancelado correctamente'
    );

    load();

  } catch (err) {
    alertaError(
      err.response?.data?.message ||
      'Error al cancelar pedido'
    );
  }
};

  const handleVerDetalle = async (pedido) => {
    const res = await api.get(`/pedidos/${pedido.id}`);
    setPedidoDetalle(res.data);
    setDetalleOpen(true);
  };
  const handleTicketPedido = async (pedido) => {
  try {
    const res = await api.get(`/pedidos/${pedido.id}`);

    setTicketPedido(res.data);
    setTicketPedidoOpen(true);

  } catch (err) {
    alertaError(
      err.response?.data?.message ||
      'Error al obtener el pedido'
    );
  }
};

  const abrirDialogoAbono = (pedido) => {
    setPedidoSeleccionado(pedido);
    setMontoAbono('');
    setError('');
    setAbonoOpen(true);
  };

  const abrirDialogoEditarAnticipo = (pedido) => {
    setPedidoSeleccionado(pedido);
    setNuevoAnticipo(pedido.anticipo?.toString() || '0');
    setError('');
    setEditAnticipoOpen(true);
  };

  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
  const total = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);
  const anticipo = parseFloat(form.anticipo) || 0;

  const estadoColor = { pendiente: { bg: '#FFF3E0', text: '#E65100' }, entregado: { bg: '#E8F5E9', text: '#2E7D32' }, cancelado: { bg: '#FFEBEE', text: '#C62828' } };
const pedidosFiltrados = pedidos.filter(p => {
  const texto = busqueda.toLowerCase();

  return (
    String(p.id || '').includes(texto) ||
    String(p.cliente_nombre || '').toLowerCase().includes(texto) ||
    String(p.vendedor_nombre || '').toLowerCase().includes(texto) ||
    String(p.estado || '').toLowerCase().includes(texto) ||
    String(p.fecha_entrega || '').toLowerCase().includes(texto)
  );
});
  return (
    <Box>
      <Box
  sx={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: { xs: 'stretch', md: 'center' },
    flexDirection: { xs: 'column', md: 'row' },
    mb: 3,
    gap: 2
  }}
>
        <Typography variant="h5" fontWeight={700} color="#1B5E20">Pedidos</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
          <ButtonGroup
  size="small"
  fullWidth={isMobile}
  orientation={isMobile ? 'vertical' : 'horizontal'}
>
            {[{ label: 'Día', value: 'dia' }, { label: 'Semana', value: 'semana' }, { label: 'Mes', value: 'mes' }].map(p => (
              <Button key={p.value} onClick={() => setPeriodo(p.value)}
                variant={periodo === p.value ? 'contained' : 'outlined'}
                sx={periodo === p.value ? { bgcolor: '#2E7D32', borderColor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } } : { borderColor: '#2E7D32', color: '#2E7D32' }}>
                {p.label}
              </Button>
            ))}
          </ButtonGroup>
          <Button
  fullWidth={isMobile}
  variant="contained"
  startIcon={<AddIcon />}
  onClick={() => setOpen(true)}
  sx={{
    bgcolor: '#2E7D32',
    '&:hover': { bgcolor: '#1B5E20' },
    borderRadius: 2
  }}
>
  Nuevo pedido
</Button>
        </Box>
      </Box>
      <TextField
  fullWidth
  size="small"
  label="Buscar pedido"
  placeholder="Buscar por folio, cliente, vendedor, estado o fecha..."
  value={busqueda}
  onChange={(e) => setBusqueda(e.target.value)}
  sx={{ mb: 2 }}
/>
      

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress sx={{ color: '#2E7D32' }} /></Box>
        ) : (
           <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 880 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                {['#', 'Cliente', 'Entrega', 'Total', 'Pagado', 'Saldo', 'Estado', 'Acciones'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 13 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pedidosFiltrados.map((p) => {
                const ec = estadoColor[p.estado] || estadoColor.pendiente;
                const saldo = Number(p.total || 0) - Number(p.anticipo || 0);
                const pagado = Number(p.anticipo || 0);
                const porcentajePagado = (pagado / Number(p.total || 1)) * 100;
                
                return (
                  <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onDoubleClick={() => handleVerDetalle(p)}>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>#{p.id}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{p.cliente_nombre || 'Sin cliente'}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{formatFecha(p.fecha_entrega)}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1B5E20' }}>{fmt(p.total)}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography sx={{ fontWeight: 600, color: '#2E7D32' }}>{fmt(pagado)}</Typography>
                        {p.estado === 'pendiente' && pagado > 0 && (
                          <LinearProgress 
                            variant="determinate" 
                            value={porcentajePagado} 
                            sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: '#E8F5E9', '& .MuiLinearProgress-bar': { bgcolor: '#2E7D32' } }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: saldo > 0 ? '#E65100' : '#2E7D32' }}>{fmt(saldo)}</TableCell>
                    <TableCell>
                      <Chip label={p.estado} size="small" sx={{ bgcolor: ec.bg, color: ec.text, fontSize: 11, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell>
                      {p.estado === 'pendiente' && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Imprimir ticket">
                            <IconButton
                            size="small"
                            sx={{ color: '#1976D2' }}
                            onClick={() => handleTicketPedido(p)}>
                              <PrintIcon fontSize="small" />
                               </IconButton>
                               </Tooltip>
                          <Tooltip title="Registrar abono">
                            <IconButton size="small" sx={{ color: '#2E7D32' }} onClick={() => abrirDialogoAbono(p)}>
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar anticipo">
                            <IconButton size="small" sx={{ color: '#FF9800' }} onClick={() => abrirDialogoEditarAnticipo(p)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Marcar como entregado">
                            <IconButton size="small" sx={{ color: '#4CAF50' }} onClick={() => handleEntregar(p)}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancelar pedido">
                            <IconButton size="small" color="error" onClick={() => handleCancelar(p.id)}>
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {pedidosFiltrados.length === 0 && (
                <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No hay pedidos en este período</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
  </Box>
)}
      </Card>

      {/* DIALOG NUEVO PEDIDO */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1B5E20' }}>Nuevo Pedido</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12} md={6}>
              <Autocomplete options={clientes} getOptionLabel={(c) => `${c.nombre} (${c.tipo})`}
                value={form.id_cliente} onChange={(_, v) => setForm({ ...form, id_cliente: v })}
                renderInput={(params) => <TextField {...params} label="Cliente" size="small" fullWidth />} noOptionsText="Sin resultados" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Fecha de entrega" type="date" size="small" fullWidth value={form.fecha_entrega}
                onChange={e => setForm({ ...form, fecha_entrega: e.target.value })}
                InputLabelProps={{ shrink: true }} inputProps={{ min: new Date().toISOString().split('T')[0] }} />
            </Grid>
            <Grid item xs={12} md={6}>
             <TextField
  label="Anticipo ($)"
  type="number"
  size="small"
  fullWidth
  value={form.anticipo}
  onChange={e => {
  const valor = e.target.value;

  if (Number(valor) < 0) return;

  setForm({
    ...form,
    anticipo: valor
  });
}}
  inputProps={{ min: 0, step: 0.01 }}
/>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Notas" size="small" fullWidth value={form.notas}
                onChange={e => setForm({ ...form, notas: e.target.value })} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={700} color="#1B5E20" mb={1.5}>Productos del pedido</Typography>
          <Autocomplete options={productos} getOptionLabel={(p) => `${p.nombre}`}
            onChange={(_, v) => agregarItem(v)} value={null}
            renderInput={(params) => <TextField {...params} label="Agregar producto..." size="small" fullWidth />} noOptionsText="Sin resultados" />

          {items.length > 0 && (
            <Box sx={{ width: '100%', overflowX: 'auto', mt: 2 }}>
              <Table size="small" sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Producto</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Cantidad</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Precio</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Subtotal</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id_producto}>
                    <TableCell>{item.nombre_producto}</TableCell>
                    <TableCell>
                      <TextField type="number" size="small" value={item.cantidad}
                        onChange={e => setItems(items.map(i => i.id_producto === item.id_producto ? { ...i, cantidad: parseInt(e.target.value) || 1 } : i))}
                        inputProps={{ min: 1, style: { width: 56 } }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1B5E20' }}>
  {fmt(item.precio_unitario)}
</TableCell>
                    <TableCell sx={{ color: '#2E7D32', fontWeight: 600 }}>{fmt(item.precio_unitario * item.cantidad)}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => setItems(items.filter(i => i.id_producto !== item.id_producto))}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </Box>
          )}

          {items.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#F9FBF7', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography fontSize={13} color="text.secondary">Total</Typography>
                <Typography fontSize={13} fontWeight={600}>{fmt(total)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography fontSize={13} color="text.secondary">Anticipo</Typography>
                <Typography fontSize={13} color="#2E7D32" fontWeight={600}>{fmt(anticipo)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', pt: 0.5 }}>
                <Typography fontWeight={700}>Resta</Typography>
                <Typography fontWeight={700} color={total - anticipo > 0 ? '#E65100' : '#2E7D32'}>{fmt(total - anticipo)}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}>
            {saving ? 'Guardando...' : 'Guardar pedido'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG PARA REGISTRAR ABONO */}
      <Dialog open={abonoOpen} onClose={() => setAbonoOpen(false)} fullScreen={isMobile} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1B5E20' }}>Registrar Abono</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Pedido #{pedidoSeleccionado?.id} - {pedidoSeleccionado?.cliente_nombre}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Total:</strong> {fmt(pedidoSeleccionado?.total)}<br />
              <strong>Pagado actualmente:</strong> {fmt(pedidoSeleccionado?.anticipo)}<br />
              <strong>Saldo pendiente:</strong> <span style={{ color: '#E65100', fontWeight: 'bold' }}>{fmt(pedidoSeleccionado?.total - pedidoSeleccionado?.anticipo)}</span>
            </Typography>
            <TextField
              label="Monto a abonar"
              type="number"
              fullWidth
              size="small"
              value={montoAbono}
              onChange={e => setMontoAbono(e.target.value)}
              sx={{ mt: 2 }}
              inputProps={{ min: 0, step: 0.01 }}
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setAbonoOpen(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleAbonar} 
            disabled={saving || !montoAbono || parseFloat(montoAbono) <= 0}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}
          >
            {saving ? 'Procesando...' : 'Registrar Abono'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG PARA EDITAR ANTICIPO */}
      <Dialog open={editAnticipoOpen} onClose={() => setEditAnticipoOpen(false)} fullScreen={isMobile} maxWidth="md" fullWidth PaperProps={{ sx: { md: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1B5E20' }}>Editar Anticipo</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Pedido #{pedidoSeleccionado?.id} - {pedidoSeleccionado?.cliente_nombre}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Total del pedido:</strong> {fmt(pedidoSeleccionado?.total)}
            </Typography>
            <TextField
              label="Nuevo monto de anticipo"
              type="number"
              fullWidth
              size="small"
              value={nuevoAnticipo}
              onChange={e => setNuevoAnticipo(e.target.value)}
              sx={{ mt: 2 }}
              inputProps={{ min: 0, max: pedidoSeleccionado?.total, step: 0.01 }}
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditAnticipoOpen(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleEditarAnticipo} 
            disabled={saving}
            sx={{ bgcolor: '#FF9800', '&:hover': { bgcolor: '#F57C00' }, borderRadius: 2 }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG DETALLE PEDIDO */}
      <Dialog open={detalleOpen} onClose={() => setDetalleOpen(false)}  fullScreen={isMobile} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1B5E20' }}>Detalle Pedido #{pedidoDetalle?.id}</DialogTitle>
        <DialogContent>
          {pedidoDetalle && (
            <Box>
              <Grid container spacing={1} mb={2}>
                <Grid item xs={6}><Typography fontSize={13}><strong>Cliente:</strong> {pedidoDetalle.cliente_nombre || 'Sin cliente'}</Typography></Grid>
                <Grid item xs={6}><Typography fontSize={13}><strong>Entrega:</strong> {formatFecha(pedidoDetalle.fecha_entrega)}</Typography></Grid>
                <Grid item xs={6}><Typography fontSize={13}><strong>Estado:</strong> {pedidoDetalle.estado}</Typography></Grid>
                <Grid item xs={6}><Typography fontSize={13}><strong>Notas:</strong> {pedidoDetalle.notas || '—'}</Typography></Grid>
              </Grid>
              
             <Box sx={{ width: '100%', overflowX: 'auto' }}>
  <Table size="small" sx={{ minWidth: 520 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Planta</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Cant.</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Precio</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pedidoDetalle.detalle?.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell>{d.nombre_producto || d.producto_nombre}</TableCell>
                      <TableCell>{d.cantidad}</TableCell>
                      <TableCell>{fmt(d.precio_unitario)}</TableCell>
                      <TableCell sx={{ color: '#2E7D32', fontWeight: 600 }}>{fmt(d.precio_unitario * d.cantidad)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </Box>
            
              
              <Box sx={{ mt: 2, p: 2, bgcolor: '#F9FBF7', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography fontSize={13}>Total</Typography>
                  <Typography fontWeight={700} color="#1B5E20">{fmt(pedidoDetalle.total)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography fontSize={13}>Pagado</Typography>
                  <Typography fontSize={13} color="#2E7D32" fontWeight={600}>{fmt(pedidoDetalle.anticipo)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', pt: 0.5 }}>
                  <Typography fontWeight={700}>Saldo pendiente</Typography>
                  <Typography fontWeight={700} color={pedidoDetalle.total - pedidoDetalle.anticipo > 0 ? '#E65100' : '#2E7D32'}>
                    {fmt(pedidoDetalle.total - pedidoDetalle.anticipo)}
                  </Typography>
                </Box>
                
                {pedidoDetalle.historial_pagos && pedidoDetalle.historial_pagos.length > 0 && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="subtitle2" fontWeight={700} color="#1B5E20" mb={1}>Historial de pagos</Typography>
                    {pedidoDetalle.historial_pagos.map((pago, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, mb: 0.5 }}>
                        <Typography color="text.secondary">{new Date(pago.fecha).toLocaleDateString()}</Typography>
                        <Typography fontWeight={500} color="#2E7D32">{fmt(pago.monto)}</Typography>
                        <Typography color="text.secondary">{pago.nota || 'Abono'}</Typography>
                      </Box>
                    ))}
                  </>
                )}
                
              </Box>
              
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetalleOpen(false)} sx={{ color: 'text.secondary' }}>Cerrar</Button>
          {pedidoDetalle?.estado === 'pendiente' && (
            <Button 
              variant="contained" 
              startIcon={<PaymentIcon />}
              onClick={() => {
                setDetalleOpen(false);
                abrirDialogoAbono(pedidoDetalle);
              }}
              sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
            >
              Registrar Abono
            </Button>
          )}
        </DialogActions>
        </Dialog>

<Dialog
  open={ticketPedidoOpen}
  onClose={() => setTicketPedidoOpen(false)}
   fullScreen={isMobile}
  maxWidth="sm"
  fullWidth
  PaperProps={{ sx: { borderRadius: 3 } }}
>
  <DialogContent>
    <TicketPedido
      pedido={ticketPedido}
      onClose={() => setTicketPedidoOpen(false)}
    />
  </DialogContent>
</Dialog>
  
      
    </Box>
  );
}