import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/pharaohs-servant-data.ts", import.meta.url), "utf8");
const cards = source.match(/^\s*\{ id: "ps-[0-5][0-9]"[^\n]+$/gm) ?? [];

test("Pharaoh's Servant準備データは発売当時の全52種類を保持する", () => {
  assert.equal(cards.length, 52);
  assert.equal(new Set(cards.map((line) => line.match(/id: "([^"]+)/)?.[1])).size, 52);
  assert.match(source, /id: "pharaohs-servant"[\s\S]+releaseDate: "2000-07-13"[\s\S]+category: "official"/);
});

test("Pharaoh's Servant準備データのカード種別内訳を固定する", () => {
  assert.equal(cards.filter((line) => line.includes('cardType: "monster"')).length, 35);
  assert.equal(cards.filter((line) => line.includes('cardType: "spell"')).length, 15);
  assert.equal(cards.filter((line) => line.includes('cardType: "trap"')).length, 2);
  assert.equal(cards.filter((line) => line.includes('ritual: true')).length, 3);
});

test("全52種類を完成版パックとして公開する", async () => {
  assert.match(source, /export const pharaohsServantPack:/);
  assert.match(source, /pharaohsServantReadyCardIds = \[/);
  assert.doesNotMatch(source, /PackDraft/);
  const cardDataSource = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
  assert.match(cardDataSource, /pharaohsServantCards/);
  assert.match(cardDataSource, /pharaohsServantPack/);
});
