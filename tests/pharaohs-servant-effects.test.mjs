import assert from "node:assert/strict";
import test from "node:test";
import { pharaohsServantCards, pharaohsServantReadyCardIds } from "../app/pharaohs-servant-data.ts";
import {
  attributeRecruiterAttribute,
  banisherRedirectsToExile,
  bestCpuAttributeRecruitTargetIndex,
  canAttributeRecruiterTarget,
  canSummonRitualSearchTarget,
  bestCpuDarkFamiliaTargetIndex,
  boarSoldierDestroyedOnSummon,
  ceremonyBellRevealsHands,
  canSpecialSummonToon,
  cyberJarReveal,
  continuousMonsterStats,
  darkFamiliaReviveTarget,
  darkZebraStandbyPosition,
  destroyEquippedMonsterIndexes,
  equippedMonsterStats,
  hornOfUnicornReturnsToDeckTop,
  karateManAttack,
  kotodamaDuplicateIndexes,
  magicalLabyrinthCanEquip,
  magicalLabyrinthSummonIndex,
  megamorphAttack,
  messengerOfPeacePreventsAttack,
  messengerOfPeaceStandbyCost,
  pharaohSummonResponseTrap,
  sameNameBattleRecruitCount,
  sameNameBattleRecruitEffect,
  summonRitualSearchKind,
  shouldCpuKeepMessengerOfPeace,
  timeBomberEffect,
  toonAttackDeclaration,
  toonDestroyedWithWorld,
  toonSummonTributeCount,
  toonWorldActivationCost,
} from "../app/duel-rules.mjs";

const byId = new Map(pharaohsServantCards.map((card) => [card.id, card]));

test("6属性のリクルーターはATK1500以下の同属性だけを特殊召喚する", () => {
  assert.equal(attributeRecruiterAttribute("ps-28"), "地");
  assert.equal(attributeRecruiterAttribute("ps-30"), "炎");
  assert.equal(attributeRecruiterAttribute("ps-37"), "光");
  assert.equal(attributeRecruiterAttribute("ps-39"), "水");
  assert.equal(attributeRecruiterAttribute("ps-40"), "風");
  assert.equal(attributeRecruiterAttribute("ps-43"), "闇");
  assert.equal(canAttributeRecruiterTarget("ps-28", { cardType: "monster", attribute: "地", atk: 1500 }), true);
  assert.equal(canAttributeRecruiterTarget("ps-28", { cardType: "monster", attribute: "地", atk: 1550 }), false);
  assert.equal(canAttributeRecruiterTarget("ps-28", { cardType: "monster", attribute: "闇", atk: 1000 }), false);
});

test("CPUはリクルーターから呼べる中で最も攻撃力が高い候補を選ぶ", () => {
  const deck = [byId.get("ps-02"), byId.get("ps-28"), byId.get("ps-32")];
  assert.equal(bestCpuAttributeRecruitTargetIndex("ps-28", deck), 1);
});

test("センジュ・ゴッドとソニックバードは対応する儀式カードだけを検索する", () => {
  assert.equal(summonRitualSearchKind("ps-29"), "ritual-monster");
  assert.equal(summonRitualSearchKind("ps-42"), "ritual-spell");
  assert.equal(canSummonRitualSearchTarget("ps-29", byId.get("ps-16")), true);
  assert.equal(canSummonRitualSearchTarget("ps-29", byId.get("ps-11")), false);
  assert.equal(canSummonRitualSearchTarget("ps-42", byId.get("ps-11")), true);
});

test("カラテマンは効果使用ターンだけ元々のATKが倍になる", () => {
  assert.equal(karateManAttack("ps-32", 1000, true), 2000);
  assert.equal(karateManAttack("ps-32", 1000, false), 1000);
});

test("秒殺の暗殺者は手札1枚ごとにATK・DEFが400下がる", () => {
  assert.deepEqual(continuousMonsterStats({ id: "ps-31", atk: 2000, def: 2000, handSize: 3 }), { atk: 800, def: 800 });
});

test("ダークゼブラとボアソルジャーの表示・破壊・弱体化条件を判定する", () => {
  assert.equal(darkZebraStandbyPosition("ps-33", 0), "defense");
  assert.equal(darkZebraStandbyPosition("ps-33", 1), null);
  assert.equal(boarSoldierDestroyedOnSummon("ps-38", "normal"), true);
  assert.equal(boarSoldierDestroyedOnSummon("ps-38", "special"), false);
  assert.deepEqual(continuousMonsterStats({ id: "ps-38", atk: 2000, def: 500, opponentMonsterCount: 1 }), { atk: 1000, def: 500 });
});

test("ジャイアントウィルスと素早いモモンガは空き枠まで同名カードを呼ぶ", () => {
  assert.deepEqual(sameNameBattleRecruitEffect("ps-34"), { damageToOpponent: 500, lifeGain: 0, summonId: "ps-34", position: "attack" });
  assert.deepEqual(sameNameBattleRecruitEffect("ps-35"), { damageToOpponent: 0, lifeGain: 1000, summonId: "ps-35", position: "defense" });
  assert.equal(sameNameBattleRecruitCount("ps-34", 2, 1), 1);
  assert.equal(sameNameBattleRecruitCount("ps-35", 2, 3), 2);
});

test("ダークファミリアは自身以外を蘇生し、CPUは最高ATKを選ぶ", () => {
  assert.equal(darkFamiliaReviveTarget(byId.get("ps-36"), true), false);
  assert.equal(darkFamiliaReviveTarget(byId.get("ps-36"), false), true);
  assert.equal(darkFamiliaReviveTarget(byId.get("ps-24")), true);
  assert.equal(bestCpuDarkFamiliaTargetIndex([byId.get("ps-02"), byId.get("ps-24"), byId.get("ps-36")], 2), 1);
});

test("一角獣のホーンはATK・DEFを700上げ、フィールドを離れるとデッキトップへ戻る", () => {
  assert.deepEqual(equippedMonsterStats(1000, 800, ["ps-03"]), { atk: 1700, def: 1500 });
  assert.equal(hornOfUnicornReturnsToDeckTop(["ps-03"], []), true);
  assert.equal(hornOfUnicornReturnsToDeckTop(["ps-03"], ["ps-03"]), false);
});

test("迷宮変化は迷宮壁だけに装備し、デッキのウォール・シャドウを呼ぶ", () => {
  assert.equal(magicalLabyrinthCanEquip("ps-04"), true);
  assert.equal(magicalLabyrinthCanEquip("ps-07"), false);
  assert.equal(magicalLabyrinthSummonIndex(["ps-02", "ps-05"], true), 1);
  assert.equal(magicalLabyrinthSummonIndex(["ps-05"], false), -1);
});

test("巨大化はLP差に応じて元々のATKを倍・半分・等倍にする", () => {
  assert.equal(megamorphAttack(2000, 3000, 4000), 4000);
  assert.equal(megamorphAttack(2000, 5000, 4000), 1000);
  assert.equal(megamorphAttack(2000, 4000, 4000), 2000);
});

test("粘着テープの家とねずみ取りは召喚・反転召喚時だけ対応能力値を確認する", () => {
  assert.equal(pharaohSummonResponseTrap(["ps-13"], { atk: 2000, def: 500 }, "normal"), "ps-13");
  assert.equal(pharaohSummonResponseTrap(["ps-14"], { atk: 500, def: 2000 }, "flip"), "ps-14");
  assert.equal(pharaohSummonResponseTrap(["ps-13", "ps-14"], { atk: 500, def: 500 }, "special"), null);
});

test("光の追放者・セレモニーベル・コトダマの永続条件を判定する", () => {
  assert.equal(banisherRedirectsToExile(["ps-27"]), true);
  assert.equal(ceremonyBellRevealsHands(["ps-41"]), true);
  assert.deepEqual(kotodamaDuplicateIndexes(["青眼の白龍", "デーモンの召喚", "青眼の白龍"]), [0, 2]);
});

test("平和の使者はATK1500以上を止め、CPUは劣勢時だけ維持する", () => {
  assert.equal(messengerOfPeacePreventsAttack(1500, ["ps-51"]), true);
  assert.equal(messengerOfPeacePreventsAttack(1499, ["ps-51"]), false);
  assert.equal(messengerOfPeaceStandbyCost(2), 200);
  assert.equal(shouldCpuKeepMessengerOfPeace(800, 1, 1200, 2000), true);
  assert.equal(shouldCpuKeepMessengerOfPeace(100, 1, 1200, 2000), false);
  assert.equal(shouldCpuKeepMessengerOfPeace(800, 1, 2000, 1200), false);
});

test("トゥーン4体はトゥーン・ワールド、召喚酔い、500LP、直接攻撃を正しく扱う", () => {
  assert.equal(toonSummonTributeCount("ps-00"), 2);
  assert.equal(toonSummonTributeCount("ps-21"), 0);
  assert.equal(canSpecialSummonToon("ps-22", true, 1, 5), true);
  assert.equal(canSpecialSummonToon("ps-22", false, 5, 1), false);
  assert.equal(toonAttackDeclaration("ps-20", 2, 2, 4000, true, 0), null);
  assert.deepEqual(toonAttackDeclaration("ps-20", 2, 3, 4000, true, 0), { lifeCost: 500, directAttack: true, mustAttackToon: false });
  assert.deepEqual(toonAttackDeclaration("ps-20", 2, 3, 4000, true, 1), { lifeCost: 500, directAttack: false, mustAttackToon: true });
  assert.equal(toonDestroyedWithWorld("ps-00", true), true);
  assert.equal(toonWorldActivationCost("ps-25", 1001), 1000);
  assert.equal(toonWorldActivationCost("ps-25", 1000), null);
});

test("タイム・ボマー、サイバーポッド、撲滅の使徒を解決する", () => {
  assert.deepEqual(timeBomberEffect("ps-23", true, "standby", [1000, 450]), { destroyCount: 2, damage: 725 });
  assert.equal(timeBomberEffect("ps-23", false, "standby", [1000]), null);
  assert.deepEqual(destroyEquippedMonsterIndexes([{ equipped: [] }, { equipped: ["ps-03"] }]), [1]);
  const revealed = [byId.get("ps-02"), byId.get("ps-05"), byId.get("ps-11"), byId.get("ps-21"), byId.get("ps-26")];
  assert.deepEqual(cyberJarReveal(revealed, 5).summonCards.map((card) => card.id), ["ps-02", "ps-26"]);
  assert.deepEqual(cyberJarReveal(revealed, 5).handCards.map((card) => card.id), ["ps-05", "ps-11", "ps-21"]);
});

test("ファラオのしもべ全52種類が公開一覧に揃う", () => {
  assert.equal(pharaohsServantReadyCardIds.length, 52);
  pharaohsServantCards.forEach((card) => assert.equal(pharaohsServantReadyCardIds.includes(card.id), true));
});
