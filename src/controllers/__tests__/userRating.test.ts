import AuthenticationController from "@authentication/index";
import BorrowController from "@controllers/borrow";
import UserController from "@controllers/user";
import UserRatingController from "@controllers/userRating";
import App from "../../app";
import userModel from "@models/user";
import borrowModel from "@models/borrow";
import bookModel from "@models/book";
import request, { SuperAgentTest, Response } from "supertest";
import StatusCode from "@utils/statusCodes";
import userRatingModel from "@models/userRating";
import { Types } from "mongoose";
import type { Express } from "express";
import type { User } from "@interfaces/user";
import type { Book } from "@interfaces/book";
import type { Borrow } from "@interfaces/borrow";
import type { BookRating } from "@interfaces/bookRating";
import type { UserRating } from "@interfaces/userRating";

describe("USER RATING", () => {
    let server: Express;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockUser1Id = new Types.ObjectId(),
        mockUser2Id = new Types.ObjectId(),
        mockAdminId = new Types.ObjectId(),
        mockUser1RatingFromUser2Id = new Types.ObjectId(),
        mockUser2RatingFromUser1Id = new Types.ObjectId(),
        mockBookId = new Types.ObjectId(),
        mockBorrowId = new Types.ObjectId(),
        mockUser1: Partial<User> = {
            _id: mockUser1Id,
            email: "testuser1@test.com",
            password: pw,
            books: [mockBookId],
            borrows: [mockBorrowId],
            user_ratings: { from_me: [mockUser2RatingFromUser1Id], to_me: [mockUser1RatingFromUser2Id] },
        },
        mockUser2: Partial<User> = {
            _id: mockUser2Id,
            email: "testuser2@test.com",
            password: pw,
            borrows: [mockBorrowId],
            user_ratings: { from_me: [mockUser1RatingFromUser2Id], to_me: [mockUser2RatingFromUser1Id] },
        },
        mockAdmin: Partial<User> = { _id: mockAdminId, email: "testadmin@test.com", password: pw, role: "admin" },
        mockBook: Partial<Book> = {
            _id: mockBookId,
            uploader: mockUser1Id,
            title: "Test",
            author: "Test",
            for_borrow: true,
        },
        mockUser1RatingFromUser2: Partial<UserRating> = {
            _id: mockUser1RatingFromUser2Id,
            from_id: mockUser2Id,
            to_id: mockUser1Id,
            borrow_id: mockBorrowId,
            rate: false,
        },
        mockUser2RatingFromUser1: Partial<UserRating> = {
            _id: mockUser2RatingFromUser1Id,
            from_id: mockUser1Id,
            to_id: mockUser2Id,
            borrow_id: mockBorrowId,
            rate: true,
        },
        mockBorrow: Partial<Borrow> = {
            _id: mockBorrowId,
            books: [{ _id: mockBookId, _version: 1 }],
            from_id: mockUser1Id,
            to_id: mockUser2Id,
            verified: true,
            user_ratings: [mockUser1RatingFromUser2Id, mockUser2RatingFromUser1Id],
        };

    beforeAll(async () => {
        server = new App([
            new AuthenticationController(),
            new UserController(),
            new BorrowController(),
            new UserRatingController(),
        ]).getServer();
        await userModel.create([
            { ...mockUser1, password: hpw },
            { ...mockUser2, password: hpw },
            { ...mockAdmin, password: hpw },
        ]);
        await bookModel.create(mockBook);
        await borrowModel.create(mockBorrow);
        await userRatingModel.create([mockUser1RatingFromUser2, mockUser2RatingFromUser1]);
    });

    describe("USER RATINGS, not logged in", () => {
        it("any PATH, should return statuscode 401", async () => {
            expect.assertions(5);
            const randomId = new Types.ObjectId();
            const allRes = await request(server).get("/user/rate/all");
            const myRes = await request(server).get("/user/rate/myratings");
            const deleteRes = await request(server).delete(`/user/rate/${randomId}`);
            const getRes = await request(server).get("/user/rate");
            const postRes = await request(server).post("/user/rate/myratings").send();
            expect(getRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(myRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(allRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(postRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("USER RATINGS, logged in as user", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send({ email: mockUser1.email, password: pw });
        });
        it("GET /user/rate/all, should return statuscode 403", async () => {
            expect.assertions(1);
            const res: Response = await agent.get("/user/rate/all");
            expect(res.statusCode).toBe(StatusCode.Forbidden);
        });
        it("GET /user/rate/myratings, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/user/rate/myratings");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<BookRating>);
        });
        it("GET /user/rate?borrowId=id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get(`/user/rate?borrowId=${mockBorrowId}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<BookRating>);
        });
        it("GET /user/rate?userId=id, should return statuscode 200", async () => {
            expect.assertions(4);
            const myRatingsRes: Response = await agent.get(`/user/rate?userId=${mockUser1Id}`);
            const otherUserRatingsRes: Response = await agent.get(`/user/rate?userId=${mockUser2Id}`);
            expect(myRatingsRes.statusCode).toBe(StatusCode.OK);
            expect(otherUserRatingsRes.statusCode).toBe(StatusCode.OK);
            expect(myRatingsRes.body).toBeInstanceOf(
                Object as unknown as { from_me: UserRating[]; to_me: UserRating[] },
            );
            expect(otherUserRatingsRes.body).toBeInstanceOf(
                Object as unknown as { from_me: UserRating[]; to_me: UserRating[] },
            );
        });
        it("POST /user/rate?toId=id&borrowId=id, should return statuscode 200", async () => {
            expect.assertions(1);
            await userRatingModel.deleteOne({ _id: mockUser2RatingFromUser1Id.toString() });
            await borrowModel.updateOne({ _id: mockBorrowId.toString() }, {});
            await userModel.bulkWrite([
                {
                    updateOne: {
                        filter: { _id: mockUser1Id.toString() },
                        update: { $pull: { "user_ratings.from_me": mockUser2RatingFromUser1Id.toString() } },
                    },
                },
                {
                    updateOne: {
                        filter: { _id: mockUser2Id.toString() },
                        update: { $pull: { "user_ratings.to_me": mockUser2RatingFromUser1Id.toString() } },
                    },
                },
            ]);
            const res: Response = await agent
                .post(`/user/rate?toId=${mockUser2Id}&borrowId=${mockBorrowId}`)
                .send({ rate: true });
            expect(res.statusCode).toBe(StatusCode.OK);
        });
        it("DELETE /user/rate/:id, should return 204", async () => {
            expect.assertions(1);
            const agentForUser2: SuperAgentTest = request.agent(server);
            await agentForUser2.post("/auth/login").send({ email: mockUser2.email, password: pw });
            const res: Response = await agentForUser2.delete(`/user/rate/${mockUser1RatingFromUser2Id}`);
            expect(res.statusCode).toBe(204);
        });
        it("DELETE /user/rate/:id, should return 400 if user try delete other user's rate", async () => {
            expect.assertions(2);
            const userId = new Types.ObjectId(),
                rates = await userRatingModel.find().lean<UserRating[]>().exec(),
                user: Partial<User> = { _id: userId, email: "testfordelete@test.com", password: hpw },
                agentForDeleteTest: SuperAgentTest = request.agent(server);
            await userModel.create(user);
            await agentForDeleteTest.post("/auth/login").send({ email: user.email, password: pw });
            const res: Response = await agentForDeleteTest.delete(`/user/rate/${rates[0]?._id?.toString()}`);
            expect(res.statusCode).toBe(400);
            expect(res.body).toBe("You cannot delete other user's rating");
        });
    });

    describe("USER RATINGS, logged in as admin", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: pw });
        });
        it("any PATH, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/user/rate/all");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<BookRating>);
        });
    });
});
