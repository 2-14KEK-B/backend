import userModel from "@models/user";
import ForbiddenException from "@exceptions/Forbidden";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { User } from "@interfaces/user";

export default function authorizationMiddleware(permittedRoles?: string[]): RequestHandler {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const user = await userModel.findById(req.session.userId).lean<User>().exec();
        if (!user.role || !permittedRoles?.includes(user.role)) {
            return next(new ForbiddenException());
        }
        next();
    };
}
