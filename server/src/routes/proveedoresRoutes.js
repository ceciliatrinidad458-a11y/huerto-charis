const express = require('express');
const router = express.Router();

const {
  verifyToken: auth,
  soloAdmin
} = require('../middlewares/authMiddleware');

const {
  getAll,
  create,
  update,
  remove,
  registrarCompra,
  getCompras
} = require('../controllers/proveedoresController');

router.get('/', auth, soloAdmin, getAll);
router.get('/compras', auth, soloAdmin, getCompras);

router.post('/', auth, soloAdmin, create);
router.put('/:id', auth, soloAdmin, update);
router.delete('/:id', auth, soloAdmin, remove);
router.post('/compra', auth, soloAdmin, registrarCompra);

module.exports = router;