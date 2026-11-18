const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { notFound } = require('./middlewares/notFound.middleware');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      fontSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https://qr.sepay.vn', 'https://img.vietqr.io'],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(cors({
  origin: env.clientOrigin.split(',').map((item) => item.trim()),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
}));

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Computer Shop API is running.' });
});

app.use('/api', apiRoutes);
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(notFound);
app.use(errorHandler);

module.exports = app;
