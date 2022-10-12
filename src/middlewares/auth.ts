import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { userModel } from "@models/user";
import AuthenticationTokenMissingException from "@exceptions/AuthenticationTokenMissingException";
import WrongAuthenticationTokenException from "@exceptions/WrongAuthenticationTokenException";
import { DataStoredInToken } from "@interfaces/token/dataStoredInToken";
import { RequestWithUser } from "@interfaces/request_user";

export default async function authMiddleware(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    const cookies = req.cookies;
    if (cookies && cookies.Authorization) {
        const secret = process.env.SECRET;
        try {
            const verificationResponse = jwt.verify(cookies.Authorization, secret) as DataStoredInToken;
            const id = verificationResponse._id;
            const user = await userModel.findById(id);
            if (user) {
                req.user = user;
                next();
            } else {
                next(new WrongAuthenticationTokenException());
            }
        } catch (error) {
            next(new WrongAuthenticationTokenException());
        }
    } else {
        next(new AuthenticationTokenMissingException());
    }
}
