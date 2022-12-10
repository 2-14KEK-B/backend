import request, { Response } from "supertest";
import App from "../../app";
import AuthenticationController from "@authentication/index";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import type { Application } from "express";
import type { User } from "@interfaces/user";

describe("POST /auth/login", () => {
    let server: Application;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockUser: Partial<User> = { email: "test@test.com", username: "test", password: pw };

    beforeAll(async () => {
        server = new App([new AuthenticationController()]).getServer();
        await userModel.create({ ...mockUser, password: hpw });
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

    it("returns statuscode 406 if email is not a valid email", async () => {
        expect.assertions(2);
        const res: Response = await request(server).post("/auth/login").send({
            email: "any",
            password: "anything",
        });
        expect(res.statusCode).toEqual(StatusCode.NotAcceptable);
        expect(res.body).toEqual("email must be an email");
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

    it("returns statuscode 200 if user exists with email", async () => {
        expect.assertions(2);
        const res: Response = await request(server).post("/auth/login").send({ email: mockUser.email, password: pw });
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.body.email).toEqual(mockUser.email);
    });

    it("returns statuscode 200 if user exists with username", async () => {
        expect.assertions(2);
        const res: Response = await request(server)
            .post("/auth/login")
            .send({ username: mockUser.username, password: pw });
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.body.username).toEqual(mockUser.username);
    });
});
