import { h1 } from "../src/i2.ts";

test('basic', () => {
  console.log("テスト開始")
  expect(h1).toBe("ok2");
  console.log("テスト終了")
});
