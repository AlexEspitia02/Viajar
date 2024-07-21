/* eslint-disable prettier/prettier */
const { ObjectId } = require('mongodb');
const { getDb } = require('./db');

function findUserByEmail(email) {
  const db = getDb();
  return db.collection('users').findOne({ email });
}

function findUserById(id) {
  const db = getDb();
  return db.collection('users').findOne({ _id: new ObjectId(id) });
}

module.exports = {
  findUserByEmail,
  findUserById,
};
