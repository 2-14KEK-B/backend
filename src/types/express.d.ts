import type { Server } from "socket.io";

declare module "express" {
    interface Request {
        headers: {
            "accept-language": "hu" | "en";
        };
    }
    interface Application {
        io?: Server;
    }
}
