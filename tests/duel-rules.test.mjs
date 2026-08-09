import test from "node:test";
import assert from "node:assert/strict";
import { advanceSwordsTurns, battleDamageEffect, battleOutcome, bestCpuBattleTargetIndex, canMonsterAttackDirectly, canNormalSummonMonster, competitiveCpuDeck, deSpellDestroys, equipRules, equippedMonsterStats, firstSpellTargetIndex, flipEffect, isElegantEgotistTarget, moveDeckCard, shouldCpuActivateSwords, shouldCpuUseSimpleSpell, shouldPlayerChooseFlipTarget, simpleSpellEffect, strongestAttackIndex, takeGraveyardCard } from "../app/duel-rules.mjs";

test("攻撃表示の弱いプレイヤーモンスターがCPUの攻撃で破壊される", () => {
  assert.deepEqual(battleOutcome(1200, 800, "attack"), {
    attackerDestroyed: false,
    defenderDestroyed: true,
    attackerDamage: 0,
    defenderDamage: 400,
  });
});

test("守備力を上回った場合は守備モンスターが破壊される", () => {
  assert.deepEqual(battleOutcome(1200, 700, "defense"), {
    attackerDestroyed: false,
    defenderDestroyed: true,
    attackerDamage: 0,
    defenderDamage: 0,
  });
});

test("攻撃力と守備力が同じ場合は守備モンスターが破壊されない", () => {
  assert.deepEqual(battleOutcome(700, 700, "defense"), {
    attackerDestroyed: false,
    defenderDestroyed: false,
    attackerDamage: 0,
    defenderDamage: 0,
  });
});

test("守備力に負けても攻撃モンスターは破壊されず差分ダメージだけ受ける", () => {
  assert.deepEqual(battleOutcome(700, 1200, "defense"), {
    attackerDestroyed: false,
    defenderDestroyed: false,
    attackerDamage: 500,
    defenderDamage: 0,
  });
});

test("Vol.2の装備魔法5枚が正しい種族に対応する", () => {
  assert.deepEqual(
    Object.entries(equipRules).filter(([id]) => id.startsWith("vol2-")),
    [
      ["vol2-dark-energy", "悪魔族"],
      ["vol2-laser-cannon-armor", "昆虫族"],
      ["vol2-vile-germs", "植物族"],
      ["vol2-machine-conversion-factory", "機械族"],
      ["vol2-raise-body-heat", "恐竜族"],
    ],
  );
});

test("Vol.3の装備魔法5枚が正しい種族に対応する", () => {
  assert.deepEqual(
    Object.entries(equipRules).filter(([id]) => id.startsWith("vol3-")),
    [
      ["vol3-silver-bow-arrow", "天使族"],
      ["vol3-dragon-treasure", "ドラゴン族"],
      ["vol3-electro-whip", "雷族"],
      ["vol3-mystical-moon", "獣戦士族"],
      ["vol3-follow-wind", "鳥獣族"],
    ],
  );
});

test("Vol.2の回復・ダメージ魔法の数値を適用する", () => {
  assert.deepEqual(simpleSpellEffect("vol2-goblin-secret-remedy"), { gain: 600, damage: 0 });
  assert.deepEqual(simpleSpellEffect("vol2-final-flame"), { gain: 0, damage: 600 });
});

test("Booster 1・STARTER BOXの回復・ダメージ魔法の数値を適用する", () => {
  assert.deepEqual(simpleSpellEffect("bo1-blue-potion"), { gain: 400, damage: 0 });
  assert.deepEqual(simpleSpellEffect("bo1-thunder"), { gain: 0, damage: 300 });
  assert.deepEqual(simpleSpellEffect("stb-moyan-curry"), { gain: 200, damage: 0 });
  assert.deepEqual(simpleSpellEffect("stb-fireball"), { gain: 0, damage: 500 });
});

test("光の護封剣はCPUターン3回で終了する", () => {
  assert.deepEqual(advanceSwordsTurns([3]), { remaining: [2], expired: 0 });
  assert.deepEqual(advanceSwordsTurns([2]), { remaining: [1], expired: 0 });
  assert.deepEqual(advanceSwordsTurns([1]), { remaining: [], expired: 1 });
});

test("死者蘇生で選んだ墓地のモンスターだけを取り出す", () => {
  assert.deepEqual(takeGraveyardCard(["monster-a", "spell", "monster-b"], 2), {
    cardId: "monster-b",
    remaining: ["monster-a", "spell"],
  });
  assert.equal(takeGraveyardCard(["monster-a"], 3), null);
});

test("魔法除去は魔法だけを破壊し、罠は元に戻す", () => {
  assert.equal(deSpellDestroys("spell"), true);
  assert.equal(deSpellDestroys("trap"), false);
  assert.equal(deSpellDestroys("monster", "vol4-cocoon-evolution"), true);
});

test("CPUは回復量が無駄にならない時だけ回復魔法を使う", () => {
  assert.equal(shouldCpuUseSimpleSpell("vol2-goblin-secret-remedy", 8000), false);
  assert.equal(shouldCpuUseSimpleSpell("vol2-goblin-secret-remedy", 7400), true);
  assert.equal(shouldCpuUseSimpleSpell("vol2-final-flame", 8000), true);
});

test("CPUは相手モンスターがいる時だけ光の護封剣を発動する", () => {
  assert.equal(shouldCpuActivateSwords(1, 0, 4), true);
  assert.equal(shouldCpuActivateSwords(0, 0, 4), false);
  assert.equal(shouldCpuActivateSwords(1, 1, 4), false);
  assert.equal(shouldCpuActivateSwords(1, 0, 5), false);
});

test("CPUの死者蘇生は攻撃力が最も高いモンスターを選ぶ", () => {
  assert.equal(strongestAttackIndex([800, 2500, 1200]), 1);
  assert.equal(strongestAttackIndex([]), null);
});

test("CPUの魔法除去は表側魔法を選び、罠だけなら温存する", () => {
  assert.equal(firstSpellTargetIndex(["trap", "spell", "spell"]), 1);
  assert.equal(firstSpellTargetIndex(["trap", "trap"]), null);
});

test("Vol.3のリバースモンスター5体を正しい効果として扱う", () => {
  assert.equal(flipEffect("vol3-reaper-cards"), "destroy-trap");
  assert.equal(flipEffect("vol3-armed-ninja"), "destroy-spell");
  assert.equal(flipEffect("vol3-man-eater-bug"), "destroy-monster");
  assert.equal(flipEffect("vol3-skelengel"), "draw");
  assert.equal(flipEffect("vol3-hane-hane"), "return-monster");
  assert.equal(flipEffect("vol4-magician-faith"), "recover-spell");
  assert.equal(flipEffect("vol4-mask-darkness"), "recover-trap");
  assert.equal(flipEffect("vol3-red-eyes"), null);
});

test("自分のリバース効果はCPUのバトル中でも自分で対象を選べる", () => {
  assert.equal(shouldPlayerChooseFlipTarget("player", "cpu", "battle"), true);
  assert.equal(shouldPlayerChooseFlipTarget("player", "cpu", "main1"), false);
  assert.equal(shouldPlayerChooseFlipTarget("cpu", "player", "battle"), false);
});

test("Vol.5の直接攻撃モンスター6体を判定する", () => {
  for (const id of ["vol5-mystic-lamp", "vol5-leghul", "vol5-ooguchi", "vol5-jinzo-7", "vol5-rainbow-flower", "vol5-queens-double"]) {
    assert.equal(canMonsterAttackDirectly(id), true);
  }
  assert.equal(canMonsterAttackDirectly("vol5-feral-imp"), false);
});

test("Vol.5の戦闘ダメージ発動効果を判定する", () => {
  assert.equal(battleDamageEffect("vol5-white-magical-hat"), "discard-random");
  assert.equal(battleDamageEffect("vol5-masked-sorcerer"), "draw");
  assert.equal(battleDamageEffect("vol5-feral-imp"), null);
});

test("大王目玉はデッキ上5枚を並べ替えるリバース効果を持つ", () => {
  assert.equal(flipEffect("vol5-big-eye"), "reorder-five");
  assert.deepEqual(moveDeckCard(["a", "b", "c", "d", "e"], 3, 1), ["a", "d", "b", "c", "e"]);
  assert.deepEqual(moveDeckCard(["a", "b"], 0, 5), ["a", "b"]);
});

test("万華鏡はハーピィ・レディと三姉妹だけを特殊召喚できる", () => {
  assert.equal(isElegantEgotistTarget("vol4-harpie-lady"), true);
  assert.equal(isElegantEgotistTarget("vol4-harpie-sisters"), true);
  assert.equal(isElegantEgotistTarget("vol4-summoned-skull"), false);
});

test("ハーピィ・レディ三姉妹は通常召喚できない", () => {
  assert.equal(canNormalSummonMonster("vol4-harpie-sisters"), false);
  assert.equal(canNormalSummonMonster("vol4-harpie-lady"), true);
  assert.equal(canNormalSummonMonster("vol4-deepsea-shark", true), false);
});

test("進化の繭を装備したプチモスはATK0・DEF2000になる", () => {
  assert.deepEqual(equippedMonsterStats(300, 200, ["vol4-cocoon-evolution"]), { atk: 0, def: 2000 });
  assert.deepEqual(equippedMonsterStats(300, 200, ["vol4-cocoon-evolution", "equip-card"]), { atk: 300, def: 2300 });
});

test("強化CPUは40枚デッキを使い、同名カードは3枚までにする", () => {
  assert.equal(competitiveCpuDeck.length, 40);
  const counts = competitiveCpuDeck.reduce((result, id) => ({ ...result, [id]: (result[id] ?? 0) + 1 }), {});
  assert.ok(Math.max(...Object.values(counts)) <= 3);
  assert.equal(counts["vol1-dark-hole"], 1);
  assert.equal(counts["vol2-monster-reborn"], 1);
  assert.equal(counts["vol3-pot-of-greed"], 1);
  assert.ok(counts["vol3-man-eater-bug"] >= 1);
});

test("CPUは勝てる相手を攻撃し、表側の強敵へ自滅攻撃しない", () => {
  assert.equal(bestCpuBattleTargetIndex(1600, [
    { position: "attack", faceDown: false, atk: 2000, def: 1000 },
    { position: "defense", faceDown: false, atk: 800, def: 1200 },
  ]), 1);
  assert.equal(bestCpuBattleTargetIndex(1600, [
    { position: "attack", faceDown: false, atk: 2000, def: 1000 },
    { position: "defense", faceDown: false, atk: 800, def: 2000 },
  ]), null);
  assert.equal(bestCpuBattleTargetIndex(1600, [
    { position: "defense", faceDown: true, atk: 0, def: 2000 },
  ]), 0);
});
