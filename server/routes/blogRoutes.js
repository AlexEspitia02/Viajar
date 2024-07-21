/* eslint-disable prettier/prettier */
const express = require('express');
const blogController = require('../controllers/blogController');

const router = express.Router();

router.get('/api/blogList', blogController.getBlogList);
router.get('/api/blogList/search', blogController.searchBlogs);
router.get('/api/blogList/own/search', blogController.searchOwnBlogs);
router.get('/api/blogList/global/search', blogController.searchGlobalBlogs);

module.exports = router;
