import env from "@config/validateEnv";
import type { NextFunction, Request, Response } from "express";
import type HttpError from "@exceptions/Http";

export default async function errorMiddleware(error: HttpError, _req: Request, res: Response, next: NextFunction): Promise<void> {
    const status = error.status || 500;
    const message = error.message || "Something went wrong";
    if (env.isDev) console.log("error: ", { status, message });
    res.status(status).json(message);
    next();
}
