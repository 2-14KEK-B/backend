import { Request, Response, NextFunction, RequestHandler } from "express";
import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import HttpError from "@exceptions/Http";

export default function validationMiddleware(type: ClassConstructor<unknown>, skipMissingProperties = false): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction) => {
        validate(plainToInstance(type, [req.body]), { skipMissingProperties }).then((errors: ValidationError[]) => {
            if (errors.length > 0) {
                const message = errors.map((error: ValidationError) => Object.values(error.constraints)).join(", ");
                next(new HttpError(400, message));
            } else {
                next();
            }
        });
    };
}
