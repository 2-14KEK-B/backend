import request, { Response } from "supertest";
import App from "../../app";
import AuthenticationController from "@authentication/index";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import type { Express } from "express";
import type { User } from "@interfaces/user";

describe("POST /auth/register", () => {
    let server: Express;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockUser1: Partial<User> = { email: "test1@test.com", password: pw },
        mockUser2: Partial<User> = { email: "test2@test.com", password: pw };

    beforeAll(async () => {
        server = new App([new AuthenticationController()]).getServer();
        await userModel.create({ ...mockUser1, password: hpw });
    });

    it("returns statuscode 400 if user already exists", async () => {
        expect.assertions(2);
        const res: Response = await request(server).post("/auth/register").send({ email: mockUser1.email, password: pw });
        expect(res.statusCode).toEqual(StatusCode.BadRequest);
        expect(res.body).toEqual(`User with email ${mockUser1.email} already exists`);
    });

    it("returns statuscode 406 if key-value of body is not valid", async () => {
        expect.assertions(2);
        const res: Response = await request(server).post("/auth/register").send({ something: "mockUser2.email", something2: "pw" });
        expect(res.statusCode).toEqual(StatusCode.NotAcceptable);
        expect(res.body).toEqual(
            "property something should not exist, property something2 should not exist, email must be an email, password must be a string",
        );
    });

    it("returns statuscode 200 if registered successfully", async () => {
        expect.assertions(2);
        const res: Response = await request(server).post("/auth/register").send({ email: mockUser2.email, password: pw });
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.body).toEqual(`user created with ${mockUser2.email}`);
    });
});
