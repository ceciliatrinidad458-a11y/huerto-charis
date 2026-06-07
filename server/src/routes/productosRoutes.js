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
  remove
} = require('../controllers/productosController');

router.get('/', auth, getAll);
router.get('/:id', auth, getOne);

router.post('/', auth, soloAdmin, create);
router.put('/:id', auth, soloAdmin, update);
router.delete('/:id', auth, soloAdmin, remove);

module.exports = router;