import request, { Response, SuperAgentTest } from "supertest";
import App from "../../app";
import AuthenticationController from "@authentication/index";
import BorrowController from "@controllers/borrow";
import BookController from "@controllers/book";
import userModel from "@models/user";
import bookModel from "@models/book";
import borrowModel from "@models/borrow";
import StatusCode from "@utils/statusCodes";
import { dictionaries } from "@utils/dictionaries";
import { PaginateResult, Types } from "mongoose";
import type { Application } from "express";
import type { CreateBorrow, ModifyBorrow } from "@interfaces/borrow";
import type { Borrow } from "@interfaces/borrow";
import type { Book } from "@interfaces/book";
import type { User } from "@interfaces/user";

describe("BORROWS", () => {
    let app: Application;
    const dictionary = dictionaries[global.language];
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockBook1FromUser2Id = new Types.ObjectId(),
        mockBorrowId = new Types.ObjectId(),
        mockUser1Id = new Types.ObjectId(),
        mockUser2Id = new Types.ObjectId(),
        mockBook1FromUser2: Partial<Book> = {
            _id: mockBook1FromUser2Id,
            uploader: mockUser2Id,
            author: "test",
            title: "test",
            for_borrow: true,
        },
        mockUser1: Partial<User> = {
            _id: mockUser1Id,
            email: "testuserborrow1@test.com",
            email_is_verified: true,
            username: "test1ForBorrow",
            password: pw,
            books: [],
            borrows: [mockBorrowId],
        },
        mockUser2: Partial<User> = {
            _id: mockUser2Id,
            email: "testuserborrow2@test.com",
            email_is_verified: true,
            username: "test2ForBorrow",
            password: pw,
            books: [mockBook1FromUser2Id],
            borrows: [mockBorrowId],
        },
        mockBorrow: Partial<Borrow> = {
            _id: mockBorrowId,
            from: mockUser2Id,
            to: mockUser1Id,
            type: "borrow",
            books: [mockBook1FromUser2Id],
        };

    beforeAll(async () => {
        app = new App([new AuthenticationController(), new BorrowController(), new BookController()]).getApp();
        await userModel.create([
            { ...mockUser1, password: hpw },
            { ...mockUser2, password: hpw },
        ]);
        await bookModel.create(mockBook1FromUser2);
        await borrowModel.create(mockBorrow);
    });

    describe("BORROWS, not logged in", () => {
        it("any PATH, should return statuscode 401", async () => {
            expect.assertions(9);
            const randomId = new Types.ObjectId().toString();
            const update = { verified: true };
            const idRes = await request(app).get(`/borrow/${randomId}`);
            const loggedInRes = await request(app).get(`/user/me/borrow`);
            const postRes = await request(app).post("/borrow");
            const patchRes = await request(app).patch(`/borrow/${randomId}`).send(update);
            const deleteRes = await request(app).delete(`/borrow/${randomId}`);
            const adminIdRes = await request(app).get(`/admin/borrow/${randomId}`);
            const adminBorrowsRes = await request(app).get(`/admin/borrow`);
            const adminPatchRes = await request(app).patch(`/admin/borrow/${randomId}`).send(update);
            const adminDeleteRes = await request(app).delete(`/admin/borrow/${randomId}`);
            expect(idRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(loggedInRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(postRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(patchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminBorrowsRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminIdRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminPatchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(adminDeleteRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("BORROWS as Borrowing, logged in as user", () => {
        let agentForUser1: SuperAgentTest;
        let agentForUser2: SuperAgentTest;
        let mockBorrowForLoggedInUser: Partial<Borrow>;
        const mockBook1FromUser1Id = new Types.ObjectId(),
            mockBook2FromUser2Id = new Types.ObjectId(),
            mockBook1FromUser1: Partial<Book> = {
                _id: mockBook1FromUser1Id,
                uploader: mockUser1Id,
                author: "test",
                title: "test",
                for_borrow: true,
            },
            mockBook2FromUser2: Partial<Book> = {
                _id: mockBook2FromUser2Id,
                uploader: mockUser2Id,
                author: "test",
                title: "test",
                for_borrow: true,
            };

        beforeAll(async () => {
            agentForUser1 = request.agent(app);
            agentForUser2 = request.agent(app);
            await bookModel.create([mockBook1FromUser1, mockBook2FromUser2]);
            await userModel.bulkWrite([
                {
                    updateOne: {
                        filter: { _id: mockUser1Id.toString() },
                        update: { $push: { books: mockBook1FromUser1Id.toString() } },
                    },
                },
                {
                    updateOne: {
                        filter: { _id: mockUser2Id.toString() },
                        update: { $push: { books: mockBook2FromUser2Id.toString() } },
                    },
                },
            ]);
            await agentForUser1.post("/auth/login").send({ email: mockUser1.email, password: pw });
            await agentForUser2.post("/auth/login").send({ email: mockUser2.email, password: pw });
        });
        it("GET /borrow/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get(`/borrow/${mockBorrowId.toString()}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("GET /user/me/borrow, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get(`/user/me/borrow`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("POST /borrow, should return statuscode 200", async () => {
            expect.assertions(2);
            const mockBorrow: CreateBorrow = {
                from: mockUser2Id.toString(),
                books: [mockBook2FromUser2Id.toString()],
            };
            const res: Response = await agentForUser1.post("/borrow").send(mockBorrow);
            mockBorrowForLoggedInUser = res.body;
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("PATCH /borrow/:id, should return statuscode 200 if logged in user who is borrowing the book and modify the 'books'", async () => {
            expect.assertions(2);
            const patch: ModifyBorrow = { books: [mockBook1FromUser2Id.toString(), mockBook2FromUser2Id.toString()] };
            const res: Response = await agentForUser1
                .patch(`/borrow/${mockBorrowForLoggedInUser._id?.toString()}`)
                .send(patch);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("PATCH /borrow/:id/verify, should return statuscode 400 if logged in user have nothing to do with the borrow", async () => {
            expect.assertions(2);
            const thirdMockUserData = { email: "thirduser@test.com", password: pw };
            await userModel.create({
                email: thirdMockUserData.email,
                email_is_verified: true,
                username: "testForBorrow",
                password: hpw,
            });
            const agent: SuperAgentTest = request.agent(app);
            await agent.post("/auth/login").send(thirdMockUserData);
            const res: Response = await agent.patch(`/borrow/${mockBorrowId.toString()}/verify`);
            expect(res.statusCode).toBe(StatusCode.BadRequest);
            expect(res.body).toBe(dictionary.error.cannotModifyBorrow);
        });
        it("PATCH /borrow/:id/verify, should return statuscode 204 if logged in user who is the 'from' and modify 'verified'", async () => {
            expect.assertions(1);
            const res: Response = await agentForUser2.patch(`/borrow/${mockBorrowId.toString()}/verify`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
        it("PATCH /borrow/:id/verify, should return statuscode 400 if logged in user who is borrowing the book and modify 'verified'", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.patch(
                `/borrow/${mockBorrowForLoggedInUser._id?.toString()}/verify`,
            );
            expect(res.statusCode).toBe(StatusCode.BadRequest);
            expect(res.body).toBe(dictionary.error.cannotModifyVerified);
        });
        it("DELETE /borrow/:id, should return statuscode 204", async () => {
            expect.assertions(1);
            const res: Response = await agentForUser1.delete(`/borrow/${mockBorrowForLoggedInUser._id?.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });

    describe("BORROWS as Lending, logged in as user", () => {
        let agentForUser1: SuperAgentTest;
        let agentForUser2: SuperAgentTest;
        const mockUser3Id = new Types.ObjectId(),
            mockBook2FromUser1Id = new Types.ObjectId(),
            mockBookFromUser3Id = new Types.ObjectId(),
            mockLendId = new Types.ObjectId(),
            mockBookFromUser3: Partial<Book> = {
                _id: mockBookFromUser3Id,
                uploader: mockUser3Id,
                author: "test",
                title: "test",
                for_borrow: false,
            },
            mockUser3: Partial<User> = {
                _id: mockUser3Id,
                email: "testuserlend1@test.com",
                email_is_verified: true,
                username: "test3ForBorrow",
                password: pw,
                books: [mockBookFromUser3Id],
                borrows: [],
            },
            mockBook2FromUser1: Partial<Book> = {
                _id: mockBook2FromUser1Id,
                uploader: mockUser1Id,
                author: "test",
                title: "test",
                for_borrow: false,
            },
            mockLend: Partial<Borrow> = {
                _id: mockLendId,
                from: mockUser2Id,
                to: mockUser1Id,
                type: "lend",
                books: [mockBook2FromUser1Id],
            };

        beforeAll(async () => {
            agentForUser1 = request.agent(app);
            agentForUser2 = request.agent(app);
            await userModel.create(mockUser3);
            await bookModel.create(mockBook2FromUser1, mockBookFromUser3);
            await borrowModel.create(mockLend);
            await userModel.bulkWrite([
                {
                    updateOne: {
                        filter: { _id: mockUser1Id.toString() },
                        update: { $push: { books: mockBook2FromUser1Id.toString(), borrows: mockLendId.toString() } },
                    },
                },
                {
                    updateOne: {
                        filter: { _id: mockUser2Id.toString() },
                        update: { $push: { borrows: mockLendId.toString() } },
                    },
                },
            ]);
            await agentForUser1.post("/auth/login").send({ email: mockUser1.email, password: pw });
            await agentForUser2.post("/auth/login").send({ email: mockUser2.email, password: pw });
        });
        it("POST /borrow, should return 200", async () => {
            expect.assertions(2);
            const mockBorrow: CreateBorrow = {
                to: mockUser3Id.toString(),
                books: [mockBookFromUser3Id.toString()],
            };
            const res = await agentForUser1.post("/borrow").send(mockBorrow);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("PATCH /borrow/:id, should return statuscode 404 if new book id's not valid or empty", async () => {
            expect.assertions(4);
            const patch: ModifyBorrow = { books: [new Types.ObjectId().toString()] };
            const resNone = await agentForUser1.patch(`/borrow/${mockLendId.toString()}`);
            const resNotValid: Response = await agentForUser1.patch(`/borrow/${mockLendId.toString()}`).send(patch);
            expect(resNone.statusCode).toBe(StatusCode.NotFound);
            expect(resNone.body).toBe(dictionary.error.idNotValid);
            expect(resNotValid.statusCode).toBe(StatusCode.NotFound);
            expect(resNotValid.body).toBe(dictionary.error.idNotValid);
        });
        it("PATCH /borrow/:id/verify, should return statuscode 400 if logged in user who is the 'from' and modify 'verified'", async () => {
            expect.assertions(2);
            const res = await agentForUser2.patch(`/borrow/${mockLendId.toString()}/verify`);
            expect(res.statusCode).toBe(StatusCode.BadRequest);
            expect(res.body).toBe(dictionary.error.cannotModifyVerified);
        });
        it("PATCH /borrow/:id/verify, should return statuscode 204 if logged in user who is the 'from' and modify 'verified'", async () => {
            expect.assertions(1);
            const res = await agentForUser1.patch(`/borrow/${mockLendId.toString()}/verify`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });

    describe("BORROWS, logged in as admin", () => {
        let agent: SuperAgentTest;
        const mockAdminId = new Types.ObjectId(),
            mockAdmin: Partial<User> = {
                _id: mockAdminId,
                email: "testadmin@test.com",
                email_is_verified: true,
                username: "testAdminForBorrow",
                password: pw,
                role: "admin",
                books: [],
                borrows: [],
            };

        beforeAll(async () => {
            agent = request.agent(app);
            await userModel.create({ ...mockAdmin, password: hpw });
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: pw });
        });
        it("GET /admin/borrow, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/admin/borrow");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as PaginateResult<Borrow>);
        });
        it("GET /admin/borrow/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get(`/admin/borrow/${mockBorrowId.toString()}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("PATCH /admin/borrow/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const patch = { verified: true };
            const res: Response = await agent.patch(`/admin/borrow/${mockBorrowId.toString()}`).send(patch);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("DELETE /admin/borrow/:id, should return statuscode 200", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/admin/borrow/${mockBorrowId.toString()}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });
});
