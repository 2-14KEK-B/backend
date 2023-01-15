import AuthenticationController from "@authentication/index";
import BorrowController from "@controllers/borrow";
import UserController from "@controllers/user";
import UserRateController from "@controllers/userRate";
import App from "../../app";
import userModel from "@models/user";
import borrowModel from "@models/borrow";
import bookModel from "@models/book";
import request, { SuperAgentTest, Response } from "supertest";
import StatusCode from "@utils/statusCodes";
import userRateModel from "@models/userRate";
import { PaginateResult, Types } from "mongoose";
import type { Application } from "express";
import type { User } from "@interfaces/user";
import type { Book } from "@interfaces/book";
import type { Borrow } from "@interfaces/borrow";
import type { BookRate } from "@interfaces/bookRate";
import type { UserRate } from "@interfaces/userRate";

describe("USER rate", () => {
    let app: Application;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockUser1Id = new Types.ObjectId(),
        mockUser2Id = new Types.ObjectId(),
        mockAdminId = new Types.ObjectId(),
        mockUserRateFromUser2Id = new Types.ObjectId(),
        mockUserRateFromUser1Id = new Types.ObjectId(),
        mockBookId = new Types.ObjectId(),
        mockBorrowId = new Types.ObjectId(),
        mockUser1: Partial<User> = {
            _id: mockUser1Id,
            email: "testuser1@test.com",
            password: pw,
            books: [mockBookId],
            borrows: [mockBorrowId],
            user_rates: { from: [mockUserRateFromUser1Id], to: [mockUserRateFromUser2Id] },
        },
        mockUser2: Partial<User> = {
            _id: mockUser2Id,
            email: "testuser2@test.com",
            password: pw,
            borrows: [mockBorrowId],
            user_rates: { from: [mockUserRateFromUser2Id], to: [mockUserRateFromUser1Id] },
        },
        mockAdmin: Partial<User> = { _id: mockAdminId, email: "testadmin@test.com", password: pw, role: "admin" },
        mockBook: Partial<Book> = {
            _id: mockBookId,
            uploader: mockUser1Id,
            title: "Test",
            author: "Test",
            for_borrow: true,
        },
        mockUserRateFromUser2: Partial<UserRate> = {
            _id: mockUserRateFromUser2Id,
            from: mockUser2Id,
            to: mockUser1Id,
            borrow: mockBorrowId,
            rate: false,
        },
        mockUserRateFromUser1: Partial<UserRate> = {
            _id: mockUserRateFromUser1Id,
            from: mockUser1Id,
            to: mockUser2Id,
            borrow: mockBorrowId,
            rate: true,
        },
        mockBorrow: Partial<Borrow> = {
            _id: mockBorrowId,
            books: [mockBookId],
            from: mockUser1Id,
            to: mockUser2Id,
            verified: true,
            user_rates: [mockUserRateFromUser2Id, mockUserRateFromUser1Id],
        };

    beforeAll(async () => {
        app = new App([
            new AuthenticationController(),
            new UserController(),
            new BorrowController(),
            new UserRateController(),
        ]).getApp();
        await userModel.create([
            { ...mockUser1, password: hpw },
            { ...mockUser2, password: hpw },
            { ...mockAdmin, password: hpw },
        ]);
        await bookModel.create(mockBook);
        await borrowModel.create(mockBorrow);
        await userRateModel.create([mockUserRateFromUser2, mockUserRateFromUser1]);
    });

    describe("USER RATES, not logged in", () => {
        it("any PATH, should return statuscode 401", async () => {
            expect.assertions(9);
            const randomId = new Types.ObjectId().toString();
            const myRes = await request(app).get("/user/me/rate");
            const idRes = await request(app).get(`/user/${randomId}/rate`);
            const borrowIdRes = await request(app).get(`/borrow/${randomId}/rate`);
            const postRes = await request(app).post(`/user/${randomId}/rate`).send(mockUserRateFromUser2);
            const patchRes = await request(app).patch(`/user/${randomId}/rate/${randomId}`).send(mockUserRateFromUser2);
            const deleteRes = await request(app).delete(`/user/${randomId}/rate/${randomId}`);
            const adminUserRatesRes = await request(app).get("/admin/user/rate");
            const adminPatchRes = await request(app)
                .patch(`/admin/user/rate/${randomId}`)
                .send(mockUserRateFromUser2Id);
            const adminDeleteRes = await request(app).delete(`/admin/user/rate/${randomId}`);
            expect(myRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(idRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(borrowIdRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(postRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(patchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminUserRatesRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminPatchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminDeleteRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("USER RATES, logged in as user", () => {
        let agentForUser1: SuperAgentTest;
        let agentForUser2: SuperAgentTest;

        beforeAll(async () => {
            agentForUser1 = request.agent(app);
            agentForUser2 = request.agent(app);
            await agentForUser1.post("/auth/login").send({ email: mockUser1.email, password: pw });
            await agentForUser2.post("/auth/login").send({ email: mockUser2.email, password: pw });
        });
        it("GET /user/me/rate, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get("/user/me/rate");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<BookRate>);
        });
        it("GET /user/:id/rate, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get(`/user/${mockUser2Id.toString()}/rate`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<BookRate>);
        });
        it("GET /borrow/:id/rate, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get(`/borrow/${mockBorrowId.toString()}/rate`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<BookRate>);
        });
        it("POST /user/:id/rate, should return statuscode 400 if borrow is not verified", async () => {
            expect.assertions(2);
            await borrowModel.updateOne({ _id: mockBorrowId.toString() }, { verified: false });
            const res: Response = await agentForUser1
                .post(`/user/${mockUser2Id.toString()}/rate`)
                .send({ rate: true, borrow: mockBorrowId.toString() });
            expect(res.statusCode).toBe(StatusCode.BadRequest);
            expect(res.body).toBe("You can not rate user if borrow is not verified");
        });
        it("POST /user/:id/rate, should return statuscode 200", async () => {
            expect.assertions(1);
            await userRateModel.deleteOne({ _id: mockUserRateFromUser1Id.toString() });
            await borrowModel.updateOne(
                { _id: mockBorrowId.toString() },
                { verified: true, $pull: { user_rates: mockUserRateFromUser1Id.toString() } },
            );
            await userModel.bulkWrite([
                {
                    updateOne: {
                        filter: { _id: mockUser1Id.toString() },
                        update: { $pull: { "user_rates.from": mockUserRateFromUser1Id.toString() } },
                    },
                },
                {
                    updateOne: {
                        filter: { _id: mockUser2Id.toString() },
                        update: { $pull: { "user_rates.to": mockUserRateFromUser1Id.toString() } },
                    },
                },
            ]);
            const res: Response = await agentForUser1
                .post(`/user/${mockUser2Id.toString()}/rate`)
                .send({ rate: true, borrow: mockBorrowId.toString() });
            expect(res.statusCode).toBe(StatusCode.OK);
        });
        it("PATCH /user/:id/rate/:id, should return 200", async () => {
            expect.assertions(3);
            const res: Response = await agentForUser2
                .patch(`/user/${mockUser1Id.toString()}/rate/${mockUserRateFromUser2Id.toString()}`)
                .send({ rate: true });
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as UserRate);
            expect(res.body.rate).toBe(true);
        });
        it("PATCH /user/:id/rate/:id, should return 400 if logged in user do not have rate by id", async () => {
            expect.assertions(1);
            const randomId = new Types.ObjectId();
            await userRateModel.create({ _id: randomId, borrow: randomId, from: randomId, to: randomId, rate: false });
            const res: Response = await agentForUser2
                .patch(`/user/${mockUser1Id.toString()}/rate/${randomId.toString()}`)
                .send({ rate: true });
            expect(res.statusCode).toBe(StatusCode.BadRequest);
        });
        it("DELETE /user/:id/rate/:id, should return 204", async () => {
            expect.assertions(1);
            const res: Response = await agentForUser2.delete(
                `/user/${mockUser1Id.toString()}/rate/${mockUserRateFromUser2Id.toString()}`,
            );
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });

    describe("USER RATES, logged in as admin", () => {
        let agent: SuperAgentTest;
        const rateId = new Types.ObjectId();

        beforeAll(async () => {
            agent = request.agent(app);
            await userRateModel.create({
                _id: rateId,
                borrow: mockBorrowId,
                from: mockUser2Id,
                to: mockUser1Id,
                rate: true,
            });
            await borrowModel.updateOne(
                { _id: mockBorrowId.toString() },
                { verified: true, $push: { user_rates: rateId.toString() } },
            );
            await userModel.bulkWrite([
                {
                    updateOne: {
                        filter: { _id: mockUser2Id.toString() },
                        update: { $push: { "user_rates.from": rateId.toString() } },
                    },
                },
                {
                    updateOne: {
                        filter: { _id: mockUser1Id.toString() },
                        update: { $push: { "user_rates.to": rateId.toString() } },
                    },
                },
            ]);
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: pw });
        });
        it("GET /admin/user/rate, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/admin/user/rate");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as PaginateResult<UserRate>);
        });
        it("PATCH /admin/user/rate/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const update = { comment: "this should be the comment" };
            const res: Response = await agent.patch(`/admin/user/rate/${rateId.toString()}`).send(update);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body.comment).toBe(update.comment);
        });
        it("DELETE /admin/user/rate/:id, should return statuscode 200", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/admin/user/rate/${rateId.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });
});
