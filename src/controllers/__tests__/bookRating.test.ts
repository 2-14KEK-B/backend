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

describe("BOOK RATING", () => {
    let server: Express;
    const pw = global.MOCK_PASSWORD,
        hpw = global.MOCK_HASHED_PASSWORD,
        mockBookId = new Types.ObjectId(),
        mockUserId = new Types.ObjectId(),
        mockAdminId = new Types.ObjectId(),
        bookFromUserId = new Types.ObjectId(),
        bookFromAdminId = new Types.ObjectId(),
        mockBook: MockBook = {
            _id: mockBookId,
            author: "testAuthor",
            title: "testTitle",
            for_borrow: true,
            ratings: [
                { from_id: mockUserId, rate: 5 },
                { from_id: mockAdminId, rate: 1 },
            ],
        },
        mockUser: MockUser = { _id: mockUserId, email: "testuser@test.com", password: pw, rated_books: [mockBookId] },
        mockAdmin: MockUser = { _id: mockAdminId, email: "testadmin@test.com", password: pw, role: "admin", rated_books: [mockBookId] },
        mockBookFromUser: MockBook = { ...mockBook, _id: bookFromUserId, uploader: mockUserId, ratings: [{ from_id: mockAdminId, rate: 3 }] },
        mockBookFromAdmin: MockBook = { ...mockBook, _id: bookFromAdminId, uploader: mockAdminId, ratings: [{ from_id: mockUserId, rate: 3 }] };

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
            await agent.post("/auth/login").send({ email: mockUser.email, password: pw });
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
            await agent.post("/auth/login").send({ email: mockAdmin.email, password: pw });
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
