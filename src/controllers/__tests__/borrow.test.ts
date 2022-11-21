import request, { Response, SuperAgentTest } from "supertest";
import { hash } from "bcrypt";
import App from "../../app";
import AuthenticationController from "@authentication/index";
import BorrowController from "@controllers/borrow";
import BookController from "@controllers/book";
import userModel from "@models/user";
import bookModel from "@models/book";
import borrowModel from "@models/borrow";
import StatusCode from "@utils/statusCodes";
import { Types } from "mongoose";
import type { Express } from "express";
import type { CreateBorrow, ModifyBorrow } from "@interfaces/borrow";
import type { Book } from "@interfaces/book";
import type { Borrow } from "@interfaces/borrow";

type ID = string | Types.ObjectId;

interface MockUser {
    _id: ID;
    email: string;
    password: string;
    role?: string;
    books: (Book | ID)[];
    borrows: (Borrow | ID)[];
}
interface MockBook {
    _id: ID;
    uploader?: ID;
    author: string;
    title: string;
    for_borrow: boolean;
}
interface MockBorrow {
    _id: ID;
    from_id?: ID;
    updated_on?: Date;
    to_id: ID;
    books: (Book | ID)[];
    verified?: boolean;
}

describe("BORROWS", () => {
    let server: Express;
    const mockBookFromUser1Id = new Types.ObjectId(),
        mockBook1FromUser2Id = new Types.ObjectId(),
        mockBook2FromUser2Id = new Types.ObjectId(),
        mockBorrowId = new Types.ObjectId(),
        mockUser1Id = new Types.ObjectId(),
        mockUser2Id = new Types.ObjectId(),
        mockAdminId = new Types.ObjectId(),
        mockBookFromUser1: MockBook = { _id: mockBookFromUser1Id, uploader: mockUser1Id, author: "test", title: "test", for_borrow: true },
        mockBook1FromUser2: MockBook = { _id: mockBook1FromUser2Id, uploader: mockUser2Id, author: "test", title: "test", for_borrow: true },
        mockBook2FromUser2: MockBook = { _id: mockBook2FromUser2Id, uploader: mockUser2Id, author: "test", title: "test", for_borrow: true },
        mockUser1: MockUser = {
            _id: mockUser1Id,
            email: "testuser1@test.com",
            password: "test1234",
            books: [mockBookFromUser1Id],
            borrows: [mockBorrowId],
        },
        mockUser2: MockUser = {
            _id: mockUser2Id,
            email: "testuser2@test.com",
            password: "test1234",
            books: [mockBook1FromUser2Id, mockBook2FromUser2Id],
            borrows: [mockBorrowId],
        },
        mockAdmin: MockUser = {
            _id: mockAdminId,
            email: "testadmin@test.com",
            password: "test1234",
            role: "admin",
            books: [],
            borrows: [],
        },
        mockBorrow: MockBorrow = { _id: mockBorrowId, from_id: mockUser2Id, to_id: mockUser1Id, books: [mockBook1FromUser2Id] };

    beforeAll(async () => {
        server = new App([new AuthenticationController(), new BorrowController(), new BookController()]).getServer();
        const password = await hash(mockUser1.password, 10);
        await userModel.create([
            { ...mockUser1, password: password },
            { ...mockUser2, password: password },
            { ...mockAdmin, password: password },
        ]);
        await bookModel.create([mockBookFromUser1, mockBook1FromUser2, mockBook2FromUser2]);
        await borrowModel.create(mockBorrow);
    });

    describe("BORROWS, not logged in", () => {
        it("any PATH, should return statuscode 401", async () => {
            expect.assertions(5);
            const allRes = await request(server).get(`/borrow/all`);
            const idRes = await request(server).get(`/borrow/:id`);
            const postRes = await request(server).post("/borrow");
            const patchRes = await request(server).patch("/borrow/id");
            const deleteRes = await request(server).delete(`/borrow/id`);
            expect(allRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(idRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(postRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(patchRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });

    describe("BORROWS, logged in as user", () => {
        let agentForUser1: SuperAgentTest;
        let agentForUser2: SuperAgentTest;
        let mockBorrowForLoggedInUser: MockBorrow;

        beforeAll(async () => {
            agentForUser1 = request.agent(server);
            agentForUser2 = request.agent(server);
            await agentForUser1.post("/auth/login").send({ email: mockUser1.email, password: mockUser1.password });
            await agentForUser2.post("/auth/login").send({ email: mockUser2.email, password: mockUser2.password });
        });

        it("GET /borrow/all, should return statuscode 403", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get("/borrow/all");
            expect(res.statusCode).toBe(StatusCode.Forbidden);
            expect(res.body).toBe("Forbidden");
        });
        it("GET /borrow/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agentForUser1.get(`/borrow/${mockBorrowId.toString()}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("POST /borrow, should return statuscode 200", async () => {
            expect.assertions(2);
            const mockBorrow: CreateBorrow = { from_id: mockUser2Id.toString(), books: [mockBook2FromUser2Id.toString()] };
            const res: Response = await agentForUser1.post("/borrow").send(mockBorrow);
            mockBorrowForLoggedInUser = res.body;
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("PATCH /borrow/:id, should return statuscode 401 if logged in user have nothing to do with the borrow", async () => {
            expect.assertions(2);
            const patch: ModifyBorrow = { verified: true };
            const thirdMockUserData = { email: "thirduser@test.com", password: "test4321" };
            const password = await hash(thirdMockUserData.password, 10);
            await userModel.create({ email: thirdMockUserData.email, password: password });
            await request(server).post("/auth/login").send(thirdMockUserData);
            const res: Response = await request(server).patch(`/borrow/${mockBorrowId.toString()}`).send(patch);
            expect(res.statusCode).toBe(StatusCode.Unauthorized);
            expect(res.body).toBe("Unauthorized");
        });
        it("PATCH /borrow/:id, should return statuscode 200 if logged in user who is lending the book and modify 'verified'", async () => {
            expect.assertions(2);
            const patch: ModifyBorrow = { verified: true };
            const res: Response = await agentForUser2.patch(`/borrow/${mockBorrowId.toString()}`).send(patch);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("PATCH /borrow/:id, should return statuscode 401 if logged in user who is borrowing the book and modify 'verified'", async () => {
            expect.assertions(2);
            const patch: ModifyBorrow = { verified: true };
            const res: Response = await agentForUser1.patch(`/borrow/${mockBorrowForLoggedInUser._id.toString()}`).send(patch);
            expect(res.statusCode).toBe(StatusCode.Unauthorized);
            expect(res.body).toBe("You can not modify this value");
        });
        it("PATCH /borrow/:id, should return statuscode 200 if logged in user who is borrowing the book and modify the 'books'", async () => {
            expect.assertions(2);
            const patch: ModifyBorrow = { books: [mockBook1FromUser2Id.toString(), mockBook2FromUser2Id.toString()] };
            const res: Response = await agentForUser1.patch(`/borrow/${mockBorrowForLoggedInUser._id.toString()}`).send(patch);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("DELETE /borrow/:id, should return statuscode 403", async () => {
            expect.assertions(1);
            const res: Response = await agentForUser1.delete(`/borrow/${mockBorrowForLoggedInUser._id}`);
            expect(res.statusCode).toBe(StatusCode.Forbidden);
        });
    });

    describe("BORROWS, logged in as admin", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: mockAdmin.password });
        });

        it("GET /borrow/all, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/borrow/all");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Borrow>);
        });
        // it("GET /borrow/:id, should return statuscode 200", async () => {
        //     expect.assertions(2);
        //     const res: Response = await agent.get(`/borrow/${mockBorrowId}`);
        //     expect(res.statusCode).toBe(StatusCode.OK);
        //     expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        // });
        it("PATCH /borrow/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const patch: ModifyBorrow = { verified: true };
            const res: Response = await agent.patch(`/borrow/${mockBorrowId}`).send(patch);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("DELETE /borrow/:id, should return statuscode 200", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/borrow/${mockBorrowId}`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
    });
});
