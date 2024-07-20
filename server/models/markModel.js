/* eslint-disable prettier/prettier */
const { ObjectId } = require('mongodb');
const { getDb } = require('./db');

async function findMarksByMapId(mapId) {
  const db = getDb();
  const marks = [];
  await db
    .collection('marks')
    .find({ mapId })
    .forEach((mark) => marks.push(mark));
  return marks;
}

async function insertMark(newMark) {
  const db = getDb();
  return db.collection('marks').insertOne(newMark);
}

async function deleteMarkById(_id) {
  const db = getDb();
  return db.collection('marks').deleteOne({ _id: new ObjectId(_id) });
}

module.exports = { findMarksByMapId, insertMark, deleteMarkById };
