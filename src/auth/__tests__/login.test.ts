import { Application } from "express";
import request, { Response } from "supertest";
import { hash } from "bcrypt";
import "dotenv/config";
import validateEnv from "@src/utils/validateEnv";
import App from "@src/app";
import userModel from "@models/user";
import AuthenticationController from "@auth/index";

validateEnv("test");

describe("POST /login", () => {
    let server: Application;

    beforeAll(() => {
        server = new App([new AuthenticationController()]).getServer();
    });

    it("returns statuscode 401 if user not exists", async () => {
        const res: Response = await request(server).post("/auth/login").send({
            email: "student001@jedlik.uk",
            password: "student001",
        });
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toEqual("Wrong credentials provided");
    });

    it("returns statuscode 200 if user exists", async () => {
        await userModel.collection.drop();
        const userData = { email: "test@test.com", name: "test", password: await hash("test1234", 10) };
        await userModel.create(userData);
        const res: Response = await request(server).post("/auth/login").send({
            email: "test@test.com",
            password: "test1234",
        });
        expect(res.statusCode).toEqual(200);
    });
});
