/* eslint-disable prettier/prettier */
const express = require('express');
const placesController = require('../controllers/placesController');

const router = express.Router();
router.get('/api/places', placesController.getPlaces);
router.get('/api/place', placesController.getPlace);
router.get('/api/places/location', placesController.getPlacesByLocation);
router.post('/api/places', placesController.postPlaces);

module.exports = router;
