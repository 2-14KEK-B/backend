import userModel from "@models/user";
import bookModel from "@models/book";
import borrowModel from "@models/borrow";
import messageModel from "@models/message";
import { MongoMemoryServer } from "mongodb-memory-server";
import { closeSessionStore, createSessionStore } from "@db/sessionStore";
import connectToDatabase from "@db/connectToDatabase";

let mongoMemory: MongoMemoryServer;

beforeAll(async () => {
    mongoMemory = await MongoMemoryServer.create();
    await connectToDatabase(`${mongoMemory.getUri()}bookswap_test`);
    await createSessionStore();
    await userModel.init();
    await bookModel.init();
    await borrowModel.init();
    await messageModel.init();
});

afterAll(async () => {
    await closeSessionStore();
    await global.mongoConnection.close(true);
    await mongoMemory.stop({ doCleanup: true });
});
