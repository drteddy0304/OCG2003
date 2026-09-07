import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");

test("鎖付きブーメランは攻撃停止・装備・両方を選択できる", () => {
  assert.match(source, /respondToChainBoomerang\(mode: "decline" \| "stop" \| "equip" \| "both"/);
  assert.match(source, />攻撃を止める</);
  assert.match(source, />攻撃を止めて装備</);
  assert.match(source, />装備だけ行う</);
});

test("鎖付きブーメランはプレイヤーとCPUの攻撃宣言処理へ接続される", () => {
  assert.match(source, /prepareChainBoomerang\(state, index, null\)/);
  assert.match(source, /prepareChainBoomerang\(state, index, targetIndex\)/);
  assert.match(source, /duel\.cpuSpellTrap\.indexOf\("pr99-kunai-chain"\)/);
  assert.match(source, /state\.cpuHand\.includes\("pr99-kunai-chain"\)/);
});

test("同じ未対応群の硫酸のたまった落とし穴も対象選択とDEF判定を行う", () => {
  assert.match(source, /function resolveAcidTrapHole\(targetIndex: number\)/);
  assert.match(source, /\?\.def \?\? 0\) <= 2000/);
  assert.match(source, />硫酸のたまった落とし穴を発動する</);
});
