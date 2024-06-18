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
    .forEach(blog => blogs.push(blog))
    .then(() => {
      res.status(200).json(blogs);
    })
    .catch(() => {
      res.status(500).json({error: 'Could not fetch the documents'});
    });
});

router.get('/api/blogList/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    const regex = new RegExp(keyword, 'i');

    const blogs = await db.collection('posts').aggregate([
      {
        $addFields: {
          "filteredParagraphs": {
            $filter: {
              input: "$blocks",
              as: "block",
              cond: { $and: [
                { $eq: ["$$block.type", "paragraph"] },
                { $regexMatch: { input: "$$block.data.text", regex: regex } }
              ]}
            }
          }
        }
      },
      {
        $match: {
          $or: [
            { title: { $regex: regex } },
            { "filteredParagraphs": { $ne: [] } }
          ]
        }
      }
    ]).toArray();

    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
});


module.exports = router;
