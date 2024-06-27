const express = require('express');
const { ObjectId } = require('mongodb');
const request = require('request');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { connectToDb, getDb } = require('../models/db');

const router = express.Router();

router.use(express.json());

let db;

connectToDb((err) => {
  if (!err) {
    db = getDb();
  }
});

router.get('/api/places', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    res.status(400).json({ error: 'Keyword is required' });
  }

  const regex = new RegExp(keyword, 'i');

  try {
    const places = await db
      .collection('places')
      .find({ displayName: { $regex: regex } })
      .toArray();

    res.status(200).json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
});

// router.get('/api/places/location', async (req, res) => {
//   const { lat, lng } = req.query;
//   if (!lat || !lng) {
//     res.status(400).json({ error: 'Location is required' });
//   }
//   const location = { lat: parseFloat(lat), lng: parseFloat(lng) };

//   try {
//     const places = await db.collection('places').find({ location }).toArray();

//     console.log(places);

//     res.status(200).json(places);
//   } catch (error) {
//     console.error('Error fetching places:', error);
//     res.status(500).json({ error: 'Could not fetch the documents' });
//   }
// });

function downloadImage(url, filename) {
  const fullPath = path.join(__dirname, '../placeImg', filename);
  return new Promise((resolve, reject) => {
    request.head(url, (err) => {
      if (err) {
        console.log('Failed to retrieve image headers:', err);
        reject(err);
        return;
      }
      request(url)
        .pipe(fs.createWriteStream(fullPath))
        .on('close', () => {
          console.log('Image successfully downloaded and saved.');
          resolve();
        })
        .on('error', (downloadErr) => {
          console.log('Failed to download image:', downloadErr);
          reject(downloadErr);
        });
    });
  });
}

router.post('/api/places', async (req, res) => {
  const organizedPlaces = req.body;

  const downloadPromises = organizedPlaces.map(async (place) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const filename = `${timestamp}-${randomString}.jpg`;
    await downloadImage(place.imgUrl, filename);
    return { ...place, imgUrl: filename };
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
