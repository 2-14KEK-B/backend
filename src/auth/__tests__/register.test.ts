import { Application } from "express";
import request, { Response } from "supertest";
import "dotenv/config";
import App from "../../app";
import validateEnv from "@utils/validateEnv";
import userModel from "@models/user";
import AuthenticationController from "@auth/index";
import StatusCode from "@utils/statusCodes";

validateEnv("test");

describe("POST /register", () => {
    let server: Application;
    const email = "test@test.com";

    beforeAll(() => {
        server = new App([new AuthenticationController()]).getServer();
    });

    it("returns statuscode 200 if registered successfully", async () => {
        await userModel.collection.drop();
        const res: Response = await request(server).post("/auth/register").send({ email: email, password: "test1234" });
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.text).toEqual(`user created with ${email}`);
    });

    it("returns statuscode 400 if user already exists", async () => {
        const res: Response = await request(server).post("/auth/register").send({ email: email, password: "test1234" });
        expect(res.statusCode).toEqual(StatusCode.BadRequest);
        expect(res.body.message).toEqual(`User with email ${email} already exists`);
    });
});
