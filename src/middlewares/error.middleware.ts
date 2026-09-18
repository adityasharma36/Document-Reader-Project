import type { NextFunction, Request, Response } from "express";
import type { AppError } from "../utils/Errors/app.error.js";


export function genericErorr(err:AppError,req:Request,res:Response,next:NextFunction){
   console.log(err)
    res.status(err.statusCode).json({
        success: false,
        
        message:err.message,

    })
}