import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spellOfMaskCards, spellOfMaskPack, spellOfMaskReadyCardIds } from "../app/spell-of-mask-data.ts";
import { fusionRecipe } from "../app/fusion-rules.mjs";
import { equippedMonsterStats, maskOfRestrictBlocksTribute, paralyzingPotionPreventsAttack, ritualSummonDefinition } from "../app/duel-rules.mjs";

test("Spell of Maskは2001年4月19日発売の全52種類", () => {
  assert.equal(spellOfMaskPack.releaseDate, "2001-04-19");
  assert.equal(spellOfMaskCards.length, 52);
  assert.equal(new Set(spellOfMaskCards.map((card) => card.id)).size, 52);
  assert.deepEqual(spellOfMaskPack.cardIds, spellOfMaskCards.map((card) => card.id));
});

test("史実どおりモンスター31・魔法14・罠7を収録する", () => {
  assert.equal(spellOfMaskCards.filter((card) => card.cardType === "monster").length, 31);
  assert.equal(spellOfMaskCards.filter((card) => card.cardType === "spell").length, 14);
  assert.equal(spellOfMaskCards.filter((card) => card.cardType === "trap").length, 7);
  assert.equal(spellOfMaskCards.filter((card) => card.effect).length, 16);
  assert.equal(spellOfMaskCards.filter((card) => card.fusion).length, 2);
  assert.equal(spellOfMaskCards.filter((card) => card.ritual).length, 1);
});

test("仮面装備と生贄封じをデュエル計算へ接続する", () => {
  assert.deepEqual(equippedMonsterStats(1000, 1200, ["sm-19"]), { atk: 2000, def: 200 });
  assert.deepEqual(equippedMonsterStats(1000, 1200, ["sm-21"]), { atk: 1800, def: 1200 });
  assert.deepEqual(equippedMonsterStats(1000, 1200, ["sm-48"], 3), { atk: 3400, def: 3600 });
  assert.deepEqual(equippedMonsterStats(1000, 1200, ["sm-49"], 0, 4), { atk: 3000, def: 3200 });
  assert.equal(paralyzingPotionPreventsAttack(["sm-18"]), true);
  assert.equal(maskOfRestrictBlocksTribute(["sm-17"], false), true);
  assert.equal(maskOfRestrictBlocksTribute(["sm-17"], true), false);
});

test("代表カードの能力値・儀式・融合素材が正しい", () => {
  const byId = new Map(spellOfMaskCards.map((card) => [card.id, card]));
  assert.deepEqual({ atk: byId.get("sm-00")?.atk, def: byId.get("sm-00")?.def, rarity: byId.get("sm-00")?.rarity }, { atk: 3200, def: 1800, rarity: "SE" });
  assert.deepEqual({ atk: byId.get("sm-12")?.atk, effect: byId.get("sm-12")?.effect }, { atk: 2000, effect: true });
  assert.deepEqual(fusionRecipe("sm-04"), ["sm-03", "sm-02"]);
  assert.deepEqual(fusionRecipe("sm-44"), ["sm-43", "sm-45"]);
  assert.deepEqual(ritualSummonDefinition("sm-15"), { monsterId: "sm-00", level: 8 });
  assert.ok(spellOfMaskReadyCardIds.includes("sm-15"));
});

test("パック一覧と全カード一覧へ接続しCPUも新カードを使用する", async () => {
  const cardData = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
  const cpuSource = await readFile(new URL("../app/cpu-opponents.ts", import.meta.url), "utf8");
  assert.match(cardData, /\.\.\.spellOfMaskCards/);
  assert.match(cardData, /spellOfMaskPack/);
  assert.match(cpuSource, /"sm-00"/);
  assert.match(cpuSource, /"sm-51"/);
});
