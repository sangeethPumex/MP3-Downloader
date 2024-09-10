const express = require('express');
const { downloadToS3 } = require('../Controllers/youtubeController');
const router = express.Router();

// Route to download, convert, and delete
router.post('/convert', downloadToS3);

module.exports = router;
