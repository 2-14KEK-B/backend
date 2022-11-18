import MongoStore from "connect-mongo";

async function createSessionStore(connectionString: string, MAX_AGE = 1000 * 60 * 60) {
    const sessionStore = MongoStore.create({
        mongoUrl: connectionString,
        ttl: MAX_AGE,
        touchAfter: 60 * 20,
    });

    global.sessionStore = sessionStore;
}

async function closeSessionStore() {
    const sessionStore = global.sessionStore;
    await sessionStore.close();
}

export { createSessionStore, closeSessionStore };
