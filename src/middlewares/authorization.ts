// import userModel from "@models/user";
import ForbiddenException from "@exceptions/Forbidden";
import type { NextFunction, Request, RequestHandler, Response } from "express";

export default function authorizationMiddleware(permittedRoles?: string[]): RequestHandler {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const role = req.session["role"];
        // const { role } = await userModel //
        //     .findById(req.session["userId"], { role: 1 })
        //     .lean<{ role: string }>()
        //     .exec();
        if (!role || !permittedRoles?.includes(role)) {
            return next(new ForbiddenException());
        }
        next();
    };
}
