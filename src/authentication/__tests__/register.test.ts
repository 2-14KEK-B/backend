import userModel from "@models/user";
import request, { Response } from "supertest";
import App from "../../app";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import type { Application } from "express";
import type { Connection } from "mongoose";

describe("POST /register", () => {
    let server: Application;
    let db: Connection;
    const mockUser = { email: "test@test.com", password: "test1234" };

    beforeAll(async () => {
        const app = new App([new AuthenticationController()], "mongodb://127.0.0.1/bookswap_test2");
        server = app.getServer();
        db = app.getDb();
    });

    afterAll(async () => {
        await db.collection("users").drop();
        await db.close();
    });

    it("returns statuscode 200 if registered successfully", async () => {
        const validEmail = "validEmail@test.com";
        const res: Response = await request(server).post("/auth/register").send({ email: validEmail, password: mockUser.password });
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.text).toEqual(`user created with ${validEmail}`);
    });

    it("returns statuscode 400 if user already exists", async () => {
        expect.assertions(2);
        await userModel.create(mockUser);
        const res: Response = await request(server).post("/auth/register").send(mockUser);
        expect(res.statusCode).toEqual(StatusCode.BadRequest);
        expect(res.body.message).toEqual(`User with email ${mockUser.email} already exists`);
    });
});
