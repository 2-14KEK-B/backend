import request, { Response, SuperAgentTest } from "supertest";
import App from "../../app";
import AuthenticationController from "@authentication/index";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import { dictionaries } from "@utils/dictionaries";
import type { Application } from "express";
import type { User } from "@interfaces/user";

describe("POST /auth/logout", () => {
    let app: Application;
    let agent: SuperAgentTest;
    const dictionary = dictionaries[global.language];
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockUser: Partial<User> = {
            email: "test@test.com",
            email_is_verified: true,
            username: "testForLogout",
            password: pw,
        };

    beforeAll(async () => {
        app = new App([new AuthenticationController()]).getApp();
        agent = request.agent(app);
        await userModel.create({
            ...mockUser,
            password: hpw,
        });
    });

    it("returns statuscode 401 if not already logged in", async () => {
        expect.assertions(3);
        const res: Response = await request(app).get("/auth/logout");
        expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        expect(res.body).toEqual(dictionary.error.unauthorized);
        expect(res.headers["set-cookie"]).toBeFalsy();
    });

    it("returns statuscode 200 if logout successfully", async () => {
        expect.assertions(2);
        await agent.post("/auth/login").send({ email: mockUser.email, password: pw });
        const res: Response = await agent.get("/auth/logout");
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.body).toEqual(dictionary.success.logout);
    });
});
