import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  MenuItem, Tabs, Tab, Divider
} from '@mui/material';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';

export default function Login() {
  const [tab, setTab] = useState(0);
  const [loginForm, setLoginForm] = useState({ correo: '', password: '' });
  const [adminExiste, setAdminExiste] = useState(false);
  const [regForm, setRegForm] = useState({ nombre: '', correo: '', password: '', confirmar: '', rol: 'vendedor' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
 
  useEffect(() => {
  api.get('/auth/existe-admin')
    .then(res => setAdminExiste(res.data.existe))
    .catch(() => setAdminExiste(false));
}, []);

  const handleTab = (_, val) => { setTab(val); setError(''); setSuccess(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', loginForm);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!regForm.nombre || !regForm.correo || !regForm.password) return setError('Todos los campos son requeridos');
    if (regForm.password !== regForm.confirmar) return setError('Las contraseñas no coinciden');
    if (regForm.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    setLoading(true);
    try {
      await api.post('/auth/register', { nombre: regForm.nombre, correo: regForm.correo, password: regForm.password, rol: regForm.rol });
      setSuccess('¡Cuenta creada! Ya puedes iniciar sesión.');
      setRegForm({ nombre: '', correo: '', password: '', confirmar: '', rol: 'vendedor' });
      setTimeout(() => { setTab(0); setSuccess(''); }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar');
    } finally { setLoading(false); }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#2E7D32' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#2E7D32' },
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: '#f1f8e9',
      backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(76,175,80,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(27,94,32,0.06) 0%, transparent 50%)'
    }}>
      <Card sx={{ width: 400, borderRadius: 3, boxShadow: '0 8px 32px rgba(27,94,32,0.12)' }}>
        <CardContent sx={{ p: 4 }}>

          <Box sx={{ textAlign: 'center', mb: 3 }}>
             <Box
  component="img"
  src="/logo-corte-caja.png"
  alt="Viveros Charis"
  sx={{
    width: 42,
    height: 42,
    borderRadius: 2,
    bgcolor: '#fff',
    p: 0.5
  }}
/>
            <Typography variant="h5" fontWeight={700} color="#1B5E20">Viveros Charis</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>Sistema de Gestión de Ventas</Typography>
          </Box>

          <Tabs value={tab} onChange={handleTab} variant="fullWidth" sx={{
            mb: 3,
            '& .MuiTab-root': { fontWeight: 600, fontSize: 13 },
            '& .Mui-selected': { color: '#2E7D32' },
            '& .MuiTabs-indicator': { bgcolor: '#2E7D32' },
          }}>
            <Tab label="Iniciar sesión" />
            <Tab label="Registrarse" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

          {tab === 0 && (
            <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Correo electrónico" type="email" size="small" fullWidth required
                value={loginForm.correo} onChange={e => setLoginForm({ ...loginForm, correo: e.target.value })} sx={inputSx} />
              <TextField label="Contraseña" type="password" size="small" fullWidth required
                value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} sx={inputSx} />
              <Button type="submit" variant="contained" fullWidth disabled={loading}
                sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, mt: 1, py: 1.3, borderRadius: 2, fontSize: 15 }}>
                {loading ? 'Iniciando sesión...' : 'Ingresar'}
              </Button>
              <Divider />
              <Typography variant="caption" color="text.secondary" textAlign="center">
                ¿No tienes cuenta?{' '}
                <Box component="span" sx={{ color: '#2E7D32', cursor: 'pointer', fontWeight: 600 }} onClick={() => handleTab(null, 1)}>
                  Regístrate aquí
                </Box>
              </Typography>
            </Box>
          )}

          {tab === 1 && (
            <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Nombre completo" size="small" fullWidth required
                value={regForm.nombre} onChange={e => setRegForm({ ...regForm, nombre: e.target.value })} sx={inputSx} />
              <TextField label="Correo electrónico" type="email" size="small" fullWidth required
                value={regForm.correo} onChange={e => setRegForm({ ...regForm, correo: e.target.value })} sx={inputSx} />
              <TextField select label="Rol" size="small" fullWidth
                value={regForm.rol} onChange={e => setRegForm({ ...regForm, rol: e.target.value })} sx={inputSx}>
                <MenuItem value="vendedor">Vendedor</MenuItem>
                {!adminExiste && (
  <MenuItem value="admin">Administrador</MenuItem>
)}
              </TextField>
              <TextField label="Contraseña" type="password" size="small" fullWidth required
                value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} sx={inputSx}
                helperText="Mínimo 6 caracteres" />
              <TextField label="Confirmar contraseña" type="password" size="small" fullWidth required
                value={regForm.confirmar} onChange={e => setRegForm({ ...regForm, confirmar: e.target.value })} sx={inputSx}
                error={regForm.confirmar.length > 0 && regForm.password !== regForm.confirmar}
                helperText={regForm.confirmar.length > 0 && regForm.password !== regForm.confirmar ? 'Las contraseñas no coinciden' : ''} />
              <Button type="submit" variant="contained" fullWidth disabled={loading}
                sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, mt: 1, py: 1.3, borderRadius: 2, fontSize: 15 }}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
              <Divider />
              <Typography variant="caption" color="text.secondary" textAlign="center">
                ¿Ya tienes cuenta?{' '}
                <Box component="span" sx={{ color: '#2E7D32', cursor: 'pointer', fontWeight: 600 }} onClick={() => handleTab(null, 0)}>
                  Inicia sesión
                </Box>
              </Typography>
            </Box>
          )}

        </CardContent>
      </Card>
    </Box>
  );
}
