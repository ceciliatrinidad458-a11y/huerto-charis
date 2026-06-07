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

const empty = { nombre: '', cantidad: '', precio_menudista: '', precio_mayorista: '', precio_especial: '' };

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
    if (!form.nombre) return setError('El nombre es requerido');
    setSaving(true);
    try {
      if (editId) await api.put(`/productos/${editId}`, form);
      else await api.post('/productos', form);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este producto?')) return;
    await api.delete(`/productos/${id}`);
    load();
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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
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
