import request, { Response, SuperAgentTest } from "supertest";
import App from "../../app";
import AuthenticationController from "@authentication/index";
import userModel from "@models/user";
import StatusCode from "@utils/statusCodes";
import type { Application } from "express";
import type { MockUser } from "@interfaces/mockData";

describe("POST /auth", () => {
    let server: Application;
    let agent: SuperAgentTest;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockUser: MockUser = { email: "testforlogin@test.com", password: "test1234" };

    beforeAll(async () => {
        server = new App([new AuthenticationController()]).getServer();
        agent = request.agent(server);
    });

    it("returns statuscode 401 and user if user not logged in", async () => {
        expect.assertions(2);
        const res: Response = await request(server).get("/auth");
        expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        expect(res.body).toBe("Unauthorized");
    });

    it("returns statuscode 200 and user if user already logged in", async () => {
        expect.assertions(2);

        await userModel.create({ email: mockUser.email, password: hpw });
        await agent.post("/auth/login").send({ email: mockUser.email, password: pw });

        const user = await userModel.findOne({ email: mockUser.email }, "-password -books -borrows -messages -user_ratings").lean();
        const res: Response = await agent.get("/auth");

        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.body).toStrictEqual({ ...user, _id: user?._id.valueOf() });
    });
});
