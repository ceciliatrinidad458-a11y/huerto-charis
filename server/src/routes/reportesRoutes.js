const express = require('express');
const router = express.Router();

const {
  verifyToken: auth,
  soloAdmin
} = require('../middlewares/authMiddleware');

const {
  getResumen,
  getDashboard
} = require('../controllers/reportesController');

router.get('/dashboard', auth, getDashboard);
router.get('/resumen', auth, soloAdmin, getResumen);

module.exports = router;