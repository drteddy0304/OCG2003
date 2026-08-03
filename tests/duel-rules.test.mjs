import test from "node:test";
import assert from "node:assert/strict";
import { advanceSwordsTurns, battleOutcome, deSpellDestroys, equipRules, firstSpellTargetIndex, flipEffect, shouldCpuActivateSwords, shouldCpuUseSimpleSpell, simpleSpellEffect, strongestAttackIndex, takeGraveyardCard } from "../app/duel-rules.mjs";

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

test("Vol.2の回復・ダメージ魔法の数値を適用する", () => {
  assert.deepEqual(simpleSpellEffect("vol2-goblin-secret-remedy"), { gain: 600, damage: 0 });
  assert.deepEqual(simpleSpellEffect("vol2-final-flame"), { gain: 0, damage: 600 });
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
  assert.equal(flipEffect("vol3-red-eyes"), null);
});
