import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { godCards, godCardsPack } from "../app/god-cards-data.ts";

test("三幻神プロモは1パック1枚で3種を均等排出する", () => {
  assert.equal(godCardsPack.category, "original");
  assert.equal(godCardsPack.cardsPerPack, 1);
  assert.deepEqual(godCardsPack.cardIds, ["g4-01-obelisk", "g4-02-slifer", "g4-03-ra"]);
  assert.equal(godCards.length, 3);
  assert.ok(godCards.every((card) => card.attribute === "神" && card.kind === "幻神獣族" && card.level === 10 && card.effect));
});

test("三幻神をカード一覧とパック一覧へ接続する", () => {
  const source = readFileSync(new URL("../app/card-data.ts", import.meta.url), "utf8");
  assert.match(source, /\.\.\.godCards/);
  assert.match(source, /godCardsPack/);
});
