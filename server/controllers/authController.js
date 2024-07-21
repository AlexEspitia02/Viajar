/* eslint-disable prettier/prettier */
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const authModel = require('../models/authModel');

const { CLIENT_ID, CLIENT_SECRET, SECRET_KEY, HOST } = process.env;

const client = new OAuth2Client({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: `${HOST}/callback`,
});

async function login(req, res) {
  const authorizeUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });
  res.redirect(authorizeUrl);
}

async function callback(req, res) {
  const { code } = req.query;

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const userInfo = await client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
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
}

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

async function getUser(req, res) {
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

    const userMatch = await authModel.findUserByEmail(newUserInfo.email);
    if (userMatch) {
      userMatch.id = userMatch._id;
    }

    if (!userMatch) {
      await authModel.insertUser(newUserInfo);
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
}

module.exports = { login, callback, authenticateJWT, getUser };
