import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { exCards, exPack } from "../app/ex-data.ts";

test("EXは1999年12月16日発売の全85種類として追加される", () => {
  assert.equal(exPack.releaseDate, "1999-12-16");
  assert.equal(exPack.cardIds.length, 85);
  assert.equal(new Set(exPack.cardIds).size, 85);
});

test("EX固有のレア度と新規15種類を収録する", () => {
  assert.equal(exPack.rarityOverrides?.["vol1-dark-magician"], "UR");
  assert.equal(exPack.rarityOverrides?.["stb-blue-eyes"], "UR");
  assert.equal(exPack.rarityOverrides?.["ex-055"], "SR");
  assert.equal(exPack.rarityOverrides?.["ex-084"], "SE");
  assert.equal(exCards.length, 15);
});

test("EXの代表的な新規カードの能力値と種別が正しい", () => {
  const byId = new Map(exCards.map((card) => [card.id, card]));
  assert.deepEqual(byId.get("ex-055"), { id: "ex-055", name: "ジャッジ・マン", cardType: "monster", kind: "戦士族", attribute: "地", level: 6, atk: 2200, def: 1500, rarity: "SR" });
  assert.equal(byId.get("ex-034")?.effect, true);
  assert.equal(byId.get("ex-040")?.cardType, "trap");
  assert.equal(byId.get("ex-085")?.rarity, "SE");
});

test("EXをパック一覧と全カード一覧へ接続する", async () => {
  const source = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
  assert.match(source, /import \{ exCards, exPack \} from "\.\/ex-data"/);
  assert.match(source, /\.\.\.exCards/);
  assert.match(source, /exPack/);
});
