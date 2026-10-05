import type { NextFunction, Request, Response } from "express"
import type { ZodObject } from "zod"
import { BadRequestError } from "../utils/Errors/app.error.js";
import { logger } from "../configs/logger.config.js";



export const bodyValidatot =  (schema:ZodObject) => {
    return async (req:Request, res:Response,next:NextFunction ) => {
        try {
       
            await schema.parseAsync(req.body);
            next();
        } catch (error) {
           
          res.status(400).json({
                message: "Invalid request body",
                success: false,
                error: error
            });
        }
    }
}