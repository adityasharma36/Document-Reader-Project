import express from 'express';

import indexRouter from './routers/v1/index.router.js';
import { genericErorr } from './middlewares/error.middleware.js';
import { serverConfig } from './configs/env.config.js';

import { pinoHttp } from 'pino-http';
import { logger } from './configs/logger.config.js';
import { apiRateLimiter } from './middlewares/rate-limit.middleware.js';

const app = express();
const allowedOrigins = serverConfig.FRONTEND_URL
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader(
    'Access-Control-Allow-Credentials',
    'true'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json({
  limit: '1mb',
}));

app.use(pinoHttp({ logger }));
app.use('/api/v1', apiRateLimiter, indexRouter);
app.use(genericErorr);

app.listen(serverConfig.PORT, () => {
  console.log(`server Connected on Port ${serverConfig.PORT}`);
});