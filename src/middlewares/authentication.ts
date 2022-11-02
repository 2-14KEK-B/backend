import { Request, Response, NextFunction } from "express";
import userModel from "@models/user";
import HttpError from "@exceptions/Http";
import StatusCode from "@utils/statusCodes";
import isIdValid from "@utils/idChecker";

/**
 * Validate if user logged in by session
 * @param req Request
 * @param _res Response
 * @param next NextFunction
 * @returns void
 */
export default async function authenticationMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const userId = req.session.userId;
    if (!userId) return next(new HttpError("Unauthorized", StatusCode.Unauthorized));

    const user = await isIdValid(userModel, [userId], next);
    if (!user) return next(new HttpError("Unauthorized", StatusCode.Unauthorized));
    req.user = await userModel.findById(userId, "-password");
    next();
}
