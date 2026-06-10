import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  MenuItem, Tabs, Tab, Divider
} from '@mui/material';
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

const buttonSx = {
  bgcolor: '#166534',
  py: 1.5,
  borderRadius: 3,
  fontWeight: 800,
  fontSize: '0.95rem',
  boxShadow: '0 8px 20px rgba(22,101,52,.25)',
  '&:hover': {
    bgcolor: '#14532D'
  }
};

const linkSx = {
  color: '#2E7D32',
  cursor: 'pointer',
  fontWeight: 900
};

 return (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      px: { xs: 2, sm: 3 },
      py: { xs: 3, md: 5 },
      bgcolor: '#F4F7F1'
    }}
  >
    <Card
  sx={{
    width: '100%',
    maxWidth: 1050,
    minHeight: 650,
    borderRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    bgcolor: '#fff',
    boxShadow: '0 25px 80px rgba(0,0,0,0.12)'
  }}
>
      <Box
        sx={{
          width: '48%',
          display: { xs: 'none', md: 'block' },
          backgroundImage: `linear-gradient(rgba(0,0,0,.08), rgba(0,0,0,.08)), url("/login-orquidea.jpg")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderTopRightRadius: 80,
          borderBottomRightRadius: 70
        }}
      />

      <Box
        sx={{
          flex: 1,
          bgcolor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 6 },
          py: 5
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 380 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              component="img"
              src="/logo-corte-caja.png"
              alt="Viveros Charis"
              sx={{
                width: 52,
                height: 52,
                objectFit: 'contain',
                mb: 1
              }}
            />

            <Typography
              variant="h4"
              fontWeight={900}
              color="#0B4F1F"
              sx={{ letterSpacing: '-0.8px' }}
            >
              Viveros Charis
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Sistema de Gestión de Ventas
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={handleTab}
            variant="fullWidth"
            sx={{
              mb: 3,
              minHeight: 40,
              bgcolor: '#F3F7F1',
              borderRadius: 3,
              p: 0.5,
              '& .MuiTab-root': {
                minHeight: 34,
                borderRadius: 2.5,
                fontWeight: 800,
                fontSize: 12,
                textTransform: 'none'
              },
              '& .Mui-selected': {
                color: '#0B4F1F',
                bgcolor: '#FFFFFF',
                boxShadow: '0 3px 10px rgba(0,0,0,0.06)'
              },
              '& .MuiTabs-indicator': { display: 'none' }
            }}
          >
            <Tab label="Iniciar sesión" />
            <Tab label="Registrarse" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

          {tab === 0 && (
            <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" fontWeight={800} color="#1B5E20">
                Bienvenido de nuevo
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 1 }}>
                Inicia sesión para continuar
              </Typography>

              <TextField
                label="Correo electrónico"
                placeholder="tu@correo.com"
                type="email"
                size="small"
                fullWidth
                required
                value={loginForm.correo}
                onChange={e => setLoginForm({ ...loginForm, correo: e.target.value })}
                sx={inputSx}
              />

              <TextField
                label="Contraseña"
                type="password"
                size="small"
                fullWidth
                required
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                sx={inputSx}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={buttonSx}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>

              <Typography variant="caption" color="text.secondary" textAlign="center" mt={1}>
                ¿No tienes cuenta?{' '}
                <Box component="span" sx={linkSx} onClick={() => handleTab(null, 1)}>
                  Regístrate aquí
                </Box>
              </Typography>
            </Box>
          )}

          {tab === 1 && (
            <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" fontWeight={800} color="#1B5E20">
                Crear cuenta
              </Typography>

              <TextField
                label="Nombre completo"
                size="small"
                fullWidth
                required
                value={regForm.nombre}
                onChange={e => setRegForm({ ...regForm, nombre: e.target.value })}
                sx={inputSx}
              />

              <TextField
                label="Correo electrónico"
                type="email"
                size="small"
                fullWidth
                required
                value={regForm.correo}
                onChange={e => setRegForm({ ...regForm, correo: e.target.value })}
                sx={inputSx}
              />

              <TextField
                select
                label="Rol"
                size="small"
                fullWidth
                value={regForm.rol}
                onChange={e => setRegForm({ ...regForm, rol: e.target.value })}
                sx={inputSx}
              >
                <MenuItem value="vendedor">Vendedor</MenuItem>
                {!adminExiste && <MenuItem value="admin">Administrador</MenuItem>}
              </TextField>

              <TextField
                label="Contraseña"
                type="password"
                size="small"
                fullWidth
                required
                value={regForm.password}
                onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                sx={inputSx}
                helperText="Mínimo 6 caracteres"
              />

              <TextField
                label="Confirmar contraseña"
                type="password"
                size="small"
                fullWidth
                required
                value={regForm.confirmar}
                onChange={e => setRegForm({ ...regForm, confirmar: e.target.value })}
                sx={inputSx}
                error={regForm.confirmar.length > 0 && regForm.password !== regForm.confirmar}
                helperText={
                  regForm.confirmar.length > 0 && regForm.password !== regForm.confirmar
                    ? 'Las contraseñas no coinciden'
                    : ''
                }
              />

              <Button type="submit" variant="contained" fullWidth disabled={loading} sx={buttonSx}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>

              <Typography variant="caption" color="text.secondary" textAlign="center" mt={1}>
                ¿Ya tienes cuenta?{' '}
                <Box component="span" sx={linkSx} onClick={() => handleTab(null, 0)}>
                  Inicia sesión
                </Box>
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Card>
  </Box>
);
}
