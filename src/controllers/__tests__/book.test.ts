import request, { Response, SuperAgentTest } from "supertest";
import App from "../../app";
import { Types } from "mongoose";
import { BookController, AuthenticationController } from "@controllers";
import { bookModel, userModel } from "@models";
import { StatusCode } from "@utils";
import type { Application } from "express";
import type { PaginateResult } from "mongoose";
import type { User, Book, CreateBook } from "@interfaces";

describe("BOOKS", () => {
    let app: Application;
    const i18n = global.I18n;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockBook1Id = new Types.ObjectId(),
        mockBook2Id = new Types.ObjectId(),
        mockBookForLendId = new Types.ObjectId(),
        mockUserLendUploaderId = new Types.ObjectId(),
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
        mockBookForLend: Partial<Book> = {
            _id: mockBookForLendId,
            uploader: mockUserLendUploaderId,
            author: "Lend Author",
            title: "Title For Lend Book",
            for_borrow: false,
            available: true,
        },
        mockUserLendUploader: Partial<User> = {
            _id: mockUserLendUploaderId,
            email: "testuseruploaderforlend@test.com",
            email_is_verified: true,
            username: "testForBookUploaderLend",
            password: pw,
            books: [mockBook1Id, mockBook2Id],
        },
        mockUser1: Partial<User> = {
            _id: mockUser1Id,
            email: "testuser1@test.com",
            email_is_verified: true,
            username: "test1ForBook",
            password: pw,
            books: [mockBook1Id, mockBook2Id],
        },
        mockUser2: Partial<User> = {
            _id: mockUser2Id,
            email: "testuser2@test.com",
            email_is_verified: true,
            username: "test2ForBook",
            password: pw,
            books: [],
        },
        mockAdmin: Partial<User> = {
            _id: mockAdminId,
            email: "testadmin@test.com",
            email_is_verified: true,
            username: "testAdminForBook",
            password: pw,
            books: [],
            role: "admin",
        };

    beforeAll(async () => {
        app = new App([new AuthenticationController(), new BookController()]).getApp();
        await userModel.create([
            { ...mockUser1, password: hpw },
            { ...mockUser2, password: hpw },
            { ...mockUserLendUploader, password: hpw },
            { ...mockAdmin, password: hpw },
        ]);
        await bookModel.create([mockBook1, mockBook2, mockBookForLend]);
    });

    describe("BOOKS without logged in", () => {
        it("GET /book/borrow, should return statuscode 200", async () => {
            expect.assertions(3);
            const res = await request(app).get("/book/borrow");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as PaginateResult<Book>);
            expect(res.body.docs.length).toBe(2);
        });
        it("GET /book/borrow?keyword=Alpha, should return statuscode 200", async () => {
            expect.assertions(3);
            const res = await request(app).get("/book/borrow?keyword=Alpha");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as PaginateResult<Book>);
            expect(res.body.docs.length).toBe(1);
        });
        it("GET /book/lend, should return statuscode 200", async () => {
            expect.assertions(3);
            const res = await request(app).get("/book/lend");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as PaginateResult<Book>);
            expect(res.body.docs.length).toBe(1);
        });
        it("GET /book/lend?keyword=lend, should return statuscode 200", async () => {
            expect.assertions(3);
            const res = await request(app).get("/book/lend?keyword=lend");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as PaginateResult<Book>);
            expect(res.body.docs.length).toBe(1);
        });
        it("GET /book/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await request(app).get(`/book/${mockBook1Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Book);
        });
        it("any other PATH than GET /book, should return statuscode 401", async () => {
            expect.assertions(7);
            const anyRandomId = new Types.ObjectId().toString();
            const newBook: CreateBook = { title: "asd", author: "asdasd", for_borrow: true };
            const adminBooksRes = await request(app).get("/admin/book");
            const loggedInRes = await request(app).get("/user/me/book");
            const postRes = await request(app).post("/book").send(newBook);
            const patchRes = await request(app).patch(`/book/${anyRandomId}`).send({ title: "asd" });
            const adminPatchRes = await request(app).patch(`/admin/book/${anyRandomId}`).send({ title: "asd" });
            const deleteRes = await request(app).delete(`/book/${anyRandomId}`);
            const adminDeleteRes = await request(app).delete(`/admin/book/${anyRandomId}`);
            expect(adminBooksRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(loggedInRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(postRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(patchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminPatchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminDeleteRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("BOOKS, logged in as user", () => {
        let agentForUser1: SuperAgentTest;
        let agentForUser2: SuperAgentTest;

        beforeAll(async () => {
            agentForUser1 = request.agent(app);
            agentForUser2 = request.agent(app);
            await agentForUser1.post("/auth/login").send({ email: mockUser1.email, password: pw });
            await agentForUser2.post("/auth/login").send({ email: mockUser2.email, password: pw });
        });
        it("GET /user/me/book, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser2.get("/user/me/book");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Book>);
        });
        it("POST /book, should return statuscode 200", async () => {
            expect.assertions(2);
            const newBook: CreateBook = { title: "testforuser", author: "testforuser", for_borrow: true };
            const res: Response = await agentForUser1.post("/book").send(newBook);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Book);
        });
        it("POST /book, should return 406 if validation fails", async () => {
            expect.assertions(2);
            const newBook: CreateBook = {
                title: "",
                author: "tes",
                picture: "http://test.com",
                isbn: "0112112425",
                for_borrow: true,
            };
            const res: Response = await agentForUser1.post("/book").send(newBook);
            expect(res.statusCode).toBe(StatusCode.NotAcceptable);
            expect(res.body).toStrictEqual({
                validation: [
                    i18n?.__("validation.book.invalidIsbn"),
                    i18n?.__("validation.book.authorShort"),
                    i18n?.__("validation.book.titleRequired"),
                    i18n?.__("validation.picture.invalidUrl"),
                ],
            });
        });
        it("POST /book, should return 406 if isbn validation fails", async () => {
            expect.assertions(4);
            const invalidRes = {
                validation: [i18n?.__("validation.book.invalidIsbn")],
            };
            const newBook1: CreateBook = {
                title: "fuafhlna",
                author: "tesfkaw",
                isbn: "ISBN 979-1235-16-16-11",
                for_borrow: true,
            };
            const newBook2: CreateBook = {
                title: "fuafhlna",
                author: "tesfkaw",
                isbn: "ISBN 9-87654321-X",
                for_borrow: true,
            };
            const res1: Response = await agentForUser1.post("/book").send(newBook1);
            const res2: Response = await agentForUser1.post("/book").send(newBook2);
            expect(res1.statusCode).toBe(StatusCode.NotAcceptable);
            expect(res2.statusCode).toBe(StatusCode.NotAcceptable);
            expect(res1.body).toStrictEqual(invalidRes);
            expect(res2.body).toStrictEqual(invalidRes);
        });
        it("PATCH /book/:id, should return statuscode 204 if logged in user uploaded the book", async () => {
            expect.assertions(2);
            const update = { title: "asd" };
            const res: Response = await agentForUser1.patch(`/book/${mockBook1Id.toString()}`).send(update);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Book);
        });
        it("DELETE /book/:id, should return statuscode 204 if logged in user uploaded the book", async () => {
            expect.assertions(1);
            const res: Response = await agentForUser1.delete(`/book/${mockBook1Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });

    describe("BOOKS, logged in as admin", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(app);
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: pw });
        });
        it("GET /admin/book, should return statuscode 200 and array of Books", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/admin/book");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as PaginateResult<Book>);
        });
        it("GET /admin/book?available=true&keyword=Beta&uploader=mockUser1Id, should return statuscode 200 and array of Books", async () => {
            expect.assertions(3);
            const res: Response = await agent.get(
                `/admin/book?available=true&keyword=Beta&uploader=${mockUser1Id.toString()}`,
            );
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as PaginateResult<Book>);
            expect(res.body.docs.length).toBe(1);
        });
        it("PATCH /admin/book/:id, should return statuscode 204", async () => {
            expect.assertions(2);
            const res: Response = await agent.patch(`/admin/book/${mockBook2Id.toString()}`).send({ title: "asd" });
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body.title).toBe("asd");
        });
        it("DELETE /admin/book/:id, should return statuscode 204", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/admin/book/${mockBook2Id.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });
});
