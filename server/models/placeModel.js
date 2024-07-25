/* eslint-disable prettier/prettier */
const { getDb } = require('./db');

async function findPlacesByKeyword(keyword) {
  const db = getDb();
  const regex = new RegExp(keyword, 'i');
  return db
    .collection('places')
    .find({ displayName: { $regex: regex } })
    .toArray();
}

async function findPlacesByIds(placeIds) {
  const db = getDb();
  return db
    .collection('places')
    .find({ placeId: { $in: placeIds } })
    .toArray();
}

async function findPlacesByLocation(minLat, maxLat, minLng, maxLng) {
  const db = getDb();
  return db
    .collection('places')
    .find({
      'location.lat': { $gte: minLat, $lte: maxLat },
      'location.lng': { $gte: minLng, $lte: maxLng },
      type: 'restaurant',
    })
    .toArray();
}

async function insertPlaces(places) {
  const db = getDb();

  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  const placesWithExpiry = places.map(place => ({
    ...place,
    expiryDate: sixMonthsFromNow,
  }));

  await db.collection('places').createIndex({ expiryDate: 1 }, { expireAfterSeconds: 0 });

  return db.collection('places').insertMany(placesWithExpiry);
}

module.exports = {
  findPlacesByKeyword,
  findPlacesByIds,
  findPlacesByLocation,
  insertPlaces,
};
