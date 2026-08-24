import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { emailSchema, loginSchema, passwordSchema, resetPasswordSchema } from "../src/lib/validations/auth.ts";

describe("auth validation", () => {
  test("normalises and validates e-mail", () => {
    assert.equal(emailSchema.safeParse("  okur@diji.news  ").data, "okur@diji.news");
    assert.equal(emailSchema.safeParse("okur@").success, false);
    assert.equal(emailSchema.safeParse("").success, false);
  });

  test("passwords need length, a letter and a digit", () => {
    assert.equal(passwordSchema.safeParse("kisa1").success, false);
    assert.equal(passwordSchema.safeParse("yalnizcaharf").success, false);
    assert.equal(passwordSchema.safeParse("12345678").success, false);
    assert.equal(passwordSchema.safeParse("guclusifre1").success, true);
  });

  test("login needs a non-empty password but does not enforce the policy", () => {
    assert.equal(loginSchema.safeParse({ email: "admin@diji.news", password: "x" }).success, true);
    assert.equal(loginSchema.safeParse({ email: "admin@diji.news", password: "" }).success, false);
  });

  test("reset requires the two passwords to match", () => {
    assert.equal(resetPasswordSchema.safeParse({ password: "guclusifre1", confirmPassword: "guclusifre1" }).success, true);
    const mismatch = resetPasswordSchema.safeParse({ password: "guclusifre1", confirmPassword: "baskasifre1" });
    assert.equal(mismatch.success, false);
    assert.deepEqual(mismatch.error?.issues[0]?.path, ["confirmPassword"]);
  });
});
