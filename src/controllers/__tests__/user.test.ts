import { hash } from "bcrypt";
import request, { Response, SuperAgentTest } from "supertest";
import { mongoClient } from "../../../config/setupTest";
import App from "../../app";
import userModel from "@models/user";
import UserController from "@controllers/user";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import type { Express } from "express";
import type { User } from "@interfaces/user";

describe("USERS", () => {
    let server: Express;
    const defaultUser = { email: "default@test.com", password: "test1234" };

    beforeAll(async () => {
        server = new App([new AuthenticationController(), new UserController()], mongoClient).getServer();
        const password = await hash(defaultUser.password, 10);
        await userModel.create({ email: defaultUser.email, password: password });
    });

    describe("USERS, not logged in", () => {
        it("any PATH, should return statuscode 401", async () => {
            expect.assertions(5);
            const meRes = await request(server).get("/user/me");
            const allRes = await request(server).get("/user/all");
            const idRes = await request(server).get("/user/dhjkawgdhjkawfizfgva");
            const patchRes = await request(server).patch("/user/dhjkawgdhjkawfizfgva").send({ anything: "anything" });
            const deleteRes = await request(server).delete("/user/dhjkawgdhjkawfizfgva");
            expect(meRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(allRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(idRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(patchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("USERS, logged in as user", () => {
        let agent: SuperAgentTest;
        const mockUserData = { email: "test@test.com", password: "test1234" };
        let mockUser: User;

        beforeAll(async () => {
            agent = request.agent(server);
            const password = await hash(mockUserData.password, 10);
            mockUser = await userModel.create({ email: mockUserData.email, password: password });
            await agent.post("/auth/login").send(mockUserData);
        });

        it("GET /user/me, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/user/me");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as User);
        });
        it("GET /user/all, should return statuscode 403", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/user/all");
            expect(res.statusCode).toBe(StatusCode.Forbidden);
            expect(res.body).toBe("Forbidden");
        });
        it("GET /user/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const users = await userModel.find().lean();
            const res: Response = await agent.get(`/user/${users[0]?._id}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as User);
        });
        it("PATCH /user/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const newData = { email: "newemail@test.com" };
            const res: Response = await agent.patch(`/user/${mockUser._id}`).send(newData);
            const modifiedUser: User = res.body;
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(modifiedUser).toHaveProperty("email", newData.email);
        });
        it("DELETE /user/:id, should return statuscode 403", async () => {
            expect.assertions(2);
            const res: Response = await agent.delete(`/user/${mockUser._id}`);
            expect(res.statusCode).toBe(StatusCode.Forbidden);
            expect(res.body).toBe("Forbidden");
        });
    });

    describe("USERS, logged in as admin", () => {
        let agent: SuperAgentTest;
        const mockAdminData = { email: "admin@test.com", password: "test1234" };
        let users: User[];

        beforeAll(async () => {
            agent = request.agent(server);
            const password = await hash(mockAdminData.password, 10);
            await userModel.create({ email: mockAdminData.email, password: password, role: "admin" });
            await agent.post("/auth/login").send(mockAdminData);
            users = await (await agent.get("/user/all")).body;
        });

        it("GET /user/me, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/user/me");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as User);
        });
        it("GET /user/all, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/user/all");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<User>);
        });
        it("GET /user/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const users = await userModel.find().lean();
            const res: Response = await agent.get(`/user/${users[0]?._id}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as User);
        });
        it("PATCH /user/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const newData = { email: "newemail@test.com" };
            const res: Response = await agent.patch(`/user/${users[0]?._id}`).send(newData);
            const modifiedUser: User = res.body;
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(modifiedUser).toHaveProperty("email", newData.email);
        });
        it("DELETE /user/:id, should return statuscode 204", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/user/${users[0]?._id}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });
});
