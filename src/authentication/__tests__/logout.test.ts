import request, { Response } from "supertest";
import { hash } from "bcrypt";
import App from "../../app";
import userModel from "@models/user";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import type { Application } from "express";
import type { Connection } from "mongoose";

describe("POST /logout", () => {
    let server: Application;
    let db: Connection;
    let cookie: string;
    const mockUser = { email: "test@test.com", password: "test1234" };

    beforeAll(async () => {
        const app = new App([new AuthenticationController()], "mongodb://127.0.0.1/bookswap_test3");
        server = app.getServer();
        db = app.getDb();
        const password = await hash(mockUser.password, 10);
        await userModel.create({ email: mockUser.email, password: password });
        const loginRes = await request(server).post("/auth/login").send(mockUser);
        cookie = loginRes.headers["set-cookie"];
    });

    afterAll(async () => {
        await db.collection("users").drop();
        await db.collection("sessions").drop();
        await db.close();
    });

    it("returns statuscode 401 if not already logged in", async () => {
        expect.assertions(3);
        const res: Response = await request(server).post("/auth/logout");
        expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        expect(res.body.message).toEqual("Unauthorized");
        expect(res.headers["set-cookie"]).toBeFalsy();
    });

    it("returns statuscode 200 if logout successfully", async () => {
        const res: Response = await request(server).post("/auth/logout").set("Cookie", cookie);
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.text).toEqual("logout successfully");
    });
});
