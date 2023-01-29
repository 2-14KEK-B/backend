import request, { Response } from "supertest";
import App from "../../app";
import AuthenticationController from "@authentication/index";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import { dictionaries } from "@utils/dictionaries";
import type { Application } from "express";
import type { User } from "@interfaces/user";

describe("POST /auth/login", () => {
    let app: Application;
    const dictionary = dictionaries[global.language];
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockUser: Partial<User> = {
            email: "test@test.com",
            email_is_verified: true,
            username: "testForLogin",
            password: pw,
        };

    beforeAll(async () => {
        app = new App([new AuthenticationController()]).getApp();
        await userModel.create({ ...mockUser, password: hpw });
    });

    it("returns statuscode 401 if user not exists", async () => {
        expect.assertions(2);
        const res: Response = await request(app).post("/auth/login").send({
            email: "any@any.any",
            password: "anything",
        });
        expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        expect(res.body).toEqual(dictionary.error.wrongCredentials);
    });

    it("returns statuscode 406 if email is not a valid email", async () => {
        expect.assertions(2);
        const res: Response = await request(app).post("/auth/login").send({
            email: "any",
            password: "anything",
        });
        expect(res.statusCode).toEqual(StatusCode.NotAcceptable);
        expect(res.body).toEqual("email must be an email");
    });

    it("returns statuscode 401 if user exists, but password not match", async () => {
        expect.assertions(2);
        const res: Response = await request(app).post("/auth/login").send({
            email: mockUser.email,
            password: "wrongpassword",
        });
        expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        expect(res.body).toEqual(dictionary.error.wrongCredentials);
    });

    it("returns statuscode 200 if user exists with email", async () => {
        expect.assertions(2);
        const res: Response = await request(app).post("/auth/login").send({ email: mockUser.email, password: pw });
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.body.email).toEqual(mockUser.email);
    });

    it("returns statuscode 200 if user exists with username", async () => {
        expect.assertions(2);
        const res: Response = await request(app)
            .post("/auth/login")
            .send({ username: mockUser.username, password: pw });
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.body.username).toEqual(mockUser.username);
    });
});
