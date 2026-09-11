import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { curseOfAnubisCards, curseOfAnubisPack, curseOfAnubisReadyCardIds } from "../app/curse-of-anubis-data.ts";
import { ceasefireDamage, chainDestructionResult, chaosPotExcavate, continuousMonsterStats, equippedMonsterStats, flipEffect, holyElfBlessingGain, jinzoNegatesTraps, mirrorWallAttack, mirrorWallStandbyCost, whiteRobeAngelGain } from "../app/duel-rules.mjs";

test("Curse of Anubisは発売当時の全52種類を保持する", () => {
  assert.equal(curseOfAnubisCards.length, 52);
  assert.equal(new Set(curseOfAnubisCards.map((card) => card.id)).size, 52);
  assert.equal(curseOfAnubisPack.releaseDate, "2000-09-28");
  assert.equal(curseOfAnubisPack.cardIds.length, 52);
});

test("Curse of Anubisのカード種別内訳を固定する", () => {
  assert.equal(curseOfAnubisCards.filter((card) => card.cardType === "monster").length, 15);
  assert.equal(curseOfAnubisCards.filter((card) => card.cardType === "spell").length, 7);
  assert.equal(curseOfAnubisCards.filter((card) => card.cardType === "trap").length, 30);
  assert.equal(curseOfAnubisCards.filter((card) => card.effect).length, 5);
});

test("パック一覧と全カード一覧へ統合される", async () => {
  const source = await readFile(new URL("../app/card-data.ts", import.meta.url), "utf8");
  assert.match(source, /curseOfAnubisCards/);
  assert.match(source, /curseOfAnubisPack/);
});

test("サイコ・ショッカーとバスター・ブレイダーの常在効果を処理する", () => {
  assert.equal(jinzoNegatesTraps(["ca-00"], []), true);
  assert.equal(jinzoNegatesTraps([], ["ca-00"]), true);
  assert.equal(jinzoNegatesTraps([], []), false);
  assert.deepEqual(continuousMonsterStats({ id: "ca-51", atk: 2600, def: 2300, opponentDragonCount: 3 }), { atk: 4100, def: 2300 });
});

test("７カードは機械族へ装備できATKを700上げる", () => {
  assert.deepEqual(equippedMonsterStats(1000, 1000, ["ca-04"]), { atk: 1700, def: 1000 });
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-04"), true);
});

test("７カードはプレイヤーがATKかDEFを選びCPUも表示形式に合わせる", async () => {
  const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");
  assert.match(arena, /selectedSevenCardStat/);
  assert.match(arena, /ATKを700アップ/);
  assert.match(arena, /DEFを700アップ/);
  assert.match(arena, /sevenCardDefenseCount/);
});

test("銀幕の鏡壁は攻撃モンスターを半減し維持コストを計算する", async () => {
  assert.equal(mirrorWallAttack(2501, ["ca-16"]), 1250);
  assert.equal(mirrorWallAttack(2501, ["ca-16"], true), 2501);
  assert.equal(mirrorWallAttack(2501, []), 2501);
  assert.equal(mirrorWallStandbyCost(["ca-16", "ca-16"]), 4000);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-16"), true);
  const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");
  assert.match(arena, /activateCpuMirrorWall/);
  assert.match(arena, /applyMirrorWallStandby/);
  assert.match(arena, /respondToMirrorWallUpkeep/);
  assert.match(arena, /払わず破壊する/);
});

test("回復・バーン・連鎖破壊を共有ルールとして計算する", () => {
  assert.equal(holyElfBlessingGain(6), 1800);
  assert.equal(ceasefireDamage(4), 2000);
  assert.equal(whiteRobeAngelGain(2), 2000);
  assert.deepEqual(chainDestructionResult("ca-44", 1700, ["ca-44", "ca-50"], ["ca-44", "ca-44", "ca-01"]), {
    hand: ["ca-50"],
    deck: ["ca-01"],
    destroyed: ["ca-44", "ca-44", "ca-44"],
  });
  assert.equal(chainDestructionResult("ca-43", 2200, ["ca-43"], ["ca-43"]), null);
});

test("寄生虫パラサイドと3種類の罠は対戦画面へ接続される", async () => {
  const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");
  assert.match(arena, /effect === "parasite-deck"/);
  assert.match(arena, /resolveParasiteDraw/);
  assert.match(arena, /pending\.trapId === "ca-06"/);
  assert.match(arena, /chainDestructionResult/);
  assert.match(arena, /ホーリー・エルフの祝福を発動する/);
  assert.match(arena, /停戦協定を発動する/);
});

test("真実の眼・聖なる輝き・正々堂々は永続罠として対戦へ接続される", async () => {
  const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");
  assert.match(arena, /isCpuHandRevealed/);
  assert.match(arena, /applyEyeOfTruthStandby/);
  assert.match(arena, /isLightOfInterventionActive/);
  assert.match(arena, /"ca-10", "ca-31", "ca-32"/);
});

test("抹殺の使徒と撲滅の使徒は対象選択と同名カード除外へ接続される", async () => {
  const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");
  assert.match(arena, /card\.id === "ca-35"/);
  assert.match(arena, /card\.id === "ca-36"/);
  assert.match(arena, /resolveCurseRemoval/);
  assert.match(arena, /リバースモンスターだったため/);
});

test("カオスポッドは戻したモンスター数までめくり、下級だけを裏守備で出す", () => {
  const deck = [
    { id: "spell", cardType: "spell" },
    { id: "low", cardType: "monster", level: 4 },
    { id: "high", cardType: "monster", level: 6 },
    { id: "untouched", cardType: "trap" },
  ];
  assert.equal(flipEffect("ca-41"), "chaos-pot");
  assert.deepEqual(chaosPotExcavate(deck, 2), {
    remainingDeck: [deck[3]],
    summonIds: ["low"],
    graveIds: ["spell", "high"],
    revealedCount: 3,
  });
  assert.deepEqual(chaosPotExcavate(deck, 0), {
    remainingDeck: deck,
    summonIds: [],
    graveIds: [],
    revealedCount: 0,
  });
});

test("浅すぎた墓穴と検閲は対戦処理へ接続される", async () => {
  const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");
  assert.match(arena, /card\.id === "ca-37"/);
  assert.match(arena, /浅すぎた墓穴を発動/);
  assert.match(arena, /card\.id === "ca-39"/);
  assert.match(arena, /applyCardInspectionStandby/);
});

test("早すぎた埋葬と精神寄生体は蘇生・装備・スタンバイ処理へ接続される", async () => {
  const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");
  assert.match(arena, /card\.id === "ca-38"/);
  assert.match(arena, /applyPrematureBurialDestruction/);
  assert.match(arena, /defender\.id === "ca-47"/);
  assert.match(arena, /applySpiritParasiteStandby/);
});

test("刻の封印・ソロモンの律法書・ホーリージャベリンは双方のターン処理へ接続される", async () => {
  const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");
  assert.match(arena, /activateTimeSealForDraw/);
  assert.match(arena, /activateSolomonForStandby/);
  assert.match(arena, /activateHolyJavelinOnAttack/);
  for (const id of ["ca-07", "ca-13", "ca-15"]) assert.equal(curseOfAnubisReadyCardIds.includes(id), true);
});

test("砂塵の大竜巻・リビングデッドの呼び声・補充要員は双方の対象処理へ接続される", async () => {
  const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");
  assert.match(arena, /resolveDustTornado/);
  assert.match(arena, /resolveCallHaunted/);
  assert.match(arena, /confirmBackupSoldier/);
  assert.match(arena, /resolveCpuCurseOfAnubisTraps/);
  assert.match(arena, /applyCallHauntedDestruction/);
  for (const id of ["ca-11", "ca-12", "ca-28"]) assert.equal(curseOfAnubisReadyCardIds.includes(id), true);
});

test("光の封札剣・墓荒らし・王宮の勅命は双方の手札と魔法処理へ接続される", async () => {
  const arena = await readFile(new URL("../app/DuelArena.tsx", import.meta.url), "utf8");
  assert.match(arena, /remainingStandbys: 4/);
  assert.match(arena, /resolveGraverobber/);
  assert.match(arena, /playerGraverobbedCards/);
  assert.match(arena, /areSpellEffectsNegated/);
  assert.match(arena, /applyImperialOrderStandby/);
  for (const id of ["ca-05", "ca-08", "ca-33"]) assert.equal(curseOfAnubisReadyCardIds.includes(id), true);
});

test("実装済み一覧は未接続効果を完成扱いしない", () => {
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-00"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-06"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-10"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-31"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-32"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-35"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-36"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-37"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-39"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-51"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-03"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-41"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-38"), true);
  assert.equal(curseOfAnubisReadyCardIds.includes("ca-47"), true);
});

test("全カードに固有の説明文が用意される", async () => {
  const text = await readFile(new URL("../app/card-text.ts", import.meta.url), "utf8");
  curseOfAnubisCards.filter((card) => card.effect || card.cardType !== "monster").forEach((card) => {
    assert.match(text, new RegExp(`"${card.id}"\\s*:`));
  });
});
