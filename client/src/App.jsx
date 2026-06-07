import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import VendedorLayout from './components/VendedorLayout.jsx';

// Admin pages
import Dashboard from './pages/Dashboard.jsx';
import Productos from './pages/Productos.jsx';
import Clientes from './pages/Clientes.jsx';
import Ventas from './pages/admin/Ventas.jsx';
import NuevaVenta from './pages/admin/NuevaVenta.jsx';
import Reportes from './pages/Reportes.jsx';
import Proveedores from './pages/admin/Proveedores.jsx';

// Vendedor pages
import VendedorDashboard from './pages/vendedor/Dashboard.jsx';
import VendedorVentas from './pages/vendedor/Ventas.jsx';
import VendedorNuevaVenta from './pages/vendedor/NuevaVenta.jsx';
import VendedorInventario from './pages/vendedor/Inventario.jsx';
import VendedorPedidos from './pages/vendedor/Pedidos.jsx';

const getRol = () => {
  try { return JSON.parse(localStorage.getItem('usuario') || '{}').rol; } catch { return null; }
};

const PrivateRoute = ({ children, allowedRol }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  const rol = getRol();
  if (allowedRol && rol !== allowedRol) {
    return <Navigate to={rol === 'admin' ? '/admin/dashboard' : '/vendedor/dashboard'} replace />;
  }
  return children;
};

const RootRedirect = () => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  const rol = getRol();
  return <Navigate to={rol === 'admin' ? '/admin/dashboard' : '/vendedor/dashboard'} replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Admin routes */}
        <Route path="/admin" element={<PrivateRoute allowedRol="admin"><AdminLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="productos" element={<Productos />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="ventas/nueva" element={<NuevaVenta />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="proveedores" element={<Proveedores />} />
        </Route>

        {/* Vendedor routes */}
        <Route path="/vendedor" element={<PrivateRoute allowedRol="vendedor"><VendedorLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<VendedorDashboard />} />
          <Route path="ventas" element={<VendedorVentas />} />
          <Route path="ventas/nueva" element={<VendedorNuevaVenta />} />
          <Route path="inventario" element={<VendedorInventario />} />
          <Route path="pedidos" element={<VendedorPedidos />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
