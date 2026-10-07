/** @type {import('jest').Config} */
const path = require('path');

const moduleNameMapper = {
  '^@/(.*)$': '<rootDir>/$1',
  '^@crowdbeats/contracts$': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
  '^@crowdbeats/contracts/(.*)$': path.resolve(__dirname, '../../packages/contracts/src/$1'),
  '^maplibre-gl$': path.resolve(__dirname, '__mocks__/maplibre-gl.js'),
  '\\.(css|less|sass|scss)$': path.resolve(__dirname, '__mocks__/styleMock.js'),
};

module.exports = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      rootDir: __dirname,
      testMatch: ['**/__tests__/unit/**/*.test.ts', '**/*.unit.test.ts'],
      moduleNameMapper,
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: { jsx: 'react', baseUrl: '.', paths: { '@/*': ['./*'] } },
        }],
      },
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      rootDir: __dirname,
      testMatch: ['**/__tests__/jsdom/**/*.test.ts', '**/__tests__/jsdom/**/*.test.tsx', '**/*.jsdom.test.tsx'],
      moduleNameMapper,
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: { jsx: 'react-jsx', baseUrl: '.', paths: { '@/*': ['./*'] } },
        }],
      },
    },
  ],
  passWithNoTests: true,
};
