/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    //globals: true, // .test.ts の中で直接itやexceptを使う時はコメントを解除する
    includeSource: ['src/**/*.{js,ts}'], // In-Source テストを行う時はコメントを解除する
  },
});
