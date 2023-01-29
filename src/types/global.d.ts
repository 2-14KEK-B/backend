/* eslint-disable no-var */
export {};

declare global {
    var mongoInstance: MongoMemoryServer;

    var MOCK_PASSWORD: string;
    var MOCK_HASHED_PASSWORD: string;
    var language: "hu" | "en";
}
