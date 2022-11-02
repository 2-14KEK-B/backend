import { Application } from "express";
import request, { Response } from "supertest";
import { hash } from "bcrypt";
import "dotenv/config";
import App from "../../app";
import validateEnv from "@utils/validateEnv";
import userModel from "@models/user";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";

validateEnv("test");

describe("POST /login", () => {
    let server: Application;

    beforeAll(() => {
        server = new App([new AuthenticationController()]).getServer();
    });

    it("returns statuscode 401 if user not exists", async () => {
        const res: Response = await request(server).post("/auth/login").send({
            email: "any@any.any",
            password: "anything",
        });
        expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        expect(res.body.message).toEqual("Wrong credentials provided");
    });

    it("returns statuscode 200 if user exists", async () => {
        await userModel.collection.drop();
        const password = await hash("test1234", 10);
        const userData = { email: "test@test.com", password: password };
        await userModel.create(userData).then(doc => {
            console.log(doc);
        });
        const res: Response = await request(server).post("/auth/login").send({
            email: "test@test.com",
            password: "test1234",
        });
        console.log(res);
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.body.email).toEqual(userData.email);
    });

    it("returns statuscode 401 if user exists, but password not match", async () => {
        await userModel.collection.drop();
        const userData = { email: "test@test.com", password: await hash("test123", 10) };
        await userModel.create(userData);
        const res: Response = await request(server).post("/auth/login").send({
            email: "test@test.com",
            password: "test1234",
        });
        expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        expect(res.body.message).toEqual("Wrong credentials provided");
    });
});
