/* eslint-disable prettier/prettier */
const { ObjectId } = require('mongodb');
const { getDb } = require('./db');

function findUserByEmail(email) {
  const db = getDb();
  return db.collection('users').findOne({ email });
}

function insertUser(user) {
  const db = getDb();
  return db.collection('users').insertOne(user);
}

module.exports = { findUserByEmail, insertUser };
