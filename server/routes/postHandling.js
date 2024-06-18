const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { ObjectId } = require('mongodb');
const { connectToDb, getDb } = require('../models/db');

const router = express.Router();

router.use(express.json());

let db;

connectToDb((err) => {
  if (!err){
    db = getDb();
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../uploads');
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const extension = file.originalname.split('.').pop();
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const filename = `${timestamp}-${randomString}.${extension}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('不支援的檔案格式，請上傳圖片檔案！'), false);
  }
};

const upload = multer({ storage, fileFilter });

router.get('/api/posts/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const data = await db.collection('posts').findOne({ _id: id });
      res.status(200).json(data);
  } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: 'Could not fetch the documents' });
  }
});

router.post('/api/posts', upload.array('images'), async (req, res) => {
  const newPost = JSON.parse(req.body.data);
  const hasBlog = await db.collection('posts').findOne({ _id: newPost._id });

  if (hasBlog) {
    db.collection('posts')
      .updateOne(
        {_id:newPost._id},
        {$set:{blocks:newPost.blocks}}
      )
      .then(result => {
        res.status(201).json(result);
        req.io.emit('newPost', newPost);
      })
      .catch(() => {
        res.status(500).json({ error: 'Could not update the document' });
      });
  } else{
    db.collection('posts')
      .insertOne(newPost)
      .then(result => {
        res.status(201).json(result);
        req.io.emit('newPost', newPost);
      })
      .catch(() => {
        res.status(500).json({ error: 'Could not create a new document' });
      });
  }
});

router.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.status(200).json({
      success: 1,
      file: {
          url: fileUrl
      }
  });
});

router.delete('/api/posts/delete', async (req, res) => {
  const { _id } = req.body;

  db.collection('posts')
    .deleteOne({ _id: _id })
    .then(result => {
      console.log(result);
      res.status(200).json(result);
      req.io.emit('deletePost', _id);//尚未使用到
    })
    .catch(() => {
      res.status(500).json({ error: 'Could not delete the document' });
    });
});

module.exports = router;
