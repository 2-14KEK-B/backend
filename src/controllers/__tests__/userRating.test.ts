import AuthenticationController from "@authentication/index";
import BorrowController from "@controllers/borrow";
import UserController from "@controllers/user";
import UserRatingController from "@controllers/userRating";
import { Types } from "mongoose";
import App from "../../app";
import type { Express } from "express";
import type { User } from "@interfaces/user";
import userModel from "@models/user";
import borrowModel from "@models/borrow";
import bookModel from "@models/book";
import type { Book } from "@interfaces/book";
import type { Borrow } from "@interfaces/borrow";
import request from "supertest";
import StatusCode from "@utils/statusCodes";

describe("USER RATING", () => {
    let server: Express;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockUser1Id = new Types.ObjectId(),
        mockUser2Id = new Types.ObjectId(),
        mockAdminId = new Types.ObjectId(),
        mockBookId = new Types.ObjectId(),
        mockBorrowId = new Types.ObjectId(),
        mockUser1: Partial<User> = {
            _id: mockUser1Id,
            email: "testuser1@test.com",
            password: pw,
            books: [mockBookId],
            borrows: [mockBorrowId],
        },
        mockUser2: Partial<User> = {
            _id: mockUser2Id,
            email: "testuser2@test.com",
            password: pw,
            borrows: [mockBorrowId],
        },
        mockAdmin: Partial<User> = { _id: mockAdminId, email: "testadmin@test.com", password: pw, role: "admin" },
        mockBook: Partial<Book> = {
            _id: mockBookId,
            uploader: mockUser1Id,
            title: "Test",
            author: "Test",
            for_borrow: true,
        },
        mockBorrow: Partial<Borrow> = {
            _id: mockBorrowId,
            books: [mockBookId],
            from_id: mockUser1Id,
            to_id: mockUser2Id,
            user_ratings: [],
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
});
