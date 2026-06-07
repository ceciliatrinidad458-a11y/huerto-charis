const express = require('express');
const router = express.Router();
const { verifyToken: auth } = require('../middlewares/authMiddleware');
const {
  getAll,
  getOne,
  create,
  entregar,
  cancelar,
  registrarAbono,
  actualizarAnticipo
} = require('../controllers/pedidosController');

router.get('/', auth, getAll);
router.get('/:id', auth, getOne);
router.post('/', auth, create);

router.put('/:id/entregar', auth, entregar);
router.put('/:id/cancelar', auth, cancelar);

// Nuevas rutas
router.post('/:id/abonos', auth, registrarAbono);
router.put('/:id/anticipo', auth, actualizarAnticipo);

module.exports = router;