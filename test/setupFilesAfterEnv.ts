import { disconnect, connection } from "mongoose";
import connectToDatabase from "@db/connectToDatabase";
import { closeSessionStore } from "@db/sessionStore";

beforeAll(async () => {
    await connectToDatabase(process.env["TEST_URI"]);
});

afterAll(async () => {
    await connection.db.dropDatabase();
    await closeSessionStore();
    await disconnect();
});
