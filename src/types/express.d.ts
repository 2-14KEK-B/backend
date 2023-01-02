import type { Server } from "socket.io";

declare module "express" {
    interface Application {
        io?: Server;
    }
}
