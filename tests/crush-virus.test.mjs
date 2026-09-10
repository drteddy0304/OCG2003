import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");

test("死のデッキ破壊ウイルスはプレイヤーが生け贄を選んで発動できる", () => {
  assert.match(source, /function beginCrushVirus/);
  assert.match(source, /function resolveCrushVirus/);
  assert.match(source, /死のデッキ破壊ウイルスを発動する/);
  assert.match(source, /リリースする闇属性・ATK1000以下/);
});

test("死のデッキ破壊ウイルスはCPUも判断して使い、双方の3ターンドローを監視する", () => {
  assert.match(source, /function useCpuCrushVirus/);
  assert.match(source, /playerCrushVirusTurns: 3/);
  assert.match(source, /cpuCrushVirusTurns: 3/);
  assert.match(source, /virusDestroyed = state\.cpuCrushVirusTurns > 0/);
  assert.match(source, /playerDrawDestroyed = playerDrawId !== null && state\.playerCrushVirusTurns > 0/);
});
