import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { curseOfAnubisCards, curseOfAnubisPack, curseOfAnubisReadyCardIds } from "../app/curse-of-anubis-data.ts";
import { continuousMonsterStats, equippedMonsterStats, jinzoNegatesTraps } from "../app/duel-rules.mjs";

test("Curse of Anubisは発売当時の全52種類を保持する", () => {
  assert.equal(curseOfAnubisCards.length, 52);
  assert.equal(new Set(curseOfAnubisCards.map((card) => card.id)).size, 52);
  assert.equal(curseOfAnubisPack.releaseDate, "2000-09-28");
  assert.equal(curseOfAnubisPack.cardIds.length, 52);
});

test("Curse of Anubisのカード種別内訳を固定する", () => {
  assert.equal(curseOfAnubisCards.filter((card) => card.cardType === "monster").length, 15);
  assert.equal(curseOfAnubisCards.filter((card) => card.cardType === "spell").length, 7);
  assert.equal(curseOfAnubisCards.filter((card) => card.cardType === "trap").length, 30);
  assert.equal(curseOfAnubisCards.filter((card) => card.effect).length, 5);
});

test("パック一覧と全カード一覧へ統合される", async () => {
  const source = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
  assert.match(source, /curseOfAnubisCards/);
  assert.match(source, /curseOfAnubisPack/);
});

test("サイコ・ショッカーとバスター・ブレイダーの常在効果を処理する", () => {
  assert.equal(jinzoNegatesTraps(["ca-00"], []), true);
  assert.equal(jinzoNegatesTraps([], ["ca-00"]), true);
  assert.equal(jinzoNegatesTraps([], []), false);
  assert.deepEqual(continuousMonsterStats({ id: "ca-51", atk: 2600, def: 2300, opponentDragonCount: 3 }), { atk: 4100, def: 2300 });
});

test("７カードは機械族へ装備できATKを700上げる", () => {
  assert.deepEqual(equippedMonsterStats(1000, 1000, ["ca-04"]), { atk: 1700, def: 1000 });
});

test("実装済み一覧は未接続効果を完成扱いしない", () => {
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-00"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-51"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-03"), false);
});

test("全カードに固有の説明文が用意される", async () => {
  const text = await readFile(new URL("../app/card-text.ts", import.meta.url), "utf8");
  curseOfAnubisCards.filter((card) => card.effect || card.cardType !== "monster").forEach((card) => {
    assert.match(text, new RegExp(`"${card.id}"\\s*:`));
  });
});
