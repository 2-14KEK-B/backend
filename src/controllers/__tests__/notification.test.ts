import request, { Response, SuperAgentTest } from "supertest";
import App from "../../app";
import userRateModel from "@models/userRate";
import borrowModel from "@models/borrow";
import userModel from "@models/user";
import bookModel from "@models/book";
import UserController from "@controllers/user";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import { Types } from "mongoose";
import type { Application } from "express";
import type { User } from "@interfaces/user";
import type { CreateNotification } from "@interfaces/notification";
import type { Borrow } from "@interfaces/borrow";
import type { Book } from "@interfaces/book";

describe("NOTIFICATIONS", () => {
    let server: Application;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        randomId = new Types.ObjectId(),
        mockUser1Id = new Types.ObjectId(),
        mockUser2Id = new Types.ObjectId(),
        mockBookId = new Types.ObjectId(),
        mockBorrowId = new Types.ObjectId(),
        mockNotificationId = new Types.ObjectId(),
        mockUser1: Partial<User> = {
            _id: mockUser1Id,
            email: "testuser1@test.com",
            email_is_verified: true,
            username: "test1ForNotification",
            password: pw,
            createdAt: new Date("2020-10-10"),
            notifications: [
                {
                    _id: mockNotificationId,
                    from: mockUser2Id,
                    doc_id: randomId,
                    doc_type: "user_rate",
                    noti_type: "create",
                    seen: false,
                },
            ],
        },
        mockUser2: Partial<User> = {
            _id: mockUser2Id,
            email: "testuser2@test.com",
            email_is_verified: true,
            username: "test2ForNotification",
            password: pw,
            createdAt: new Date("2021-10-10"),
        },
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
            from: mockUser1Id,
            to: mockUser2Id,
            type: "borrow",
            verified: false,
            user_rates: [],
        };

    beforeAll(async () => {
        server = new App([new AuthenticationController(), new UserController()]).getApp();
        await userModel.create([
            { ...mockUser1, password: hpw },
            { ...mockUser2, password: hpw },
        ]);
        await bookModel.create(mockBook);
        await borrowModel.create(mockBorrow);
    });

    describe("NOTIFICATIONS, not logged in", () => {
        it("any PATH, should return statuscode 401", async () => {
            expect.assertions(4);
            const getRes = await request(server).get("/user/me/notification");
            const postRes = await request(server).post(`/user/${randomId}/notification`);
            const patchRes = await request(server).patch(`/user/me/notification/${randomId}`);
            const deleteRes = await request(server).delete(`/user/me/notification/${randomId}`);
            expect(getRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(postRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(patchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("NOTIFICATIONS, logged in as user", () => {
        let agentForUser1: SuperAgentTest;
        let agentForUser2: SuperAgentTest;

        beforeAll(async () => {
            agentForUser1 = request.agent(server);
            agentForUser2 = request.agent(server);
            await agentForUser1.post("/auth/login").send({ email: mockUser1.email, password: pw });
            await agentForUser2.post("/auth/login").send({ email: mockUser2.email, password: pw });
        });

        it("GET /user/me/notification, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get("/user/me/notification");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Notification>);
        });

        it("POST /user/:id/notification, should return statuscode 200", async () => {
            expect.assertions(1);
            await borrowModel.updateOne({ _id: mockBorrowId.toString() }, { $set: { verified: true } }).exec();
            const newNotification: CreateNotification = {
                doc_id: mockBorrowId.toString(),
                doc_type: "borrow",
                not_type: "verify",
            };
            const res: Response = await agentForUser1
                .post(`/user/${mockUser2Id.toString()}/notification`)
                .send(newNotification);
            expect(res.statusCode).toBe(StatusCode.OK);
        });

        it("POST /user/:id/notification, should return statuscode 200", async () => {
            expect.assertions(1);
            const rate = await userRateModel.create({
                borrow: mockBorrowId.toString(),
                from: mockUser1Id.toString(),
                to: mockUser2Id.toString(),
                rate: true,
            });
            await borrowModel.updateOne({ _id: mockBorrowId.toString() }, { $push: { user_rates: rate } }).exec();
            await userModel.bulkWrite([
                {
                    updateOne: {
                        filter: { _id: mockUser1Id.toString() },
                        update: { $pull: { "user_rates.from": rate._id.toString() } },
                    },
                },
                {
                    updateOne: {
                        filter: { _id: mockUser2Id.toString() },
                        update: { $pull: { "user_rates.to": rate._id.toString() } },
                    },
                },
            ]);
            const newNotification: CreateNotification = {
                doc_id: rate._id.toString(),
                doc_type: "user_rate",
                not_type: "create",
            };
            const res: Response = await agentForUser1
                .post(`/user/${mockUser2Id.toString()}/notification`)
                .send(newNotification);
            expect(res.statusCode).toBe(StatusCode.OK);
        });

        it("PATCH /user/me/notification/:id, should return statuscode 200", async () => {
            expect.assertions(1);
            const res: Response = await agentForUser1.patch(`/user/me/notification/${mockNotificationId.toString()}`);
            expect(res.statusCode).toBe(StatusCode.OK);
        });

        it("DELETE /user/me/notification/:id, should return statuscode 204", async () => {
            expect.assertions(1);
            const res: Response = await agentForUser1.delete(`/user/me/notification/${mockNotificationId.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });
});
