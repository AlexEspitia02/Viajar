/* eslint-disable prettier/prettier */
const express = require('express');
const mapsController = require('../controllers/mapsController');

const router = express.Router();

router.get('/api/maps/map', mapsController.getMapById);
router.get('/api/maps', mapsController.getMapsByUser);
router.post('/api/maps', mapsController.createMap);
router.patch('/api/maps', mapsController.inviteToMap);
router.get('/api/maps/confirm', mapsController.confirmInvitation);
router.get('/api/maps/search', mapsController.searchMaps);
router.get('/api/maps/match', mapsController.getMatchingMaps);
router.delete('/api/maps', mapsController.deleteMap);

module.exports = router;
