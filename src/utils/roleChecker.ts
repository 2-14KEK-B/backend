import userModel from "@models/user";
import HttpError from "@exceptions/Http";
import StatusCode from "./statusCodes";
import type { User } from "@interfaces/user";
import type { NextFunction } from "express";

// TODO: make it more usable

export default async function roleCheck(userId: string, desiredRole: string, next: NextFunction): Promise<boolean> {
    const { role } = await userModel.findById(userId).lean<User>().exec();
    if (role != desiredRole) {
        next(new HttpError("Forbidden", StatusCode.Forbidden));
        return true;
    }
    return false;
}
