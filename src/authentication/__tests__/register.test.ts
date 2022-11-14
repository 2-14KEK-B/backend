import { mongoClient } from "../../../config/setupTest";
import userModel from "@models/user";
import request, { Response } from "supertest";
import App from "../../app";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import type { Express } from "express";

describe("POST /auth/register", () => {
    let server: Express;
    const mockUser = { email: "test@test.com", password: "test1234" };

    beforeAll(async () => {
        server = new App([new AuthenticationController()], mongoClient).getServer();
    });

    it("returns statuscode 200 if registered successfully", async () => {
        expect.assertions(2);
        const validEmail = "validEmail@test.com";
        const res: Response = await request(server).post("/auth/register").send({ email: validEmail, password: mockUser.password });
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.body).toEqual(`user created with ${validEmail}`);
    });

    it("returns statuscode 400 if user already exists", async () => {
        expect.assertions(2);
        await userModel.create(mockUser);
        const res: Response = await request(server).post("/auth/register").send(mockUser);
        expect(res.statusCode).toEqual(StatusCode.BadRequest);
        expect(res.body).toEqual(`User with email ${mockUser.email} already exists`);
    });
});
