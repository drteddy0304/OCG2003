import assert from "node:assert/strict";
import test from "node:test";
import { pharaohsServantCards, pharaohsServantReadyCardIds } from "../app/pharaohs-servant-data.ts";
import {
  attributeRecruiterAttribute,
  bestCpuAttributeRecruitTargetIndex,
  canAttributeRecruiterTarget,
  canSummonRitualSearchTarget,
  bestCpuDarkFamiliaTargetIndex,
  boarSoldierDestroyedOnSummon,
  continuousMonsterStats,
  darkFamiliaReviveTarget,
  darkZebraStandbyPosition,
  karateManAttack,
  sameNameBattleRecruitCount,
  sameNameBattleRecruitEffect,
  summonRitualSearchKind,
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

test("ファラオのしもべは完了カードだけを公開待ち一覧へ追加する", () => {
  ["ps-28", "ps-29", "ps-30", "ps-31", "ps-32", "ps-33", "ps-34", "ps-35", "ps-36", "ps-37", "ps-38", "ps-39", "ps-40", "ps-42", "ps-43"].forEach((id) => {
    assert.equal(pharaohsServantReadyCardIds.includes(id), true);
  });
  assert.equal(pharaohsServantReadyCardIds.includes("ps-00"), false);
});
