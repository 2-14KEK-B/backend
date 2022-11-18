/* eslint-disable no-var */
import MongoStore from "connect-mongo";
import { MongoMemoryServer } from "mongodb-memory-server";

export {};

declare global {
    var mongoInstance: MongoMemoryServer;
    var sessionStore: MongoStore;
}
