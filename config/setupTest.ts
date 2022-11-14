import connectToDatabase from "@utils/connectToDatabase";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { Connection } from "mongoose";
import type { MongoClient } from "mongodb";

let mongoMemory: MongoMemoryServer;
let mongoConnection: Connection;
let mongoClient: MongoClient;

beforeAll(async () => {
    mongoMemory = await MongoMemoryServer.create();
    mongoConnection = connectToDatabase(`${mongoMemory.getUri()}bookswap_test`);
    mongoClient = mongoConnection.getClient();
});
afterAll(async () => {
    await mongoConnection.close(true);
    await mongoMemory.stop({ doCleanup: true });
});

export { mongoClient };
