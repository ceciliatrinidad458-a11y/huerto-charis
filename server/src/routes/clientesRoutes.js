const express = require('express');
const router = express.Router();

const {
  verifyToken: auth,
  soloAdmin
} = require('../middlewares/authMiddleware');

const {
  getAll,
  getOne,
  create,
  update,
  remove,
  getCreditos,
  getCreditoDetalle,
  registrarAbonoCredito
} = require('../controllers/clientesController');

router.get('/', auth, getAll);
router.get('/creditos', auth, soloAdmin, getCreditos);
router.get('/creditos/:id', auth, soloAdmin, getCreditoDetalle);
router.post('/creditos/:id/abono', auth, soloAdmin, registrarAbonoCredito);
router.get('/:id', auth, getOne);
router.post('/', auth, create);
router.put('/:id', auth, soloAdmin, update);
router.delete('/:id', auth, soloAdmin, remove);

module.exports = router;