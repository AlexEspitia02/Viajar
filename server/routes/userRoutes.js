/* eslint-disable prettier/prettier */
const express = require('express');
const multer = require('multer');
const userController = require('../controllers/userController');

const router = express.Router();
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

router.post('/user/signup', userController.signUp);
router.post('/user/signin', userController.signIn);
router.get('/user/profile', userController.getProfile);

module.exports = router;
