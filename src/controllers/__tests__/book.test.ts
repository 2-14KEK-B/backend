import { hash } from "bcrypt";
import request, { Response, SuperAgentTest } from "supertest";
import { mongoClient } from "../../../config/setupTest";
import App from "../../app";
import bookModel from "@models/book";
import userModel from "@models/user";
import BookController from "@controllers/book";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import type { Express } from "express";
import type { Book, CreateBook } from "@interfaces/book";

describe("BOOKS", () => {
    let server: Express;
    const mockBook = { author: "testAuthor", title: "testTitle", for_borrow: true };

    beforeAll(async () => {
        server = new App([new AuthenticationController(), new BookController()], mongoClient).getServer();
    });

    describe("BOOKS without logged in", () => {
        beforeAll(async () => {
            await bookModel.create(mockBook);
        });
        it("GET /book/all, should return statuscode 200", async () => {
            expect.assertions(2);
            const res = await request(server).get("/book/all");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Book>);
        });
        it("GET /book, should return statuscode 401", async () => {
            expect.assertions(1);
            const res = await request(server).get("/book");
            expect(res.statusCode).toBe(StatusCode.Unauthorized);
        });
        it("GET /book/:id, should return statuscode 401", async () => {
            expect.assertions(1);
            const res = await request(server).get("/book/fguikawgfauwkfghkua");
            expect(res.statusCode).toBe(StatusCode.Unauthorized);
        });
        it("POST /book, should return statuscode 401", async () => {
            expect.assertions(1);
            const res = await request(server).post("/book").send({ somedata: "somedata" });
            expect(res.statusCode).toBe(StatusCode.Unauthorized);
        });
        it("DELETE /book/:id, should return statuscode 401", async () => {
            expect.assertions(1);
            const res = await request(server).delete("/book/fguikawgfauwkfghkua");
            expect(res.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("BOOKS with logged in as user", () => {
        let books: Array<Book>;
        let agent: SuperAgentTest;
        const mockUser = { email: "test@test.com", password: "test1234" };
        const newBook: CreateBook = { author: "testfornewbook", title: "testfornewbook", for_borrow: true };

        beforeAll(async () => {
            agent = request.agent(server);
            const password = await hash(mockUser.password, 10);
            await userModel.create({ email: mockUser.email, password: password });
            await agent.post("/auth/login").send(mockUser);
            await agent.post("/book").send(mockBook);
        });

        it("GET /book/all, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/book/all");
            books = res.body;
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Book>);
        });
        it("GET /book, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/book");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Book>);
        });
        it("GET /book/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get(`/book/${books[0]?._id}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Book);
        });
        it("POST /book, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.post("/book").send(newBook);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Book);
        });
        it("DELETE /book/:id, should return statuscode 200", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/book/${books[0]?._id}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });
});
