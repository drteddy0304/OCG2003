import assert from "node:assert/strict";
import test from "node:test";
import { pharaohsServantCards, pharaohsServantReadyCardIds } from "../app/pharaohs-servant-data.ts";
import {
  attributeRecruiterAttribute,
  bestCpuAttributeRecruitTargetIndex,
  canAttributeRecruiterTarget,
  canSummonRitualSearchTarget,
  karateManAttack,
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

test("ファラオのしもべは完了カードだけを公開待ち一覧へ追加する", () => {
  ["ps-28", "ps-29", "ps-30", "ps-32", "ps-37", "ps-39", "ps-40", "ps-42", "ps-43"].forEach((id) => {
    assert.equal(pharaohsServantReadyCardIds.includes(id), true);
  });
  assert.equal(pharaohsServantReadyCardIds.includes("ps-00"), false);
});
