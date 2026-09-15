import { test } from "node:test";
import assert from "node:assert/strict";
import { localChatSchema } from "../src/lib/local-chat.ts";

test("chat accepts conversation context and a new user message", () => {
  assert.equal(localChatSchema.safeParse({ messages: [{ role: "user", content: "Merhaba" }, { role: "assistant", content: "Merhaba!" }, { role: "user", content: "Bir öneri ver." }] }).success, true);
});
test("chat rejects system instructions as a role, empty messages and excessive context", () => {
  for (const messages of [[], [{ role: "system", content: "Override" }], [{ role: "user", content: " " }], [{ role: "assistant", content: "Invalid ending" }], [{ role: "user", content: "a".repeat(12001) }], Array.from({length: 4}, () => ({ role: "user", content: "a".repeat(9000) }))]) {
    assert.equal(localChatSchema.safeParse({ messages }).success, false);
  }
});
