const express = require('express');
const { connectToDb, getDb } = require('../models/db');

const router = express.Router();

router.use(express.json());

let db;

connectToDb((err) => {
  if (!err) {
    db = getDb();
  }
});

router.get('/api/blogList', async (req, res) => {
  const { mapId } = req.query;
  const blogs = [];

  db.collection('posts')
    .find({ mapId })
    .forEach((blog) => blogs.push(blog))
    .then(() => {
      res.status(200).json(blogs);
    })
    .catch(() => {
      res.status(500).json({ error: 'Could not fetch the documents' });
    });
});

router.get('/api/blogList/search', async (req, res) => {
  try {
    const { keyword, mapId } = req.query;

    if (!keyword) {
      return res
        .status(400)
        .json({ success: false, error: '請輸入搜索關鍵字' });
    }

    const regex = new RegExp(keyword, 'i');
    const blogs = await db
      .collection('posts')
      .aggregate([
        {
          $match: {
            mapId,
          },
        },
        {
          $match: {
            $or: [{ title: { $regex: regex } }],
          },
        },
      ])
      .toArray();

    if (blogs.length === 0) {
      return res.status(400).json({ success: false, error: '查無文章' });
    }

    res.status(200).json(blogs);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: 'Could not fetch the documents' });
  }
});

// 保留給userId search
// router.get('/api/blogList/search', async (req, res) => {
//   try {
//     const { keyword, loginUserId } = req.query;

//     const regex = new RegExp(keyword, 'i');

//     const blogs = await db
//       .collection('posts')
//       .aggregate([
//         {
//           $match: {
//             loginUserId,
//           },
//         },
//         {
//           $addFields: {
//             filteredParagraphs: {
//               $filter: {
//                 input: '$blocks',
//                 as: 'block',
//                 cond: {
//                   $and: [
//                     { $eq: ['$$block.type', 'paragraph'] },
//                     {
//                       $regexMatch: { input: '$$block.data.text', regex },
//                     },
//                   ],
//                 },
//               },
//             },
//           },
//         },
//         {
//           $match: {
//             $or: [
//               { title: { $regex: regex } },
//               { filteredParagraphs: { $ne: [] } },
//             ],
//           },
//         },
//       ])
//       .toArray();

//     res.status(200).json(blogs);
//   } catch (error) {
//     res.status(500).json({ error: 'Could not fetch the documents' });
//   }
// });

router.get('/api/blogList/global/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    const regex = new RegExp(keyword, 'i');

    const blogs = await db
      .collection('posts')
      .aggregate([
        {
          $addFields: {
            filteredParagraphs: {
              $filter: {
                input: '$blocks',
                as: 'block',
                cond: {
                  $and: [
                    { $eq: ['$$block.type', 'paragraph'] },
                    { $regexMatch: { input: '$$block.data.text', regex } },
                  ],
                },
              },
            },
          },
        },
        {
          $match: {
            $or: [
              { title: { $regex: regex } },
              { filteredParagraphs: { $ne: [] } },
            ],
          },
        },
      ])
      .toArray();

    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
});

module.exports = router;
