/* eslint-disable prettier/prettier */
router.post('/user/send', (req, res) => {
  const { refresh_token, access_token } = req.session.tokens;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: '你要用來發送信件的 Gmail',
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: refresh_token,
      accessToken: access_token,
    },
  });

  const mailOptions = {
    from: '你要用來發送信件的 Gmail',
    to: '你要發送的對象',
    subject: '這是信件的主旨',
    text: '‘這是信件的內容',
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error sending email');
    } else {
      console.log(info);
      res.send('Email sent');
    }
  });
});

module.exports = router;
