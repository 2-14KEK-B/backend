import "express-session";

declare module "express-session" {
    interface SessionData {
        userId: string;
        locale: string;
        role?: string;
    }
}
