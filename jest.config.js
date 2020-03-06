module.exports = {
  "testMatch": [
    "<rootDir>/src/*.spec.ts"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  globals: {
    'ts-jest': {
      diagnostics: false
    }
  }
}