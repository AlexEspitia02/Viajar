const express = require('express');
const { ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const { connectToDb, getDb } = require('../models/db');

dotenv.config();

const router = express.Router();

router.use(express.json());

let db;

connectToDb((err) => {
  if (!err) {
    db = getDb();
  }
});

// 先留給如果之後需要fetch一個地圖，已經調整完
// router.get('/api/maps/map', async (req, res) => {
//   const { mapId } = req.query;

//   try {
//     const mapInfo = await db
//       .collection('maps')
//       .findOne({ _id: new ObjectId(mapId) });

//     res.status(200).json(mapInfo);
//   } catch (error) {
//     res.status(500).json({ error: '無法獲取地圖資訊' });
//   }
// });

async function sendInvitationEmail(
  inviteesEmail,
  confirmationLink,
  inviteesName,
  user
) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  await transporter.verify();

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: inviteesEmail,
    subject: `您好${inviteesName},歡迎來到 My Travel, 您受到${user}的邀請共同編輯地圖!`,
    html: `
      <h2>您好${inviteesName},歡迎來到 <span style="color:#00b7a2;">My Travel</span>。</h2>
      <div>請點以下連結獲取地圖編輯權：</div>
      <a href="${confirmationLink}">${confirmationLink}</a>
      <br>
      <br>
      <div><span style="color:#00b7a2;">My Travel</span>歡迎您~</div>
      `,
  };

  await transporter.sendMail(mailOptions);
}

router.get('/api/maps', async (req, res) => {
  const maps = [];
  const { loginUserId } = req.query;

  db.collection('maps')
    .find({
      $or: [{ loginUserId }, { invitees: loginUserId }],
    })
    .forEach((map) => maps.push(map))
    .then(() => {
      res.status(200).json(maps);
    })
    .catch(() => {
      res.status(500).json({ error: 'Could not fetch the documents' });
    });
});

router.post('/api/maps', async (req, res) => {
  const mapRoomInfo = req.body;

  db.collection('maps')
    .insertOne(mapRoomInfo)
    .then((result) => {
      res.status(201).json(result);
    })
    .catch(() => {
      res.status(500).json({ error: 'Could not create a new document' });
    });
});

router.patch('/api/maps', async (req, res) => {
  const { roomId, loginUserId, invitees } = req.body;

  try {
    const map = await db
      .collection('maps')
      .findOne({ _id: new ObjectId(roomId) });
    if (!map) {
      res.status(404).json({ error: '未找到房間' });
    }

    if (map.loginUserId !== loginUserId) {
      res.status(403).json({
        error: '您無權邀請使用者存取此地圖',
      });
    }
    const confirmationLink = `${process.env.HOST}/api/maps/confirm?roomId=${roomId}&invitees=${invitees}`;

    const newInvitees = await db
      .collection('users')
      .findOne({ _id: new ObjectId(invitees) });

    const newUserInfo = await db
      .collection('users')
      .findOne({ _id: new ObjectId(loginUserId) });

    await sendInvitationEmail(
      newInvitees.email,
      confirmationLink,
      newInvitees.name,
      newUserInfo.name
    );

    res.status(200).json({ message: '邀請已發送' });
  } catch (error) {
    res.status(500).json({ error: '無法發送邀請' });
  }
});

router.get('/api/maps/confirm', async (req, res) => {
  const { roomId, invitees } = req.query;

  try {
    await db
      .collection('maps')
      .updateOne({ _id: new ObjectId(roomId) }, { $addToSet: { invitees } });
    res.status(200).redirect(`${process.env.HOST}/?mapId=${roomId}`);
  } catch (error) {
    res.status(500).json({ error: '無法更新文檔' });
  }
});

router.get('/api/maps/search', async (req, res) => {
  try {
    const { keyword } = req.query;

    const regex = new RegExp(keyword, 'i');

    const queryConditions = [];

    if (ObjectId.isValid(keyword)) {
      queryConditions.push({ _id: new ObjectId(keyword) });
    }

    queryConditions.push(
      { roomName: { $regex: regex } },
      { loginUserName: { $regex: regex } }
    );

    const maps = await db
      .collection('maps')
      .aggregate([
        {
          $match: {
            $or: queryConditions,
          },
        },
      ])
      .toArray();

    res.status(200).json(maps);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
});

router.get('/api/maps/match', async (req, res) => {
  const maps = [];
  const { loginUserId, mapId } = req.query;

  const validMapId = ObjectId.isValid(mapId)
    ? mapId
    : '000000000000000000000000';

  db.collection('maps')
    .find({
      $and: [
        {
          $or: [{ loginUserId }, { invitees: loginUserId }],
        },
        { _id: new ObjectId(validMapId) },
      ],
    })
    .forEach((map) => maps.push(map))
    .then(() => {
      res.status(200).json(maps);
    })
    .catch(() => {
      res.status(500).json({ error: 'Could not fetch the documents' });
    });
});

router.delete('/api/maps', async (req, res) => {
  const { _id } = req.body;

  db.collection('maps')
    .deleteOne({ _id: new ObjectId(_id) })
    .then((result) => {
      res.status(200).json(result);
      req.io.emit('deleteMap', _id); // 尚未用到
    })
    .catch(() => {
      res.status(500).json({ error: 'Could not delete the document' });
    });
});

module.exports = router;
