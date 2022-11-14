import { hash } from "bcrypt";
import request, { Response, SuperAgentTest } from "supertest";
import { mongoClient } from "../../../config/setupTest";
import App from "../../app";
import userModel from "@models/user";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import type { Express } from "express";
import BorrowController from "@controllers/borrow";
import type { CreateBorrow, ModifyBorrow } from "@interfaces/borrow";
import type { User } from "@interfaces/user";
import type { Book } from "@interfaces/book";
import type { Borrow } from "@interfaces/borrow";
import BookController from "@controllers/book";

describe("BORROWS", () => {
    let server: Express;
    const testUsers: User[] = [];
    const mockBook = { author: "test", title: "test", for_borrow: true };
    const mockUser = { email: "test1@test.com", password: "test1234" };
    const mockAdmin = { email: "test2@test.com", password: "test1234" };

    beforeAll(async () => {
        server = new App([new AuthenticationController(), new BorrowController(), new BookController()], mongoClient).getServer();
        const password = await hash(mockUser.password, 10);
        testUsers.push(
            await userModel.create({ email: mockUser.email, password: password }),
            await userModel.create({ email: mockAdmin.email, password: password, role: "admin" }),
        );
        const agent = request.agent(server);
        await agent.post("/auth/login").send(mockUser);
        await agent.post("/book").send(mockBook);
        await agent.post("/auth/login").send(mockAdmin);
        await agent.post("/book").send(mockBook);
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
        let agent: SuperAgentTest;
        let books: Book[];
        let mockBorrowId: string;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send(mockUser);
            const res = await agent.get("/book/all");
            books = res.body;
            if (testUsers[0]?._id && testUsers[1]?._id && books.length > 0 && books[1]?._id) {
                const mockBorrow: CreateBorrow = { from_id: testUsers[1]?._id.toString(), books: [books[1]?._id.toString()] };
                const res = await agent.post("/borrow").send(mockBorrow);
                mockBorrowId = (res.body as Borrow)._id.toString();
            }
        });

        it("GET /borrow/all, should return statuscode 403", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/borrow/all");
            expect(res.statusCode).toBe(StatusCode.Forbidden);
            expect(res.body).toBe("Forbidden");
        });
        it("GET /borrow/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get(`/borrow/${mockBorrowId}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("POST /borrow, should return statuscode 200", async () => {
            if (testUsers[0]?._id && testUsers[1]?._id && books.length > 0 && books[1]?._id) {
                expect.assertions(2);
                const mockBorrow: CreateBorrow = { from_id: testUsers[1]?._id.toString(), books: [books[1]?._id.toString()] };
                const res: Response = await agent.post("/borrow").send(mockBorrow);
                expect(res.statusCode).toBe(StatusCode.OK);
                expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
            }
        });
        it("PATCH /borrow/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const patch: ModifyBorrow = { verified: true };
            const res: Response = await agent.patch(`/borrow/${mockBorrowId}`).send(patch);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("DELETE /borrow/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.delete(`/borrow/${mockBorrowId}`);
            expect(res.statusCode).toBe(StatusCode.Forbidden);
            expect(res.body).toBe("Forbidden");
        });
    });

    describe("BORROWS, logged in as admin", () => {
        let agent: SuperAgentTest;
        let books: Book[];
        let mockBorrowId: string;

        beforeAll(async () => {
            agent = request.agent(server);
            await agent.post("/auth/login").send(mockAdmin);
            const res = await agent.get("/book/all");
            books = res.body;
            if (testUsers[0]?._id && testUsers[1]?._id && books.length > 0 && books[0]?._id) {
                const mockBorrow: CreateBorrow = { from_id: testUsers[0]?._id.toString(), books: [books[0]?._id.toString()] };
                const res = await agent.post("/borrow").send(mockBorrow);
                mockBorrowId = (res.body as Borrow)._id.toString();
            }
        });

        it("GET /borrow/all, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get("/borrow/all");
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Array<Borrow>);
        });
        it("GET /borrow/:id, should return statuscode 200", async () => {
            expect.assertions(2);
            const res: Response = await agent.get(`/borrow/${mockBorrowId}`);
            expect(res.statusCode).toBe(StatusCode.OK);
            expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
        });
        it("POST /borrow, should return statuscode 200", async () => {
            if (testUsers[0]?._id && testUsers[1]?._id && books.length > 0 && books[0]?._id) {
                expect.assertions(2);
                const mockBorrow: CreateBorrow = { from_id: testUsers[0]?._id.toString(), books: [books[0]?._id.toString()] };
                const res: Response = await agent.post("/borrow").send(mockBorrow);
                expect(res.statusCode).toBe(StatusCode.OK);
                expect(res.body).toBeInstanceOf(Object as unknown as Borrow);
            }
        });
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
