import assert from "node:assert/strict";
import test from "node:test";
import { matchesDeckFilters } from "../app/deck-rules.mjs";

const effectMonster = { name: "人喰い虫", cardType: "monster", kind: "昆虫族", attribute: "地", level: 2, effect: true };
const fusionMonster = { name: "竜騎士ガイア", cardType: "monster", kind: "ドラゴン族", attribute: "風", level: 7, fusion: true };
const normalMonster = { name: "真紅眼の黒竜", cardType: "monster", kind: "ドラゴン族", attribute: "闇", level: 7 };

test("モンスターを通常・効果・融合で絞り込める", () => {
  assert.equal(matchesDeckFilters(effectMonster, "", "monster", "effect", "all"), true);
  assert.equal(matchesDeckFilters(effectMonster, "", "monster", "normal", "all"), false);
  assert.equal(matchesDeckFilters(fusionMonster, "", "monster", "fusion", "all"), true);
  assert.equal(matchesDeckFilters(normalMonster, "", "monster", "normal", "all"), true);
});

test("★の数と文字検索を組み合わせられる", () => {
  assert.equal(matchesDeckFilters(effectMonster, "効果", "all", "all", "2"), true);
  assert.equal(matchesDeckFilters(effectMonster, "★2", "all", "all", "2"), true);
  assert.equal(matchesDeckFilters(effectMonster, "効果", "all", "all", "7"), false);
  assert.equal(matchesDeckFilters(fusionMonster, "融合", "monster", "fusion", "7"), true);
});

test("属性と種族で絞り込める", () => {
  assert.equal(matchesDeckFilters(effectMonster, "", "monster", "all", "all", "地", "昆虫族"), true);
  assert.equal(matchesDeckFilters(effectMonster, "", "monster", "all", "all", "闇", "昆虫族"), false);
  assert.equal(matchesDeckFilters(fusionMonster, "", "monster", "all", "all", "風", "ドラゴン族"), true);
  assert.equal(matchesDeckFilters(normalMonster, "", "monster", "all", "all", "闇", "魔法使い族"), false);
});

test("ATKとDEFの数値でも文字検索できる", () => {
  const card = { ...effectMonster, atk: 450, def: 600 };
  assert.equal(matchesDeckFilters(card, "DEF 600", "all", "all", "all"), true);
  assert.equal(matchesDeckFilters(card, "ATK 450", "all", "all", "all"), true);
  assert.equal(matchesDeckFilters(card, "DEF 450", "all", "all", "all"), false);
});
