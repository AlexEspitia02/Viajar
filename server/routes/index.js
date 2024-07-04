/* eslint-disable prettier/prettier */
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { connectToDb, getDb } = require('../models/db');

require('dotenv').config();

const router = express.Router();

let db;

connectToDb((err) => {
  if (!err) {
    db = getDb();
  }
});

const { CLIENT_ID, CLIENT_SECRET, SECRET_KEY, HOST } = process.env;

router.post('/login', (req, res) => {
  const client = new OAuth2Client({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: `${HOST}/callback`,
  });

  const authorizeUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });
  res.redirect(authorizeUrl);
});

router.get('/callback', async (req, res) => {
  const client = new OAuth2Client({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: `${HOST}/callback`,
  });

  const { code } = req.query;

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const userInfo = await client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    const token = jwt.sign({ data: userInfo.data, tokens }, SECRET_KEY);
    res.cookie('token', token);
    res.redirect('/');
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(400).send('獲取Google用戶信息時出錯');
    }
  }
});

function authenticateJWT(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.sendStatus(401);
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = decoded.data;
    req.tokens = decoded.tokens;
    next();
  });
}

router.get('/user', authenticateJWT, async (req, res) => {
  const client = new OAuth2Client({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: `${HOST}/callback`,
  });

  client.setCredentials(req.tokens);

  try {
    const userInfo = await client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });

    const newUserInfo = {
      sub: userInfo.data.sub,
      name: userInfo.data.name,
      email: userInfo.data.email,
      provider: 'google',
      role: 'user',
      picture: userInfo.data.picture,
    };

    const userMatch = await db.collection('users').findOne({ email: newUserInfo.email });
    if (userMatch) {
      userMatch.id = userMatch._id;
    }

    if (!userMatch) {
      await db.collection('users')
        .insertOne(newUserInfo)
        .catch(() => res.status(500).json({ error: '無法創建新文檔' }));

      newUserInfo.id = newUserInfo._id;
      res.json(newUserInfo);
    } else {
      res.json(userMatch);
    }
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(400).send('獲取用戶信息時出錯');
    }
  }
});

module.exports = router;
