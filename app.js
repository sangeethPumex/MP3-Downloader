const express = require('express');
const youtubeRoutes = require('./Routes/authRoutes');
const app = express();

app.use(express.json());
require('dotenv').config();


// Routes
app.use('/api/youtube', youtubeRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
