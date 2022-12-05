import request, { Response, SuperAgentTest } from "supertest";
import bookModel from "@models/book";
import userModel from "@models/user";
import BookController from "@controllers/book";
import AuthenticationController from "@authentication/index";
import App from "../../app";
import StatusCode from "@utils/statusCodes";
import { Types } from "mongoose";
import type { Express } from "express";
import type { MockBook, MockUser } from "@interfaces/mockData";
import type { BookRating } from "@interfaces/bookRating";

describe("BOOK RATING", () => {
    let server: Express;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockBookId = new Types.ObjectId(),
        mockUserId = new Types.ObjectId(),
        mockAdminId = new Types.ObjectId(),
        bookFromUserId = new Types.ObjectId(),
        bookFromAdminId = new Types.ObjectId(),
        mockUser: MockUser = { _id: mockUserId, email: "testuser@test.com", password: pw, rated_books: [mockBookId] },
        mockAdmin: MockUser = {
            _id: mockAdminId,
            email: "testadmin@test.com",
            password: pw,
            role: "admin",
            rated_books: [mockBookId],
        },
        mockBook: MockBook = {
            _id: mockBookId,
            author: "testAuthor",
            title: "testTitle",
            for_borrow: true,
            ratings: [
                { _id: new Types.ObjectId("60a4fa38846526d389527da3"), from_id: mockUserId, rate: 5 }, //2021
                { _id: new Types.ObjectId("638e197810dc9e77d2842471"), from_id: mockAdminId, rate: 1 }, //2022
            ],
        },
        mockBookFromUser: MockBook = {
            ...mockBook,
            _id: bookFromUserId,
            uploader: mockUserId,
            ratings: [{ from_id: mockAdminId, rate: 3 }],
        },
        mockBookFromAdmin: MockBook = {
            ...mockBook,
            _id: bookFromAdminId,
            uploader: mockAdminId,
            ratings: [{ from_id: mockUserId, rate: 3 }],
        };

    beforeAll(async () => {
        server = new App([new AuthenticationController(), new BookController()]).getServer();
        await userModel.create([
            { ...mockUser, password: hpw },
            { ...mockAdmin, password: hpw },
        ]);
        await bookModel.create([mockBook, mockBookFromUser, mockBookFromAdmin]);
    });

    describe("BOOK RATING without logged in", () => {
        const anyRandomId = new Types.ObjectId();

        it("GET /book/rate/:id?, should return statuscode 200 where rate: 1(2022) is the first rate: 5(2021) the second", async () => {
            expect.assertions(3);
            const res: Response = await request(server).get(`/book/rate/${mockBook._id}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array<BookRating>);
            expect(res.body[1].rate).toBe(1);
        });

        it("GET /book/rate/:id, should return statuscode 200 where rate: 5(2021) is the first rate: 1(2022) the second", async () => {
            expect.assertions(3);
            const res: Response = await request(server).get(`/book/rate/${mockBook._id}?sort=asc`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array<BookRating>);
            expect(res.body[1].rate).toBe(5);
        });

        it("GET /book/rate/:id?limit=1, should return statuscode 200 and array of ratings with one document", async () => {
            expect.assertions(3);
            const res: Response = await request(server).get(`/book/rate/${mockBook._id}?limit=1`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array<BookRating>);
            expect(res.body.length).toBe(1);
        });

        it("any other PATH, should return statuscode 401", async () => {
            expect.assertions(2);
            const postRes = await request(server).post(`/book/rate/${anyRandomId}`);
            const deleteRes = await request(server).delete(`/book/rate/${anyRandomId}`);
            expect(postRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });
    describe("BOOK RATING with logged in as user", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send({ email: mockUser.email, password: pw });
        });

        it("POST /book/rate/:id, should return statuscode 400 if rated already", async () => {
            expect.assertions(1);
            const res: Response = await agent.post(`/book/rate/${bookFromAdminId}`).send({ rate: 2 });
            expect(res.statusCode).toBe(StatusCode.BadRequest);
        });
        it("POST /book/rate/:id, should return statuscode 200 if successfully rated", async () => {
            expect.assertions(1);
            const res: Response = await agent.post(`/book/rate/${bookFromUserId}`).send({ rate: 4 });
            expect(res.statusCode).toBe(StatusCode.OK);
        });

        it("DELETE /book/rate/:id, should return statuscode 403", async () => {
            expect.assertions(2);
            const resU: Response = await agent.delete(`/book/rate/${bookFromUserId}`);
            const resA: Response = await agent.delete(`/book/rate/${bookFromAdminId}`);
            expect(resU.statusCode).toBe(StatusCode.Forbidden);
            expect(resA.statusCode).toBe(StatusCode.Forbidden);
        });
    });
    describe("BOOK RATING with logged in as admin", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: pw });
        });

        it("DELETE /book/rate/:id, should be return 204 if has been rated the book", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/book/rate/${bookFromUserId}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
        it("DELETE /book/rate/:id, should be return 400 if did not rated the book", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/book/rate/${bookFromAdminId}`);
            expect(res.statusCode).toBe(StatusCode.BadRequest);
        });
    });
});
