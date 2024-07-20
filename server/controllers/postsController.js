/* eslint-disable prettier/prettier */
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const postModel = require('../models/postModel');

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

async function getPostById(req, res) {
  try {
    const { id } = req.params;
    const data = await postModel.findPostById(id);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
}

async function createOrUpdatePost(req, res) {
  const newPost = JSON.parse(req.body.data);
  const hasBlog = await postModel.findPostById(newPost._id);
  const hasImageBlock = newPost.blocks.some((block) => block.type === 'image');
  const imageLogoBlock = {
    id: 'aQgm-uAlzT',
    type: 'image',
    data: {
      file: {
        url: 'https://alexespitia.s3.amazonaws.com/posts/1720944037593-ec3db85b2c44ee62.webp',
      },
      caption: '',
      withBorder: false,
      stretched: false,
      withBackground: false,
    },
  };

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
    newPost.blocks.push(imageLogoBlock);
    newPost.blocks.push(imageBlock);
  }

  try {
    let result;
    if (hasBlog) {
      result = await postModel.updatePost(newPost._id, {
        blocks: newPost.blocks,
      });
      res.status(201).json({ success: true, message: '文章成功更新', result });
    } else {
      result = await postModel.insertPost(newPost);
      res.status(201).json({ success: true, message: '文章成功上傳', result });
    }
  } catch (error) {
    res.status(500).json({ error: 'Could not process the document' });
  }
}

async function uploadImage(req, res) {
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

  try {
    await s3Client.send(mainImageCommand);
    const fileUrl = `https://d327wy5d585ux5.cloudfront.net/posts/${mainImageKey}`;
    res.status(200).json({
      success: 1,
      file: {
        url: fileUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not upload the image' });
  }
}

async function deletePost(req, res) {
  const { _id } = req.body;

  try {
    const result = await postModel.deletePostById(_id);
    res.status(200).json(result);
    req.io.emit('deletePost', _id);
  } catch (error) {
    res.status(500).json({ error: 'Could not delete the document' });
  }
}

async function getUserPosts(req, res) {
  const { loginUserId, mapId } = req.query;

  try {
    const result = await postModel.findUserPosts(loginUserId, mapId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
}

module.exports = {
  getPostById,
  createOrUpdatePost,
  uploadImage,
  deletePost,
  getUserPosts,
};
