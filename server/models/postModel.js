/* eslint-disable prettier/prettier */
const { ObjectId } = require('mongodb');
const { getDb } = require('./db');

async function findPostById(id) {
  const db = getDb();
  return db.collection('posts').findOne({ _id: id});
}

async function insertPost(newPost) {
  const db = getDb();
  return db.collection('posts').insertOne(newPost);
}

async function updatePost(id, update) {
  const db = getDb();
  return db
    .collection('posts')
    .updateOne({ _id: id }, { $set: update });
}

async function deletePostById(id) {
  const db = getDb();
  return db.collection('posts').deleteOne({ _id: id });
}

async function findUserPosts(loginUserId, mapId) {
  const db = getDb();
  return db.collection('maps').findOne({
    _id: new ObjectId(mapId),
    $or: [{ loginUserId }, { invitees: loginUserId }],
  });
}

module.exports = {
  findPostById,
  insertPost,
  updatePost,
  deletePostById,
  findUserPosts,
};
