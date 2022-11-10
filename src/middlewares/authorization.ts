import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import type { NextFunction, Request, Response } from "express";

export default function authorizationMiddleware([...permittedRoles]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) return next(new HttpError("Unauthorized", StatusCode.Unauthorized));
        if (!permittedRoles.includes(req.user.role)) return next(new HttpError("Forbidden", StatusCode.Forbidden));
        next();
    };
}
