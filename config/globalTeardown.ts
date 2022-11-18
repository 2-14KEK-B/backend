import type { MongoMemoryServer } from "mongodb-memory-server";

export = async function globalTeardown() {
    // Config to decided if an mongodb-memory-server instance should be used
    const instance: MongoMemoryServer = global.mongoInstance;
    await instance.stop({ doCleanup: true });
};
