const express = require('express');
const { connectToDb, getDb } = require('../models/db');

const router = express.Router();

router.use(express.json());

let db;

connectToDb((err) => {
  if (!err){
    db = getDb();
  }
});

router.get('/api/blogList', async (req, res) => {
  let blogs = [];
  
  db.collection('posts')
    .find()
    .sort({ author: 1 })
    .forEach(blog => blogs.push(blog))
    .then(() => {
      res.status(200).json(blogs);
    })
    .catch(() => {
      res.status(500).json({error: 'Could not fetch the documents'});
    });
});

module.exports = router;
