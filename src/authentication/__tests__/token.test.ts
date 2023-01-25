import request, { Response, SuperAgentTest } from "supertest";
import App from "../../app";
import AuthenticationController from "@authentication/index";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import type { Application } from "express";
import type { User } from "@interfaces/user";

describe("POST /auth", () => {
    let app: Application;
    let agent: SuperAgentTest;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockUser: Partial<User> = { email: "testforlogin@test.com", password: "test1234" };

    beforeAll(async () => {
        app = new App([new AuthenticationController()]).getApp();
        agent = request.agent(app);
    });

    it("returns statuscode 401 and user if user not logged in", async () => {
        expect.assertions(2);
        const res: Response = await request(app).get("/auth");
        expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        expect(res.body).toBe("Unauthorized");
    });

    it("returns statuscode 200 and user if user already logged in", async () => {
        expect.assertions(2);

        await userModel.create({ email: mockUser.email, email_is_verified: true, password: hpw });
        await agent.post("/auth/login").send({ email: mockUser.email, password: pw });
        const res: Response = await agent.get("/auth");

        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.body.email).toBe(mockUser.email);
    });
});
