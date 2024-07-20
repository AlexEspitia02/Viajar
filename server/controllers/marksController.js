/* eslint-disable prettier/prettier */
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const markModel = require('../models/markModel');

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

async function getMarks(req, res) {
  const { mapId } = req.query;
  try {
    const marks = await markModel.findMarksByMapId(mapId);
    res.status(200).json(marks);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
}

async function createMark(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, error: '請上傳檔案' });
  }
  if (!req.body.title) {
    return res.status(400).json({ success: false, error: '請填寫Title' });
  }

  const mainImageFile = req.file;
  const extension = mainImageFile.originalname.split('.').pop();
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const mainImageKey = `${timestamp}-${randomString}.${extension}`;

  const mainImageCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `uploads/${mainImageKey}`,
    Body: mainImageFile.buffer,
    ContentType: mainImageFile.mimetype,
  });
  await s3Client.send(mainImageCommand);

  const newMark = {
    imgSrc: `uploads/${mainImageKey}`,
    src: '/post.html',
    title: req.body.title,
    lat: parseFloat(req.body.lat),
    lng: parseFloat(req.body.lng),
    loginUserId: req.body.loginUserId,
    mapId: req.body.mapId,
  };

  try {
    const result = await markModel.insertMark(newMark);
    res.status(201).json({ result, success: true, message: '資料上傳成功' });
    req.io.emit('newMarker', newMark);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: 'Could not create a new document' });
  }
}

async function deleteMark(req, res) {
  const { _id } = req.body;
  try {
    const result = await markModel.deleteMarkById(_id);
    res.status(200).json(result);
    req.io.emit('deleteMarker', _id);
  } catch (error) {
    res.status(500).json({ error: 'Could not delete the document' });
  }
}

module.exports = { getMarks, createMark, deleteMark };
