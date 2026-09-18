


import express from 'express'
import testRouter from './test.router.js';


const indexRouter = express.Router();



indexRouter.use('/',testRouter);

export  default indexRouter