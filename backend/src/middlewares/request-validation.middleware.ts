import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

function validationError(res: Response, issues: unknown) {
  res.status(400).json({
    success: false,
    message: "Invalid request",
    issues,
  });
}

export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      validationError(res, result.error.issues);
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateParams(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      validationError(res, result.error.issues);
      return;
    }

    next();
  };
}

export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      validationError(res, result.error.issues);
      return;
    }

    res.locals.pagination = result.data;
    next();
  };
}