import { cleanEnv, port, str } from "envalid";

export function validateEnv(dev = false): void {
    if (dev) {
        cleanEnv(process.env, {
            SECRET: str(),
            DEV_MONGO_URI: str(),
            PORT: port(),
        });
    } else {
        cleanEnv(process.env, {
            SECRET: str(),
            MONGO_PASSWORD: str(),
            MONGO_PATH: str(),
            MONGO_USER: str(),
            MONGO_DB: str(),
            PORT: port(),
        });
    }
}
