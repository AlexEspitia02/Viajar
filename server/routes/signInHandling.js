const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

router.post('/user/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, error: '所有空格都是必填的' });
    }

    const hasEmail = await db.collection('users').findOne({ email });

    if (hasEmail) {
      return res.status(403).json({ success: false, error: '信箱已被使用' });
    }

    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const checkValidateEmail = re.test(String(email).toLowerCase());
    if (!checkValidateEmail) {
      return res.status(400).json({ success: false, error: '信箱格式錯誤' });
    }

    const saltRounds = 10;
    const hashPasswordText = await bcrypt.hash(password, saltRounds);

    const newUser = {
      name,
      email,
      password: hashPasswordText,
      provider: 'native',
      role: 'user',
    };

    const dbUser = await db
      .collection('users')
      .insertOne(newUser)
      .catch(() => {
        res.status(500).json({ error: 'Could not create a new document' });
      });

    const expiresInTime = 3600;
    const token = jwt.sign(
      {
        id: dbUser.insertedId,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      process.env.SECRET_KEY,
      { expiresIn: expiresInTime }
    );

    res.status(201).json({
      success: true,
      data: {
        access_token: token,
        access_expired: expiresInTime,
        user: {
          provider: 'native',
          id: dbUser.insertedId,
          name: newUser.name,
          email: newUser.email,
          picture:
            newUser.picture ||
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJ0KLWLbFOK60yIV6IoEhuEr8F3kNEcDpPBg&s',
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.post('/user/signIn', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: '所有空格都是必填的' });
    }

    const userMatch = await db.collection('users').findOne({ email });

    if (!userMatch) {
      return res
        .status(404)
        .json({ success: false, error: '信箱錯誤，無此使用者' });
    }

    const match = await bcrypt.compare(password, userMatch.password);

    if (match) {
      const saltRounds = 10;
      const hashPasswordText = await bcrypt.hash(password, saltRounds);
      const user = {
        id: userMatch._id,
        name: userMatch.name,
        email,
        password: hashPasswordText,
        role: userMatch.role,
      };

      const expiresInTime = 3600;
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        process.env.SECRET_KEY,
        { expiresIn: expiresInTime }
      );
      res.status(200).json({
        success: true,
        data: {
          access_token: token,
          access_expired: expiresInTime,
          user: {
            id: user.id,
            provider: 'native',
            name: user.name,
            email: user.email,
            picture:
              user.picture ||
              'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJ0KLWLbFOK60yIV6IoEhuEr8F3kNEcDpPBg&s',
            role: user.role,
          },
        },
      });
    } else {
      res.status(403).json({ success: false, error: '密碼錯誤，請再試一次' });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.get('/user/profile', async (req, res) => {
  try {
    const { provider } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send('Authorization token is missing');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (decoded) {
      res.status(200).json({
        data: {
          provider,
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          picture:
            decoded.picture ||
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJ0KLWLbFOK60yIV6IoEhuEr8F3kNEcDpPBg&s',
          role: decoded.role,
        },
      });
    } else {
      res.status(403).send('Invalid token');
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).send('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).send('Token has expired');
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
