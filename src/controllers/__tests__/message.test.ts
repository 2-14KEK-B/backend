import { hash } from "bcrypt";
import request, { Response, SuperAgentTest } from "supertest";
import { mongoClient } from "../../../config/setupTest";
import App from "../../app";
import userModel from "@models/user";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import type { Express } from "express";
import type { CreateMessage, Message } from "@interfaces/message";
import type { User } from "@interfaces/user";
import MessageController from "@controllers/message";

describe("MESSAGES", () => {
    let server: Express;
    const testUsers: User[] = [];
    const mockUser = { email: "test1@test.com", password: "test1234" };
    const mockAdmin = { email: "test2@test.com", password: "test1234" };

    beforeAll(async () => {
        server = new App([new AuthenticationController(), new MessageController()], mongoClient).getServer();
        const password = await hash(mockUser.password, 10);
        testUsers.push(
            await userModel.create({ email: mockUser.email, password: password }),
            await userModel.create({ email: mockAdmin.email, password: password, role: "admin" }),
        );
    });

    describe("MESSAGES, not logged in", () => {
        it("any PATH, should return statuscode 401", async () => {
            expect.assertions(4);
            const allRes = await request(server).get(`/message/all`);
            const idRes = await request(server).get(`/message/:id`);
            const postRes = await request(server).post("/message");
            const deleteRes = await request(server).delete(`/message/id`);
            expect(allRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(idRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(postRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("MESSAGES with logged in as user", () => {
        let agent: SuperAgentTest;
        let mockMessageId: string;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send(mockUser);
            if (testUsers[0]?._id && testUsers[1]?._id) {
                const res = await agent.post(`/message/${testUsers[1]?._id?.toString()}`).send({ content: "test" });
                mockMessageId = res.body;
            }
        });

        it("GET /message/all, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/message/all");
            expect(res.statusCode).toBe(StatusCode.Forbidden);
            expect(res.body).toBe("Forbidden");
        });
        it("GET /message/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get(`/message/${mockMessageId}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Message);
        });
        it("POST /message/:toId, should return statuscode 200", async () => {
            expect.assertions(1);
            const newMessage: CreateMessage = { content: "newMessage" };
            const res: Response = await agent.post(`/message/${testUsers[1]?._id?.toString()}`).send(newMessage);
            expect(res.statusCode).toBe(StatusCode.OK);
        });
        it("DELETE /message/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.delete(`/message/${mockMessageId}`);
            expect(res.statusCode).toBe(StatusCode.Forbidden);
            expect(res.body).toBe("Forbidden");
        });
    });

    describe("MESSAGES with logged in as admin", () => {
        let agent: SuperAgentTest;
        let mockMessageId: Message;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send(mockAdmin);
            if (testUsers[0]?._id && testUsers[1]?._id) {
                const res = await agent.post(`/message/${testUsers[0]?._id?.toString()}`).send({ content: "test" });
                mockMessageId = res.body;
            }
        });

        it("GET /message/all, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/message/all");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Message>);
        });
        it("GET /message/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get(`/message/${mockMessageId}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Message);
        });
        it("POST /message, should return statuscode 200", async () => {
            expect.assertions(1);
            const newMessage: CreateMessage = { content: "newMessage" };
            const res: Response = await agent.post(`/message/${testUsers[0]?._id?.toString()}`).send(newMessage);
            expect(res.statusCode).toBe(StatusCode.OK);
        });
        it("DELETE /message/:id, should return statuscode 200", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/message/${mockMessageId}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });
});
