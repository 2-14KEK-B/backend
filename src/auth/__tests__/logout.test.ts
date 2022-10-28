import { Application } from "express";
import request, { Response } from "supertest";
import "dotenv/config";
import App from "../../app";
import validateEnv from "@utils/validateEnv";
import AuthenticationController from "@auth/index";
import StatusCode from "@utils/statusCodes";

validateEnv("test");

describe("POST /logout", () => {
    let server: Application;

    beforeAll(() => {
        server = new App([new AuthenticationController()]).getServer();
    });

    it("returns statuscode 200 if registered successfully", async () => {
        const res: Response = await request(server).post("/auth/logout");
        expect(res.statusCode).toEqual(StatusCode.OK);
        expect(res.text).toEqual("logout successfully");
    });
});
