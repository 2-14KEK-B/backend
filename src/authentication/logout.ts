import authMiddleware from "@middlewares/authentication";
import HttpError from "@exceptions/Http";
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
        this.router.post(`${this.path}/logout`, authMiddleware, this.logout);
    }

    private logout = async (req: Request, res: Response, next: NextFunction) => {
        try {
            delete req.session["userId"];
            req.session.destroy(error => {
                if (error) {
                    return next(new HttpError((error as Error).message));
                }
                res.clearCookie("session-id");
                res.json("Logged out successfully.");
            });
        } catch (error) {
            next(new HttpError((error as Error).message));
        }
    };
}
