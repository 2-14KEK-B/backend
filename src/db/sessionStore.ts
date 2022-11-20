import MongoStore from "connect-mongo";

let sessionStore: MongoStore;

function createSessionStore(MAX_AGE: number, connectionString?: string): MongoStore {
    sessionStore = MongoStore.create({
        mongoUrl: connectionString,
        ttl: MAX_AGE,
        touchAfter: 60 * 20,
    });

    return sessionStore;
}

async function closeSessionStore() {
    await sessionStore.close();
}

export { createSessionStore, closeSessionStore };
