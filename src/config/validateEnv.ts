import { cleanEnv, port, str } from "envalid";

const env = cleanEnv(process.env, {
    NODE_ENV: str({ default: "production", choices: ["production", "development", "test"] }),
    SECRET: str({ devDefault: "JustALittleLongerSecretThenExpected" }),
    MONGO_URI: str({ devDefault: "mongodb://127.0.0.1:27017/bookswap" }),
    FRONT_URL: str({ devDefault: "http://localhost:4000" }),
    PORT: port({ default: 3000 }),
    EMAIL_PASSWORD: str({ default: "" }),
    EMAIL_ADDRESS: str({ default: "" }),
});

export default env;
