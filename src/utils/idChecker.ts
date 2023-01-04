import { isValidObjectId, Model } from "mongoose";
import IdNotValidException from "@exceptions/IdNotValid";
import type { NextFunction } from "express";

/**
Check id/ids if not valid ObjectId or not existing in the collection
 */
export default async function isIdNotValid<T>(
    model: Model<T>,
    [...ids]: string[],
    next: NextFunction,
): Promise<boolean> {
    for (const id of ids) {
        if (!isValidObjectId(id)) {
            next(new IdNotValidException(id));
            return true;
        } else if (!(await model.exists({ _id: id }))) {
            next(new IdNotValidException(id));
            return true;
        }
    }
    return false;
}
