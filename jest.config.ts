import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: ['<rootDir>/backend/'],
  modulePathIgnorePatterns: ['<rootDir>/backend/'],
  coveragePathIgnorePatterns: ['<rootDir>/backend/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  // Umbral solo para los módulos núcleo de src/lib (token, api, roles, CSP, utils).
  // Los adaptadores de src/lib/api/** y la UI aún no tienen suites dedicadas.
  coverageThreshold: {
    global: {},
    'src/lib/*.ts': { lines: 80 },
  },
};

export default createJestConfig(config);
