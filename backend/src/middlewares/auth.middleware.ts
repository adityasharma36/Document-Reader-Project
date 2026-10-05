import type { NextFunction, Request, Response } from "express";
import { supabase } from "../configs/supabase.config.js";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
  };
};

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : undefined;

  if (!token) {
    res.status(401).json({
      message: "Authorization token is required",
    });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({
      message: "Invalid authorization token",
    });
    return;
  }

  (req as AuthenticatedRequest).user = {
    id: data.user.id,
  };

  next();
}