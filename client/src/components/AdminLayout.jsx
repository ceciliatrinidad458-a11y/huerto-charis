import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, IconButton, Avatar, Divider, Tooltip, AppBar, Toolbar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import BarChartIcon from '@mui/icons-material/BarChart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LogoutIcon from '@mui/icons-material/Logout';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CreditScoreIcon from '@mui/icons-material/CreditScore';

const W = 220;

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
  { label: 'Ventas', path: '/admin/ventas', icon: <PointOfSaleIcon /> },
  { label: 'Créditos', path: '/admin/creditos', icon: <CreditScoreIcon /> },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const goTo = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body1" fontWeight={700} color="#fff" lineHeight={1.2} noWrap>
            Viveros Charis
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Administrador
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />

      <List sx={{ px: 1, flex: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path);

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => goTo(item.path)}
                sx={{
                  borderRadius: 2,
                  color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                  bgcolor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  borderLeft: active ? '3px solid #81C784' : '3px solid transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: '#fff'
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: '#4CAF50', fontSize: 14 }}>
          {usuario.nombre?.[0]?.toUpperCase() || 'A'}
        </Avatar>

        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography variant="caption" color="#fff" fontWeight={600} noWrap display="block">
            {usuario.nombre}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Admin
          </Typography>
        </Box>

        <Tooltip title="Cerrar sesión">
          <IconButton
            size="small"
            onClick={handleLogout}
            sx={{
              color: 'rgba(255,255,255,0.6)',
              '&:hover': { color: '#fff' }
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f0' }}>
      <AppBar
        position="fixed"
        sx={{
          display: { xs: 'block', md: 'none' },
          bgcolor: '#1B5E20',
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)'
        }}
      >
        <Toolbar sx={{ minHeight: 58 }}>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>

          <Box
            component="img"
            src="/logo-corte-caja.png"
            alt="Viveros Charis"
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1.5,
              bgcolor: '#fff',
              p: 0.4,
              mr: 1.2
            }}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={700} noWrap>
              Viveros Charis
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Administrador
            </Typography>
          </Box>

          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: W,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: W,
            bgcolor: '#1B5E20',
            color: '#fff',
            border: 'none'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: W,
            bgcolor: '#1B5E20',
            color: '#fff',
            border: 'none'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flex: 1,
          width: { xs: '100%', md: `calc(100% - ${W}px)` },
          p: { xs: 2, sm: 2.5, md: 3 },
          pt: { xs: 9, md: 3 },
          overflow: 'auto'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}