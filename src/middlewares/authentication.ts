import userModel from "@models/user";
import isIdValid from "@utils/idChecker";
import StatusCode from "@utils/statusCodes";
import HttpError from "@exceptions/Http";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@interfaces/user";

/**
Validate if user logged in by session
 */
export default async function authenticationMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const userId = req.session.userId;
    if (!userId) return next(new HttpError("Unauthorized", StatusCode.Unauthorized));

    const user = await isIdValid(userModel, [userId], next);
    if (!user) return next(new HttpError("Unauthorized", StatusCode.Unauthorized));
    req.user = (await userModel.findById(userId, "-password")) as User;
    next();
}
