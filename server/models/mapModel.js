/* eslint-disable prettier/prettier */
const { ObjectId } = require('mongodb');
const { getDb } = require('./db');

function findMapById(id) {
  const db = getDb();
  return db.collection('maps').findOne({ _id: new ObjectId(id) });
}

function findMapsByUser(loginUserId) {
  const db = getDb();
  return db
    .collection('maps')
    .find({ $or: [{ loginUserId }, { invitees: loginUserId }] })
    .toArray();
}

function insertMap(mapRoomInfo) {
  const db = getDb();
  return db.collection('maps').insertOne(mapRoomInfo);
}

function addInviteeToMap(roomId, inviteeId) {
  const db = getDb();
  return db
    .collection('maps')
    .updateOne(
      { _id: new ObjectId(roomId) },
      { $addToSet: { invitees: inviteeId } }
    );
}

function searchMaps(keyword) {
  const db = getDb();
  const regex = new RegExp(keyword, 'i');
  const queryConditions = [];

  if (ObjectId.isValid(keyword)) {
    queryConditions.push({ _id: new ObjectId(keyword) });
  }

  queryConditions.push(
    { roomName: { $regex: regex } },
    { loginUserName: { $regex: regex } }
  );

  return db
    .collection('maps')
    .aggregate([{ $match: { $or: queryConditions } }])
    .toArray();
}

function findMatchingMaps(loginUserId, mapId) {
  const db = getDb();
  const validMapId = ObjectId.isValid(mapId)
    ? mapId
    : '000000000000000000000000';

  return db
    .collection('maps')
    .find({
      $and: [
        { $or: [{ loginUserId }, { invitees: loginUserId }] },
        { _id: new ObjectId(validMapId) },
      ],
    })
    .toArray();
}

function deleteMapById(id) {
  const db = getDb();
  return db.collection('maps').deleteOne({ _id: new ObjectId(id) });
}

module.exports = {
  findMapById,
  findMapsByUser,
  insertMap,
  addInviteeToMap,
  searchMaps,
  findMatchingMaps,
  deleteMapById,
};
