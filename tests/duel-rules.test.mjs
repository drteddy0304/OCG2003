import test from "node:test";
import assert from "node:assert/strict";
import { battleOutcome } from "../app/duel-rules.mjs";

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
