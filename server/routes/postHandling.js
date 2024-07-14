const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { connectToDb, getDb } = require('../models/db');

const router = express.Router();

router.use(express.json());

let db;

connectToDb((err) => {
  if (!err) {
    db = getDb();
  }
});

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_REGION,
  BUCKET_NAME,
} = process.env;

const s3Client = new S3Client({
  region: S3_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const storage = multer.memoryStorage();

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
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
});

router.post('/api/posts', upload.array('images'), async (req, res) => {
  const newPost = JSON.parse(req.body.data);
  const hasBlog = await db.collection('posts').findOne({ _id: newPost._id });
  const hasImageBlock = newPost.blocks.some((block) => block.type === 'image');
  const imageBlock = {
    id: 'aQgm-uAlzT',
    type: 'image',
    data: {
      file: {
        url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJ0KLWLbFOK60yIV6IoEhuEr8F3kNEcDpPBg&s',
      },
      caption: '🐷表示：這傢伙居然沒有上傳任何圖片...🐽',
      withBorder: false,
      stretched: false,
      withBackground: true,
    },
  };

  if (!hasImageBlock) {
    newPost.blocks.push(imageBlock);
  }

  if (hasBlog) {
    db.collection('posts')
      .updateOne({ _id: newPost._id }, { $set: { blocks: newPost.blocks } })
      .then((result) => {
        res
          .status(201)
          .json({ success: true, message: '文章成功更新', result });
      })
      .catch(() => {
        res.status(500).json({ error: 'Could not update the document' });
      });
  } else {
    db.collection('posts')
      .insertOne(newPost)
      .then((result) => {
        res
          .status(201)
          .json({ success: true, message: '文章成功上傳', result });
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

  const mainImageFile = req.file;
  const extension = mainImageFile.originalname.split('.').pop();
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const mainImageKey = `${timestamp}-${randomString}.${extension}`;

  const mainImageCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `posts/${mainImageKey}`,
    Body: mainImageFile.buffer,
    ContentType: mainImageFile.mimetype,
  });
  await s3Client.send(mainImageCommand);

  const fileUrl = `https://d327wy5d585ux5.cloudfront.net/posts/${mainImageKey}`;

  res.status(200).json({
    success: 1,
    file: {
      url: fileUrl,
    },
  });
});

router.delete('/api/posts/delete', async (req, res) => {
  const { _id } = req.body;

  db.collection('posts')
    .deleteOne({ _id })
    .then((result) => {
      res.status(200).json(result);
      req.io.emit('deletePost', _id); // 尚未使用到
    })
    .catch(() => {
      res.status(500).json({ error: 'Could not delete the document' });
    });
});

router.get('/api/post/user', async (req, res) => {
  const { loginUserId, mapId } = req.query;

  db.collection('maps')
    .findOne({
      _id: new ObjectId(mapId),
      $or: [{ loginUserId }, { invitees: loginUserId }],
    })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json({ error: 'Could not delete the document' });
    });
});

module.exports = router;
