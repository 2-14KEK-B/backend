import { I18n } from "i18n";
import { MongoMemoryServer } from "mongodb-memory-server";

/* eslint-disable no-var */
export {};

declare global {
    var mongoInstance: MongoMemoryServer | undefined;

    var I18n: I18n | undefined;

    var MOCK_PASSWORD: string | undefined;
    var MOCK_HASHED_PASSWORD: string | undefined;
    var language: "hu" | "en";
}
