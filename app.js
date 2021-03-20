require('dotenv').config();
const connectDatabase = require('./database/database');
const crawlPost = require('./services/post.crawler');

connectDatabase(() => {
    crawlPost();
});