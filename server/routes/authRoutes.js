/* eslint-disable prettier/prettier */
const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', authController.login);
router.get('/callback', authController.callback);
router.get('/user', authController.authenticateJWT, authController.getUser);

module.exports = router;
