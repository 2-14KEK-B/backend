import type { NextFunction, Request, Response } from "express";
import type HttpError from "@exceptions/Http";

export default async function errorMiddleware(error: HttpError, _req: Request, res: Response, next: NextFunction): Promise<void> {
    const status = error.status || 500;
    const message = error.message || "Something went wrong";
    res.status(status).send({
        message,
        status,
    });
    next();
}
