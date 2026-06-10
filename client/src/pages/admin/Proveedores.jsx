import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
  CircularProgress, Alert, Tooltip, Tabs, Tab, Divider, Autocomplete, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import api from '../../api.js';
import {
  alertaConfirmar,
  alertaExito,
  alertaError
} from '../../utils/alerts.js';

const emptyProv = { nombre: '', telefono: '', correo: '', direccion: '' };

export default function Proveedores() {
  const [compraDetalle, setCompraDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [tab, setTab] = useState(0);
  const [proveedores, setProveedores] = useState([]);
  const [compras, setCompras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openProv, setOpenProv] = useState(false);
  const [openCompra, setOpenCompra] = useState(false);
  const [form, setForm] = useState(emptyProv);
  const [editId, setEditId] = useState(null);
  const [compraForm, setCompraForm] = useState({ id_proveedor: null, notas: '' });
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [openNuevoProducto, setOpenNuevoProducto] = useState(false);
const [nuevoProducto, setNuevoProducto] = useState({
  nombre: '',
  cantidad: '',
  precio_menudista: '',
  precio_mayorista: '',
  precio_especial: ''
});
  const loadProveedores = () => api.get('/proveedores').then(res => setProveedores(res.data));
  const loadCompras = () => api.get('/proveedores/compras').then(res => setCompras(res.data));

  useEffect(() => {
    Promise.all([loadProveedores(), loadCompras(), api.get('/productos').then(res => setProductos(res.data))])
      .finally(() => setLoading(false));
  }, []);

  const handleOpenProv = (p = null) => {
    setForm(p ? { nombre: p.nombre, telefono: p.telefono || '', correo: p.correo || '', direccion: p.direccion || '' } : emptyProv);
    setEditId(p?.id || null); setError(''); setOpenProv(true);
  };

  const handleSaveProv = async () => {
    if (!form.nombre) return setError('El nombre es requerido');
    setSaving(true);
    try {
      if (editId) await api.put(`/proveedores/${editId}`, form);
      else await api.post('/proveedores', form);
      setOpenProv(false); loadProveedores();
    } catch (err) { setError(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

 const handleDeleteProv = async (id) => {
  const result = await alertaConfirmar(
    '¿Eliminar este proveedor?'
  );

  if (!result.isConfirmed) return;

  try {
    await api.delete(`/proveedores/${id}`);

    alertaExito(
      'Proveedor eliminado correctamente'
    );

    loadProveedores();

  } catch (err) {
    alertaError(
      err.response?.data?.message ||
      'Error al eliminar proveedor'
    );
  }
};
const handleVerDetalleCompra = async (compra) => {
  setLoadingDetalle(true);
  setCompraDetalle({ ...compra, detalle: [] });

  try {
    const res = await api.get(`/proveedores/compras/${compra.id}`);
    setCompraDetalle(res.data);
  } catch (err) {
    alertaError(err.response?.data?.message || 'Error al obtener detalle de compra');
  } finally {
    setLoadingDetalle(false);
  }
};

  const agregarItemCompra = (producto) => {
    if (!producto) return;
    const existe = items.find(i => i.id_producto === producto.id);
    if (existe) setItems(items.map(i => i.id_producto === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    else setItems([...items, { id_producto: producto.id, nombre_producto: producto.nombre, cantidad: 1, precio_unitario: 0 }]);
  };
  const handleCrearProductoDesdeCompra = async () => {
  if (!nuevoProducto.nombre) return setError('El nombre del producto es requerido');

  const cantidad = Number(nuevoProducto.cantidad || 0);
  const menudista = Number(nuevoProducto.precio_menudista || 0);
  const mayorista = Number(nuevoProducto.precio_mayorista || 0);
  const especial = Number(nuevoProducto.precio_especial || 0);

  if (cantidad <= 0) return setError('La cantidad inicial debe ser mayor a 0');
  if (menudista <= 0 || mayorista <= 0 || especial <= 0) {
    return setError('Todos los precios deben ser mayores a 0');
  }

  if (menudista <= mayorista || menudista <= especial) {
    return setError('El precio menudista debe ser mayor al mayorista y especial');
  }

  if (especial >= mayorista) {
    return setError('El precio especial debe ser menor al precio mayorista');
  }

  setSaving(true);
  setError('');

  try {
    await api.post('/productos', {
      nombre: nuevoProducto.nombre,
      cantidad,
      precio_menudista: menudista,
      precio_mayorista: mayorista,
      precio_especial: especial
    });

    const res = await api.get('/productos');
    setProductos(res.data);

    const creado = res.data.find(
      p => p.nombre.toLowerCase() === nuevoProducto.nombre.toLowerCase()
    );

    if (creado) {
      setItems(prev => [
        ...prev,
        {
          id_producto: creado.id,
          nombre_producto: creado.nombre,
          cantidad,
          precio_unitario: 0
        }
      ]);
    }

    setNuevoProducto({
      nombre: '',
      cantidad: '',
      precio_menudista: '',
      precio_mayorista: '',
      precio_especial: ''
    });

    setOpenNuevoProducto(false);
  } catch (err) {
    setError(err.response?.data?.message || 'Error al crear producto');
  } finally {
    setSaving(false);
  }
};

  const handleSaveCompra = async () => {
    if (!compraForm.id_proveedor) return setError('Selecciona un proveedor');
    if (items.length === 0) return setError('Agrega al menos un producto');
    setSaving(true); setError('');
    try {
      await api.post('/proveedores/compra', {
        id_proveedor: compraForm.id_proveedor.id,
        notas: compraForm.notas,
        items
      });
      setOpenCompra(false);
      setCompraForm({ id_proveedor: null, notas: '' });
      setItems([]);
      loadCompras();
      // Recargar productos para ver stock actualizado
      api.get('/productos').then(res => setProductos(res.data));
    } catch (err) { setError(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
  const totalCompra = items.reduce((s, i) => s + (i.precio_unitario || 0) * i.cantidad, 0);

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
  <Typography
    variant="h5"
    fontWeight={700}
    color="#1B5E20"
  >
    Proveedores
  </Typography>

  <Box
    sx={{
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      gap: 1.5,
      width: { xs: '100%', sm: 'auto' }
    }}
  >
    <Button
      fullWidth
      variant="outlined"
      startIcon={<ShoppingBagIcon />}
      onClick={() => {
        setError('');
        setOpenCompra(true);
      }}
      sx={{
        borderColor: '#2E7D32',
        color: '#2E7D32',
        borderRadius: 2
      }}
    >
      Registrar compra
    </Button>

    <Button
      fullWidth
      variant="contained"
      startIcon={<AddIcon />}
      onClick={() => handleOpenProv()}
      sx={{
        bgcolor: '#2E7D32',
        '&:hover': { bgcolor: '#1B5E20' },
        borderRadius: 2
      }}
    >
      Nuevo proveedor
    </Button>
  </Box>
</Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .Mui-selected': { color: '#2E7D32' }, '& .MuiTabs-indicator': { bgcolor: '#2E7D32' } }}>
        <Tab label="Proveedores" />
        <Tab label="Historial de compras" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress sx={{ color: '#2E7D32' }} /></Box>
      ) : (
        <>
          {tab === 0 && (
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                    {['Nombre', 'Teléfono', 'Correo', 'Dirección', ''].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 13 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proveedores.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{p.nombre}</TableCell>
                      <TableCell>{p.telefono || '—'}</TableCell>
                      <TableCell>{p.correo || '—'}</TableCell>
                      <TableCell>{p.direccion || '—'}</TableCell>
                      <TableCell>
                        <Tooltip title="Editar"><IconButton size="small" onClick={() => handleOpenProv(p)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDeleteProv(p.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {proveedores.length === 0 && (
                    <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>Sin proveedores registrados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          )}

          {tab === 1 && (
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                    {['#', 'Proveedor', 'Registró', 'Fecha', 'Total', 'Notas'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 13 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compras.map((c) => (
                    <TableRow
  key={c.id}
  hover
  onDoubleClick={() => handleVerDetalleCompra(c)}
  sx={{ cursor: 'pointer' }}
>
  <Dialog open={!!compraDetalle} onClose={() => setCompraDetalle(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
  <DialogTitle sx={{ fontWeight: 700, color: '#1B5E20' }}>
    Detalle de compra #{compraDetalle?.id}
  </DialogTitle>

  <DialogContent>
    {loadingDetalle ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress sx={{ color: '#2E7D32' }} />
      </Box>
    ) : compraDetalle && (
      <Box>
        <Typography variant="body2"><strong>Proveedor:</strong> {compraDetalle.proveedor_nombre || '—'}</Typography>
        <Typography variant="body2"><strong>Registró:</strong> {compraDetalle.usuario_nombre || '—'}</Typography>
        <Typography variant="body2"><strong>Fecha:</strong> {new Date(compraDetalle.fecha).toLocaleString('es-MX')}</Typography>
        <Typography variant="body2"><strong>Notas:</strong> {compraDetalle.notas || '—'}</Typography>

        <Divider sx={{ my: 2 }} />

        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F1F8E9' }}>
              <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Producto</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Cantidad</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Precio</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Subtotal</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {compraDetalle.detalle?.map((d, i) => (
              <TableRow key={i}>
                <TableCell>{d.nombre_producto}</TableCell>
                <TableCell>{d.cantidad}</TableCell>
                <TableCell>{fmt(d.precio_unitario)}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2E7D32' }}>
                  {fmt(Number(d.precio_unitario || 0) * Number(d.cantidad || 0))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Typography variant="h6" fontWeight={700} color="#1B5E20">
            Total: {fmt(compraDetalle.total)}
          </Typography>
        </Box>
      </Box>
    )}
  </DialogContent>

  <DialogActions sx={{ p: 2 }}>
    <Button onClick={() => setCompraDetalle(null)} sx={{ color: 'text.secondary' }}>
      Cerrar
    </Button>
  </DialogActions>
</Dialog>n
                      <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>#{c.id}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{c.proveedor_nombre}</TableCell>
                      <TableCell>{c.usuario_nombre}</TableCell>
                      <TableCell>{new Date(c.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>{fmt(c.total)}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{c.notas || '—'}</TableCell>
                    </TableRow>
                  ))}
                  {compras.length === 0 && (
                    <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>Sin compras registradas</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}

      {/* DIALOG PROVEEDOR */}
      <Dialog open={openProv} onClose={() => setOpenProv(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1B5E20' }}>{editId ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12}><TextField label="Nombre" fullWidth size="small" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Teléfono" fullWidth size="small" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Correo" fullWidth size="small" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Dirección" fullWidth size="small" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setOpenProv(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveProv} disabled={saving} sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG COMPRA */}
      <Dialog open={openCompra} onClose={() => setOpenCompra(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1B5E20' }}>Registrar compra a proveedor</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12} md={6}>
              <Autocomplete options={proveedores} getOptionLabel={(p) => p.nombre}
                value={compraForm.id_proveedor} onChange={(_, v) => setCompraForm({ ...compraForm, id_proveedor: v })}
                renderInput={(params) => <TextField {...params} label="Proveedor" size="small" fullWidth />} noOptionsText="Sin proveedores" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Notas (opcional)" fullWidth size="small" value={compraForm.notas} onChange={e => setCompraForm({ ...compraForm, notas: e.target.value })} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
  <Typography variant="subtitle2" fontWeight={700} color="#1B5E20">
    Productos recibidos
  </Typography>

  <Button
    size="small"
    variant="outlined"
    startIcon={<AddIcon />}
    onClick={() => {
      setError('');
      setOpenNuevoProducto(true);
    }}
    sx={{
      borderColor: '#2E7D32',
      color: '#2E7D32',
      borderRadius: 2
    }}
  >
    Nuevo producto
  </Button>
</Box>
<Dialog
  open={openNuevoProducto}
  onClose={() => setOpenNuevoProducto(false)}
  maxWidth="sm"
  fullWidth
  PaperProps={{ sx: { borderRadius: 3 } }}
>
  <DialogTitle sx={{ fontWeight: 700, color: '#1B5E20' }}>
    Nuevo producto desde compra
  </DialogTitle>

  <DialogContent>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

    <Grid container spacing={2} mt={0.5}>
      <Grid item xs={12}>
        <TextField
          label="Nombre del producto"
          fullWidth
          size="small"
          value={nuevoProducto.nombre}
          onChange={e => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Cantidad inicial"
          type="number"
          fullWidth
          size="small"
          value={nuevoProducto.cantidad}
          onChange={e => setNuevoProducto({ ...nuevoProducto, cantidad: e.target.value })}
          inputProps={{ min: 1 }}
        />
      </Grid>

      <Grid item xs={4}>
        <TextField
          label="P. Menudista"
          type="number"
          fullWidth
          size="small"
          value={nuevoProducto.precio_menudista}
          onChange={e => setNuevoProducto({ ...nuevoProducto, precio_menudista: e.target.value })}
          inputProps={{ min: 0, step: 0.01 }}
        />
      </Grid>

      <Grid item xs={4}>
        <TextField
          label="P. Mayorista"
          type="number"
          fullWidth
          size="small"
          value={nuevoProducto.precio_mayorista}
          onChange={e => setNuevoProducto({ ...nuevoProducto, precio_mayorista: e.target.value })}
          inputProps={{ min: 0, step: 0.01 }}
        />
      </Grid>

      <Grid item xs={4}>
        <TextField
          label="P. Especial"
          type="number"
          fullWidth
          size="small"
          value={nuevoProducto.precio_especial}
          onChange={e => setNuevoProducto({ ...nuevoProducto, precio_especial: e.target.value })}
          inputProps={{ min: 0, step: 0.01 }}
        />
      </Grid>
    </Grid>

    <Alert severity="info" sx={{ mt: 2 }}>
      Al guardar, el producto se agregará al inventario y se añadirá automáticamente a esta compra.
    </Alert>
  </DialogContent>

  <DialogActions sx={{ p: 2.5 }}>
    <Button onClick={() => setOpenNuevoProducto(false)} sx={{ color: 'text.secondary' }}>
      Cancelar
    </Button>

    <Button
      variant="contained"
      onClick={handleCrearProductoDesdeCompra}
      disabled={saving}
      sx={{
        bgcolor: '#2E7D32',
        '&:hover': { bgcolor: '#1B5E20' },
        borderRadius: 2
      }}
    >
      {saving ? 'Guardando...' : 'Crear y agregar'}
    </Button>
  </DialogActions>
</Dialog>

<Autocomplete options={productos} getOptionLabel={(p) => p.nombre}
            onChange={(_, v) => agregarItemCompra(v)} value={null}
            renderInput={(params) => <TextField {...params} label="Buscar producto del inventario..." size="small" fullWidth />} noOptionsText="Sin resultados" />

          {items.length > 0 && (
            <Table size="small" sx={{ mt: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Producto</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Cantidad</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Precio compra</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 12 }}>Subtotal</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id_producto}>
                    <TableCell sx={{ fontWeight: 500 }}>{item.nombre_producto}</TableCell>
                    <TableCell>
                      <TextField type="number" size="small" value={item.cantidad}
                        onChange={e => setItems(items.map(i => i.id_producto === item.id_producto ? { ...i, cantidad: parseInt(e.target.value) || 1 } : i))}
                        inputProps={{ min: 1, style: { width: 60 } }} />
                    </TableCell>
                    <TableCell>
                      <TextField type="number" size="small" value={item.precio_unitario}
                        onChange={e => setItems(items.map(i => i.id_producto === item.id_producto ? { ...i, precio_unitario: parseFloat(e.target.value) || 0 } : i))}
                        inputProps={{ min: 0, step: 0.5, style: { width: 80 } }}
                        InputProps={{ startAdornment: <Typography variant="caption" mr={0.5}>$</Typography> }} />
                    </TableCell>
                    <TableCell sx={{ color: '#2E7D32', fontWeight: 600 }}>{fmt((item.precio_unitario || 0) * item.cantidad)}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => setItems(items.filter(i => i.id_producto !== item.id_producto))}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {items.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#F9FBF7', borderRadius: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Typography fontWeight={700} color="#1B5E20">Total compra: {fmt(totalCompra)}</Typography>
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>Al guardar, las cantidades se sumarán automáticamente al inventario.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenCompra(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveCompra} disabled={saving} sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}>
            {saving ? 'Guardando...' : 'Registrar compra'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
