import authMiddleware from "@middlewares/authentication";
import HttpError from "@exceptions/Http";
import { dictionaries } from "@utils/dictionaries";
import type { NextFunction, Request, Response, Router } from "express";
import type Controller from "@interfaces/controller";

export default class LogoutController implements Controller {
    path: string;
    router: Router;

    constructor(path: string, router: Router) {
        this.path = path;
        this.router = router;
        this.initializeRoute();
    }

    private initializeRoute() {
        this.router.get(`${this.path}/logout`, authMiddleware, this.logout);
    }

    private logout = async (req: Request, res: Response, next: NextFunction) => {
        try {
            delete req.session["userId"];
            delete req.session["role"];
            delete req.session["locale"];
            req.session.destroy(error => {
                if (error) {
                    /* istanbul ignore next */
                    return next(new HttpError(error.message));
                }
                // const dictionary = dictionaries[req.headers["accept-language"]];
                const dictionary = dictionaries[global.language];

                res.clearCookie("session-id");
                res.json(dictionary.success.logout);
            });
        } catch (error) {
            /* istanbul ignore next */
            next(new HttpError(error.message));
        }
    };
}
