import ForbiddenException from "@exceptions/Forbidden";
import UnauthorizedException from "@exceptions/Unauthorized";
import type { NextFunction, Request, RequestHandler, Response } from "express";

export default function authorizationMiddleware(permittedRoles?: string[]): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new UnauthorizedException());
        }
        if (!req.user.role || !permittedRoles?.includes(req.user.role)) {
            return next(new ForbiddenException());
        }
        next();
    };
}
