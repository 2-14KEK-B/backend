import authMiddleware from "@middlewares/authentication";
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
            req.session.destroy(error => {
                if (error) {
                    /* istanbul ignore next */
                    return next(error);
                }

                res.clearCookie("session-id");
                res.json(res.__("success.logout"));
            });
        } catch (error) {
            /* istanbul ignore next */
            next(error);
        }
    };
}
