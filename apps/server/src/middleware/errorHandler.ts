import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

interface HttpError extends Error {
  statusCode?: number;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // If a streaming (SSE) response already started, Express can no longer send status/JSON;
  // just log and terminate the connection instead of crashing on "headers already sent".
  if (res.headersSent) {
    console.error(err);
    res.end();
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: "Invalid request", details: err.issues });
    return;
  }

  const httpError = err as HttpError;
  const statusCode = httpError.statusCode ?? 500;

  if (statusCode >= 500) {
    // Log full internal details server-side, but never leak stack traces/file paths/DB errors to clients.
    console.error(err);
    res.status(statusCode).json({ error: "Internal server error" });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(statusCode).json({ error: message });
}
