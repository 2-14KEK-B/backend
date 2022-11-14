import userModel from "@models/user";
import isIdValid from "@utils/idChecker";
import UnauthorizedException from "@exceptions/Unauthorized";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@interfaces/user";

/**
Validate if user logged in by session
 */
export default async function authenticationMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const userId = req.session.userId;
    if (!userId) return next(new UnauthorizedException());

    const user = await isIdValid(userModel, [userId], next);
    if (!user) return next(new UnauthorizedException());
    req.user = (await userModel.findById(userId, "-password")) as User;
    next();
}
