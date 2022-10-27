import { NextFunction } from "express";
import { isValidObjectId, Model } from "mongoose";
import IdNotValidException from "@exceptions/IdNotValid";

/**
 *  Check id/ids if valid ObjectId or existing in the collection
 * @typeParam type of model
 * @param model mongoose Model
 * @param param1 string[]
 * @param next NextFunction
 * @return Boolean
 */
export default async function isIdValid<T>(model: Model<T>, [...ids]: string[], next: NextFunction): Promise<boolean> {
    for (const id of ids) {
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
