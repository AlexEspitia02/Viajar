/* eslint-disable prettier/prettier */
const express = require('express');
const multer = require('multer');
const marksController = require('../controllers/marksController');

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

router.get('/api/marks', marksController.getMarks);
router.post(
  '/api/marks',
  upload.single('main_image'),
  marksController.createMark
);
router.delete('/api/marks/delete', marksController.deleteMark);

module.exports = router;
