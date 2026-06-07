const express = require('express');
const router = express.Router();

const {
  verifyToken: auth,
  soloAdmin
} = require('../middlewares/authMiddleware');

const {
  generarRespaldo,
  listarRespaldos,
  descargarRespaldo
} = require('../controllers/backupsController');

router.post('/generar', auth, soloAdmin, generarRespaldo);
router.get('/', auth, soloAdmin, listarRespaldos);
router.get('/:id/descargar', auth, soloAdmin, descargarRespaldo);

module.exports = router;