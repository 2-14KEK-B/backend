import connectToDatabase from "@db/connectToDatabase";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connection, disconnect } from "mongoose";

export = async function globalSetup() {
    const instance = await MongoMemoryServer.create();
    const uri = instance.getUri();
    global.mongoInstance = instance;
    process.env["TEST_URI"] = uri.slice(0, uri.lastIndexOf("/"));

    // The following is to make sure the database is clean before an test starts
    await connectToDatabase(`${process.env["TEST_URI"]}/bookswap_test`);
    // await connect(`${process.env["TEST_URI"]}/bookswap_test`);
    await connection.db.dropDatabase();
    await disconnect();
};
