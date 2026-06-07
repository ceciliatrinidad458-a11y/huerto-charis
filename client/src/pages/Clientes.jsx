import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, MenuItem, CircularProgress, Alert, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api.js';

const empty = { nombre: '', telefono: '', tipo: 'menudista', credito_activo: false, saldo_credito: 0 };

const tipoColor = { mayorista: { bg: '#E3F2FD', text: '#1565C0' }, menudista: { bg: '#F3E5F5', text: '#6A1B9A' }, especial: { bg: '#FFF8E1', text: '#F57F17' } };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/clientes').then(res => setClientes(res.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleOpen = (c = null) => {
    setForm(c ? { nombre: c.nombre, telefono: c.telefono || '', tipo: c.tipo, credito_activo: c.credito_activo, saldo_credito: c.saldo_credito } : empty);
    setEditId(c?.id || null);
    setError('');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre) return setError('El nombre es requerido');
    setSaving(true);
    try {
      if (editId) await api.put(`/clientes/${editId}`, form);
      else await api.post('/clientes', form);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    await api.delete(`/clientes/${id}`);
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1B5E20">Clientes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}
          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}>
          Nuevo cliente
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress sx={{ color: '#2E7D32' }} /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                {['Nombre', 'Teléfono', 'Tipo', 'Crédito activo', 'Saldo crédito', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 13 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {clientes.map((c) => {
                const tc = tipoColor[c.tipo] || tipoColor.menudista;
                return (
                  <TableRow key={c.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{c.nombre}</TableCell>
                    <TableCell>{c.telefono || '—'}</TableCell>
                    <TableCell>
                      <Chip label={c.tipo} size="small" sx={{ bgcolor: tc.bg, color: tc.text, fontSize: 11, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={c.credito_activo ? 'Sí' : 'No'} size="small"
                        sx={{ bgcolor: c.credito_activo ? '#FFEBEE' : '#E8F5E9', color: c.credito_activo ? '#C62828' : '#2E7D32', fontSize: 11 }} />
                    </TableCell>
                    <TableCell sx={{ color: c.saldo_credito > 0 ? '#C62828' : 'text.primary', fontWeight: c.saldo_credito > 0 ? 600 : 400 }}>
                      ${Number(c.saldo_credito || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Editar"><IconButton size="small" onClick={() => handleOpen(c)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDelete(c.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1B5E20' }}>{editId ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12}>
              <TextField label="Nombre completo" fullWidth size="small" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Teléfono" fullWidth size="small" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField select label="Tipo de cliente" fullWidth size="small" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                <MenuItem value="menudista">Menudista</MenuItem>
                <MenuItem value="mayorista">Mayorista</MenuItem>
                <MenuItem value="especial">Especial</MenuItem>
              </TextField>
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
