/* eslint-disable prettier/prettier */
const blogModel = require('../models/blogModel');

async function getBlogList(req, res) {
  const { mapId } = req.query;
  try {
    const blogs = await blogModel.findBlogsByMapId(mapId);
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
}

async function searchBlogs(req, res) {
  const { keyword, mapId } = req.query;

  if (!keyword) {
    return res.status(400).json({ success: false, error: '請輸入搜索關鍵字' });
  }

  try {
    const blogs = await blogModel.searchBlogs(keyword, mapId);
    if (blogs.length === 0) {
      return res.status(400).json({ success: false, error: '查無文章' });
    }
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Could not fetch the documents' });
  }
}

async function searchOwnBlogs(req, res) {
  const { keyword, loginUserId } = req.query;

  try {
    const blogs = await blogModel.searchOwnBlogs(keyword, loginUserId);
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
}

async function searchGlobalBlogs(req, res) {
  const { keyword } = req.query;

  try {
    const blogs = await blogModel.searchGlobalBlogs(keyword);
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
}

module.exports = { getBlogList, searchBlogs, searchOwnBlogs, searchGlobalBlogs };
