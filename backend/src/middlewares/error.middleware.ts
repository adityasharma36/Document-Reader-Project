import type { NextFunction, Request, Response } from "express";
import type { AppError } from "../utils/Errors/app.error.js";

export function genericErorr(
    err: AppError | Error,
    _req: Request,
    res: Response,
    next: NextFunction
) {
    if (res.headersSent) {
        next(err);
        return;
    }

    const statusCode = "statusCode" in err && typeof err.statusCode === "number"
        ? err.statusCode
        : 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal server error",
    });
}