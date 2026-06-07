const express = require('express');
const router = express.Router();
const { verifyToken: auth } = require('../middlewares/authMiddleware');
const { getAll, getOne, create } = require('../controllers/ventasController');
router.get('/', auth, getAll);
router.get('/:id', auth, getOne);
router.post('/', auth, create);
module.exports = router;
