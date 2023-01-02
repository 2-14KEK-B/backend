import request, { Response, SuperAgentTest } from "supertest";
import App from "../../app";
import userModel from "@models/user";
import messageModel from "@models/message";
import MessageController from "@controllers/message";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import { PaginateResult, Types } from "mongoose";
import type { Application } from "express";
import type { Message, MessageContent } from "@interfaces/message";
import type { User } from "@interfaces/user";

describe("MESSAGES", () => {
    let server: Application;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockUser1Id = new Types.ObjectId(),
        mockUser2Id = new Types.ObjectId(),
        mockUser3Id = new Types.ObjectId(),
        mockUser4Id = new Types.ObjectId(),
        mockAdminId = new Types.ObjectId(),
        mockMessageId = new Types.ObjectId(),
        mockUser1: Partial<User> = {
            _id: mockUser1Id,
            email: "testuser1@test.com",
            password: pw,
            messages: [mockMessageId],
        },
        mockUser2: Partial<User> = {
            _id: mockUser2Id,
            email: "testuser2@test.com",
            password: pw,
            messages: [mockMessageId],
        },
        mockUser3: Partial<User> = { _id: mockUser3Id, email: "testuser3@test.com", password: pw },
        mockUser4: Partial<User> = { _id: mockUser4Id, email: "testuser4@test.com", password: pw },
        mockAdmin: Partial<User> = { _id: mockAdminId, email: "testadmin@test.com", password: pw, role: "admin" },
        mockMessage: Partial<Message> = {
            _id: mockMessageId,
            users: [mockUser1Id, mockUser2Id],
            message_contents: [
                {
                    sender_id: mockUser1Id,
                    content: "just_a_test",
                    createdAt: new Date(),
                },
                {
                    sender_id: mockUser1Id,
                    content: "just_another_test",
                    createdAt: new Date(),
                },
            ],
        };

    beforeAll(async () => {
        server = new App([new AuthenticationController(), new MessageController()]).getServer();
        await userModel.create([
            { ...mockUser1, password: hpw },
            { ...mockUser2, password: hpw },
            { ...mockUser3, password: hpw },
            { ...mockUser4, password: hpw },
            { ...mockAdmin, password: hpw },
        ]);
        await messageModel.create(mockMessage);
    });

    describe("MESSAGES, not logged in", () => {
        it("any PATH, should return statuscode 401", async () => {
            expect.assertions(6);
            const randomId = new Types.ObjectId().toString();
            const loggedInRes = await request(server).get("/user/me/message");
            const idRes = await request(server).get(`/user/${randomId}/message`);
            const postRes = await request(server).post(`/user/${randomId}/message`);
            const adminMessagesRes = await request(server).get("/admin/message");
            const adminDeleteRes = await request(server).delete(`/admin/message/${randomId}`);
            const adminDeleteContentRes = await request(server).delete(
                `/admin/message/${randomId}/content/${randomId}`,
            );
            expect(loggedInRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(idRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(postRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminMessagesRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminDeleteRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminDeleteContentRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("MESSAGES, logged in as user", () => {
        let agentForUser1: SuperAgentTest;
        let agentForUser2: SuperAgentTest;
        let agentForUser3: SuperAgentTest;

        beforeAll(async () => {
            agentForUser1 = request.agent(server);
            agentForUser2 = request.agent(server);
            agentForUser3 = request.agent(server);
            await agentForUser1.post("/auth/login").send({ email: mockUser1.email, password: pw });
            await agentForUser2.post("/auth/login").send({ email: mockUser2.email, password: pw });
            await agentForUser3.post("/auth/login").send({ email: mockUser3.email, password: pw });
        });
        it("GET /user/me/message, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get("/user/me/message");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<MessageContent>);
        });
        it("GET /user/:id/message?skip=0, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser2.get(`/user/${mockUser1Id.toString()}/message?skip=0`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(
                Object as unknown as { _id: string; message_contents: MessageContent[]; totalCount: number },
            );
        });
        it("POST /user/:id/message, should return statuscode 200", async () => {
            expect.assertions(1);
            const newMessage: Partial<MessageContent> = { content: "newMessage" };
            const res: Response = await agentForUser3.post(`/user/${mockUser4Id.toString()}/message`).send(newMessage);
            expect(res.statusCode).toBe(StatusCode.OK);
        });
        it("POST /user/:id/message, should return statuscode 200 if users already messaging", async () => {
            expect.assertions(1);
            const newMessage: Partial<MessageContent> = { content: "newMessage" };
            const res: Response = await agentForUser1.post(`/user/${mockUser2Id.toString()}/message`).send(newMessage);
            expect(res.statusCode).toBe(StatusCode.OK);
        });
    });

    describe("MESSAGES, logged in as admin", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: pw });
        });

        it("GET /admin/message, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/admin/message");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as PaginateResult<Message>);
        });
        it("DELETE /admin/message/:id, should return statuscode 200", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/admin/message/${mockMessageId.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
        it("DELETE /admin/message/:id/content/:id, should return statuscode 200", async () => {
            expect.assertions(1);
            const message = await messageModel
                .findOne({ "message_contents.0": { $exists: true } })
                .lean()
                .exec();
            const res: Response = await agent.delete(
                `/admin/message/${message?._id.toString()}/content/${message?.message_contents[0]?._id?.toString()}`,
            );
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });
});
