import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DUEL_BGM_THEMES, duelBgmTitle } from "../app/duel-audio.ts";

const audio = await readFile(new URL("../app/duel-audio.ts", import.meta.url), "utf8");
const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");

test("15人の対戦キャラに異なるオリジナルBGMを割り当てる", () => {
  const themes = Object.values(DUEL_BGM_THEMES);
  assert.equal(themes.length, 15);
  assert.equal(new Set(themes.map((theme) => theme.title)).size, 15);
  assert.equal(new Set(themes.map((theme) => `${theme.bpm}:${theme.root}:${theme.motif.join(",")}`)).size, 15);
  assert.equal(duelBgmTitle("seto-kaiba"), "蒼眼オーバードライブ");
  assert.match(audio, /scheduleCharacterSong/);
  assert.match(audio, /export function startDuelBgm/);
  assert.match(audio, /export function stopDuelBgm/);
  assert.match(arena, /startDuelBgm\(true, selectedOpponentId\)/);
  assert.match(arena, /BGM · \{duelBgmTitle\(opponent\.id\)\}/);
});

test("音声切替はBGMと効果音の両方に連動する", () => {
  assert.match(arena, /音声・BGM/);
  assert.match(arena, /音声とBGMを/);
  assert.match(arena, /else stopDuelBgm\(\)/);
});
