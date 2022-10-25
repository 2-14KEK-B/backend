import { Request, Response, NextFunction } from "express";
import userModel from "@models/user";
import HttpError from "@exceptions/Http";
import StatusCode from "@utils/statusCodes";

export default async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
    console.log(req.session);
    if (!req.session.userId) return next(new HttpError("Unauthorized", StatusCode.Unauthorized));

    const user = await userModel.findById(req.session.userId);
    if (!user) return next(new HttpError("Unauthorized", StatusCode.Unauthorized));
    next();
}
