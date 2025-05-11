require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 1 * 60 * 1000, max: 100 }));
  app.use(
    '/auth',
    createProxyMiddleware({
      target: process.env.AUTH_SERVICE,
      changeOrigin: true,
      pathRewrite: { '^/auth': '/' },
    })
  );

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
