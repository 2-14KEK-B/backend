import env from "@config/validateEnv";
import HttpError from "@exceptions/Http";
import { dictionaries } from "@utils/dictionaries";
import type { NextFunction, Request, Response } from "express";

export default async function errorMiddleware(
    error: HttpError,
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const status = error.status || 500;

    // const dictionary = dictionaries[req.headers["accept-language"]];
    const dictionary = dictionaries[global.language];
    const message = dictionary.error[error.message as keyof typeof dictionary.error] ?? error.message;

    if (error instanceof HttpError) {
        if (error.slots !== null) {
            const slots = Object.keys(error.slots);

            for (const slot in slots) {
                const toReplace = error.slots[slot];
                if (toReplace) {
                    message.replace(`#${slot}#`, toReplace.toString());
                }
            }
        }
    }

    if (env.isDev) {
        /* istanbul ignore next */
        console.log("error: ", { status, message });
    }
    res.status(status).json(message);
    next();
}
