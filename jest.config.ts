import { pathsToModuleNameMapper } from "ts-jest";
import type { JestConfigWithTsJest } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

const jestConfig: JestConfigWithTsJest = {
    roots: ["<rootDir>"],
    preset: "ts-jest",
    verbose: true,
    setupFilesAfterEnv: ["<rootDir>/config/setupTest.ts"],
    testEnvironment: "node",
    testTimeout: 5000,
    detectOpenHandles: true,
    maxWorkers: "50%",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.jest.json",
            },
        ],
    },
    testMatch: ["<rootDir>/**/__tests__/**/*.ts"],
    moduleFileExtensions: ["ts", "js", "json", "node"],
    collectCoverage: true,
    coverageDirectory: "coverage",
    collectCoverageFrom: ["src/**/*.{ts,js}", "!src/**/*.d.ts"],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/" }),
};

export default jestConfig;
