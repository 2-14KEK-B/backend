import env from "@config/validateEnv";
import { I18n } from "i18n";
import { join, normalize } from "node:path";
import type { HttpError } from "@exceptions";
import type { NextFunction, Request, Response } from "express";

export default async function errorMiddleware(
    error: HttpError,
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const status = error.status || 500;

    const i18n = new I18n({
        locales: ["en", "hu"],
        defaultLocale: "hu",
        directory: normalize(join(__dirname, "..", "locales")),
        objectNotation: true,
    });

    const message = i18n.__(error.message);

    if (env.isDev) {
        /* istanbul ignore next */
        console.log("error: ", { status, message });
    }
    res.status(status).json(message);
    next();
}
