import { type ClassConstructor, plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { HttpError } from "@exceptions";
import StatusCode from "@utils/statusCodes";
import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
Checks input from req.data by Dto-s
 */
export default function validationMiddleware<T>(
    type: ClassConstructor<T>,
    skipMissingProperties = false,
): RequestHandler {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const object: Partial<T> = plainToInstance(type, req.body);

        const errors: ValidationError[] = await validate(object, {
            skipMissingProperties,
            whitelist: true,
            forbidNonWhitelisted: true,
        });

        if (!errors.length) return next();

        next(new HttpError(getMessagesFromErrors(errors), StatusCode.NotAcceptable));
    };
}

function getMessagesFromErrors(errors: ValidationError[]) {
    const messages: string[] = [];
    errors.forEach(error => {
        if (error.constraints) {
            messages.push(...Object.values(error.constraints));
        }
    });

    return messages.join(", ");
}
