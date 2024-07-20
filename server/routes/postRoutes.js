/* eslint-disable prettier/prettier */
const express = require('express');
const multer = require('multer');
const postsController = require('../controllers/postsController');

const router = express.Router();
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('不支援的檔案格式，請上傳圖片檔案！'), false);
  }
};

const upload = multer({ storage, fileFilter });

router.get('/api/posts/:id', postsController.getPostById);
router.post(
  '/api/posts',
  upload.array('images'),
  postsController.createOrUpdatePost
);
router.post('/api/upload', upload.single('image'), postsController.uploadImage);
router.delete('/api/posts/delete', postsController.deletePost);
router.get('/api/post/user', postsController.getUserPosts);

module.exports = router;
