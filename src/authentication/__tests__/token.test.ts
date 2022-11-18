import AuthenticationController from "@authentication/index";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import { hash } from "bcrypt";
import App from "../../app";
import request, { Response, SuperAgentTest } from "supertest";
import type { Application } from "express";

describe("POST /auth", () => {
    let server: Application;
    let agent: SuperAgentTest;
    const mockUser = { email: "testforlogin@test.com", password: "test1234" };

    beforeAll(async () => {
        server = new App([new AuthenticationController()]).getServer();
        agent = request.agent(server);
    });

    it("returns statuscode 401 and user if user not logged in", async () => {
        expect.assertions(2);
        const res: Response = await agent.get("/auth");
        expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        expect(res.body).toBe("Unauthorized");
    });

    it("returns statuscode 200 and user if user already logged in", async () => {
        expect.assertions(2);
        const password = await hash(mockUser.password, 10);
        await userModel.create({ email: mockUser.email, password: password });
        await agent.post("/auth/login").send(mockUser);

        const user = await userModel.findOne({ email: mockUser.email }, "-password -books -borrows -messages -user_ratings").lean();
        const res: Response = await agent.get("/auth");

        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.body).toStrictEqual({ ...user, _id: user?._id.toString() });
    });
});
