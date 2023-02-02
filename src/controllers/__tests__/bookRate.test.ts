import request, { Response, SuperAgentTest } from "supertest";
import bookModel from "@models/book";
import userModel from "@models/user";
import BookController from "@controllers/book";
import AuthenticationController from "@authentication/index";
import App from "../../app";
import StatusCode from "@utils/statusCodes";
import { Types } from "mongoose";
import type { Application } from "express";
import type { BookRate } from "@interfaces/bookRate";
import type { Book } from "@interfaces/book";
import type { User } from "@interfaces/user";

describe("BOOK rate", () => {
    let app: Application;
    const i18n = global.I18n;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockBookId = new Types.ObjectId(),
        mockRateFromUserToMockBookId = new Types.ObjectId(),
        mockRateFromAdminToMockBookId = new Types.ObjectId(),
        mockRateFromAdminToMockBookFromUserId = new Types.ObjectId(),
        mockRateFromUserToMockBookFromAdminId = new Types.ObjectId(),
        mockUploaderId = new Types.ObjectId(),
        mockUserId = new Types.ObjectId(),
        mockAdminId = new Types.ObjectId(),
        mockBookFromUserId = new Types.ObjectId(),
        mockBookFromAdminId = new Types.ObjectId(),
        mockUploader: Partial<User> = {
            _id: mockUploaderId,
            email: "testuserforuploader@test.com",
            email_is_verified: true,
            username: "testUploaderForBookRate",
            password: pw,
            books: [mockBookId],
        },
        mockUser: Partial<User> = {
            _id: mockUserId,
            email: "testuser@test.com",
            email_is_verified: true,
            username: "testForBookRate",
            password: pw,
            rated_books: [mockBookId],
        },
        mockAdmin: Partial<User> = {
            _id: mockAdminId,
            email: "testadmin@test.com",
            email_is_verified: true,
            username: "testAdminForBookRate",
            password: pw,
            role: "admin",
            rated_books: [mockBookId],
        },
        mockBook: Partial<Book> = {
            _id: mockBookId,
            uploader: mockUploaderId,
            author: "testAuthor",
            title: "testTitle",
            for_borrow: true,
            rates: [
                {
                    _id: mockRateFromUserToMockBookId,
                    from: mockUserId,
                    rate: 5,
                    createdAt: new Date("2020-10-10"),
                },
                {
                    _id: mockRateFromAdminToMockBookId,
                    from: mockAdminId,
                    rate: 1,
                    createdAt: new Date("2021-10-10"),
                },
            ],
        },
        mockBookFromUser: Partial<Book> = {
            ...mockBook,
            _id: mockBookFromUserId,
            uploader: mockUserId,
            rates: [
                {
                    _id: mockRateFromAdminToMockBookFromUserId,
                    from: mockAdminId,
                    rate: 3,
                    createdAt: new Date(),
                },
            ],
        },
        mockBookFromAdmin: Partial<Book> = {
            ...mockBook,
            _id: mockBookFromAdminId,
            uploader: mockAdminId,
            rates: [
                {
                    _id: mockRateFromUserToMockBookFromAdminId,
                    from: mockUserId,
                    rate: 3,
                    createdAt: new Date(),
                },
            ],
        };

    beforeAll(async () => {
        app = new App([new AuthenticationController(), new BookController()]).getApp();
        await userModel.create([
            { ...mockUploader, password: hpw },
            { ...mockUser, password: hpw },
            { ...mockAdmin, password: hpw },
        ]);
        await bookModel.create([mockBook, mockBookFromUser, mockBookFromAdmin]);
    });

    describe("BOOK RATE, not logged in", () => {
        it("GET /book/:id/rate, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await request(app).get(`/book/${mockBookId.toString()}/rate`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array<BookRate>);
        });
        it("any other PATH, should return statuscode 401", async () => {
            expect.assertions(5);
            const anyRandomId = new Types.ObjectId().toString();
            const update = { rate: 1 };
            const postRes = await request(app).post(`/book/${anyRandomId}/rate`);
            const patchRes = await request(app).patch(`/book/${anyRandomId}/rate/${anyRandomId}`).send(update);
            const deleteRes = await request(app).delete(`/book/${anyRandomId}/rate/${anyRandomId}`);
            const adminPatchRes = await request(app)
                .patch(`/admin/book/${anyRandomId}/rate/${anyRandomId}`)
                .send(update);
            const adminDeleteRes = await request(app).delete(`/admin/book/${anyRandomId}/rate/${anyRandomId}`);
            expect(postRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(patchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminPatchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminDeleteRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });
    describe("BOOK RATE, logged in as user", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(app);
            await agent.post("/auth/login").send({ email: mockUser.email, password: pw });
        });
        it("PATCH /book/:id/rate/:id, should return 200 if the logged in user created rate for the book", async () => {
            expect.assertions(3);
            const res: Response = await agent
                .patch(
                    `/book/${mockBookFromAdminId.toString()}/rate/${mockRateFromUserToMockBookFromAdminId.toString()}`,
                )
                .send({ rate: 4, comment: "Not bad" });
            const updatedRate = (res.body.rates as BookRate[]).find(
                r => r._id == mockRateFromUserToMockBookFromAdminId.toString(),
            );
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(updatedRate?.rate).toBe(4);
            expect(updatedRate?.comment).toBe("Not bad");
        });
        it("PATCH /book/:id/rate/:id, should return statuscode 400 if not the logged in user created rate for the book", async () => {
            expect.assertions(2);
            const res: Response = await agent
                .patch(
                    `/book/${mockBookFromUserId.toString()}/rate/${mockRateFromAdminToMockBookFromUserId.toString()}`,
                )
                .send({ rate: 2 });
            expect(res.statusCode).toBe(StatusCode.BadRequest);
            expect(res.body).toBe(i18n?.__("error.bookRate.notHaveBookRate"));
        });
        it("POST /book/:id/rate, should return statuscode 200 if successfully rated", async () => {
            expect.assertions(2);
            const res: Response = await agent.post(`/book/${mockBookFromUserId.toString()}/rate`).send({ rate: 4 });
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Book);
        });
        it("POST /book/:id/rate, should return statuscode 400 if rated already", async () => {
            expect.assertions(2);
            const res: Response = await agent.post(`/book/${mockBookFromAdminId.toString()}/rate`).send({ rate: 2 });
            expect(res.statusCode).toBe(StatusCode.BadRequest);
            expect(res.body).toBe(i18n?.__("error.bookRate.alreadyRatedBook"));
        });

        it("DELETE /book/:id/rate, should return statuscode 204 if logged in user created rate for the book", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(
                `/book/${mockBookFromAdminId.toString()}/rate/${mockRateFromUserToMockBookFromAdminId.toString()}`,
            );
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
        it("DELETE /book/:id/rate, should return statuscode 400 if logged in user not created rateing for the book", async () => {
            expect.assertions(2);
            const res: Response = await agent.delete(
                `/book/${mockBookFromAdminId.toString()}/rate/${mockRateFromUserToMockBookFromAdminId.toString()}`,
            );
            expect(res.statusCode).toBe(StatusCode.BadRequest);
            expect(res.body).toBe(i18n?.__("error.bookRate.notHaveBookRate"));
        });
    });
    describe("BOOK RATE, logged in as admin", () => {
        let agent: SuperAgentTest;
        const mockRateId = new Types.ObjectId();

        beforeAll(async () => {
            agent = request.agent(app);
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: pw });
            await bookModel.findByIdAndUpdate(mockBookFromAdminId.toString(), {
                $push: { rates: { _id: mockRateId, rate: 2, from: mockUserId.toString() } },
            });
        });

        it("PATCH /admin/book/:id/rate/:id, should be return 200", async () => {
            expect.assertions(3);
            const res: Response = await agent
                .patch(`/admin/book/${mockBookFromAdminId.toString()}/rate/${mockRateId.toString()}`)
                .send({ rate: 1 });
            const updatedRate = (res.body.rates as BookRate[]).find(r => r._id == mockRateId.toString());
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Book);
            expect(updatedRate?.rate).toBe(1);
        });
        it("PATCH /admin/book/:id/rate/:id, should be return 400 if rate id not valid", async () => {
            expect.assertions(2);
            const res: Response = await agent
                .patch(
                    `/admin/book/${mockBookFromAdminId.toString()}/rate/${mockRateFromUserToMockBookFromAdminId.toString()}`,
                )
                .send({ rate: 1 });
            expect(res.statusCode).toBe(StatusCode.BadRequest);
            expect(res.body).toBe(i18n?.__("error.bookRate.notContainBookRate"));
        });
        it("DELETE /admin/book/rate/:bookId/:rateId, should be return 400 if rate id not valid", async () => {
            expect.assertions(2);
            const res: Response = await agent.delete(
                `/admin/book/${mockBookFromAdminId.toString()}/rate/${mockRateFromAdminToMockBookFromUserId.toString()}`,
            );
            expect(res.statusCode).toBe(StatusCode.BadRequest);
            expect(res.body).toBe(i18n?.__("error.bookRate.notContainBookRate"));
        });
        it("DELETE /admin/book/rate/:bookId/:rateId, should be return 204", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(
                `/admin/book/${mockBookId.toString()}/rate/${mockRateFromUserToMockBookId.toString()}`,
            );
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });
});
