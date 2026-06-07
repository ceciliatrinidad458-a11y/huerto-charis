-- Ejecutar en MySQL Workbench para agregar las nuevas tablas
USE viveros_charis;

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  correo VARCHAR(150),
  direccion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de compras a proveedor (entrada de inventario)
CREATE TABLE IF NOT EXISTS compras_proveedor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_proveedor INT NOT NULL,
  id_usuario INT,
  total DECIMAL(10,2) DEFAULT 0,
  notas TEXT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_proveedor) REFERENCES proveedores(id),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Detalle de compras a proveedor
CREATE TABLE IF NOT EXISTS detalle_compras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_compra INT NOT NULL,
  id_producto INT,
  nombre_producto VARCHAR(150),
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (id_compra) REFERENCES compras_proveedor(id) ON DELETE CASCADE,
  FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE SET NULL
);

-- Tabla de pedidos de clientes
CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT,
  id_usuario INT,
  fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_entrega DATE NOT NULL,
  estado ENUM('pendiente', 'entregado', 'cancelado') DEFAULT 'pendiente',
  total DECIMAL(10,2) DEFAULT 0,
  anticipo DECIMAL(10,2) DEFAULT 0,
  notas TEXT,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id) ON DELETE SET NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Detalle de pedidos
CREATE TABLE IF NOT EXISTS detalle_pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  id_producto INT,
  nombre_producto VARCHAR(150),
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE SET NULL
);

-- Datos de prueba proveedores
INSERT IGNORE INTO proveedores (nombre, telefono, correo) VALUES
  ('Vivero Hernández', '555-1001', 'hernandez@vivero.com'),
  ('Plantas del Sur SA', '555-1002', 'contacto@plantassur.com'),
  ('NaturGreen', '555-1003', 'ventas@naturgreen.mx');
