import { isValidObjectId, Model } from "mongoose";
import IdNotValidException from "@exceptions/IdNotValid";
import type { NextFunction } from "express";

/**
Check id/ids if valid ObjectId or existing in the collection
 */
export default async function isIdValid<T>(model: Model<T>, [...ids]: (string | undefined)[], next: NextFunction): Promise<boolean> {
    for (const id of ids) {
        if (!id) {
            next(new IdNotValidException(id));
            return false;
        }
        if (!isValidObjectId(id)) {
            next(new IdNotValidException(id));
            return false;
        }
        if (!(await model.exists({ _id: id }))) {
            next(new IdNotValidException(id));
            return false;
        }
    }
    return true;
}
