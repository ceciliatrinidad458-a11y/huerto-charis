const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { correo, password } = req.body;

  try {
    const result = await db.query(
      'SELECT * FROM usuarios WHERE correo = $1',
      [correo]
    );

    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const usuario = rows[0];

    const valid = await bcrypt.compare(password, usuario.password);

    if (!valid) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error del servidor',
      error: err.message
    });
  }
};

const register = async (req, res) => {
  const { nombre, correo, password, rol } = req.body;
  if (rol === 'admin') {
  const adminResult = await db.query(
    `SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'admin'`
  );

  if (Number(adminResult.rows[0].total) > 0) {
    return res.status(400).json({
      message: 'Ya existe un administrador registrado'
    });
  }
}
  try {
    const hash = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO usuarios 
      (nombre, correo, password, rol) 
      VALUES ($1, $2, $3, $4)`,
      [nombre, correo, hash, rol || 'vendedor']
    );

    res.status(201).json({
      message: 'Usuario creado correctamente'
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({
        message: 'El correo ya está registrado'
      });
    }

    res.status(500).json({
      message: 'Error del servidor',
      error: err.message
    });
  }
};
const existeAdmin = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'admin'`
    );

    res.json({
      existe: Number(result.rows[0].total) > 0
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error al verificar administrador',
      error: err.message
    });
  }
};

module.exports = { login, register, existeAdmin };