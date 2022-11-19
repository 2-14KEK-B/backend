import { disconnect } from "mongoose";
import connectToDatabase from "@db/connectToDatabase";
import { closeSessionStore } from "@db/sessionStore";

beforeAll(async () => {
    // put your client connection code here, example with mongoose:
    await connectToDatabase(process.env["TEST_URI"]);
});

afterAll(async () => {
    // put your client disconnection code here, example with mongodb:
    await closeSessionStore();
    await disconnect();
});
