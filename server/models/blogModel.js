/* eslint-disable prettier/prettier */
const { getDb } = require('./db');

async function findBlogsByMapId(mapId) {
  const db = getDb();
  const blogs = [];
  return db.collection('posts')
    .find({ mapId })
    .forEach((blog) => blogs.push(blog))
    .then(() => blogs);
}

async function searchBlogs(keyword, mapId) {
  const db = getDb();
  const regex = new RegExp(keyword, 'i');
  return db.collection('posts')
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
}

async function searchOwnBlogs(keyword, loginUserId) {
  const db = getDb();
  const regex = new RegExp(keyword, 'i');

  return db.collection('posts')
    .aggregate([
      {
        $match: {
          loginUserId,
        },
      },
      {
        $addFields: {
          filteredParagraphs: {
            $filter: {
              input: '$blocks',
              as: 'block',
              cond: {
                $and: [
                  { $eq: ['$$block.type', 'paragraph'] },
                  {
                    $regexMatch: { input: '$$block.data.text', regex },
                  },
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
}

async function searchGlobalBlogs(keyword) {
  const db = getDb();
  const regex = new RegExp(keyword, 'i');

  return db.collection('posts')
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
}

module.exports = { findBlogsByMapId, searchBlogs, searchOwnBlogs, searchGlobalBlogs };
