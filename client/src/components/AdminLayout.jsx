import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, IconButton, Avatar, Divider, Tooltip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import BarChartIcon from '@mui/icons-material/BarChart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LogoutIcon from '@mui/icons-material/Logout';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import AssignmentIcon from '@mui/icons-material/Assignment';

const W = 220;
const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
  { label: 'Ventas', path: '/admin/ventas', icon: <PointOfSaleIcon /> },
  { label: 'Pedidos', path: '/admin/pedidos', icon: <AssignmentIcon /> },
  { label: 'Clientes', path: '/admin/clientes', icon: <PeopleIcon /> },
  { label: 'Proveedores', path: '/admin/proveedores', icon: <LocalShippingIcon /> },
  { label: 'Reportes', path: '/admin/reportes', icon: <BarChartIcon /> },
  { label: 'Inventario', path: '/admin/productos', icon: <InventoryIcon /> },
];
export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f0' }}>
      <Drawer variant="permanent" sx={{ width: W, flexShrink: 0, '& .MuiDrawer-paper': { width: W, bgcolor: '#1B5E20', color: '#fff', border: 'none' } }}>
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
         <Box>
            <Typography variant="body1" fontWeight={700} color="#fff" lineHeight={1.2}>Viveros Charis</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Administrador</Typography>
          </Box>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />
        <List sx={{ px: 1, flex: 1 }}>
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton onClick={() => navigate(item.path)} sx={{ borderRadius: 2, color: active ? '#fff' : 'rgba(255,255,255,0.65)', bgcolor: active ? 'rgba(255,255,255,0.15)' : 'transparent', borderLeft: active ? '3px solid #81C784' : '3px solid transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' } }}>
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#4CAF50', fontSize: 14 }}>{usuario.nombre?.[0]?.toUpperCase() || 'A'}</Avatar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography variant="caption" color="#fff" fontWeight={600} noWrap display="block">{usuario.nombre}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Admin</Typography>
          </Box>
          <Tooltip title="Cerrar sesión"><IconButton size="small" onClick={handleLogout} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#fff' } }}><LogoutIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flex: 1, p: 3, overflow: 'auto' }}><Outlet /></Box>
    </Box>
  );
}
