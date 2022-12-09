import { pathsToModuleNameMapper } from "ts-jest";
import type { JestConfigWithTsJest } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

const jestConfig: JestConfigWithTsJest = {
    roots: ["<rootDir>"],
    preset: "ts-jest",
    verbose: true,
    expand: true,
    globalSetup: "<rootDir>/test/globalSetup.ts",
    globalTeardown: "<rootDir>/test/globalTeardown.ts",
    setupFilesAfterEnv: ["<rootDir>/test/setupFilesAfterEnv.ts"],
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
    collectCoverageFrom: [
        "src/**/*.{ts,js}",
        "!src/**/*.d.ts",
        "!src/utils/{getPaginated,roleChecker}.ts",
        "!src/db/*.ts",
        "!src/server.ts",
    ],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/" }),
};

export default jestConfig;
