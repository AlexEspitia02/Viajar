const express = require('express');
const { ObjectId } = require('mongodb');
const request = require('request');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { connectToDb, getDb } = require('../models/db');

const router = express.Router();

router.use(express.json());

let db;

connectToDb((err) => {
  if (!err) {
    db = getDb();
  }
});

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_REGION,
  BUCKET_NAME,
} = process.env;

const s3Client = new S3Client({
  region: S3_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    request({ url, encoding: null }, async (err, res, body) => {
      if (err) {
        console.log('Failed to download image:', err);
        return reject(err);
      }
      try {
        const mainImageCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: `placeImg/${filename}`,
          Body: body,
          ContentType: res.headers['content-type'],
        });
        await s3Client.send(mainImageCommand);
        console.log('Image successfully uploaded to S3.');
        resolve();
      } catch (uploadErr) {
        console.log('Failed to upload image to S3:', uploadErr);
        reject(uploadErr);
      }
    });
  });
}

router.get('/api/places', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res
      .status(400)
      .json({ success: false, error: '請輸入地點，內容不得為空' });
  }

  const regex = new RegExp(keyword, 'i');

  try {
    const places = await db
      .collection('places')
      .find({ displayName: { $regex: regex }, type: { $ne: 'restaurant' } })
      .toArray();

    res.status(200).json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
});

router.get('/api/place', async (req, res) => {
  const { placeId } = req.query;

  if (!placeId) {
    return res.status(400).json({ success: false, error: '附近沒有餐聽' });
  }

  const placeIds = placeId.split(',');

  try {
    const places = await db
      .collection('places')
      .find({
        placeId: { $in: placeIds },
      })
      .toArray();

    res.status(200).json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
});

router.get('/api/places/location', async (req, res) => {
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
    const places = await db
      .collection('places')
      .find({
        'location.lat': { $gte: minLat, $lte: maxLat },
        'location.lng': { $gte: minLng, $lte: maxLng },
        type: 'restaurant',
      })
      .toArray();

    res.status(200).json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
});

router.post('/api/places', async (req, res) => {
  const organizedPlaces = req.body;

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

  db.collection('places')
    .insertMany(placesWithImages)
    .then((result) => {
      res.status(201).json(result);
    })
    .catch((error) => {
      console.log('Error inserting places:', error);
      res.status(500).json({
        error: 'Could not create a new document',
        details: error.message,
      });
    });
});

module.exports = router;
