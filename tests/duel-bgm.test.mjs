import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const audio = await readFile(new URL("../app/duel-audio.ts", import.meta.url), "utf8");
const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");

test("デュエル中はオリジナルのチップチューンBGMをループ再生する", () => {
  assert.match(audio, /MODERN_JPOP_CHIP_SONG/);
  assert.match(audio, /Intro:[\s\S]+Verse:[\s\S]+Pre-chorus:[\s\S]+Chorus:/);
  assert.match(audio, /scheduleChipSong/);
  assert.match(audio, /158/);
  assert.match(audio, /energy: 3/);
  assert.match(audio, /export function startDuelBgm/);
  assert.match(audio, /export function stopDuelBgm/);
  assert.match(arena, /if \(duel && soundEnabled\) startDuelBgm\(true\)/);
});

test("音声切替はBGMと効果音の両方に連動する", () => {
  assert.match(arena, /音声・BGM/);
  assert.match(arena, /音声とBGMを/);
  assert.match(arena, /else stopDuelBgm\(\)/);
});
