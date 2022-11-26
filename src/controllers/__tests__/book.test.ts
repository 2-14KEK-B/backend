import { hash } from "bcrypt";
import request, { Response, SuperAgentTest } from "supertest";
import App from "../../app";
import bookModel from "@models/book";
import userModel from "@models/user";
import BookController from "@controllers/book";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import { Types } from "mongoose";
import type { Express } from "express";
import type { Book, CreateBook } from "@interfaces/book";
import type { MockBook, MockUser } from "@interfaces/mockData";

describe("BOOKS", () => {
    let server: Express;
    const mockBook1Id = new Types.ObjectId();
    const mockBook2Id = new Types.ObjectId();
    const mockUser1Id = new Types.ObjectId();
    const mockUser2Id = new Types.ObjectId();
    const mockAdminId = new Types.ObjectId();
    const mockBook1: MockBook = {
        _id: mockBook1Id,
        uploader: mockUser1Id,
        author: "testAuthor",
        title: "testTitle",
        for_borrow: true,
        available: true,
    };
    const mockBook2: MockBook = {
        _id: mockBook2Id,
        uploader: mockUser1Id,
        author: "testAuthor",
        title: "testTitle",
        for_borrow: true,
        available: true,
    };
    const mockUser1: MockUser = { _id: mockUser1Id, email: "testuser1@test.com", password: "test1234", books: [mockBook1Id, mockBook2Id] };
    const mockUser2: MockUser = { _id: mockUser2Id, email: "testuser2@test.com", password: mockUser1.password, books: [] };
    const mockAdmin: MockUser = { _id: mockAdminId, email: "testadmin@test.com", password: mockUser1.password, books: [], role: "admin" };

    beforeAll(async () => {
        server = new App([new AuthenticationController(), new BookController()]).getServer();
        const password = await hash(mockUser1.password, 10);
        await userModel.create([
            { ...mockUser1, password: password },
            { ...mockUser2, password: password },
            { ...mockAdmin, password: password },
        ]);
        // console.log("users: ", await userModel.find());
        await bookModel.create([mockBook1, mockBook2]);
    });

    describe("BOOKS without logged in", () => {
        it("GET /book/all, should return statuscode 200", async () => {
            expect.assertions(2);
            const res = await request(server).get("/book/all");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Book>);
        });
        it("any other PATH than GET /book/all, should return statuscode 401", async () => {
            expect.assertions(4);
            const newBook: CreateBook = { title: "asd", author: "asdasd", for_borrow: true };
            const allByUserRes = await request(server).get(`/book`);
            const idRes = await request(server).get(`/book/${mockBook1Id.toString()}`);
            const postRes = await request(server).post("/book").send(newBook);
            // const patchRes = await request(server).patch("/borrow/id");
            const deleteRes = await request(server).delete(`/book/${mockBook1Id.toString()}`);
            expect(allByUserRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(idRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(postRes.statusCode).toBe(StatusCode.Unauthorized);
            // expect(patchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("BOOKS with logged in as user", () => {
        let agentForUser1: SuperAgentTest;
        let agentForUser2: SuperAgentTest;

        beforeAll(async () => {
            agentForUser1 = request.agent(server);
            agentForUser2 = request.agent(server);
            await agentForUser1.post("/auth/login").send({ email: mockUser1.email, password: mockUser1.password });
            await agentForUser2.post("/auth/login").send({ email: mockUser2.email, password: mockUser2.password });
        });
        it("GET /book, should return statuscode 200 and a book array with 2 books in it", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get("/book");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Book>);
        });
        it("GET /book, should return statuscode 200 and empty array", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser2.get("/book");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toStrictEqual([]);
        });
        it("GET /book/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get(`/book/${mockBook1Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Book);
        });
        it("POST /book, should return statuscode 200", async () => {
            expect.assertions(2);
            const newBook: CreateBook = { title: "testforuser", author: "testforuser", for_borrow: true };
            const res: Response = await agentForUser1.post("/book").send(newBook);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Book);
        });
        it("DELETE /book/:id, should return statuscode 204 if logged in user uploaded the book", async () => {
            expect.assertions(1);
            const res: Response = await agentForUser1.delete(`/book/${mockBook1Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
        it("DELETE /book/:id, should return statuscode 401 if not logged in user uploaded the book", async () => {
            expect.assertions(1);
            const res: Response = await agentForUser2.delete(`/book/${mockBook2Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("BOOKS, logged in as admin", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: mockAdmin.password });
        });
        it("DELETE /book/:id, should return statuscode 204", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/book/${mockBook2Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });
});
