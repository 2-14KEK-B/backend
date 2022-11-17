/* eslint-disable no-var */
import { Connection } from "mongoose";
import MongoStore from "connect-mongo";

export {};

declare global {
    var mongoConnection: Connection;
    var sessionStore: MongoStore;
}
