export {};

declare module "jsonwebtoken" {
    export interface JwtPayload {
        email?: string;
    }
}
