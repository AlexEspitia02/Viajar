const express = require('express');
const { ObjectId } = require('mongodb');
const { connectToDb, getDb } = require('../models/db');

const router = express.Router();

router.use(express.json());

let db;

connectToDb((err) => {
  if (!err) {
    db = getDb();
  }
});

router.get('/api/maps', async (req, res) => {
  const maps = [];
  const { loginUserId } = req.query;

  db.collection('maps')
    .find({ loginUserId })
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
      return res.status(404).json({ error: '未找到房間' });
    }

    if (map.loginUserId !== loginUserId) {
      return res.status(403).json({
        error: '您無權邀請使用者存取此地圖',
      });
    }

    const result = await db
      .collection('maps')
      .updateOne({ _id: new ObjectId(roomId) }, { $addToSet: { invitees } });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: '無法更新文檔' });
  }
});

// router.delete('/api/marks/delete', async (req, res) => {
//   const { _id } = req.body;

//   db.collection('marks')
//     .deleteOne({ _id: new ObjectId(_id) })
//     .then((result) => {
//       res.status(200).json(result);
//       req.io.emit('deleteMarker', _id);
//     })
//     .catch(() => {
//       res.status(500).json({ error: 'Could not delete the document' });
//     });
// });

module.exports = router;
