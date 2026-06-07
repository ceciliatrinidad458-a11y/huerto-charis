-- Ejecutar este archivo en MySQL Workbench o tu terminal MySQL
-- mysql -u root -p < database.sql

CREATE DATABASE IF NOT EXISTS viveros_charis;
USE viveros_charis;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'vendedor') DEFAULT 'vendedor',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  tipo ENUM('mayorista', 'menudista', 'especial') DEFAULT 'menudista',
  credito_activo BOOLEAN DEFAULT FALSE,
  saldo_credito DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  cantidad INT DEFAULT 0,
  precio_menudista DECIMAL(10,2) DEFAULT 0,
  precio_mayorista DECIMAL(10,2) DEFAULT 0,
  precio_especial DECIMAL(10,2) DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT,
  id_usuario INT,
  tipo_pago ENUM('contado', 'credito') DEFAULT 'contado',
  total DECIMAL(10,2),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id) ON DELETE SET NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT,
  id_producto INT,
  cantidad INT,
  precio_unitario DECIMAL(10,2),
  FOREIGN KEY (id_venta) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE SET NULL
);

-- Usuario admin por defecto
-- Correo: admin@viveros.com | Contraseña: admin123
INSERT IGNORE INTO usuarios (nombre, correo, password, rol) VALUES (
  'Administrador',
  'admin@viveros.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin'
);

-- Datos de prueba - Clientes
INSERT IGNORE INTO clientes (nombre, telefono, tipo, credito_activo, saldo_credito) VALUES
  ('Juan Mendoza', '555-0101', 'menudista', FALSE, 0),
  ('Distribuidora Verde SA', '555-0202', 'mayorista', TRUE, 1500.00),
  ('Rosa Elena Pérez', '555-0303', 'especial', FALSE, 0),
  ('Jardines del Norte', '555-0404', 'mayorista', FALSE, 0);

-- Datos de prueba - Productos
INSERT IGNORE INTO productos (nombre, cantidad, precio_menudista, precio_mayorista, precio_especial) VALUES
  ('Helecho Boston', 15, 85.00, 65.00, 70.00),
  ('Cactus Barrel', 8, 220.00, 180.00, 190.00),
  ('Ficus Elastica', 22, 150.00, 120.00, 130.00),
  ('Lavanda', 30, 60.00, 45.00, 50.00),
  ('Rosa Inglesa', 5, 95.00, 75.00, 80.00),
  ('Pothos Golden', 40, 45.00, 35.00, 38.00),
  ('Monstera Deliciosa', 12, 320.00, 260.00, 280.00),
  ('Suculenta Echeveria', 50, 35.00, 25.00, 28.00),
  ('Orquídea Phalaenopsis', 7, 450.00, 380.00, 400.00),
  ('Bambú de la Suerte', 3, 180.00, 145.00, 155.00);
