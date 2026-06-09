const express = require('express');
const router = express.Router();

const {
  login,
  register,
  existeAdmin
} = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.get('/existe-admin', existeAdmin);

module.exports = router;