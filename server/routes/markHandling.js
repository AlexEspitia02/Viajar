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
  if (!err) {
    db = getDb();
  }
});

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadsDir = path.join(__dirname, '../uploads');
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const extension = file.originalname.split('.').pop();
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const filename = `${timestamp}-${randomString}.${extension}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('不支援的檔案格式，請上傳圖片檔案！'), false);
  }
};

const upload = multer({ storage, fileFilter });

router.get('/api/marks', async (req, res) => {
  const { loginUserId } = req.query;
  const marks = [];

  db.collection('marks')
    .find({ loginUserId })
    .forEach((mark) => marks.push(mark))
    .then(() => {
      res.status(200).json(marks);
    })
    .catch(() => {
      res.status(500).json({ error: 'Could not fetch the documents' });
    });
});

router.post('/api/marks', upload.single('main_image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const mainImageFile = req.file;

  const newMark = {
    imgSrc: `/uploads/${mainImageFile.filename}`,
    src: '/post.html',
    title: req.body.title,
    lat: parseFloat(req.body.lat),
    lng: parseFloat(req.body.lng),
    loginUserId: req.body.loginUserId,
  };

  db.collection('marks')
    .insertOne(newMark)
    .then((result) => {
      res.status(201).json(result);
      req.io.emit('newMarker', newMark);
    })
    .catch(() => {
      res.status(500).json({ error: 'Could not create a new document' });
    });
});

router.delete('/api/marks/delete', async (req, res) => {
  const { _id } = req.body;

  db.collection('marks')
    .deleteOne({ _id: new ObjectId(_id) })
    .then((result) => {
      res.status(200).json(result);
      req.io.emit('deleteMarker', _id);
    })
    .catch(() => {
      res.status(500).json({ error: 'Could not delete the document' });
    });
});

module.exports = router;
