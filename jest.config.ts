import { pathsToModuleNameMapper } from "ts-jest";
import type { JestConfigWithTsJest } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

const jestConfig: JestConfigWithTsJest = {
    roots: ["<rootDir>"],
    preset: "ts-jest",
    verbose: true,
    globalSetup: "<rootDir>/config/globalSetup.ts",
    globalTeardown: "<rootDir>/config/globalTeardown.ts",
    setupFilesAfterEnv: ["<rootDir>/config/setupFilesAfterEnv.ts"],
    testEnvironment: "node",
    testTimeout: 5000,
    detectOpenHandles: true,
    forceExit: true,
    maxWorkers: "50%",
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
    testMatch: ["<rootDir>/**/__tests__/**/*.ts"],
    moduleFileExtensions: ["ts", "js", "json", "node"],
    collectCoverage: true,
    coverageDirectory: "coverage",
    collectCoverageFrom: ["src/**/*.{ts,js}", "!src/**/*.d.ts"],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/" }),
};

export default jestConfig;
