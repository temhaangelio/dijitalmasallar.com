import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { pronounceTurkish } from "../src/lib/speech/pronounce.ts";

describe("pronounceTurkish", () => {
  test("writes a brand the way it is said", () => {
    assert.equal(pronounceTurkish("Cloudflare yeni bir özellik ekledi."), "Klaudfleyr yeni bir özellik ekledi.");
  });

  test("keeps the Turkish suffix on a replaced name", () => {
    assert.equal(pronounceTurkish("OpenAI'ın modeli"), "Oupın Ey Ay'ın modeli");
  });

  test("prefers the longer entry", () => {
    assert.equal(pronounceTurkish("Hugging Face üzerinde"), "Haging Feys üzerinde");
  });

  test("translates AI rather than spelling it", () => {
    assert.equal(pronounceTurkish("AI alanında"), "yapay zekâ alanında");
  });

  test("spells an acronym it does not know with Turkish letter names", () => {
    assert.equal(pronounceTurkish("NASA açıkladı"), "Ne A Se A açıkladı");
  });

  test("leaves an ordinary Turkish word alone", () => {
    assert.equal(pronounceTurkish("Google haritalarda gezinmek"), "Gugıl haritalarda gezinmek");
  });

  test("does not replace inside a longer word", () => {
    assert.equal(pronounceTurkish("Maceralar"), "Maceralar");
    assert.equal(pronounceTurkish("kaimac"), "kaimac");
  });

  test("is case-insensitive on the way in", () => {
    assert.equal(pronounceTurkish("google ve GOOGLE"), "Gugıl ve Gugıl");
  });

  test("leaves text with nothing foreign untouched", () => {
    const line = "Şirket, veri merkezlerinde enerji tüketimini azalttığını belirtti.";
    assert.equal(pronounceTurkish(line), line);
  });
});
