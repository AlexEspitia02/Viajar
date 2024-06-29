/* eslint-disable prettier/prettier */
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { connectToDb, getDb } = require('../models/db');
const { ObjectId } = require('mongodb');

require('dotenv').config();

const router = express.Router();

let db;

connectToDb((err) => {
  if (!err) {
    db = getDb();
  }
});

const { CLIENT_ID, CLIENT_SECRET, SECRET_KEY, HOST } = process.env;

const client = new OAuth2Client({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: `${HOST}/callback`,
});

router.post('/login', (req, res) => {
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
  const { code } = req.query;

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const userInfo = await client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    const token = jwt.sign(userInfo.data, SECRET_KEY);
    res.cookie('token', token);
    res.redirect('/');
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(400).send('Error fetching Google user info');
    }
  }
});

function authenticateJWT(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    res.sendStatus(401);
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

router.get('/user', authenticateJWT, async (req, res) => {
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
    }
    
    const userMatch = await db.collection('users').findOne({ email: newUserInfo.email });
    if (userMatch) {
      userMatch.id = userMatch._id;
    }

    if(!userMatch){
      await db
      .collection('users')
      .insertOne(newUserInfo)
      .catch(() => {
        res.status(500).json({ error: 'Could not create a new document' });
      });

      newUserInfo.id = newUserInfo._id;
      console.log('存到DB');
      res.json(newUserInfo); // 回傳用戶資訊
    } else {

      res.json(userMatch);
      console.log('取得DB');
    }
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(400).send('Error fetching user info');
    }
  }
});

module.exports = router;
