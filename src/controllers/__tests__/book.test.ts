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
import type { User } from "@interfaces/user";

describe("BOOKS", () => {
    let server: Express;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockBook1Id = new Types.ObjectId(),
        mockBook2Id = new Types.ObjectId(),
        mockUser1Id = new Types.ObjectId(),
        mockUser2Id = new Types.ObjectId(),
        mockAdminId = new Types.ObjectId(),
        mockBook1: Partial<Book> = {
            _id: mockBook1Id,
            uploader: mockUser1Id,
            author: "Alpha Author",
            title: "Title For First Book",
            for_borrow: true,
            available: true,
        },
        mockBook2: Partial<Book> = {
            _id: mockBook2Id,
            uploader: mockUser1Id,
            author: "Beta Author",
            title: "Title For Second Book",
            for_borrow: true,
            available: true,
        },
        mockUser1: Partial<User> = {
            _id: mockUser1Id,
            email: "testuser1@test.com",
            password: pw,
            books: [mockBook1Id, mockBook2Id],
        },
        mockUser2: Partial<User> = { _id: mockUser2Id, email: "testuser2@test.com", password: pw, books: [] },
        mockAdmin: Partial<User> = { _id: mockAdminId, email: "testadmin@test.com", password: pw, books: [], role: "admin" };

    beforeAll(async () => {
        server = new App([new AuthenticationController(), new BookController()]).getServer();
        await userModel.create([
            { ...mockUser1, password: hpw },
            { ...mockUser2, password: hpw },
            { ...mockAdmin, password: hpw },
        ]);
        await bookModel.create([mockBook1, mockBook2]);
    });

    describe("BOOKS without logged in", () => {
        it("GET /book, should return statuscode 200", async () => {
            expect.assertions(5);
            const res = await request(server).get("/book");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Book>);
            expect(res.body.length).toBe(2);
            expect(res.body[0].title).toBe(mockBook1.title);
            expect(res.body[1].title).toBe(mockBook2.title);
        });
        it("GET /book?limit=1, should return statuscode 200 and book array with one book in it", async () => {
            expect.assertions(3);
            const res = await request(server).get("/book?limit=1");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Book>);
            expect(res.body.length).toBe(1);
        });
        it("GET /book?keyword=Second, should return statuscode 200 and book array with book where keyword in book title or author", async () => {
            expect.assertions(4);
            const res = await request(server).get("/book?keyword=Second");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Book>);
            expect(res.body.length).toBe(1);
            expect(res.body[0].title).toBe(mockBook2.title);
        });
        it("GET /book?sort=desc&sortBy=author, should return statuscode 200 and book array with sorted books by author field", async () => {
            expect.assertions(5);
            const res = await request(server).get("/book?sort=desc&sortBy=author");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Book>);
            expect(res.body.length).toBe(2);
            expect(res.body[0].title).toBe(mockBook2.title);
            expect(res.body[1].title).toBe(mockBook1.title);
        });
        it("any other PATH than GET /book, should return statuscode 401", async () => {
            expect.assertions(5);
            const newBook: CreateBook = { title: "asd", author: "asdasd", for_borrow: true };
            const allRes = await request(server).get("/book/all");
            const allByUserRes = await request(server).get(`/book/me`);
            const idRes = await request(server).get(`/book/${mockBook1Id.toString()}`);
            const postRes = await request(server).post("/book").send(newBook);
            // const patchRes = await request(server).patch("/borrow/id");
            const deleteRes = await request(server).delete(`/book/${mockBook1Id.toString()}`);
            expect(allRes.statusCode).toBe(StatusCode.Unauthorized);
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
            await agentForUser1.post("/auth/login").send({ email: mockUser1.email, password: pw });
            await agentForUser2.post("/auth/login").send({ email: mockUser2.email, password: pw });
        });
        it("GET /book/all, should return statuscode 403", async () => {
            expect.assertions(1);
            const res: Response = await agentForUser2.get("/book/all");
            expect(res.statusCode).toBe(StatusCode.Forbidden);
        });
        it("GET /book, should return statuscode 200 and a book array with 2 books in it", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get("/book/me");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Book>);
        });
        it("GET /book, should return statuscode 200 and empty array", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser2.get("/book/me");
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
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: pw });
        });
        it("GET /book/all, should return statuscode 200 and array of Books", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/book/all");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Book>);
        });
        it("DELETE /book/:id, should return statuscode 204", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/book/${mockBook2Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });
});
