/* eslint-disable prettier/prettier */
const crypto = require('crypto');
const placeModel = require('../models/placeModel');
const { downloadImage } = require('../utilities/imageDownloader');

async function getPlaces(req, res) {
  const { keyword } = req.query;
  if (!keyword) {
    return res
      .status(400)
      .json({ success: false, error: '請輸入地點，內容不得為空' });
  }
  try {
    const places = await placeModel.findPlacesByKeyword(keyword);
    res.status(200).json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
}

async function getPlace(req, res) {
  const { placeId } = req.query;

  if (!placeId) {
    return res.status(400).json({ success: false, error: '附近沒有餐聽' });
  }

  const placeIds = placeId.split(',');

  try {
    const places = await placeModel.findPlacesByIds(placeIds);
    res.status(200).json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
}

async function getPlacesByLocation(req, res) {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Location is required' });
  }

  const location = { lat: parseFloat(lat), lng: parseFloat(lng) };
  const radius = 600;
  const earthRadiusInMeters = 6378137;

  const deltaLat = radius / earthRadiusInMeters;
  const deltaLng =
    radius / (earthRadiusInMeters * Math.cos((Math.PI * location.lat) / 180));

  const rangeFactor = 50;
  const minLat = location.lat - deltaLat * rangeFactor;
  const maxLat = location.lat + deltaLat * rangeFactor;
  const minLng = location.lng - deltaLng * rangeFactor;
  const maxLng = location.lng + deltaLng * rangeFactor;

  try {
    const places = await placeModel.findPlacesByLocation(
      minLat,
      maxLat,
      minLng,
      maxLng
    );
    res.status(200).json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
}

async function postPlaces(req, res) {
  const organizedPlaces = req.body;

  if (organizedPlaces.length === 0) {
    return res.status(400).json({ error: '沒有需要存入的值' });
  }

  const downloadPromises = organizedPlaces.map(async (place) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const filename = `${timestamp}-${randomString}.jpg`;
    await downloadImage(place.imgUrl, filename);
    return {
      ...place,
      imgUrl: `https://d327wy5d585ux5.cloudfront.net/placeImg/${filename}`,
    };
  });

  const placesWithImages = await Promise.all(downloadPromises);

  try {
    const result = await placeModel.insertPlaces(placesWithImages);
    res.status(201).json(result);
  } catch (error) {
    console.log('Error inserting places:', error);
    res.status(500).json({
      error: 'Could not create a new document',
      details: error.message,
    });
  }
}

module.exports = { getPlaces, getPlace, getPlacesByLocation, postPlaces };
