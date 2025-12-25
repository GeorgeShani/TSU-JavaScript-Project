import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  testMatch: ["**/*.test.ts"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  // Handle .js extensions in imports (for ES modules compatibility)
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    // Mock chalk for tests (it's ESM-only)
    "^chalk$": "<rootDir>/tests/__mocks__/chalk.ts",
  },
  // Transform TypeScript files
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      useESM: false,
    }],
  },
};

export default config;
