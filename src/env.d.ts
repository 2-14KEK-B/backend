declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: "development" | "test" | "production";
        JWT_SECRET: string;
        MONGO_USER: string;
        MONGO_PASSWORD: string;
        MONGO_PATH: string;
        MONGO_DB: string;
        DEV_MONGO_URI: string;
        TEST_MONGO_URI: string;
        PORT: string;
    }
}
