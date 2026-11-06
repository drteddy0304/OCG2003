import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { pharaonicGuardianCards, pharaonicGuardianPack, pharaonicGuardianReadyCardIds } from "../app/pharaonic-guardian-data.ts";
import { bottomlessShiftingSandTarget, canMonsterAttackDirectly, dicePotDamage, isPharaonicCycleFlipMonster, isSpiritMonster, pharaonicAttackBlocked, pharaonicBattleAttack, pharaonicBattleEffect, pharaonicMonsterStats, pharaonicSummonDestruction, pharaonicTrapOutcome, requiredTributes, spiritReturnsAtEnd } from "../app/duel-rules.mjs";

test("王家の守護者は発売時の全53種類を収録する", () => {
  assert.equal(pharaonicGuardianCards.length, 52);
  assert.equal(new Set(pharaonicGuardianCards.map((card) => card.id)).size, 52);
  assert.equal(pharaonicGuardianPack.releaseDate, "2002-03-21");
  assert.equal(pharaonicGuardianPack.cardIds.length, 53);
  assert.equal(pharaonicGuardianPack.cardIds.at(-1), "vol1-gaia");
  assert.equal(pharaonicGuardianPack.rarityOverrides?.["vol1-gaia"], "UR");
  assert.equal(pharaonicGuardianCards.filter((card) => card.cardType === "monster").length, 32);
  assert.equal(pharaonicGuardianCards.filter((card) => card.cardType === "spell").length, 8);
  assert.equal(pharaonicGuardianCards.filter((card) => card.cardType === "trap").length, 12);
  assert.deepEqual([...pharaonicGuardianReadyCardIds], pharaonicGuardianPack.cardIds);
});

test("代表カードの能力値とレアリティを再現する", () => {
  assert.deepEqual(pharaonicGuardianCards.find((card) => card.id === "ph-00"), { id: "ph-00", name: "不死王リッチー", cardType: "monster", kind: "アンデット族", attribute: "闇", level: 7, atk: 2600, def: 2900, rarity: "SE", effect: true });
  assert.equal(pharaonicGuardianCards.find((card) => card.id === "ph-08")?.rarity, "R");
  assert.equal(pharaonicGuardianCards.find((card) => card.id === "ph-25")?.def, 2400);
  assert.equal(pharaonicGuardianCards.find((card) => card.id === "ph-45")?.rarity, "SR");
  assert.equal(pharaonicGuardianCards.filter((card) => card.rarity === "UR").length, 3);
  assert.equal(pharaonicGuardianCards.filter((card) => card.rarity === "SR").length, 4);
});

test("サイクルリバース・直接攻撃・召喚制圧を裁定する", () => {
  assert.equal(isPharaonicCycleFlipMonster("ph-25"), true);
  assert.equal(isSpiritMonster("ph-17"), true);
  assert.equal(spiritReturnsAtEnd("ph-17", false, 3, 3), true);
  assert.equal(canMonsterAttackDirectly("ph-11"), true);
  assert.equal(canMonsterAttackDirectly("ph-12"), true);
  assert.deepEqual(pharaonicMonsterStats("ph-07", 2000, 2000, 0), { atk: 1000, def: 1000 });
  assert.deepEqual(pharaonicMonsterStats("ph-07", 2000, 2000, 1), { atk: 2000, def: 2000 });
  assert.deepEqual(pharaonicMonsterStats("ph-18", 1600, 1700, 0, true), { atk: 1900, def: 2000 });
  assert.equal(pharaonicBattleAttack("ph-24", 300, true), 2400);
  assert.equal(pharaonicAttackBlocked(1900, true), true);
  assert.equal(pharaonicSummonDestruction(1400, true), true);
  assert.equal(requiredTributes("ph-13", 9), 3);
});

test("戦闘・サイコロ・罠の主要効果を裁定する", () => {
  assert.equal(pharaonicBattleEffect("ph-10", { destroyedMonster: true }).skipOpponentMain1, true);
  assert.equal(pharaonicBattleEffect("ph-29", { dealtBattleDamage: true }).discardOpponentCard, true);
  assert.deepEqual(dicePotDamage(2, 4), { own: 2000, opponent: 0, reroll: false });
  assert.deepEqual(dicePotDamage(3, 3), { own: 0, opponent: 0, reroll: true });
  assert.deepEqual(dicePotDamage(6, 1), { own: 0, opponent: 6000, reroll: false });
  assert.equal(pharaonicTrapOutcome("ph-44", { monsterCount: 4 }).destroyFaceUp, true);
  assert.equal(pharaonicTrapOutcome("ph-48", { opponentHandCount: 4 }).returnMonsterToDeck, true);
  assert.deepEqual(pharaonicTrapOutcome("ph-50", { deckCount: 10 }), { activate: true, draw: 2, skipDraws: 2 });
  assert.equal(bottomlessShiftingSandTarget([1600, 2400, 2000]), 1);
});

test("全53種がカード一覧・テキスト・対戦処理・CPUへ接続される", async () => {
  const cardData = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
  const cardText = await readFile(new URL("../app/card-text.ts", import.meta.url), "utf8");
  const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");
  assert.match(cardData, /\.\.\.pharaonicGuardianCards/);
  assert.match(cardData, /pharaonicGuardianPack/);
  for (const card of pharaonicGuardianCards.filter((card) => card.effect || card.cardType !== "monster")) assert.match(cardText, new RegExp(`"${card.id}":`));
  for (const marker of ["setCycleFlipMonster", "dice-pot", "ph-32", "ph-44", "ph-50", "BUILD 192"]) assert.match(arena, new RegExp(marker));
});
