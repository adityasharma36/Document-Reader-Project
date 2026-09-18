
import express, { type Request, type Response } from 'express'
import { logger } from '../../configs/logger.config.js';
import { bodyValidatot } from '../../validators/index.js';
import { testSchema } from '../../validators/test.validator.js';

const testRouter = express.Router();
 

testRouter.get('/',bodyValidatot(testSchema),async (req:Request,res:Response) => {

    res.status(200).json({
        success : true,
    })
})

export default testRouter