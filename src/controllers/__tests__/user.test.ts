import request, { Response, SuperAgentTest } from "supertest";
import App from "../../app";
import userModel from "@models/user";
import UserController from "@controllers/user";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import { Types } from "mongoose";
import type { Express } from "express";
import type { ModifyUser, User } from "@interfaces/user";

describe("USERS", () => {
    let server: Express;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockUser1Id = new Types.ObjectId(),
        mockUser2Id = new Types.ObjectId(),
        mockAdminId = new Types.ObjectId(),
        mockUser1: Partial<User> = {
            _id: mockUser1Id,
            email: "testuser1@test.com",
            password: pw,
            createdAt: new Date("2020-10-10"),
        },
        mockUser2: Partial<User> = {
            _id: mockUser2Id,
            email: "testuser2@test.com",
            password: pw,
            createdAt: new Date("2021-10-10"),
        },
        mockAdmin: Partial<User> = { _id: mockAdminId, email: "testadmin@test.com", password: pw, role: "admin" };

    beforeAll(async () => {
        server = new App([new AuthenticationController(), new UserController()]).getServer();
        await userModel.create([
            { ...mockUser1, password: hpw },
            { ...mockUser2, password: hpw },
            { ...mockAdmin, password: hpw },
        ]);
    });

    describe("USERS, not logged in", () => {
        it("GET /user/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res = await request(server).get(`/user/${mockUser1Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as User);
        });
        it("any PATH, should return statuscode 401", async () => {
            expect.assertions(4);
            const randomId = new Types.ObjectId().toString();
            const dummyUser: Partial<User> = { email: "justsomeemail@domain.com" };
            const meRes = await request(server).get("/user/me");
            const allRes = await request(server).get("/user");
            const patchRes = await request(server).patch(`/user/${randomId}`).send(dummyUser);
            const deleteRes = await request(server).delete(`/user/${randomId}`);
            expect(meRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(allRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(patchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("USERS, logged in as user", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send({ email: mockUser1.email, password: pw });
        });

        it("GET /user/me, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/user/me");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as User);
        });
        it("GET /user, should return statuscode 403", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/user");
            expect(res.statusCode).toBe(StatusCode.Forbidden);
            expect(res.body).toBe("Forbidden");
        });
        it("PATCH /user/:id, should return statuscode 200, if it's the logged in user's", async () => {
            expect.assertions(2);
            const newData: ModifyUser = { username: "justatestuser" };
            const res: Response = await agent.patch(`/user/${mockUser1Id.toString()}`).send(newData);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toHaveProperty("username", newData.username);
        });
        it("PATCH /user/:id, should return statuscode 403, if it's not the logged in user's", async () => {
            expect.assertions(2);
            const newData: ModifyUser = { username: "anything" };
            const res: Response = await agent.patch(`/user/${mockUser2Id.toString()}`).send(newData);
            expect(res.statusCode).toBe(StatusCode.Forbidden);
            expect(res.body).toBe("You cannot modify other user's data.");
        });
        it("DELETE /user/:id, should return statuscode 400 if it's not logged in user", async () => {
            expect.assertions(2);
            const res: Response = await agent.delete(`/user/${mockUser2Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.BadRequest);
            expect(res.body).toBe("You can not delete other user");
        });
        it("DELETE /user/:id, should return statuscode 204", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/user/${mockUser1Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });

    describe("USERS, logged in as admin", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: pw });
        });

        it("GET /user/me, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/user/me");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as User);
        });
        it("GET /user, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/user");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<User>);
        });
        it("GET /user?sort=asc&sortBy=createdAt, should return statuscode 200", async () => {
            expect.assertions(3);
            const mockUser = await userModel.create({
                email: "testemail@email.com",
                password: hpw,
                createdAt: new Date("2010-10-10"),
            });
            const res: Response = await agent.get("/user?sort=asc&sortBy=createdAt");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<User>);
            expect(res.body[0].createdAt).toBe(mockUser.createdAt?.toISOString());
        });
        it("GET /user?keyword=testuser2@test.com, should return statuscode 200", async () => {
            expect.assertions(3);
            const res: Response = await agent.get(`/user?keyword=${mockUser2.email}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<User>);
            expect(res.body[0].email).toBe(mockUser2.email);
        });
        it("PATCH /user/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const newData: ModifyUser = { fullname: "John Doe" };
            const res: Response = await agent.patch(`/user/${mockUser2Id.toString()}`).send(newData);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toHaveProperty("fullname", newData.fullname);
        });
        it("DELETE /user/:id, should return statuscode 204", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/user/${mockUser2Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
        it("DELETE /user/:id, should return statuscode 404 if user not found", async () => {
            expect.assertions(2);
            const res: Response = await agent.delete(`/user/${mockUser2Id.toString()}`);
            expect(res.statusCode).toBe(404);
            expect(res.body).toBe(`This ${mockUser2Id.toString()} id is not valid.`);
        });
    });
});
