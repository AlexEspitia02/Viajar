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
