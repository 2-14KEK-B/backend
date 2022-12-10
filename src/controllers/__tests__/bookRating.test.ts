import request, { Response, SuperAgentTest } from "supertest";
import bookModel from "@models/book";
import userModel from "@models/user";
import BookController from "@controllers/book";
import AuthenticationController from "@authentication/index";
import App from "../../app";
import StatusCode from "@utils/statusCodes";
import { Types } from "mongoose";
import type { Express } from "express";
import type { BookRating } from "@interfaces/bookRating";
import type { Book } from "@interfaces/book";
import type { User } from "@interfaces/user";

describe("BOOK RATING", () => {
    let server: Express;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockBookId = new Types.ObjectId(),
        mockRateFromUserToMockBookId = new Types.ObjectId(),
        mockRateFromAdminToMockBookId = new Types.ObjectId(),
        mockRateFromAdminToMockBookFromUserId = new Types.ObjectId(),
        mockRateFromUserToMockBookFromAdminId = new Types.ObjectId(),
        mockUserId = new Types.ObjectId(),
        mockAdminId = new Types.ObjectId(),
        mockBookFromUserId = new Types.ObjectId(),
        mockBookFromAdminId = new Types.ObjectId(),
        mockUser: Partial<User> = {
            _id: mockUserId,
            email: "testuser@test.com",
            password: pw,
            rated_books: [mockBookId],
        },
        mockAdmin: Partial<User> = {
            _id: mockAdminId,
            email: "testadmin@test.com",
            password: pw,
            role: "admin",
            rated_books: [mockBookId],
        },
        mockBook: Partial<Book> = {
            _id: mockBookId,
            author: "testAuthor",
            title: "testTitle",
            for_borrow: true,
            ratings: [
                {
                    _id: mockRateFromUserToMockBookId,
                    from_id: mockUserId,
                    rate: 5,
                    createdAt: new Date("2020-10-10"),
                },
                {
                    _id: mockRateFromAdminToMockBookId,
                    from_id: mockAdminId,
                    rate: 1,
                    createdAt: new Date("2021-10-10"),
                },
            ],
        },
        mockBookFromUser: Partial<Book> = {
            ...mockBook,
            _id: mockBookFromUserId,
            uploader: mockUserId,
            ratings: [
                {
                    _id: mockRateFromAdminToMockBookFromUserId,
                    from_id: mockAdminId,
                    rate: 3,
                    createdAt: new Date(),
                },
            ],
        },
        mockBookFromAdmin: Partial<Book> = {
            ...mockBook,
            _id: mockBookFromAdminId,
            uploader: mockAdminId,
            ratings: [
                {
                    _id: mockRateFromUserToMockBookFromAdminId,
                    from_id: mockUserId,
                    rate: 3,
                    createdAt: new Date(),
                },
            ],
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
        it("GET /book/rate/:id?, should return statuscode 200 where rate: 1(2022) is the first rate: 5(2021) the second", async () => {
            expect.assertions(3);
            const res: Response = await request(server).get(`/book/rate/${mockBookId.toString()}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array<BookRating>);
            expect(res.body[1].rate).toBe(1);
        });

        it("GET /book/rate/:id, should return statuscode 200 where rate: 5(2021) is the first rate: 1(2022) the second", async () => {
            expect.assertions(3);
            const res: Response = await request(server).get(`/book/rate/${mockBookId.toString()}?sort=asc`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array<BookRating>);
            expect(res.body[1].rate).toBe(5);
        });

        it("GET /book/rate/:id?limit=1, should return statuscode 200 and array of ratings with one document", async () => {
            expect.assertions(3);
            const res: Response = await request(server).get(`/book/rate/${mockBookId.toString()}?limit=1`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array<BookRating>);
            expect(res.body.length).toBe(1);
        });

        it("any other PATH, should return statuscode 401", async () => {
            expect.assertions(2);
            const anyRandomId = new Types.ObjectId();
            const postRes = await request(server).post(`/book/rate/${anyRandomId.toString()}`);
            const deleteRes = await request(server).delete(`/book/rate/${anyRandomId.toString()}`);
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

        it("PATCH, should return 400", async () => {
            expect.assertions(2);
            const res: Response = await agent
                .patch(
                    `/book/rate/${mockBookFromUserId.toString()}/${mockRateFromAdminToMockBookFromUserId.toString()}`,
                )
                .send({ rate: 5 });
            expect(res.statusCode).toBe(StatusCode.BadRequest);
            expect(res.body).toBe("You don't have rate for this book");
        });
        it("PATCH, should return 200", async () => {
            expect.assertions(3);
            const res: Response = await agent
                .patch(
                    `/book/rate/${mockBookFromAdminId.toString()}/${mockRateFromUserToMockBookFromAdminId.toString()}`,
                )
                .send({ rate: 4, comment: "Not bad" });
            const updatedRate = (res.body.ratings as BookRating[]).find(
                r => r._id == mockRateFromUserToMockBookFromAdminId.toString(),
            );
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(updatedRate?.rate).toBe(4);
            expect(updatedRate?.comment).toBe("Not bad");
        });
        it("POST /book/rate/:id, should return statuscode 400 if rated already", async () => {
            expect.assertions(1);
            const res: Response = await agent.post(`/book/rate/${mockBookFromAdminId.toString()}`).send({ rate: 2 });
            expect(res.statusCode).toBe(StatusCode.BadRequest);
        });
        it("POST /book/rate/:id, should return statuscode 200 if successfully rated", async () => {
            expect.assertions(1);
            const res: Response = await agent.post(`/book/rate/${mockBookFromUserId.toString()}`).send({ rate: 4 });
            expect(res.statusCode).toBe(StatusCode.OK);
        });

        it("DELETE /book/rate/:id, should return statuscode 204 if logged in user created rate for the book", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/book/rate/${mockBookFromAdminId.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });

        it("DELETE /book/rate/:id, should return statuscode 400 if logged in user not created rateing for the book", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/book/rate/${mockBookFromAdminId.toString()}`);
            expect(res.statusCode).toBe(StatusCode.BadRequest);
        });
    });
    describe("BOOK RATING with logged in as admin", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: pw });
        });

        it("DELETE /book/rate/:id, should be return 400 if did not rated the book", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/book/rate/${mockBookFromAdminId.toString()}`);
            expect(res.statusCode).toBe(StatusCode.BadRequest);
        });

        it("DELETE /book/rate/:bookId/:rateId, should be return 204", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(
                `/book/rate/${mockBookId.toString()}/${mockRateFromUserToMockBookId.toString()}`,
            );
            expect(res.statusCode).toBe(204);
        });
    });
});
