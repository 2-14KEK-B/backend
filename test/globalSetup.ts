import connectToDatabase from "@db/connectToDatabase";
import { hash } from "bcrypt";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connection, disconnect } from "mongoose";

const password = "test1234";

export = async function globalSetup() {
    const instance = await MongoMemoryServer.create();
    const uri = instance.getUri();

    global.language = "en";
    global.mongoInstance = instance;
    global.MOCK_PASSWORD = password;
    global.MOCK_HASHED_PASSWORD = await hash(password, 10);

    process.env["TEST_URI"] = `${uri.slice(0, uri.lastIndexOf("/"))}/bookswap_test`;

    // The following is to make sure the database is clean before an test starts
    await connectToDatabase(process.env["TEST_URI"]);
    // await connect(`${process.env["TEST_URI"]}/bookswap_test`);
    await connection.db.dropDatabase();
    await disconnect();
};
