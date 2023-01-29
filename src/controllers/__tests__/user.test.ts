import request, { Response, SuperAgentTest } from "supertest";
import App from "../../app";
import userModel from "@models/user";
import UserController from "@controllers/user";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
// import { dictionaries } from "@utils/dictionaries";
import { PaginateResult, Types } from "mongoose";
import type { Application } from "express";
import type { ModifyUser, User } from "@interfaces/user";

describe("USERS", () => {
    let app: Application;
    // const dictionary = dictionaries[global.language];
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockUser1Id = new Types.ObjectId(),
        mockUser2Id = new Types.ObjectId(),
        mockAdminId = new Types.ObjectId(),
        mockUser1: Partial<User> = {
            _id: mockUser1Id,
            email: "testuser1@test.com",
            email_is_verified: true,
            username: "test1ForUser",
            password: pw,
            createdAt: new Date("2020-10-10"),
        },
        mockUser2: Partial<User> = {
            _id: mockUser2Id,
            email: "testuser2@test.com",
            email_is_verified: true,
            username: "test2ForUser",
            password: pw,
            createdAt: new Date("2021-10-10"),
        },
        mockAdmin: Partial<User> = {
            _id: mockAdminId,
            email: "testadmin@test.com",
            email_is_verified: true,
            username: "testAdminForUser",
            password: pw,
            role: "admin",
        };

    beforeAll(async () => {
        app = new App([new AuthenticationController(), new UserController()]).getApp();
        await userModel.create([
            { ...mockUser1, password: hpw },
            { ...mockUser2, password: hpw },
            { ...mockAdmin, password: hpw },
        ]);
    });

    describe("USERS, not logged in", () => {
        it("GET /user/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res = await request(app).get(`/user/${mockUser1Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as User);
        });
        it("any PATH, should return statuscode 401", async () => {
            expect.assertions(6);
            const randomId = new Types.ObjectId().toString();
            const dummyUser: Partial<User> = { email: "justsomeemail@domain.com" };
            const meRes = await request(app).get("/user/me");
            const patchRes = await request(app).patch(`/user/me`).send(dummyUser);
            const deleteRes = await request(app).delete(`/user/me`);
            const adminUsersRes = await request(app).get("/admin/user");
            const adminPatchRes = await request(app).patch(`/admin/user/${randomId}`).send(dummyUser);
            const adminDeleteRes = await request(app).delete(`/admin/user/${randomId}`);
            expect(meRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(patchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminUsersRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminPatchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminDeleteRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("USERS, logged in as user", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(app);
            await agent.post("/auth/login").send({ email: mockUser1.email, password: pw });
        });
        it("GET /admin/user, should return statuscode 403", async () => {
            expect.assertions(1);
            const res: Response = await agent.get("/admin/user");
            expect(res.statusCode).toBe(StatusCode.Forbidden);
        });
        it("GET /user/me, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/user/me");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as User);
        });
        it("PATCH /user/me, should return statuscode 200", async () => {
            expect.assertions(2);
            const newData: ModifyUser = { username: "justatestuser" };
            const res: Response = await agent.patch(`/user/me`).send(newData);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body.username).toBe(newData.username);
        });
        // it("PATCH /user/me, should return statuscode 400 if picture is not valid url", async () => {
        //     expect.assertions(2);
        //     const newData: ModifyUser = { picture: "http://www.justatestforerror.com" };
        //     const res: Response = await agent.patch(`/user/me`).send(newData);
        //     expect(res.statusCode).toBe(StatusCode.BadRequest);
        //     expect(res.body).toBe(dictionary.error.invalidUrl);
        // });
        it("DELETE /user/me, should return statuscode 200 if it's not logged in user", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/user/me`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });

    describe("USERS, logged in as admin", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(app);
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: pw });
        });
        it("GET /admin/user, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/admin/user");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as PaginateResult<User>);
        });
        it("GET /admin/user?sort=asc&sortBy=createdAt, should return statuscode 200", async () => {
            expect.assertions(3);
            const mockUser = await userModel.create({
                email: "testemail@email.com",
                email_is_verified: true,
                username: "testForUser",
                password: hpw,
                createdAt: new Date("2010-10-10"),
            });
            const res: Response = await agent.get("/admin/user?sort=asc&sortBy=createdAt");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as PaginateResult<User>);
            expect(res.body.docs[0].createdAt).toBe(mockUser.createdAt?.toISOString());
        });
        it("GET /admin/user?keyword=testuser2@test.com, should return statuscode 200", async () => {
            expect.assertions(3);
            const res: Response = await agent.get(`/admin/user?keyword=${mockUser2.email}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as PaginateResult<User>);
            expect(res.body.docs[0].email).toBe(mockUser2.email);
        });
        it("PATCH /admin/user/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const newData: ModifyUser = { fullname: "John Doe" };
            const res: Response = await agent.patch(`/admin/user/${mockUser2Id.toString()}`).send(newData);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body.fullname).toBe(newData.fullname);
        });
        it("PATCH /admin/user/:id, should return statuscode 404 if user id not valid", async () => {
            expect.assertions(1);
            const newData: ModifyUser = { fullname: "John Doe" };
            const res: Response = await agent.patch(`/admin/user/${new Types.ObjectId()}`).send(newData);
            expect(res.statusCode).toBe(StatusCode.NotFound);
        });
        it("DELETE /admin/user/:id, should return statuscode 204", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/admin/user/${mockUser2Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
        it("DELETE /admin/user/:id, should return statuscode 404", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/admin/user/${new Types.ObjectId()}`);
            expect(res.statusCode).toBe(StatusCode.NotFound);
        });
    });
});
