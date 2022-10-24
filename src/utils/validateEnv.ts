import { cleanEnv, port, str } from "envalid";

export default function validateEnv(env: "prod" | "dev" | "test"): void {
    if (env == "prod") {
        cleanEnv(process.env, {
            SECRET: str(),
            MONGO_PASSWORD: str(),
            MONGO_PATH: str(),
            MONGO_USER: str(),
            MONGO_DB: str(),
            PORT: port(),
        });
    } else {
        if (env == "dev") {
            cleanEnv(process.env, {
                SECRET: str(),
                DEV_MONGO_URI: str(),
                PORT: port(),
            });
        } else if (env == "test") {
            cleanEnv(process.env, {
                SECRET: str(),
                TEST_MONGO_URI: str(),
                PORT: port(),
            });
        }
    }
}
