
import express, { type Request, type Response } from 'express'

const testRouter = express.Router();
 

testRouter.get('/', async (req: Request, res: Response) => {

    res.status(200).json({
        success : true,
    })
})

export default testRouter