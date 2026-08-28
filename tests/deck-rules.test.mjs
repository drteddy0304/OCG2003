import assert from "node:assert/strict";
import test from "node:test";
import { deckComposition, matchesDeckFilters, normalizeDeckLibrary, sanitizeDeckCounts } from "../app/deck-rules.mjs";

const effectMonster = { name: "人喰い虫", cardType: "monster", kind: "昆虫族", attribute: "地", level: 2, effect: true };
const fusionMonster = { name: "竜騎士ガイア", cardType: "monster", kind: "ドラゴン族", attribute: "風", level: 7, fusion: true };
const ritualMonster = { name: "スカルライダー", cardType: "monster", kind: "アンデット族", attribute: "闇", level: 6, ritual: true };
const normalMonster = { name: "真紅眼の黒竜", cardType: "monster", kind: "ドラゴン族", attribute: "闇", level: 7 };

test("モンスターを通常・効果・融合で絞り込める", () => {
  assert.equal(matchesDeckFilters(effectMonster, "", "monster", "effect", "all"), true);
  assert.equal(matchesDeckFilters(effectMonster, "", "monster", "normal", "all"), false);
  assert.equal(matchesDeckFilters(fusionMonster, "", "monster", "fusion", "all"), true);
  assert.equal(matchesDeckFilters(ritualMonster, "", "monster", "ritual", "all"), true);
  assert.equal(matchesDeckFilters(ritualMonster, "", "monster", "normal", "all"), false);
  assert.equal(matchesDeckFilters(ritualMonster, "儀式モンスター", "monster", "all", "all"), true);
  assert.equal(matchesDeckFilters(normalMonster, "", "monster", "normal", "all"), true);
});

test("★の数と文字検索を組み合わせられる", () => {
  assert.equal(matchesDeckFilters(effectMonster, "効果", "all", "all", "2"), true);
  assert.equal(matchesDeckFilters(effectMonster, "★2", "all", "all", "2"), true);
  assert.equal(matchesDeckFilters(effectMonster, "効果", "all", "all", "7"), false);
  assert.equal(matchesDeckFilters(fusionMonster, "融合", "monster", "fusion", "7"), true);
});

test("★3と★7のように複数レベルを同時に絞り込める", () => {
  assert.equal(matchesDeckFilters(effectMonster, "", "monster", "all", [3, 7]), false);
  assert.equal(matchesDeckFilters(fusionMonster, "", "monster", "all", [3, 7]), true);
  assert.equal(matchesDeckFilters({ ...normalMonster, level: 3 }, "", "monster", "all", [3, 7]), true);
});

test("効果モンスターという文字でも検索できる", () => {
  assert.equal(matchesDeckFilters(effectMonster, "効果モンスター", "all", "all", []), true);
  assert.equal(matchesDeckFilters(normalMonster, "効果モンスター", "all", "all", []), false);
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

test("レア度を他の条件と組み合わせて絞り込める", () => {
  const rareEffectMonster = { ...effectMonster, rarity: "SR" };
  assert.equal(matchesDeckFilters(rareEffectMonster, "", "monster", "effect", "all", "all", "all", "SR"), true);
  assert.equal(matchesDeckFilters(rareEffectMonster, "", "monster", "effect", "all", "all", "all", "UR"), false);
});

test("カードの効果文でも検索できる", () => {
  const directAttacker = { name: "魔法のランプ", cardType: "monster", kind: "魔法使い族", attribute: "闇", level: 1, effect: true, rarity: "N" };
  assert.equal(matchesDeckFilters(directAttacker, "直接攻撃", "all", "all", "all", "all", "all", "all", "相手に直接攻撃できる。"), true);
  assert.equal(matchesDeckFilters(directAttacker, "破壊する", "all", "all", "all", "all", "all", "all", "相手に直接攻撃できる。"), false);
});

test("メインデッキと融合デッキを分離して所持数・同名3枚制限を適用する", () => {
  const cardsById = new Map([
    ["normal", { cardType: "monster" }],
    ["fusion", { cardType: "monster", fusion: true }],
  ]);
  const counts = { normal: 5, fusion: 4, missing: 2 };
  const collection = { normal: 2, fusion: 5, missing: 5 };
  assert.deepEqual(sanitizeDeckCounts(counts, collection, cardsById, false), { normal: 2 });
  assert.deepEqual(sanitizeDeckCounts(counts, collection, cardsById, true), { fusion: 3 });
});

test("2003年10月改訂の制限・準制限枚数を保存デッキにも適用する", () => {
  const cardsById = new Map([
    ["limited", { name: "強欲な壺", cardType: "spell" }],
    ["semi", { name: "増援", cardType: "spell" }],
    ["unlimited", { name: "地割れ", cardType: "spell" }],
  ]);
  const counts = { limited: 3, semi: 3, unlimited: 3 };
  const collection = { limited: 5, semi: 5, unlimited: 5 };
  assert.deepEqual(sanitizeDeckCounts(counts, collection, cardsById, false), {
    limited: 1,
    semi: 2,
    unlimited: 3,
  });
});

test("デッキ内の通常・効果モンスター、魔法、罠の枚数を集計する", () => {
  const cardsById = new Map([
    ["normal", { cardType: "monster" }],
    ["effect", { cardType: "monster", effect: true }],
    ["ritual", { cardType: "monster", ritual: true }],
    ["spell", { cardType: "spell" }],
    ["trap", { cardType: "trap" }],
  ]);
  assert.deepEqual(deckComposition({ normal: 3, effect: 2, ritual: 1, spell: 10, trap: 5 }, cardsById), {
    monsters: 6,
    normalMonsters: 3,
    effectMonsters: 2,
    ritualMonsters: 1,
    spells: 10,
    traps: 5,
  });
});

test("既存デッキをデッキ1へ残したまま5つの保存枠を作る", () => {
  const cardsById = new Map([["normal", { cardType: "monster" }]]);
  const library = normalizeDeckLibrary(null, { normal: 2 }, {}, { normal: 5 }, cardsById);
  assert.equal(Object.keys(library).length, 5);
  assert.deepEqual(library[1].main, { normal: 2 });
  assert.deepEqual(library[2].main, {});
  assert.deepEqual(library[5].fusion, {});
});
