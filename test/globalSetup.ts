import connectToDatabase from "@db/connectToDatabase";
import { hash } from "bcrypt";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connection, disconnect } from "mongoose";
import { I18n } from "i18n";
import { resolve } from "node:path";

const password = "test1234";

export default async function globalSetup() {
    const instance = await MongoMemoryServer.create();
    const uri = instance.getUri();

    const i18n = new I18n({
        locales: ["en", "hu"],
        defaultLocale: "hu",
        directory: resolve("src", "locales"),
        objectNotation: true,
    });

    global.I18n = i18n;

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
}
