import { randomUUID } from "node:crypto";
import { parseCookie, stringifySetCookie } from "cookie";
import type { NextFunction, Request, Response } from "express";
import { supabase } from "../configs/supabase.config.js";

const anonymousCookieName = "document_reader_session";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type UserRequest = Request & {
  user?: {
    id: string;
  };
};

export async function resolveUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : undefined;

  if (token) {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        message: "Invalid authorization token",
      });
      return;
    }

    (req as UserRequest).user = { id: data.user.id };
    next();
    return;
  }

  const cookies = parseCookie(req.headers.cookie ?? "");
  const existingSession = cookies[anonymousCookieName];
  const sessionId = existingSession && uuidPattern.test(existingSession)
    ? existingSession
    : randomUUID();

  if (sessionId !== existingSession) {
    res.append(
      "Set-Cookie",
      stringifySetCookie({
        name: anonymousCookieName,
        value: sessionId,
        httpOnly: true,
        sameSite: "lax",
        secure: req.secure,
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      })
    );
  }

  (req as UserRequest).user = { id: sessionId };
  next();
}