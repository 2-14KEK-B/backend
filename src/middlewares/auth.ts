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
export default async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
    // console.log(req.session);
    const userId = req.session.userId;
    if (!userId) return next(new HttpError("Unauthorized", StatusCode.Unauthorized));

    const user = await isIdValid(userModel, [userId], next);
    if (!user) return next(new HttpError("Unauthorized", StatusCode.Unauthorized));
    next();
}
