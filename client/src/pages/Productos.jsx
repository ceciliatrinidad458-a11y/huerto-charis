import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, CircularProgress, Alert, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api.js';
import Swal from 'sweetalert2';
import { Snackbar } from '@mui/material';

const empty = { nombre: '', cantidad: '', precio_menudista: '', precio_mayorista: '', precio_especial: '' };

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
  open: false,
  message: '',
  severity: 'success'
});

  const load = () => {
    setLoading(true);
    api.get('/productos').then(res => setProductos(res.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleOpen = (p = null) => {
    setForm(p ? { nombre: p.nombre, cantidad: p.cantidad, precio_menudista: p.precio_menudista, precio_mayorista: p.precio_mayorista, precio_especial: p.precio_especial } : empty);
    setEditId(p?.id || null);
    setError('');
    setOpen(true);
  };

const handleSave = async () => {
  console.log('Entró a handleSave');

  if (!form.nombre) {
    console.log('Nombre vacío');
    return;
  }
  if (!form.nombre) {
    await Swal.fire({
      icon: 'warning',
      title: 'Campo requerido',
      text: 'El nombre del producto es requerido',
      confirmButtonColor: '#2E7D32'
    });
    return;
  }

  setSaving(true);
  setError('');

  try {
  const esEdicion = Boolean(editId);

  if (esEdicion) {
    await api.put(`/productos/${editId}`, form);
  } else {
    console.log('Antes del POST');
    await api.post('/productos', form);
    console.log('Después del POST');
  
  }
setSnackbar({
  open: true,
  message: 'Producto agregado correctamente',
  severity: 'success'
});

console.log('Voy a mostrar alerta');
  setOpen(false);
  load();

  setSnackbar({
    open: true,
    message: esEdicion
      ? 'Producto actualizado correctamente'
      : 'Nuevo producto agregado al stock',
    severity: 'success'
  });

} catch (err) {
  setSnackbar({
    open: true,
    message: err.response?.data?.message || 'Error al guardar producto',
    severity: 'error'
  });
} finally {
  setSaving(false);
} 
};

const handleDelete = async (id) => {
  const result = await Swal.fire({
    icon: 'warning',
    title: '¿Desactivar producto?',
    text: 'El producto dejará de estar disponible en el inventario.',
    showCancelButton: true,
    confirmButtonColor: '#C62828',
    cancelButtonColor: '#757575',
    confirmButtonText: 'Sí, desactivar',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed) return;

  try {
    await api.delete(`/productos/${id}`);

    await Swal.fire({
      icon: 'success',
      title: 'Producto desactivado',
      text: 'El producto se desactivó correctamente',
      confirmButtonColor: '#2E7D32',
      timer: 1600,
      showConfirmButton: false
    });

    load();
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.response?.data?.message || 'No se pudo desactivar el producto',
      confirmButtonColor: '#C62828'
    });
  }
};
  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1B5E20">Inventario</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}
          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}>
          Nuevo producto
        </Button>
      </Box>
      <Snackbar
  open={snackbar.open}
  autoHideDuration={2500}
  onClose={() => setSnackbar({ ...snackbar, open: false })}
  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
>
  <Alert
    severity={snackbar.severity}
    variant="filled"
    sx={{ borderRadius: 2 }}
    onClose={() => setSnackbar({ ...snackbar, open: false })}
  >
    {snackbar.message}
  </Alert>
</Snackbar>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress sx={{ color: '#2E7D32' }} /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                {['Producto', 'Cantidad', 'P. Menudista', 'P. Mayorista', 'P. Especial', 'Estado', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 13 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{p.nombre}</TableCell>
                  <TableCell>{p.cantidad}</TableCell>
                  <TableCell>{fmt(p.precio_menudista)}</TableCell>
                  <TableCell>{fmt(p.precio_mayorista)}</TableCell>
                  <TableCell>{fmt(p.precio_especial)}</TableCell>
                  <TableCell>
                    <Chip
                      label={p.cantidad <= 5 ? 'Crítico' : p.cantidad <= 10 ? 'Bajo' : 'OK'}
                      size="small"
                      sx={{
                        bgcolor: p.cantidad <= 5 ? '#FFEBEE' : p.cantidad <= 10 ? '#FFF3E0' : '#E8F5E9',
                        color: p.cantidad <= 5 ? '#C62828' : p.cantidad <= 10 ? '#E65100' : '#2E7D32',
                        fontSize: 11
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => handleOpen(p)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Desactivar"><IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog
  open={open}
  onClose={() => setOpen(false)}
  maxWidth="sm"
  fullWidth
  disableRestoreFocus
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1B5E20' }}>
          {editId ? 'Editar producto' : 'Nuevo producto'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12}>
              <TextField label="Nombre del producto" fullWidth size="small" value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Cantidad en stock" type="number" fullWidth size="small" value={form.cantidad}
                onChange={e => setForm({ ...form, cantidad: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Precio menudista" type="number" fullWidth size="small" value={form.precio_menudista}
                onChange={e => setForm({ ...form, precio_menudista: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Precio mayorista" type="number" fullWidth size="small" value={form.precio_mayorista}
                onChange={e => setForm({ ...form, precio_mayorista: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Precio especial" type="number" fullWidth size="small" value={form.precio_especial}
                onChange={e => setForm({ ...form, precio_especial: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
