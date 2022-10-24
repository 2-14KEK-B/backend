import { NextFunction, Request, Response, Router } from "express";
import Controller from "@interfaces/controller";
import HttpError from "@exceptions/Http";

export default class LogoutController implements Controller {
    path: string;
    router: Router;

    constructor(path: string, router: Router) {
        this.path = path;
        this.router = router;
        this.initializeRoute();
    }

    private initializeRoute() {
        this.router.post(`${this.path}/logout`, this.logout);
    }

    private logout = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            res.send("logout successfully");
        } catch (error) {
            next(new HttpError(400, (error as Error).message));
        }
    };
}
