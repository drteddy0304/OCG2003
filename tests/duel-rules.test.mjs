import test from "node:test";
import assert from "node:assert/strict";
import { advanceSwordsTurns, attackDeclarationCost, barrelDragonCoinResult, battleAttackBonus, battleDamageEffect, battleDefenseValue, battleOutcome, battleRemovalOutcome, bestCpuBattleTargetIndex, bestCpuFieldSpell, canActivateChangeOfHeart, canActivateCheerfulCoffin, canActivateHornOfHeaven, canActivateMagicJammer, canActivateSevenTools, canActivateTributeToDoomed, canActivateTwoProngedAttack, canBlastJugglerTarget, canDeclareAttackOnTurn, canDeckSearchTarget, canMonsterAttackDirectly, canNormalSummonMonster, canPayMonsterEffect, canRespondWithAntiRaigeki, canSpecialSummonLarvaeMoth, canSpecialSummonMoth, canStopAttackTarget, canTransferMatango, canUseKuriboh, catapultTurtleDamage, cockroachKnightReturns, competitiveCpuDeck, competitiveCpuDeckLatestPackId, continuousMonsterStats, darkCastleUndeadBoost, deSpellDestroys, dimensionalWarriorBanishes, dopingPenalty, electricLizardAttackLockTurn, endsBattlePhaseOnBattleDestruction, equipRules, equippedMonsterStats, fakeTrapCanProtect, fieldSpellStatModifier, firstFaceUpTrapIndex, firstSpellTargetIndex, flipEffect, flipLifeAmount, foreignSwordsmanDestroyTurn, germInfectionPenalty, giantSpiderAttackLife, graveyardLifeLoss, guardianAdjustedAttack, hourglassOriginalStats, ironScorpionDestroyTurn, isDragonCaptureJarLocked, isElegantEgotistTarget, isFaceUpTrapTarget, isGuardianMonster, isIronScorpionDestructionDue, isMonsterRebornBlocked, isRaceDestructionTarget, magicThornDamage, matangoStandbyDamage, mechanicalSpiderDestroys, moveDeckCard, mysteriousPuppeteerLifeGain, paralyzingPotionPreventsAttack, patrolRoboCanInspect, positionChangeEffect, pumpkingTimedBonus, raceDestructionKind, resolveSimpleSpellLife, resolveUpstartGoblin, robbinGoblinCanTrigger, royalDecreeNegatesTraps, shouldCpuActivateSwords, shouldCpuUseHeavyStorm, shouldCpuUseRaceDestructionSpell, shouldCpuUseSimpleSpell, shouldPlayerChooseFlipTarget, simpleSpellEffect, solemnJudgmentRemainingLp, spellSpecificTrapResponse, strongestAttackIndex, swappedMonsterStats, takeGraveyardCard, thunderDragonSearchIndexes, toggleLimitedSelection } from "../app/duel-rules.mjs";
import { attackDeclarationPayment, resolveDelinquentDuo, resolveHandDisruption } from "../app/duel-rules.mjs";
import { isMirrorForceDestructionTarget } from "../app/duel-rules.mjs";
import { wormBeastReturns } from "../app/duel-rules.mjs";
import { aileSwordsmanAttackBonus, bottomDeckSelection } from "../app/duel-rules.mjs";
import { gracefulCharityDraw, selectedCards } from "../app/duel-rules.mjs";
import { justDessertsDamage } from "../app/duel-rules.mjs";
import { temporaryBattleStatBonus } from "../app/duel-rules.mjs";
import { canUseUltimateOffering } from "../app/duel-rules.mjs";
import { reverseAdjustedStat } from "../app/duel-rules.mjs";
import { phantomWallReturnsAttacker } from "../app/duel-rules.mjs";
import { dragonTargetProtected } from "../app/duel-rules.mjs";

test("EXのリバース・戦闘効果を判定する", () => {
  assert.equal(flipEffect("ex-033"), "inspect-all-set");
  assert.equal(phantomWallReturnsAttacker("ex-034", false), true);
  assert.equal(phantomWallReturnsAttacker("ex-034", true), false);
  assert.equal(phantomWallReturnsAttacker("vol3-hane-hane", false), false);
  assert.equal(dragonTargetProtected("ドラゴン族", false, 1), true);
  assert.equal(dragonTargetProtected("ドラゴン族", true, 1), false);
  assert.equal(dragonTargetProtected("戦士族", false, 1), false);
  assert.equal(dragonTargetProtected("ドラゴン族", false, 0), false);
});

test("攻撃表示の弱いプレイヤーモンスターがCPUの攻撃で破壊される", () => {
  assert.deepEqual(battleOutcome(1200, 800, "attack"), {
    attackerDestroyed: false,
    defenderDestroyed: true,
    attackerDamage: 0,
    defenderDamage: 400,
  });
});

test("アイルの小剣士とヤドカリューの手動効果を計算する", () => {
  assert.equal(aileSwordsmanAttackBonus(5, 2, 5), 1400);
  assert.equal(aileSwordsmanAttackBonus(5, 2, 6), 0);
  assert.equal(aileSwordsmanAttackBonus(5, 0, 5), 0);
  assert.deepEqual(bottomDeckSelection(["a", "b", "c", "d"], [1, 3]), {
    remaining: ["a", "c"],
    bottom: ["b", "d"],
  });
});

test("天使の施しは3枚引いて選択した2枚を捨てる", () => {
  assert.deepEqual(gracefulCharityDraw(["h1"], ["d1", "d2", "d3", "d4"]), {
    hand: ["h1", "d1", "d2", "d3"],
    deck: ["d4"],
  });
  assert.equal(gracefulCharityDraw([], ["d1", "d2"]), null);
  assert.deepEqual(selectedCards(["a", "b", "c", "d"], [0, 2]), {
    remaining: ["b", "d"],
    chosen: ["a", "c"],
  });
});

test("自業自得は相手モンスター1体につき500ダメージを与える", () => {
  assert.equal(justDessertsDamage(0), 0);
  assert.equal(justDessertsDamage(1), 500);
  assert.equal(justDessertsDamage(5), 2500);
});

test("援軍と城壁の500アップは発動したターンだけ適用する", () => {
  assert.equal(temporaryBattleStatBonus(8, 8), 500);
  assert.equal(temporaryBattleStatBonus(8, 8, 700), 700);
  assert.equal(temporaryBattleStatBonus(8, 8, -500), -500);
  assert.equal(temporaryBattleStatBonus(8, 9), 0);
  assert.equal(temporaryBattleStatBonus(undefined, 8), 0);
});

test("悪魔の偵察者は専用のリバース効果として扱う", () => {
  assert.equal(flipEffect("mr-hiros-shadow-scout"), "opponent-draw-three-discard-spells");
});

test("血の代償は通常召喚後に500LPを残して追加召喚できる", () => {
  assert.equal(canUseUltimateOffering(501, true, 4, true), true);
  assert.equal(canUseUltimateOffering(500, true, 4, true), false);
  assert.equal(canUseUltimateOffering(8000, false, 4, true), false);
  assert.equal(canUseUltimateOffering(8000, true, 5, true), false);
  assert.equal(canUseUltimateOffering(8000, true, 4, false), false);
});

test("あまのじゃくの呪いはATK・DEFのアップとダウンを反転する", () => {
  assert.equal(reverseAdjustedStat(1000, 1500, true), 500);
  assert.equal(reverseAdjustedStat(1000, 600, true), 1400);
  assert.equal(reverseAdjustedStat(1000, 1500, false), 1500);
  assert.equal(reverseAdjustedStat(300, 1000, true), 0);
});

test("守備力を上回った場合は守備モンスターが破壊される", () => {
  assert.deepEqual(battleOutcome(1200, 700, "defense"), {
    attackerDestroyed: false,
    defenderDestroyed: true,
    attackerDamage: 0,
    defenderDamage: 0,
  });
});

test("攻撃力と守備力が同じ場合は守備モンスターが破壊されない", () => {
  assert.deepEqual(battleOutcome(700, 700, "defense"), {
    attackerDestroyed: false,
    defenderDestroyed: false,
    attackerDamage: 0,
    defenderDamage: 0,
  });
});

test("守備力に負けても攻撃モンスターは破壊されず差分ダメージだけ受ける", () => {
  assert.deepEqual(battleOutcome(700, 1200, "defense"), {
    attackerDestroyed: false,
    defenderDestroyed: false,
    attackerDamage: 500,
    defenderDamage: 0,
  });
});

test("異次元の戦士は攻撃側・守備側のどちらでも戦闘相手と除外される", () => {
  assert.equal(dimensionalWarriorBanishes("vol7-dimensional-warrior", "vol1-blue-eyes"), true);
  assert.equal(dimensionalWarriorBanishes("vol1-blue-eyes", "vol7-dimensional-warrior"), true);
  assert.equal(dimensionalWarriorBanishes("vol7-dimensional-warrior", null), false);
  assert.equal(dimensionalWarriorBanishes("vol1-gaia", "vol1-blue-eyes"), false);
  assert.deepEqual(battleRemovalOutcome("vol7-dimensional-warrior", "vol1-blue-eyes", true, false), {
    banishBoth: true,
    removeAttacker: true,
    removeDefender: true,
    graveAttacker: false,
    graveDefender: false,
  });
});

test("雷仙人と剣の女王のリバース・墓地効果を計算する", () => {
  assert.equal(flipEffect("vol7-thunder-nyan-nyan"), "gain-3000");
  assert.deepEqual(flipLifeAmount("vol7-thunder-nyan-nyan"), { gain: 3000, damage: 0 });
  assert.equal(graveyardLifeLoss("vol7-thunder-nyan-nyan"), 5000);
  assert.equal(flipEffect("vol7-sword-queen"), "damage-spell-traps");
  assert.deepEqual(flipLifeAmount("vol7-sword-queen", 3), { gain: 0, damage: 1500 });
  assert.deepEqual(flipLifeAmount("vol7-sword-queen", 0), { gain: 0, damage: 0 });
});

test("カタパルト・タートルとサンダー・ドラゴンの起動効果を計算する", () => {
  assert.equal(catapultTurtleDamage(1600), 800);
  assert.equal(catapultTurtleDamage(1550), 775);
  assert.deepEqual(thunderDragonSearchIndexes(["a", "vol7-thunder-dragon", "b", "vol7-thunder-dragon", "vol7-thunder-dragon"]), [1, 3]);
  assert.deepEqual(thunderDragonSearchIndexes(["a", "b"]), []);
});

test("リボルバー・ドラゴンはコイン3回のうち表2回以上で破壊する", () => {
  assert.deepEqual(barrelDragonCoinResult([true, false, true]), { heads: 2, destroys: true });
  assert.deepEqual(barrelDragonCoinResult([true, false, false]), { heads: 1, destroys: false });
  assert.deepEqual(barrelDragonCoinResult([true, true]), { heads: 2, destroys: false });
});

test("クリボーはCPUから受ける戦闘ダメージがある時だけ手札から使える", () => {
  assert.equal(canUseKuriboh(["vol7-kuriboh"], "cpu", 1200), true);
  assert.equal(canUseKuriboh(["vol7-kuriboh"], "player", 1200), false);
  assert.equal(canUseKuriboh(["vol7-kuriboh"], "cpu", 0), false);
  assert.equal(canUseKuriboh([], "cpu", 1200), false);
});

test("マタンゴはスタンバイフェイズに300ダメージを与え、LPを残せる時だけ移動できる", () => {
  assert.equal(matangoStandbyDamage(["vol7-matango", "vol1-kuriboh", "vol7-matango"]), 600);
  assert.equal(matangoStandbyDamage([]), 0);
  assert.equal(canTransferMatango(501, 4), true);
  assert.equal(canTransferMatango(500, 4), false);
  assert.equal(canTransferMatango(8000, 5), false);
});

test("攻撃封じの対象と右手に盾を左手に剣をの能力値交換を判定する", () => {
  assert.equal(canStopAttackTarget("attack", false), true);
  assert.equal(canStopAttackTarget("attack", true), false);
  assert.equal(canStopAttackTarget("defense", false), false);
  assert.deepEqual(swappedMonsterStats(2000, 800, true), { atk: 800, def: 2000 });
  assert.deepEqual(swappedMonsterStats(2000, 800, false), { atk: 2000, def: 800 });
});

test("Vol.7の装備魔法3枚の能力補正と攻撃制限を計算する", () => {
  assert.deepEqual(equippedMonsterStats(1000, 800, ["vol7-sword-deep-seated"]), { atk: 1500, def: 1300 });
  assert.deepEqual(equippedMonsterStats(1000, 800, ["vol7-germ-infection"]), { atk: 1000, def: 800 });
  assert.equal(germInfectionPenalty(["vol7-germ-infection"], 3), 900);
  assert.equal(germInfectionPenalty([], 3), 0);
  assert.equal(paralyzingPotionPreventsAttack(["vol7-paralyzing-potion"]), true);
  assert.equal(paralyzingPotionPreventsAttack([]), false);
});

test("Booster 7の磁力の指輪とドーピングの能力補正を計算する", () => {
  assert.deepEqual(equippedMonsterStats(1500, 1200, ["bo7-magnetic-ring"]), { atk: 1000, def: 700 });
  assert.deepEqual(equippedMonsterStats(1500, 1200, ["bo7-doping"]), { atk: 2200, def: 1200 });
  assert.equal(dopingPenalty(["bo7-doping"], 3), 600);
  assert.equal(dopingPenalty([], 3), 0);
});

test("ダーク・エルフは1000LPを残せる時だけ攻撃コストを払える", () => {
  assert.equal(attackDeclarationCost("vol7-dark-elf", 8000), 1000);
  assert.equal(attackDeclarationCost("vol7-dark-elf", 1001), 1000);
  assert.equal(attackDeclarationCost("vol7-dark-elf", 1000), null);
  assert.equal(attackDeclarationCost("vol7-rainbow-fish", 1), 0);
});

test("薄幸の美少女は戦闘で破壊された時だけバトルフェイズを終了する", () => {
  assert.equal(endsBattlePhaseOnBattleDestruction("vol7-unhappy-maiden", true), true);
  assert.equal(endsBattlePhaseOnBattleDestruction("vol7-unhappy-maiden", false), false);
  assert.equal(endsBattlePhaseOnBattleDestruction("vol7-dark-elf", true), false);
});

test("ミラーフォースは攻撃表示モンスターだけを破壊し、強化CPUも1枚使用する", () => {
  assert.equal(isMirrorForceDestructionTarget("attack"), true);
  assert.equal(isMirrorForceDestructionTarget("defense"), false);
  assert.equal(competitiveCpuDeck.filter((id) => id === "vol7-mirror-force").length, 1);
});

test("追い剥ぎゴブリンは場にあり相手の手札がある時だけ戦闘ダメージで誘発する", () => {
  assert.equal(robbinGoblinCanTrigger(["vol7-robbin-goblin"], 2), true);
  assert.equal(robbinGoblinCanTrigger(["vol7-robbin-goblin"], 0), false);
  assert.equal(robbinGoblinCanTrigger([], 2), false);
  assert.equal(competitiveCpuDeck.filter((id) => id === "vol7-robbin-goblin").length, 1);
});

test("Vol.2の装備魔法5枚が正しい種族に対応する", () => {
  assert.deepEqual(
    Object.entries(equipRules).filter(([id]) => id.startsWith("vol2-")),
    [
      ["vol2-dark-energy", "悪魔族"],
      ["vol2-laser-cannon-armor", "昆虫族"],
      ["vol2-vile-germs", "植物族"],
      ["vol2-machine-conversion-factory", "機械族"],
      ["vol2-raise-body-heat", "恐竜族"],
    ],
  );
});

test("Vol.3の装備魔法5枚が正しい種族に対応する", () => {
  assert.deepEqual(
    Object.entries(equipRules).filter(([id]) => id.startsWith("vol3-")),
    [
      ["vol3-silver-bow-arrow", "天使族"],
      ["vol3-dragon-treasure", "ドラゴン族"],
      ["vol3-electro-whip", "雷族"],
      ["vol3-mystical-moon", "獣戦士族"],
      ["vol3-follow-wind", "鳥獣族"],
    ],
  );
});

test("Vol.2の回復・ダメージ魔法の数値を適用する", () => {
  assert.deepEqual(simpleSpellEffect("vol2-goblin-secret-remedy"), { gain: 600, damage: 0 });
  assert.deepEqual(simpleSpellEffect("vol2-final-flame"), { gain: 0, damage: 600 });
});

test("Booster 1・STARTER BOXの回復・ダメージ魔法の数値を適用する", () => {
  assert.deepEqual(simpleSpellEffect("bo1-blue-potion"), { gain: 400, damage: 0 });
  assert.deepEqual(simpleSpellEffect("bo1-thunder"), { gain: 0, damage: 300 });
  assert.deepEqual(simpleSpellEffect("stb-moyan-curry"), { gain: 200, damage: 0 });
  assert.deepEqual(simpleSpellEffect("stb-fireball"), { gain: 0, damage: 500 });
});

test("Booster 2の属性装備と回復・ダメージ魔法を適用する", () => {
  assert.equal(equipRules["bo2-dark-piercing-sword"], "闇属性");
  assert.equal(equipRules["bo2-elf-light"], "光属性");
  assert.equal(equipRules["bo2-steel-shell"], "水属性");
  assert.equal(equipRules["bo2-awakening"], "地属性");
  assert.equal(equipRules["bo2-burning-spear"], "炎属性");
  assert.equal(equipRules["bo2-gust-fan"], "風属性");
  assert.deepEqual(equippedMonsterStats(1000, 1000, ["bo2-awakening"]), { atk: 1400, def: 800 });
  assert.deepEqual(simpleSpellEffect("bo2-angel-blood"), { gain: 800, damage: 0 });
  assert.deepEqual(simpleSpellEffect("bo2-fire"), { gain: 0, damage: 800 });
});

test("火炎地獄は相手に1000・自分に500ダメージを与え、同時0なら引き分けにする", () => {
  assert.deepEqual(simpleSpellEffect("vol7-tremendous-fire"), { gain: 0, damage: 1000, selfDamage: 500 });
  assert.deepEqual(resolveSimpleSpellLife("vol7-tremendous-fire", 4000, 3000), { ownLp: 3500, opponentLp: 2000, outcome: null });
  assert.deepEqual(resolveSimpleSpellLife("vol7-tremendous-fire", 500, 1000), { ownLp: 0, opponentLp: 0, outcome: "draw" });
  assert.deepEqual(resolveSimpleSpellLife("vol7-tremendous-fire", 400, 2000), { ownLp: -100, opponentLp: 1000, outcome: "own-lose" });
  assert.equal(shouldCpuUseSimpleSpell("vol7-tremendous-fire", 500), false);
});

test("光の護封剣はCPUターン3回で終了する", () => {
  assert.deepEqual(advanceSwordsTurns([3]), { remaining: [2], expired: 0 });
  assert.deepEqual(advanceSwordsTurns([2]), { remaining: [1], expired: 0 });
  assert.deepEqual(advanceSwordsTurns([1]), { remaining: [], expired: 1 });
});

test("死者蘇生で選んだ墓地のモンスターだけを取り出す", () => {
  assert.deepEqual(takeGraveyardCard(["monster-a", "spell", "monster-b"], 2), {
    cardId: "monster-b",
    remaining: ["monster-a", "spell"],
  });
  assert.equal(takeGraveyardCard(["monster-a"], 3), null);
});

test("魔法除去は魔法だけを破壊し、罠は元に戻す", () => {
  assert.equal(deSpellDestroys("spell"), true);
  assert.equal(deSpellDestroys("trap"), false);
  assert.equal(deSpellDestroys("monster", "vol4-cocoon-evolution"), true);
});

test("CPUは回復量が無駄にならない時だけ回復魔法を使う", () => {
  assert.equal(shouldCpuUseSimpleSpell("vol2-goblin-secret-remedy", 8000), false);
  assert.equal(shouldCpuUseSimpleSpell("vol2-goblin-secret-remedy", 7400), true);
  assert.equal(shouldCpuUseSimpleSpell("vol2-final-flame", 8000), true);
});

test("CPUは相手モンスターがいる時だけ光の護封剣を発動する", () => {
  assert.equal(shouldCpuActivateSwords(1, 0, 4), true);
  assert.equal(shouldCpuActivateSwords(0, 0, 4), false);
  assert.equal(shouldCpuActivateSwords(1, 1, 4), false);
  assert.equal(shouldCpuActivateSwords(1, 0, 5), false);
});

test("CPUの死者蘇生は攻撃力が最も高いモンスターを選ぶ", () => {
  assert.equal(strongestAttackIndex([800, 2500, 1200]), 1);
  assert.equal(strongestAttackIndex([]), null);
});

test("CPUの魔法除去は表側魔法を選び、罠だけなら温存する", () => {
  assert.equal(firstSpellTargetIndex(["trap", "spell", "spell"]), 1);
  assert.equal(firstSpellTargetIndex(["trap", "trap"]), null);
});

test("罠はずしは発動後も表側で残る罠だけを対象にする", () => {
  assert.equal(isFaceUpTrapTarget("stb-dragon-capture-jar"), true);
  assert.equal(isFaceUpTrapTarget("vol5-call-darkness"), true);
  assert.equal(isFaceUpTrapTarget("vol1-trap-hole"), false);
  assert.equal(firstFaceUpTrapIndex(["vol1-trap-hole", "vol5-call-darkness"]), 1);
  assert.equal(firstFaceUpTrapIndex(["vol1-trap-hole"]), null);
});

test("Vol.3のリバースモンスター5体を正しい効果として扱う", () => {
  assert.equal(flipEffect("vol3-reaper-cards"), "destroy-trap");
  assert.equal(flipEffect("vol3-armed-ninja"), "destroy-spell");
  assert.equal(flipEffect("vol3-man-eater-bug"), "destroy-monster");
  assert.equal(flipEffect("vol3-skelengel"), "draw");
  assert.equal(flipEffect("vol3-hane-hane"), "return-monster");
  assert.equal(flipEffect("vol4-magician-faith"), "recover-spell");
  assert.equal(flipEffect("vol4-mask-darkness"), "recover-trap");
  assert.equal(flipEffect("vol3-red-eyes"), null);
});

test("壺魔人とドラゴン族・封印の壺を正しく判定する", () => {
  assert.equal(flipEffect("vol6-dragon-piper"), "destroy-dragon-jar");
  assert.equal(isDragonCaptureJarLocked("ドラゴン族", false, true), true);
  assert.equal(isDragonCaptureJarLocked("ドラゴン族", true, true), false);
  assert.equal(isDragonCaptureJarLocked("戦士族", false, true), false);
  assert.equal(isDragonCaptureJarLocked("ドラゴン族", false, false), false);
});

test("盗賊の七つ道具は1000LPを残して罠にチェーンできる", () => {
  assert.equal(canActivateSevenTools(1001, ["vol6-seven-tools"]), true);
  assert.equal(canActivateSevenTools(1000, ["vol6-seven-tools"]), false);
  assert.equal(canActivateSevenTools(8000, ["vol1-trap-hole"]), false);
});

test("マジック・ジャマーは捨てる手札がある時だけ発動できる", () => {
  assert.equal(canActivateMagicJammer(1, ["vol6-magic-jammer"]), true);
  assert.equal(canActivateMagicJammer(0, ["vol6-magic-jammer"]), false);
  assert.equal(canActivateMagicJammer(3, ["vol1-trap-hole"]), false);
});

test("昇天の角笛は生け贄にできるモンスターがいる時だけ発動できる", () => {
  assert.equal(canActivateHornOfHeaven(1, ["vol6-horn-heaven"]), true);
  assert.equal(canActivateHornOfHeaven(0, ["vol6-horn-heaven"]), false);
  assert.equal(canActivateHornOfHeaven(2, ["vol1-trap-hole"]), false);
});

test("神の宣告は現在LPの半分を払う", () => {
  assert.equal(solemnJudgmentRemainingLp(8000, ["vol6-solemn-judgment"]), 4000);
  assert.equal(solemnJudgmentRemainingLp(1, ["vol6-solemn-judgment"]), 1);
  assert.equal(solemnJudgmentRemainingLp(8000, ["vol1-trap-hole"]), null);
});

test("自分のリバース効果はCPUのバトル中でも自分で対象を選べる", () => {
  assert.equal(shouldPlayerChooseFlipTarget("player", "cpu", "battle"), true);
  assert.equal(shouldPlayerChooseFlipTarget("player", "cpu", "main1"), true);
  assert.equal(shouldPlayerChooseFlipTarget("cpu", "player", "battle"), false);
});

test("Vol.5の直接攻撃モンスター6体を判定する", () => {
  for (const id of ["vol5-mystic-lamp", "vol5-leghul", "vol5-ooguchi", "vol5-jinzo-7", "vol5-rainbow-flower", "vol5-queens-double"]) {
    assert.equal(canMonsterAttackDirectly(id), true);
  }
  assert.equal(canMonsterAttackDirectly("vol5-feral-imp"), false);
});

test("でんきトカゲを攻撃したアンデット族以外は次の自分ターンだけ攻撃できない", () => {
  assert.equal(electricLizardAttackLockTurn("vol4-electric-lizard", "戦士族", 3), 5);
  assert.equal(electricLizardAttackLockTurn("vol4-electric-lizard", "アンデット族", 3), null);
  assert.equal(electricLizardAttackLockTurn("vol3-man-eater-bug", "戦士族", 3), null);
  assert.equal(canDeclareAttackOnTurn(5, 5), false);
  assert.equal(canDeclareAttackOnTurn(5, 7), true);
});

test("鉄のサソリを攻撃した機械族以外は攻撃側の3ターン目終了時に破壊される", () => {
  assert.equal(ironScorpionDestroyTurn("vol4-iron-scorpion", "戦士族", 3), 7);
  assert.equal(ironScorpionDestroyTurn("vol4-iron-scorpion", "機械族", 3), null);
  assert.equal(ironScorpionDestroyTurn("vol4-electric-lizard", "戦士族", 3), null);
  assert.equal(isIronScorpionDestructionDue(7, 5), false);
  assert.equal(isIronScorpionDestructionDue(7, 7), true);
});

test("ゾーン・イーターと異国の剣士は攻撃を受けた相手を5ターン後に破壊する", () => {
  assert.equal(foreignSwordsmanDestroyTurn("bo4-zone-eater", 12), 20);
  assert.equal(foreignSwordsmanDestroyTurn("bo4-foreign-swordsman", 12), 20);
});

test("Vol.5の戦闘ダメージ発動効果を判定する", () => {
  assert.equal(battleDamageEffect("vol5-white-magical-hat"), "discard-random");
  assert.equal(battleDamageEffect("vol5-masked-sorcerer"), "draw");
  assert.equal(battleDamageEffect("vol5-feral-imp"), null);
});

test("Boosterの戦闘・召喚・リバース効果を判定する", () => {
  assert.equal(battleDamageEffect("bo7-devil-cook"), "opponent-draw-two");
  assert.equal(battleAttackBonus("bo7-flying-insect-soldier", "風"), 1000);
  assert.equal(battleAttackBonus("bo7-flying-insect-soldier", "地"), 0);
  assert.equal(battleDefenseValue("bo3-dark-artist", 1400, "光"), 700);
  assert.equal(battleDefenseValue("bo3-dark-artist", 1400, "闇"), 1400);
  assert.equal(mechanicalSpiderDestroys("bo4-mechanical-spider", "闇"), true);
  assert.equal(mechanicalSpiderDestroys("bo4-mechanical-spider", "光"), false);
  assert.equal(foreignSwordsmanDestroyTurn("bo4-foreign-swordsman", 12), 20);
  assert.equal(foreignSwordsmanDestroyTurn("vol1-hitotsume-giant", 12), null);
  assert.equal(mysteriousPuppeteerLifeGain(["bo5-mysterious-puppeteer", "bo5-mysterious-puppeteer"], 1), 1000);
  assert.equal(flipEffect("bo5-needle-ball"), "pay-2000-damage-1000");
});

test("Boosterの表示形式・スタンバイ・墓地効果を判定する", () => {
  assert.equal(positionChangeEffect("bo7-crass-clown", "defense", "attack"), "return-monster");
  assert.equal(positionChangeEffect("bo7-dream-clown", "attack", "defense"), "destroy-monster");
  assert.equal(positionChangeEffect("bo7-wisdom-devil", "attack", "defense"), "shuffle-deck");
  assert.equal(positionChangeEffect("bo7-dream-clown", "defense", "attack"), null);
  assert.equal(cockroachKnightReturns("bo4-cockroach-knight"), true);
  assert.equal(cockroachKnightReturns("bo4-worm-beast"), false);
  assert.equal(patrolRoboCanInspect(["bo3-patrol-robo"], 1), true);
  assert.equal(patrolRoboCanInspect(["bo3-patrol-robo"], 0), false);
  assert.equal(positionChangeEffect("bo5-dragon-killer", "defense", "attack"), "destroy-dragon");
  assert.equal(flipEffect("bo6-penguin-soldier"), "return-two-monsters");
  assert.equal(flipEffect("bo6-doppelganger"), "destroy-two-set-spell-traps");
});

test("Boosterの時間経過と地雷蜘蛛の効果を判定する", () => {
  assert.deepEqual(hourglassOriginalStats("bo3-hourglass-courage", 1100, 1200, 4, 4), { atk: 550, def: 600 });
  assert.deepEqual(hourglassOriginalStats("bo3-hourglass-courage", 1100, 1200, 4, 6), { atk: 550, def: 600 });
  assert.deepEqual(hourglassOriginalStats("bo3-hourglass-courage", 1100, 1200, 4, 7), { atk: 2200, def: 2400 });
  assert.equal(darkCastleUndeadBoost([3], 3), 200);
  assert.equal(darkCastleUndeadBoost([3], 8), 1000);
  assert.equal(pumpkingTimedBonus("bo7-pumpking", true, 5, 9), 500);
  assert.equal(pumpkingTimedBonus("bo7-pumpking", false, 5, 9), 0);
  assert.equal(giantSpiderAttackLife("bo7-giant-spider", 8000, false), 4000);
  assert.equal(giantSpiderAttackLife("bo7-giant-spider", 1, false), 1);
  assert.equal(giantSpiderAttackLife("bo7-giant-spider", 8000, true), 8000);
  assert.equal(canPayMonsterEffect(1001, 1000), true);
  assert.equal(canPayMonsterEffect(1000, 1000), false);
  assert.equal(canPayMonsterEffect(5001, 5000), true);
});

test("大王目玉はデッキ上5枚を並べ替えるリバース効果を持つ", () => {
  assert.equal(flipEffect("vol5-big-eye"), "reorder-five");
  assert.deepEqual(moveDeckCard(["a", "b", "c", "d", "e"], 3, 1), ["a", "d", "b", "c", "e"]);
  assert.deepEqual(moveDeckCard(["a", "b"], 0, 5), ["a", "b"]);
});

test("死者への手向けは捨てる手札と破壊対象がある時だけ発動できる", () => {
  assert.equal(canActivateTributeToDoomed(2, 1), true);
  assert.equal(canActivateTributeToDoomed(1, 1), false);
  assert.equal(canActivateTributeToDoomed(3, 0), false);
});

test("魂の解放は墓地のカードを5枚まで選択できる", () => {
  const five = ["player:0", "player:1", "cpu:0", "cpu:1", "cpu:2"];
  assert.deepEqual(toggleLimitedSelection(five, "cpu:3"), five);
  assert.deepEqual(toggleLimitedSelection(five, "cpu:1"), ["player:0", "player:1", "cpu:0", "cpu:2"]);
  assert.deepEqual(toggleLimitedSelection([], "player:0"), ["player:0"]);
});

test("陽気な葬儀屋はモンスターだけを3枚まで選べる", () => {
  assert.equal(canActivateCheerfulCoffin(["spell", "monster"]), true);
  assert.equal(canActivateCheerfulCoffin(["spell", "trap"]), false);
  assert.deepEqual(toggleLimitedSelection(["1", "2", "3"], "4", 3), ["1", "2", "3"]);
});

test("はさみ撃ちは自分2体と相手1体が揃っている時だけ発動できる", () => {
  assert.equal(canActivateTwoProngedAttack(2, 1, ["stb-two-pronged-attack"]), true);
  assert.equal(canActivateTwoProngedAttack(1, 1, ["stb-two-pronged-attack"]), false);
  assert.equal(canActivateTwoProngedAttack(2, 0, ["stb-two-pronged-attack"]), false);
  assert.equal(canActivateTwoProngedAttack(2, 1, ["vol1-trap-hole"]), false);
});

test("三魔神だけが攻撃力を0にする防御効果を持つ", () => {
  assert.equal(isGuardianMonster("vol5-sanga"), true);
  assert.equal(isGuardianMonster("vol5-kazejin"), true);
  assert.equal(isGuardianMonster("vol5-suijin"), true);
  assert.equal(isGuardianMonster("vol5-big-eye"), false);
  assert.equal(guardianAdjustedAttack(2500, true), 0);
  assert.equal(guardianAdjustedAttack(2500, false), 2500);
});

test("ミスター・ボンバーは表側でATK1000以下だけを対象にできる", () => {
  assert.equal(canBlastJugglerTarget(false, 1000), true);
  assert.equal(canBlastJugglerTarget(false, 1001), false);
  assert.equal(canBlastJugglerTarget(true, 500), false);
});

test("万華鏡はハーピィ・レディと三姉妹だけを特殊召喚できる", () => {
  assert.equal(isElegantEgotistTarget("vol4-harpie-lady"), true);
  assert.equal(isElegantEgotistTarget("vol4-harpie-sisters"), true);
  assert.equal(isElegantEgotistTarget("vol4-summoned-skull"), false);
});

test("ハーピィ・レディ三姉妹は通常召喚できない", () => {
  assert.equal(canNormalSummonMonster("vol4-harpie-sisters"), false);
  assert.equal(canNormalSummonMonster("vol4-harpie-lady"), true);
  assert.equal(canNormalSummonMonster("vol4-deepsea-shark", true), false);
});

test("ラーバモスは通常召喚できず進化の繭から2回目の自分ターン以降に特殊召喚できる", () => {
  assert.equal(canNormalSummonMonster("vol5-larvae-moth"), false);
  assert.equal(canSpecialSummonLarvaeMoth(4, 1), false);
  assert.equal(canSpecialSummonLarvaeMoth(5, 1), true);
  assert.equal(canSpecialSummonLarvaeMoth(5), false);
});

test("グレート・モスは通常召喚できず進化の繭から4回目の自分ターン以降に特殊召喚できる", () => {
  assert.equal(canNormalSummonMonster("vol6-great-moth"), false);
  assert.equal(canSpecialSummonMoth("vol6-great-moth", 8, 1), false);
  assert.equal(canSpecialSummonMoth("vol6-great-moth", 9, 1), true);
  assert.equal(canSpecialSummonMoth("vol6-great-moth", 9), false);
});

test("心変わりは自分の場に空きがあり相手モンスターがいる時だけ発動できる", () => {
  assert.equal(canActivateChangeOfHeart(4, 1), true);
  assert.equal(canActivateChangeOfHeart(5, 1), false);
  assert.equal(canActivateChangeOfHeart(2, 0), false);
});

test("避雷針は相手のサンダー・ボルトにだけ発動できる", () => {
  assert.equal(canRespondWithAntiRaigeki(["vol5-anti-raigeki"], "stb-raigeki"), true);
  assert.equal(canRespondWithAntiRaigeki(["vol5-anti-raigeki"], "vol1-dark-hole"), false);
  assert.equal(canRespondWithAntiRaigeki([], "stb-raigeki"), false);
  assert.equal(competitiveCpuDeck.includes("stb-raigeki"), true);
});

test("専用カウンター罠は対応する魔法にだけチェーンできる", () => {
  assert.equal(spellSpecificTrapResponse(["bo4-white-hole"], "vol1-dark-hole"), "bo4-white-hole");
  assert.equal(spellSpecificTrapResponse(["bo4-call-grave"], "vol2-monster-reborn"), "bo4-call-grave");
  assert.equal(spellSpecificTrapResponse(["bo7-griffin-wing"], "stb-harpies-feather-duster"), "bo7-griffin-wing");
  assert.equal(spellSpecificTrapResponse(["bo4-white-hole"], "vol2-monster-reborn"), null);
});

test("王宮のお触れと魔力の棘の永続効果を計算する", () => {
  assert.equal(royalDecreeNegatesTraps(["bo5-royal-decree"], []), true);
  assert.equal(royalDecreeNegatesTraps([], []), false);
  assert.equal(magicThornDamage(2, ["bo6-magic-thorn"]), 1000);
  assert.equal(magicThornDamage(2, ["bo6-magic-thorn"], true), 0);
});

test("闇からの呼び声がどちらかの場にあれば死者蘇生を使えない", () => {
  assert.equal(isMonsterRebornBlocked(["vol5-call-darkness"], []), true);
  assert.equal(isMonsterRebornBlocked([], ["vol5-call-darkness"]), true);
  assert.equal(isMonsterRebornBlocked(["vol1-trap-hole"], []), false);
});

test("偽物のわなは別の罠が破壊される時だけ身代わりにできる", () => {
  assert.equal(fakeTrapCanProtect(["vol1-trap-hole", "vol5-fake-trap"], 0), true);
  assert.equal(fakeTrapCanProtect(["vol1-trap-hole"], 0), false);
  assert.equal(fakeTrapCanProtect(["vol5-fake-trap"], 0), false);
  assert.equal(competitiveCpuDeck.includes("vol3-reaper-cards"), true);
});

test("進化の繭を装備したプチモスはATK0・DEF2000になる", () => {
  assert.deepEqual(equippedMonsterStats(300, 200, ["vol4-cocoon-evolution"]), { atk: 0, def: 2000 });
  assert.deepEqual(equippedMonsterStats(300, 200, ["vol4-cocoon-evolution", "equip-card"]), { atk: 300, def: 2300 });
});

test("シャドウ・グールは自分の墓地のモンスター1体につきATK100アップする", () => {
  assert.deepEqual(continuousMonsterStats({ id: "vol6-shadow-ghoul", attribute: "闇", atk: 1600, def: 1300, graveyardMonsterCount: 4 }), { atk: 2000, def: 1300 });
});

test("森の住人 ウダンは表側表示の植物族1体につきATK100アップする", () => {
  assert.deepEqual(continuousMonsterStats({ id: "bo3-udan", attribute: "地", atk: 900, def: 1200, faceUpPlantCount: 3 }), { atk: 1200, def: 1200 });
});

test("Booster 5の機械王は自身を含む表側機械族の数だけ攻撃力が上がる", () => {
  assert.deepEqual(continuousMonsterStats({ id: "bo5-machine-king", attribute: "地", atk: 2200, def: 2000, faceUpMachineCount: 1 }), { atk: 2300, def: 2000 });
  assert.deepEqual(continuousMonsterStats({ id: "bo5-machine-king", attribute: "地", atk: 2200, def: 2000, faceUpMachineCount: 3 }), { atk: 2500, def: 2000 });
});

test("Booster 5の主要リバース効果を識別できる", () => {
  assert.equal(flipEffect("bo5-trap-master"), "destroy-trap");
  assert.equal(flipEffect("bo5-needle-worm"), "mill-five");
  assert.equal(flipEffect("bo5-morphing-jar"), "reload-five");
});

test("邪悪なるワーム・ビーストは召喚したターンのエンドフェイズに手札へ戻る", () => {
  assert.equal(wormBeastReturns("bo4-worm-beast", false, 7, 7), true);
  assert.equal(wormBeastReturns("bo4-worm-beast", true, 7, 7), false);
  assert.equal(wormBeastReturns("bo4-worm-beast", false, 6, 7), false);
});

test("ムカムカは自分の手札1枚につきATK・DEF300アップする", () => {
  assert.deepEqual(continuousMonsterStats({ id: "vol6-muka-muka", attribute: "地", atk: 600, def: 300, handSize: 5 }), { atk: 2100, def: 1800 });
});

test("Vol.6の属性強化効果は強化500・弱体化400として重複適用する", () => {
  assert.deepEqual(continuousMonsterStats({ id: "target", attribute: "光", atk: 1000, def: 1000, auraIds: ["vol6-hoshiningen", "vol6-witch-apprentice"] }), { atk: 1100, def: 1000 });
  assert.deepEqual(continuousMonsterStats({ id: "target", attribute: "水", atk: 1000, def: 1000, auraIds: ["vol6-star-boy", "vol6-little-chimera"] }), { atk: 1100, def: 1000 });
});

test("バーバリアン1号・2号は自分フィールドの相方1体につきATK500アップする", () => {
  assert.deepEqual(continuousMonsterStats({ id: "vol7-barbarian-1", atk: 1550, def: 1800, allyIds: ["vol7-barbarian-1", "vol7-barbarian-2"] }), { atk: 2050, def: 1800 });
  assert.deepEqual(continuousMonsterStats({ id: "vol7-barbarian-2", atk: 1800, def: 1500, allyIds: ["vol7-barbarian-1", "vol7-barbarian-1", "vol7-barbarian-2"] }), { atk: 2800, def: 1500 });
  assert.deepEqual(continuousMonsterStats({ id: "vol7-barbarian-1", atk: 1550, def: 1800, allyIds: ["vol7-barbarian-1"] }), { atk: 1550, def: 1800 });
});

test("フィールド魔法6種は対象種族を200強化し海と闇は対象種族を200弱体化する", () => {
  assert.equal(fieldSpellStatModifier("昆虫族", ["stb-forest"]), 200);
  assert.equal(fieldSpellStatModifier("恐竜族", ["stb-wasteland"]), 200);
  assert.equal(fieldSpellStatModifier("ドラゴン族", ["stb-mountain"]), 200);
  assert.equal(fieldSpellStatModifier("戦士族", ["stb-sogen"]), 200);
  assert.equal(fieldSpellStatModifier("魚族", ["stb-umi"]), 200);
  assert.equal(fieldSpellStatModifier("機械族", ["stb-umi"]), -200);
  assert.equal(fieldSpellStatModifier("悪魔族", ["stb-yami"]), 200);
  assert.equal(fieldSpellStatModifier("天使族", ["stb-yami"]), -200);
  assert.equal(fieldSpellStatModifier("ドラゴン族", ["stb-mountain", "stb-mountain"]), 400);
});

test("CPUは相手より自分への恩恵が大きいフィールド魔法だけを選ぶ", () => {
  assert.equal(bestCpuFieldSpell(["stb-mountain", "stb-umi"], ["ドラゴン族", "鳥獣族"], ["戦士族"]), "stb-mountain");
  assert.equal(bestCpuFieldSpell(["stb-mountain"], ["戦士族"], ["ドラゴン族"]), null);
});

test("Vol.4の種族破壊魔法5枚を判定し、CPUは相手の損失が大きい時だけ使う", () => {
  assert.equal(raceDestructionKind("vol4-eternal-drought"), "水族");
  assert.equal(raceDestructionKind("vol4-breath-god"), "岩石族");
  assert.equal(raceDestructionKind("vol4-acid-storm"), "機械族");
  assert.equal(raceDestructionKind("vol4-warrior-elimination"), "戦士族");
  assert.equal(raceDestructionKind("vol4-insecticide"), "昆虫族");
  assert.equal(isRaceDestructionTarget("vol4-acid-storm", "機械族", false), true);
  assert.equal(isRaceDestructionTarget("vol4-acid-storm", "機械族", true), false);
  assert.equal(isRaceDestructionTarget("vol4-acid-storm", "雷族", false), false);
  assert.equal(shouldCpuUseRaceDestructionSpell("vol4-acid-storm", [], ["機械族"]), true);
  assert.equal(shouldCpuUseRaceDestructionSpell("vol4-acid-storm", ["機械族"], ["機械族"]), false);
});

test("Booster 6の魔女狩りと悪魔払いは対応する種族だけを破壊する", () => {
  assert.equal(raceDestructionKind("bo6-witch-hunt"), "魔法使い族");
  assert.equal(raceDestructionKind("bo6-exile-wicked"), "悪魔族");
  assert.equal(isRaceDestructionTarget("bo6-witch-hunt", "魔法使い族", false), true);
  assert.equal(isRaceDestructionTarget("bo6-exile-wicked", "悪魔族", false), true);
  assert.equal(isRaceDestructionTarget("bo6-witch-hunt", "悪魔族", false), false);
  assert.equal(isRaceDestructionTarget("bo6-exile-wicked", "悪魔族", true), false);
});

test("CPUは相手の損失が自分より大きい時だけ大嵐を使う", () => {
  assert.equal(shouldCpuUseHeavyStorm(1, 3), true);
  assert.equal(shouldCpuUseHeavyStorm(2, 2), false);
  assert.equal(shouldCpuUseHeavyStorm(1, 1, false, true), true);
  assert.equal(shouldCpuUseHeavyStorm(1, 1, true, false), false);
});

test("クリッターと黒き森のウィッチはそれぞれATK・DEF1500以下を検索する", () => {
  assert.equal(canDeckSearchTarget("vol6-sangan", { cardType: "monster", atk: 1500, def: 2000 }), true);
  assert.equal(canDeckSearchTarget("vol6-sangan", { cardType: "monster", atk: 1501, def: 0 }), false);
  assert.equal(canDeckSearchTarget("vol6-witch-black-forest", { cardType: "monster", atk: 2000, def: 1500 }), true);
  assert.equal(canDeckSearchTarget("vol6-witch-black-forest", { cardType: "monster", atk: 0, def: 1501 }), false);
  assert.equal(canDeckSearchTarget("vol6-sangan", { cardType: "spell" }), false);
});

test("強化CPUは40枚デッキを使い、2003年10月の制限枚数を守る", () => {
  assert.equal(competitiveCpuDeck.length, 40);
  const counts = competitiveCpuDeck.reduce((result, id) => ({ ...result, [id]: (result[id] ?? 0) + 1 }), {});
  assert.ok(Math.max(...Object.values(counts)) <= 3);
  assert.equal(counts["vol1-dark-hole"], 1);
  assert.equal(counts["vol2-swords-revealing-light"], 1);
  assert.equal(counts["vol2-monster-reborn"], 1);
  assert.equal(counts["vol3-pot-of-greed"], 1);
  assert.equal(counts["stb-raigeki"], 1);
  assert.equal(counts["vol7-mirror-force"], 1);
  assert.equal(counts["vol2-monster-reborn"], 1);
  assert.equal(counts["vol3-pot-of-greed"], 1);
  assert.ok(counts["vol3-man-eater-bug"] >= 1);
  assert.equal(counts["stb-polymerization"], 1);
  assert.equal(counts["vol1-gaia"], 1);
  assert.equal(counts["vol7-barrel-dragon"], 1);
  assert.equal(counts["mr-axe-despair"], 1);
  assert.equal(counts["mr-mystical-space-typhoon"], 1);
  assert.equal(counts["mr-upstart-goblin"], 1);
  assert.equal(counts["mr-confiscation"], 1);
  assert.equal(counts["mr-forceful-sentry"], 1);
});

test("強化CPUは現在の最新パックMagic Rulerまでの戦力をデッキに採用する", () => {
  assert.equal(competitiveCpuDeckLatestPackId, "magic-ruler");
  assert.equal(competitiveCpuDeck.filter((id) => id === "mr-maha-vailo").length, 1);
  assert.equal(competitiveCpuDeck.filter((id) => id === "vol7-rainbow-fish").length, 3);
  assert.equal(competitiveCpuDeck.filter((id) => id === "vol7-dark-elf").length, 2);
  assert.equal(competitiveCpuDeck.filter((id) => id === "vol7-prevent-rat").length, 2);
  assert.equal(competitiveCpuDeck.filter((id) => id === "vol7-tremendous-fire").length, 1);
  assert.ok(competitiveCpuDeck.some((id) => id.startsWith("vol5-")));
  assert.ok(competitiveCpuDeck.some((id) => id.startsWith("vol6-")));
});

test("Magic Rulerの装備魔法とマハー・ヴァイロの強化値を計算する", () => {
  assert.deepEqual(equippedMonsterStats(1000, 1000, ["mr-axe-despair"]), { atk: 2000, def: 1000 });
  assert.deepEqual(equippedMonsterStats(1000, 1000, ["mr-black-pendant", "mr-horn-light", "mr-malevolent-nuzzler"]), { atk: 2200, def: 1800 });
  assert.deepEqual(continuousMonsterStats({ id: "mr-maha-vailo", attribute: "光", kind: "魔法使い族", atk: 1550, def: 1400, equipCount: 2 }), { atk: 2550, def: 1400 });
});

test("成金ゴブリンは1枚ドローして相手を1000LP回復する", () => {
  assert.deepEqual(resolveUpstartGoblin(["hand"], ["draw", "next"], 8000), {
    hand: ["hand", "draw"],
    deck: ["next"],
    opponentLp: 9000,
  });
  assert.equal(resolveUpstartGoblin([], [], 8000), null);
});

test("通行税と墓守の使い魔は攻撃宣言のコストを重ねて適用する", () => {
  assert.deepEqual(attackDeclarationPayment("monster", 8000, 20, ["mr-toll", "mr-toll"], ["mr-gravekeepers-servant"]), { lifeCost: 1000, millCount: 1 });
  assert.deepEqual(attackDeclarationPayment("vol7-dark-elf", 8000, 20, ["mr-toll"], []), { lifeCost: 1500, millCount: 0 });
  assert.equal(attackDeclarationPayment("monster", 500, 20, ["mr-toll"], []), null);
  assert.equal(attackDeclarationPayment("monster", 8000, 0, [], ["mr-gravekeepers-servant"]), null);
});

test("押収と強引な番兵は選択した手札だけを移動する", () => {
  assert.deepEqual(resolveHandDisruption("discard", ["a", "b", "c"], ["deck"], 1), { hand: ["a", "c"], deck: ["deck"], affected: "b" });
  assert.deepEqual(resolveHandDisruption("return-deck", ["a", "b", "c"], ["deck"], 2), { hand: ["a", "b"], deck: ["deck", "c"], affected: "c" });
});

test("いたずら好きな双子悪魔は手札を最大2枚捨てる", () => {
  assert.deepEqual(resolveDelinquentDuo(["a", "b", "c"], 1, 1), { hand: ["a"], discarded: ["b", "c"] });
  assert.deepEqual(resolveDelinquentDuo(["a"], 0, 0), { hand: [], discarded: ["a"] });
});

test("聖域の歌声は表側守備表示モンスターだけを500強化する", () => {
  assert.deepEqual(continuousMonsterStats({ id: "target", attribute: "光", kind: "天使族", position: "defense", atk: 1000, def: 1200, fieldSpellIds: ["mr-chorus-sanctuary"] }), { atk: 1000, def: 1700 });
  assert.deepEqual(continuousMonsterStats({ id: "target", attribute: "光", kind: "天使族", position: "attack", atk: 1000, def: 1200, fieldSpellIds: ["mr-chorus-sanctuary"] }), { atk: 1000, def: 1200 });
});

test("CPUは勝てる相手を攻撃し、表側の強敵へ自滅攻撃しない", () => {
  assert.equal(bestCpuBattleTargetIndex(1600, [
    { position: "attack", faceDown: false, atk: 2000, def: 1000 },
    { position: "defense", faceDown: false, atk: 800, def: 1200 },
  ]), 1);
  assert.equal(bestCpuBattleTargetIndex(1600, [
    { position: "attack", faceDown: false, atk: 2000, def: 1000 },
    { position: "defense", faceDown: false, atk: 800, def: 2000 },
  ]), null);
  assert.equal(bestCpuBattleTargetIndex(1600, [
    { position: "defense", faceDown: true, atk: 0, def: 2000 },
  ]), 0);
});
