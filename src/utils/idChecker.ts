import { isValidObjectId, Model } from "mongoose";
import { IdNotValidException } from "@exceptions";
import type { NextFunction } from "express";

/**
Check id/ids if not valid ObjectId or not existing in the collection
 */
export default async function isIdNotValid<T>(
    model: Model<T>,
    ids: string[] | undefined,
    next: NextFunction,
): Promise<boolean> {
    if (!ids) {
        next(new IdNotValidException());
        return true;
    }
    for (const id of ids) {
        if (!isValidObjectId(id) || !(await model.exists({ _id: id }))) {
            next(new IdNotValidException());
            return true;
        }
    }
    return false;
}
