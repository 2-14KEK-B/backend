import request, { Response, SuperAgentTest } from "supertest";
import App from "../../app";
import userModel from "@models/user";
import messageModel from "@models/message";
import MessageController from "@controllers/message";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import { Types } from "mongoose";
import type { Express } from "express";
import type { Message, MessageContent } from "@interfaces/message";
import type { User } from "@interfaces/user";

describe("MESSAGES", () => {
    let server: Express;
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
            expect.assertions(5);
            const allRes = await request(server).get("/message/all");
            const userRes = await request(server).get(`/message?userId=${mockUser1Id.toString()}`);
            const idRes = await request(server).get(`/message/${mockMessageId.toString()}`);
            const postRes = await request(server).post("/message");
            const deleteRes = await request(server).delete(`/message/${mockMessageId.toString()}`);
            expect(allRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(userRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(idRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(postRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("MESSAGES with logged in as user", () => {
        let agentForUser1: SuperAgentTest;
        let agentForUser3: SuperAgentTest;

        beforeAll(async () => {
            agentForUser1 = request.agent(server);
            agentForUser3 = request.agent(server);
            await agentForUser1.post("/auth/login").send({ email: mockUser1.email, password: pw });
            await agentForUser3.post("/auth/login").send({ email: mockUser3.email, password: pw });
        });

        it("GET /message/all, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get("/message/all");
            expect(res.statusCode).toBe(StatusCode.Forbidden);
            expect(res.body).toBe("Forbidden");
        });
        it("GET /message?userId=id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get(`/message?userId=${mockUser2Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<MessageContent>);
        });
        it("GET /message/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get(`/message/${mockMessageId.toString()}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<MessageContent>);
        });
        it("POST /message/:toId, should return statuscode 200", async () => {
            expect.assertions(1);
            const newMessage: Partial<MessageContent> = { content: "newMessage" };
            const res: Response = await agentForUser3.post(`/message/${mockUser4Id.toString()}`).send(newMessage);
            expect(res.statusCode).toBe(StatusCode.OK);
        });
        it("POST /message/:toId, should return statuscode 200 if users already messaging", async () => {
            expect.assertions(1);
            const newMessage: Partial<MessageContent> = { content: "newMessage" };
            const res: Response = await agentForUser1.post(`/message/${mockUser2Id.toString()}`).send(newMessage);
            expect(res.statusCode).toBe(StatusCode.OK);
        });
        it("DELETE /message/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.delete(`/message/${mockMessageId.toString()}`);
            expect(res.statusCode).toBe(StatusCode.Forbidden);
            expect(res.body).toBe("Forbidden");
        });
    });

    describe("MESSAGES with logged in as admin", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: pw });
        });

        it("GET /message/all, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/message/all");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Message>);
        });
        it("DELETE /message/:id, should return statuscode 200", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/message/${mockMessageId.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });
});
