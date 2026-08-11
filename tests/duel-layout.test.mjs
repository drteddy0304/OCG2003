import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");

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
});
