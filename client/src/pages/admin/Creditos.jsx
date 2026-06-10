import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Divider, Alert, IconButton, Tooltip
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../api.js';
import {
  alertaExito,
  alertaError
} from '../../utils/alerts.js';

export default function Creditos() {
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [abonoOpen, setAbonoOpen] = useState(false);
  const [creditoDetalle, setCreditoDetalle] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [notasAbono, setNotasAbono] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

  const load = () => {
    setLoading(true);
    api.get('/clientes/creditos')
      .then(res => setCreditos(res.data))
      .catch(err => alertaError(err.response?.data?.message || 'Error al cargar créditos'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const abrirDetalle = async (credito) => {
    setDetalleOpen(true);
    setCreditoDetalle(null);

    try {
      const res = await api.get(`/clientes/creditos/${credito.id}`);
      setCreditoDetalle(res.data);
    } catch (err) {
      alertaError(err.response?.data?.message || 'Error al cargar detalle');
    }
  };

  const abrirAbono = (credito) => {
    setClienteSeleccionado(credito);
    setMontoAbono('');
    setNotasAbono('');
    setError('');
    setAbonoOpen(true);
  };

  const registrarAbono = async () => {
    const monto = Number(montoAbono || 0);

    if (monto <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    if (monto > Number(clienteSeleccionado?.saldo_credito || 0)) {
      setError(`El abono no puede ser mayor al saldo pendiente (${fmt(clienteSeleccionado?.saldo_credito)})`);
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.post(`/clientes/creditos/${clienteSeleccionado.id}/abono`, {
        monto,
        notas: notasAbono || 'Abono a crédito'
      });

      setAbonoOpen(false);
      setMontoAbono('');
      setNotasAbono('');
      alertaExito('Abono registrado correctamente');
      load();

      if (detalleOpen && creditoDetalle?.cliente?.id === clienteSeleccionado.id) {
        const res = await api.get(`/clientes/creditos/${clienteSeleccionado.id}`);
        setCreditoDetalle(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar abono');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1B5E20">
          Créditos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Control de ventas a crédito y abonos de clientes.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#2E7D32' }} />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                {['Cliente', 'Teléfono', 'Total crédito', 'Abonado', 'Saldo pendiente', 'Estado', 'Acciones'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#1B5E20', fontSize: 13 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {creditos.map((c) => (
                <TableRow
                  key={c.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onDoubleClick={() => abrirDetalle(c)}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{c.nombre}</TableCell>
                  <TableCell>{c.telefono || '—'}</TableCell>
                  <TableCell>{fmt(c.total_credito)}</TableCell>
                  <TableCell sx={{ color: '#2E7D32', fontWeight: 600 }}>{fmt(c.abonado)}</TableCell>
                  <TableCell sx={{ color: '#E65100', fontWeight: 700 }}>{fmt(c.saldo_credito)}</TableCell>
                  <TableCell>
                    <Chip
                      label={Number(c.saldo_credito || 0) > 0 ? 'Pendiente' : 'Pagado'}
                      size="small"
                      sx={{
                        bgcolor: Number(c.saldo_credito || 0) > 0 ? '#FFF3E0' : '#E8F5E9',
                        color: Number(c.saldo_credito || 0) > 0 ? '#E65100' : '#2E7D32',
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Ver detalle">
                      <IconButton size="small" onClick={() => abrirDetalle(c)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Registrar abono">
                      <IconButton
                        size="small"
                        sx={{ color: '#2E7D32' }}
                        onClick={() => abrirAbono(c)}
                      >
                        <PaymentIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {creditos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No hay créditos pendientes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={detalleOpen} onClose={() => setDetalleOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1B5E20' }}>
          Detalle del crédito
        </DialogTitle>

        <DialogContent>
          {!creditoDetalle ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#2E7D32' }} />
            </Box>
          ) : (
            <Box>
              <Grid container spacing={1} mb={2}>
                <Grid item xs={12} md={6}>
                  <Typography fontSize={13}><strong>Cliente:</strong> {creditoDetalle.cliente.nombre}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography fontSize={13}><strong>Teléfono:</strong> {creditoDetalle.cliente.telefono || '—'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography fontSize={13}><strong>Saldo pendiente:</strong> {fmt(creditoDetalle.cliente.saldo_credito)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography fontSize={13}><strong>Estado:</strong> {creditoDetalle.cliente.credito_activo ? 'Activo' : 'Pagado'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight={700} color="#1B5E20" mb={1}>
                Ventas a crédito
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Folio</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Vendedor</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {creditoDetalle.ventas.map(v => (
                    <TableRow key={v.id}>
                      <TableCell>#{v.id}</TableCell>
                      <TableCell>{new Date(v.fecha).toLocaleDateString('es-MX')}</TableCell>
                      <TableCell>{v.vendedor_nombre || '—'}</TableCell>
                      <TableCell>{fmt(v.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight={700} color="#1B5E20" mb={1}>
                Abonos realizados
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F1F8E9' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Registró</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Monto</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1B5E20' }}>Notas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {creditoDetalle.abonos.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>{new Date(a.fecha).toLocaleString('es-MX')}</TableCell>
                      <TableCell>{a.usuario_nombre || '—'}</TableCell>
                      <TableCell sx={{ color: '#2E7D32', fontWeight: 700 }}>{fmt(a.monto)}</TableCell>
                      <TableCell>{a.notas || '—'}</TableCell>
                    </TableRow>
                  ))}

                  {creditoDetalle.abonos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}>
                        Sin abonos registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          {creditoDetalle?.cliente?.credito_activo && (
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={() => {
                setDetalleOpen(false);
                abrirAbono(creditoDetalle.cliente);
              }}
              sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}
            >
              Registrar abono
            </Button>
          )}
          <Button onClick={() => setDetalleOpen(false)} sx={{ color: 'text.secondary' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={abonoOpen} onClose={() => setAbonoOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1B5E20' }}>
          Registrar abono
        </DialogTitle>

        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="body2" color="text.secondary" mb={1}>
            Cliente: <strong>{clienteSeleccionado?.nombre}</strong>
          </Typography>

          <Typography variant="body2" mb={2}>
            Saldo pendiente: <strong style={{ color: '#E65100' }}>{fmt(clienteSeleccionado?.saldo_credito)}</strong>
          </Typography>

          <TextField
            label="Monto del abono"
            type="number"
            fullWidth
            size="small"
            value={montoAbono}
            onChange={e => setMontoAbono(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            sx={{ mb: 2 }}
            autoFocus
          />

          <TextField
            label="Notas"
            fullWidth
            size="small"
            value={notasAbono}
            onChange={e => setNotasAbono(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setAbonoOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={registrarAbono}
            disabled={saving}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: 2 }}
          >
            {saving ? 'Guardando...' : 'Guardar abono'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}