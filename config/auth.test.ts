import { mongoClient } from "./setupTest";
import request, { Response, SuperAgentTest } from "supertest";
import App from "../src/app";
import AuthenticationController from "@authentication/index";
import StatusCode from "@utils/statusCodes";
import type { Application } from "express";

describe("AUTHENTICATION", () => {
    let server: Application;
    let agent: SuperAgentTest;
    const mockUser = { email: "test@test.com", password: "test1234" };

    beforeAll(async () => {
        server = new App([new AuthenticationController()], mongoClient).getServer();
        agent = request.agent(server);
    });

    describe("POST /register", () => {
        it("returns statuscode 200 if registered successfully", async () => {
            expect.assertions(2);
            const res: Response = await agent.post("/auth/register").send(mockUser);
            expect(res.statusCode).toEqual(StatusCode.OK);
            expect(res.text).toEqual(`user created with ${mockUser.email}`);
        });

        it("returns statuscode 400 if user already exists", async () => {
            expect.assertions(2);
            const res: Response = await agent.post("/auth/register").send(mockUser);
            expect(res.statusCode).toEqual(StatusCode.BadRequest);
            expect(res.body.message).toEqual(`User with email ${mockUser.email} already exists`);
        });
    });

    describe("POST /login", () => {
        it("returns statuscode 401 if user not exists", async () => {
            expect.assertions(2);
            const res: Response = await agent.post("/auth/login").send({
                email: "any@any.any",
                password: "anything",
            });
            expect(res.statusCode).toEqual(StatusCode.Unauthorized);
            expect(res.body.message).toEqual("Wrong credentials provided");
        });

        it("returns statuscode 401 if user exists, but password not match", async () => {
            expect.assertions(2);
            const res: Response = await agent.post("/auth/login").send({
                email: mockUser.email,
                password: "wrongpassword",
            });
            expect(res.statusCode).toEqual(StatusCode.Unauthorized);
            expect(res.body.message).toEqual("Wrong credentials provided");
        });

        it("returns statuscode 200 if user exists", async () => {
            expect.assertions(2);
            const res: Response = await agent.post("/auth/login").send(mockUser);
            expect(res.statusCode).toEqual(StatusCode.OK);
            expect(res.body.email).toEqual(mockUser.email);
        });
    });

    describe("GET /auth", () => {
        it("should return userdata if logged in", async () => {
            const res = await agent.get("/auth");
            expect(res.statusCode).toEqual(StatusCode.OK);
        });
    });

    describe("POST /logout", () => {
        it("returns statuscode 200 if logout successfully", async () => {
            expect.assertions(2);
            const res: Response = await agent.post("/auth/logout");
            expect(res.statusCode).toEqual(StatusCode.OK);
            expect(res.text).toEqual("logout successfully");
        });

        it("returns statuscode 401 if not already logged in", async () => {
            expect.assertions(3);
            const res: Response = await agent.post("/auth/logout");
            expect(res.statusCode).toEqual(StatusCode.Unauthorized);
            expect(res.body.message).toEqual("Unauthorized");
            expect(res.headers["set-cookie"]).toBeFalsy();
        });
    });

    describe("GET /auth", () => {
        it("should 401 if not logged in", async () => {
            const res = await agent.get("/auth");
            expect(res.statusCode).toEqual(StatusCode.Unauthorized);
        });
    });
});
