import { pathsToModuleNameMapper } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";
import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
    roots: ["<rootDir>"],
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
        "^.+\\.ts$": [
            "ts-jest",
            {
                diagnostics: {
                    exclude: ["**"],
                },
            },
        ],
    },
    testMatch: ["<rootDir>/**/__tests__/**/*.ts"],
    moduleFileExtensions: ["ts", "js", "json", "node"],
    collectCoverage: true,
    coverageDirectory: "coverage",
    collectCoverageFrom: ["src/**/*.{ts,js}", "!src/**/*.d.ts", "!src/db/*.ts", "!src/server.ts", "!src/app.ts"],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/" }),
};

export default jestConfig;
