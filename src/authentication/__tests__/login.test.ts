import { mongoClient } from "../../../config/setupTest";
import request, { Response } from "supertest";
import { hash } from "bcrypt";
import App from "../../app";
import AuthenticationController from "@authentication/index";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import type { Application } from "express";

describe("POST /auth/login", () => {
    let server: Application;
    const mockUser = { email: "test@test.com", password: "test1234" };

    beforeAll(async () => {
        server = new App([new AuthenticationController()], mongoClient).getServer();
        const password = await hash(mockUser.password, 10);
        await userModel.create({ email: mockUser.email, password: password });
    });

    it("returns statuscode 401 if user not exists", async () => {
        expect.assertions(2);
        const res: Response = await request(server).post("/auth/login").send({
            email: "any@any.any",
            password: "anything",
        });
        expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        expect(res.body).toEqual("Wrong credentials provided");
    });

    it("returns statuscode 401 if user exists, but password not match", async () => {
        expect.assertions(2);
        const res: Response = await request(server).post("/auth/login").send({
            email: mockUser.email,
            password: "wrongpassword",
        });
        expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        expect(res.body).toEqual("Wrong credentials provided");
    });

    it("returns statuscode 200 if user exists", async () => {
        expect.assertions(2);
        const res: Response = await request(server).post("/auth/login").send(mockUser);
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.body.email).toEqual(mockUser.email);
    });
});
