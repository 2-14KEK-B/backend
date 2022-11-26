import { hash } from "bcrypt";
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

type ID = string | Types.ObjectId;

interface MockUser {
    _id: ID;
    email: string;
    password: string;
    role?: string;
    rated_books: ID[];
}
interface MockBook {
    _id: ID;
    uploader?: ID;
    author: string;
    title: string;
    for_borrow: boolean;
    ratings?: BookRating[];
}

describe("BOOK RATING", () => {
    const mockBookId = new Types.ObjectId();
    const mockUserId = new Types.ObjectId();
    const mockAdminId = new Types.ObjectId();
    const bookFromUserId = new Types.ObjectId();
    const bookFromAdminId = new Types.ObjectId();
    let server: Express;
    const mockBook: MockBook = {
        _id: mockBookId,
        author: "testAuthor",
        title: "testTitle",
        for_borrow: true,
        ratings: [
            { from_id: mockUserId, rate: 5 },
            { from_id: mockAdminId, rate: 1 },
        ],
    };
    const mockUser: MockUser = { _id: mockUserId, email: "testuser@test.com", password: "test1234", rated_books: [mockBookId] };
    const mockAdmin: MockUser = { _id: mockAdminId, email: "testadmin@test.com", password: "test1234", role: "admin", rated_books: [mockBookId] };
    const mockBookFromUser: MockBook = { ...mockBook, _id: bookFromUserId, uploader: mockUserId, ratings: [{ from_id: mockAdminId, rate: 3 }] };
    const mockBookFromAdmin: MockBook = { ...mockBook, _id: bookFromAdminId, uploader: mockAdminId, ratings: [{ from_id: mockUserId, rate: 3 }] };

    beforeAll(async () => {
        server = new App([new AuthenticationController(), new BookController()]).getServer();
        const password = await hash(mockUser.password, 10);
        await userModel.create([
            { ...mockUser, password: password },
            { ...mockAdmin, password: password },
        ]);
        await bookModel.create([mockBook, mockBookFromUser, mockBookFromAdmin]);
    });

    describe("BOOK RATING without logged in", () => {
        const anyRandomId = new Types.ObjectId();

        it("GET /book/:id/rate, should return statuscode 200", async () => {
            expect.assertions(1);
            const res: Response = await request(server).get(`/book/${mockBook._id}/rate`);
            expect(res.statusCode).toBe(200);
        });

        it("any PATH, should return statuscode 401", async () => {
            expect.assertions(2);
            const postRes = await request(server).post(`/book/${anyRandomId}/rate`);
            const deleteRes = await request(server).delete(`/book/${anyRandomId}/rate`);
            expect(postRes.statusCode).toBe(StatusCode.Unauthorized);
            expect(deleteRes.statusCode).toBe(StatusCode.Unauthorized);
        });
    });
    describe("BOOK RATING with logged in as user", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send({ email: mockUser.email, password: mockUser.password });
        });

        it("POST /book/:id/rate, should return statuscode 400 if rated already", async () => {
            expect.assertions(1);
            const res: Response = await agent.post(`/book/${bookFromAdminId}/rate`).send({ rate: 2 });
            expect(res.statusCode).toBe(StatusCode.BadRequest);
        });
        it("POST /book/:id/rate, should return statuscode 200 if successfully rated", async () => {
            expect.assertions(1);
            const res: Response = await agent.post(`/book/${bookFromUserId}/rate`).send({ rate: 4 });
            expect(res.statusCode).toBe(StatusCode.OK);
        });

        it("DELETE /book/:id/rate, should return statuscode 403", async () => {
            expect.assertions(2);
            const resU: Response = await agent.delete(`/book/${bookFromUserId}/rate`);
            const resA: Response = await agent.delete(`/book/${bookFromAdminId}/rate`);
            expect(resU.statusCode).toBe(StatusCode.Forbidden);
            expect(resA.statusCode).toBe(StatusCode.Forbidden);
        });
    });
    describe("BOOK RATING with logged in as admin", () => {
        let agent: SuperAgentTest;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: mockAdmin.password });
        });

        it("DELETE /book/:id/rate, should be return 204 if has been rated the book", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/book/${bookFromUserId}/rate`);
            expect(res.statusCode).toBe(StatusCode.NoContent);
        });
        it("DELETE /book/:id/rate, should be return 400 if did not rated the book", async () => {
            expect.assertions(1);
            const res: Response = await agent.delete(`/book/${bookFromAdminId}/rate`);
            expect(res.statusCode).toBe(StatusCode.BadRequest);
        });
    });
});
