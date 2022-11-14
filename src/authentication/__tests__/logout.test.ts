import request, { Response } from "supertest";
import { hash } from "bcrypt";
import App from "../../app";
import userModel from "@models/user";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import type { Express } from "express";
import { mongoClient } from "../../../config/setupTest";

describe("POST /auth/logout", () => {
    let server: Express;
    const mockUser = { email: "test@test.com", password: "test1234" };

    beforeAll(async () => {
        server = new App([new AuthenticationController()], mongoClient).getServer();
    });

    it("returns statuscode 401 if not already logged in", async () => {
        expect.assertions(3);
        const res: Response = await request(server).post("/auth/logout");
        expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        expect(res.body).toEqual("Unauthorized");
        expect(res.headers["set-cookie"]).toBeFalsy();
    });

    it("returns statuscode 200 if logout successfully", async () => {
        expect.assertions(2);
        const password = await hash(mockUser.password, 10);
        await userModel.create({ email: mockUser.email, password: password });
        const loginRes = await request(server).post("/auth/login").send(mockUser);
        const cookie = loginRes.headers["set-cookie"];
        const res: Response = await request(server).post("/auth/logout").set("Cookie", cookie);
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.body).toEqual("Logged out successfully.");
    });
});
