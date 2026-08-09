import assert from "node:assert/strict";
import test from "node:test";
import { feedbackForMessage } from "../app/duel-feedback.mjs";

test("攻撃して撃破した時は攻撃演出の後に撃破演出を出す", () => {
  assert.deepEqual(
    feedbackForMessage("暗黒騎士ガイアがワイトを攻撃。ワイトを破壊。" ).map((item) => item.kind),
    ["attack", "destroy"],
  );
});

test("守備表示を倒せなかった時は攻撃と守備成功の演出を出す", () => {
  assert.deepEqual(
    feedbackForMessage("ルイーズが岩石の巨兵を攻撃。モンスターは破壊されない。800ダメージ。" ).map((item) => item.kind),
    ["attack", "guard"],
  );
});

test("効果・魔法・罠を別々の演出として判定する", () => {
  assert.equal(feedbackForMessage("人喰い虫がリバース。モンスターを破壊した。")[0].kind, "effect");
  assert.equal(feedbackForMessage("ブラック・ホールを発動。")[0].kind, "spell");
  assert.equal(feedbackForMessage("落とし穴を発動。モンスターを破壊。")[0].kind, "trap");
});

test("直接攻撃には専用演出を出す", () => {
  assert.equal(feedbackForMessage("デーモンの召喚の直接攻撃。2500ダメージ。")[0].title, "DIRECT ATTACK");
  assert.equal(feedbackForMessage("デーモンの召喚の直接攻撃。2500ダメージ。")[0].detail, "デーモンの召喚");
});

test("攻撃・魔法演出にはカード名を表示する", () => {
  assert.equal(feedbackForMessage("暗黒騎士ガイアがワイトを攻撃。ワイトを破壊。")[0].detail, "暗黒騎士ガイア  VS  ワイト");
  assert.equal(feedbackForMessage("CPUがブラック・ホールを発動。すべてのモンスターを破壊。")[0].detail, "ブラック・ホール");
});
