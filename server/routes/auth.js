// /* eslint-disable prettier/prettier */
// const express = require('express');

// const router = express.Router();

// const googleOAuth2Client = require('../models/googleOAuth2Client');

// const SCOPES = ['https://mail.google.com/'];

// router.get('/login', (req, res) => {
//   const authUrl = googleOAuth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: SCOPES,
//   });
//   res.redirect(authUrl);
// });

// router.get('/google/callback', async (req, res) => {
//   const { code } = req.query;
//   try {
//     const { tokens } = await googleOAuth2Client.getToken(code);

//     googleOAuth2Client.setCredentials(tokens);
//     req.session.tokens = tokens;

//     res.redirect('/email/user');
//   } catch (err) {
//     console.error('Error authenticating with Google:', err);
//     res.status(500).send('Error authenticating with Google');
//   }
// });

// router.post('/user/send', (req, res) => {
//   const { refresh_token, access_token } = req.session.tokens;

//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       type: 'OAuth2',
//       user: '你要用來發送信件的 Gmail',
//       clientId: process.env.CLIENT_ID,
//       clientSecret: process.env.CLIENT_SECRET,
//       refreshToken: refresh_token,
//       accessToken: access_token,
//     },
//   });

//   const mailOptions = {
//     from: '你要用來發送信件的 Gmail',
//     to: '你要發送的對象',
//     subject: '這是信件的主旨',
//     text: '‘這是信件的內容',
//   };

//   transporter.sendMail(mailOptions, (err, info) => {
//     if (err) {
//       console.error(err);
//       res.status(500).send('Error sending email');
//     } else {
//       console.log(info);
//       res.send('Email sent');
//     }
//   });
// });

// module.exports = router;
