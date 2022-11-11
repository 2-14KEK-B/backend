import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import HttpError from "@exceptions/Http";
import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
Checks input from req.data by Dto-s
 */
export default function validationMiddleware<T>(type: ClassConstructor<T>, skipMissingProperties = false): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction) => {
        validate(plainToInstance(type, [req.body]), { skipMissingProperties }).then((errors: ValidationError[]) => {
            if (errors.length > 0) {
                const message = errors.map((error: ValidationError) => Object.values([error.constraints])).join(", ");
                next(new HttpError(message));
            } else {
                next();
            }
        });
    };
}
