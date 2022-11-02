import { NextFunction, Request, Response } from "express";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";

export default function authorizationMiddleware([...permittedRoles]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return next(new HttpError("Unauthorized", StatusCode.Unauthorized));
        if (!permittedRoles.includes(req.user.role)) return next(new HttpError("Forbidden", StatusCode.Forbidden));
        next();
    };
}
