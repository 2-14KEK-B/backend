/* eslint-disable @typescript-eslint/no-explicit-any */
import { I18n } from "i18n";
import { join, normalize } from "node:path";
import StatusCode from "@utils/statusCodes";
import type { Error } from "mongoose";
import type { Request, Response, NextFunction } from "express";

function mongooseErrorMiddleware(error: any, _req: Request, res: Response, next: NextFunction) {
    const i18n = new I18n({
        locales: ["en", "hu"],
        defaultLocale: "hu",
        directory: normalize(join(__dirname, "..", "locales")),
        objectNotation: true,
    });

    if (isValidationError(error)) {
        error.errors[0]?.message;
        const errors = Object.values(error.errors).map((err: Error.ValidatorError | Error.CastError) => err.message);
        const messages = { validation: errors.map((e: string) => i18n.__("validation." + e)) };
        return res.status(StatusCode.NotAcceptable).json(messages);
    }
    if (isValidatorError(error)) {
        /* istanbul ignore next */
        const message = i18n.__(error.message);
        if (message != error.message) {
            /* istanbul ignore next */
            return res.status(400).json(message);
        } else {
            /* istanbul ignore next */
            return res.status(StatusCode.NotAcceptable).json(error.message);
        }
    }
    if (isCastError(error)) {
        /* istanbul ignore next */
        return res.status(StatusCode.NotAcceptable).json(error.message);
    }
    next(error);
}

function isValidatorError(error: any): error is Error.ValidatorError {
    return error.name === "ValidatorError";
}
function isValidationError(error: any): error is Error.ValidationError {
    return error.name === "ValidationError";
}
function isCastError(error: any): error is Error.CastError {
    return error.name == "CastError";
}

export default mongooseErrorMiddleware;
