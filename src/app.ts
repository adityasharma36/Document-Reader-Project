import express from 'express'

import v1Router from './routers/v1/test.router.js';
import { genericErorr } from './middlewares/error.middleware.js';
import { serverConfig } from './configs/server.config.js';

import  { pinoHttp } from 'pino-http';
import { logger } from './configs/logger.config.js';

const app = express();


app.use(express.json({
    limit:"1mb"
}));
app.use(pinoHttp({logger}))
app.use(genericErorr)
app.use('/api/v1',v1Router)

app.listen(serverConfig.PORT,()=>{
    console.log(`server Connected on Port ${serverConfig.PORT}`)


})