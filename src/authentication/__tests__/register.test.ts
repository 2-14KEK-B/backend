import request, { Response } from "supertest";
import App from "../../app";
import AuthenticationController from "@authentication/index";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import type { Application } from "express";
import type { User } from "@interfaces/user";
import type { RegisterCred } from "@interfaces/authentication";

describe("POST /auth/register", () => {
    let app: Application;
    const i18n = global.I18n;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockUser1: Partial<User> = {
            email: "test1@test.com",
            email_is_verified: true,
            username: "test1ForRegister",
            password: pw,
        },
        mockUser2: Partial<User> = {
            email: "test2@test.com",
            email_is_verified: true,
            username: "test2ForRegister",
            password: pw,
        };

    beforeAll(async () => {
        app = new App([new AuthenticationController()]).getApp();
        await userModel.create({ ...mockUser1, password: hpw });
    });

    it("returns statuscode 409 if user already exists with this email", async () => {
        expect.assertions(2);
        const userData: RegisterCred = {
            email: mockUser1.email as string,
            username: "testRegisterWithSameEmail",
            password: pw as string,
        };

        const res: Response = await request(app).post("/auth/register").send(userData);
        expect(res.statusCode).toEqual(StatusCode.Conflict);
        expect(res.body).toEqual(i18n?.__("error.userAlreadyExists"));
    });
    it("returns statuscode 409 if user already exists with this username", async () => {
        expect.assertions(2);
        const userData: RegisterCred = {
            email: "validemailforregister@test.com",
            username: mockUser1.username as string,
            password: pw as string,
        };

        const res: Response = await request(app).post("/auth/register").send(userData);
        expect(res.statusCode).toEqual(StatusCode.Conflict);
        expect(res.body).toEqual(i18n?.__("error.userAlreadyExists"));
    });

    it("returns statuscode 406 if key-value of body is not valid", async () => {
        expect.assertions(2);
        const res: Response = await request(app)
            .post("/auth/register")
            .send({ something: "mockUser2.email", something2: "pw" });
        expect(res.statusCode).toEqual(StatusCode.NotAcceptable);
        expect(res.body).toEqual(
            "property something should not exist, property something2 should not exist, username must be a string, email must be an email, password must be a string",
        );
    });

    it("returns statuscode 204 if registered successfully", async () => {
        expect.assertions(1);
        const userData: RegisterCred = {
            email: mockUser2.email as string,
            username: mockUser2.username as string,
            password: pw as string,
        };

        const res: Response = await request(app).post("/auth/register").send(userData);
        expect(res.statusCode).toEqual(StatusCode.NoContent);
    });
});
