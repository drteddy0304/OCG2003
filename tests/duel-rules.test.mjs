import test from "node:test";
import assert from "node:assert/strict";
import { advanceSwordsTurns, battleOutcome, equipRules, simpleSpellEffect } from "../app/duel-rules.mjs";

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
