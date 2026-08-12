import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");

test("Vol.7の起動効果に専用の操作導線がある", () => {
  assert.match(arena, /カタパルト・タートルの効果を使う/);
  assert.match(arena, /捨てて同名カードをサーチ/);
  assert.match(arena, /catapultUsedTurn/);
  assert.match(arena, /pendingCatapultTurtle !== null/);
  assert.match(arena, /リボルバー・ドラゴンの効果を使う/);
  assert.match(arena, /pendingBarrelDragon !== null/);
  assert.match(arena, /function useCpuBarrelDragon/);
});

test("攻撃・守備表示はプレイヤーごとの正しい向きになる", () => {
  assert.match(css, /\.zones-player \.field-card\.attack \{ transform: rotate\(0deg\)/);
  assert.match(css, /\.zones-player \.field-card\.defense \{ transform: rotate\(90deg\)/);
  assert.match(css, /\.zones-cpu \.field-card\.attack \{ transform: rotate\(180deg\)/);
  assert.match(css, /\.zones-cpu \.field-card\.defense \{ transform: rotate\(-90deg\)/);
});

test("キャノン・ソルジャーの対象選択には専用の読みやすい画面を使う", () => {
  assert.match(arena, /className="card-overlay cannon-soldier-overlay"/);
  assert.match(arena, /className="cannon-soldier-panel"/);
  assert.match(arena, /className="target-list cannon-target-list"/);
  assert.match(css, /\.cannon-soldier-panel \{[^}]*max-height: 84vh;[^}]*overflow: auto;/);
  assert.match(css, /\.cannon-target-list \{[^}]*max-height: 48vh;[^}]*overflow: auto;/);
  assert.match(css, /\.feedback-effect \.action-cut-in strong \{[^}]*overflow-wrap: anywhere;/);
});

test("CPUの行動は処理済みの結果一覧としてまとめて表示する", () => {
  assert.match(arena, /CPU ACTION RESULT/);
  assert.match(arena, /以下はすべて盤面へ反映済みです/);
  assert.match(arena, /className="cpu-result-list"/);
  assert.doesNotMatch(arena, />次の行動</);
  assert.match(css, /\.cpu-result-list \{[^}]*max-height: 48vh;[^}]*overflow: auto;/);
});

test("フィールドのカードに攻撃表示・守備表示を明記する", () => {
  assert.match(arena, /攻撃表示・縦/);
  assert.match(arena, /守備表示・横/);
});
