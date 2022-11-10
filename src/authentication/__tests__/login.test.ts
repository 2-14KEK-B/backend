import type { Application } from "express";
import request, { Response } from "supertest";
import { hash } from "bcrypt";
import App from "../../app";
import userModel from "@models/user";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import type { Connection } from "mongoose";

describe("POST /login", () => {
    let server: Application;
    let db: Connection;
    const mockUser = { email: "test@test.com", password: "test1234" };

    beforeAll(async () => {
        const app = new App([new AuthenticationController()], "mongodb://127.0.0.1/bookswap_test1");
        server = app.getServer();
        db = app.getDb();
        const password = await hash(mockUser.password, 10);
        await userModel.create({ email: mockUser.email, password: password });
    });

    afterAll(async () => {
        await db.collection("users").drop();
        await db.collection("sessions").drop();
        await db.close();
    });

    it("returns statuscode 401 if user not exists", async () => {
        expect.assertions(2);
        const res: Response = await request(server).post("/auth/login").send({
            email: "any@any.any",
            password: "anything",
        });
        expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        expect(res.body.message).toEqual("Wrong credentials provided");
    });

    it("returns statuscode 200 if user exists", async () => {
        const res: Response = await request(server).post("/auth/login").send(mockUser);
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.body.email).toEqual(mockUser.email);
    });

    it("returns statuscode 401 if user exists, but password not match", async () => {
        expect.assertions(2);
        const res: Response = await request(server).post("/auth/login").send({
            email: mockUser.email,
            password: "wrongpassword",
        });
        expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        expect(res.body.message).toEqual("Wrong credentials provided");
    });
});
