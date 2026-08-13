export function battleOutcome(attack, defense, defenderPosition) {
  if (defenderPosition === "attack") {
    if (attack > defense) {
      return { attackerDestroyed: false, defenderDestroyed: true, attackerDamage: 0, defenderDamage: attack - defense };
    }
    if (attack < defense) {
      return { attackerDestroyed: true, defenderDestroyed: false, attackerDamage: defense - attack, defenderDamage: 0 };
    }
    return { attackerDestroyed: true, defenderDestroyed: true, attackerDamage: 0, defenderDamage: 0 };
  }
  if (attack > defense) {
    return { attackerDestroyed: false, defenderDestroyed: true, attackerDamage: 0, defenderDamage: 0 };
  }
  if (attack < defense) {
    return { attackerDestroyed: false, defenderDestroyed: false, attackerDamage: defense - attack, defenderDamage: 0 };
  }
  return { attackerDestroyed: false, defenderDestroyed: false, attackerDamage: 0, defenderDamage: 0 };
}

export function dimensionalWarriorBanishes(attackerId, defenderId) {
  return Boolean(defenderId) && (attackerId === "vol7-dimensional-warrior" || defenderId === "vol7-dimensional-warrior");
}

export function battleRemovalOutcome(attackerId, defenderId, attackerDestroyed, defenderDestroyed) {
  const banishBoth = dimensionalWarriorBanishes(attackerId, defenderId);
  return {
    banishBoth,
    removeAttacker: banishBoth || attackerDestroyed,
    removeDefender: banishBoth || defenderDestroyed,
    graveAttacker: !banishBoth && attackerDestroyed,
    graveDefender: !banishBoth && defenderDestroyed,
  };
}

export const equipRules = Object.freeze({
  "vol1-legendary-sword": "戦士族",
  "vol1-beast-fangs": "獣族",
  "vol1-violet-crystal": "アンデット族",
  "vol1-book-secret-arts": "魔法使い族",
  "vol1-power-kaishin": "水族",
  "vol2-dark-energy": "悪魔族",
  "vol2-laser-cannon-armor": "昆虫族",
  "vol2-vile-germs": "植物族",
  "vol2-machine-conversion-factory": "機械族",
  "vol2-raise-body-heat": "恐竜族",
  "vol3-silver-bow-arrow": "天使族",
  "vol3-dragon-treasure": "ドラゴン族",
  "vol3-electro-whip": "雷族",
  "vol3-mystical-moon": "獣戦士族",
  "vol3-follow-wind": "鳥獣族",
  "vol7-germ-infection": "機械族以外",
  "vol7-paralyzing-potion": "機械族以外",
  "vol7-sword-deep-seated": "全モンスター",
  "bo7-magnetic-ring": "全モンスター",
  "bo7-doping": "全モンスター",
  "mr-axe-despair": "全モンスター",
  "mr-black-pendant": "全モンスター",
  "mr-horn-light": "全モンスター",
  "mr-malevolent-nuzzler": "全モンスター",
  "bo2-dark-piercing-sword": "闇属性",
  "bo2-elf-light": "光属性",
  "bo2-steel-shell": "水属性",
  "bo2-awakening": "地属性",
  "bo2-burning-spear": "炎属性",
  "bo2-gust-fan": "風属性",
});

const simpleSpellEffects = Object.freeze({
  "vol1-red-medicine": { gain: 500, damage: 0 },
  "vol1-sparks": { gain: 0, damage: 200 },
  "vol2-goblin-secret-remedy": { gain: 600, damage: 0 },
  "vol2-final-flame": { gain: 0, damage: 600 },
  "bo1-blue-potion": { gain: 400, damage: 0 },
  "bo1-thunder": { gain: 0, damage: 300 },
  "stb-moyan-curry": { gain: 200, damage: 0 },
  "stb-fireball": { gain: 0, damage: 500 },
  "vol7-tremendous-fire": { gain: 0, damage: 1000, selfDamage: 500 },
  "bo2-angel-blood": { gain: 800, damage: 0 },
  "bo2-fire": { gain: 0, damage: 800 },
  "ex-023": { gain: 1000, damage: 0 },
});

export function simpleSpellEffect(id) {
  return simpleSpellEffects[id] ?? null;
}

export function shouldCpuUseSimpleSpell(id, currentLp, startingLp = 8000) {
  const effect = simpleSpellEffect(id);
  if (!effect) return false;
  if ((effect.selfDamage ?? 0) >= currentLp) return false;
  return effect.damage > 0 || currentLp <= startingLp - effect.gain;
}

export function resolveSimpleSpellLife(id, ownLp, opponentLp) {
  const effect = simpleSpellEffect(id);
  if (!effect) return null;
  const nextOwnLp = ownLp + effect.gain - (effect.selfDamage ?? 0);
  const nextOpponentLp = opponentLp - effect.damage;
  const outcome = nextOwnLp <= 0 && nextOpponentLp <= 0
    ? "draw"
    : nextOpponentLp <= 0
      ? "own-win"
      : nextOwnLp <= 0
        ? "own-lose"
        : null;
  return { ownLp: nextOwnLp, opponentLp: nextOpponentLp, outcome };
}

export function resolveUpstartGoblin(hand, deck, opponentLp) {
  if (deck.length === 0) return null;
  return {
    hand: [...hand, deck[0]],
    deck: deck.slice(1),
    opponentLp: Math.max(0, opponentLp) + 1000,
  };
}

export function shouldCpuActivateSwords(opponentMonsterCount, activeSwordsCount, spellTrapCount, fieldLimit = 5) {
  return opponentMonsterCount > 0 && activeSwordsCount === 0 && spellTrapCount < fieldLimit;
}

const raceDestructionSpells = Object.freeze({
  "vol4-eternal-drought": "水族",
  "vol4-breath-god": "岩石族",
  "vol4-acid-storm": "機械族",
  "vol4-warrior-elimination": "戦士族",
  "vol4-insecticide": "昆虫族",
  "bo6-witch-hunt": "魔法使い族",
  "bo6-exile-wicked": "悪魔族",
});

export function raceDestructionKind(id) {
  return raceDestructionSpells[id] ?? null;
}

export function isRaceDestructionTarget(id, kind, faceDown) {
  return !faceDown && raceDestructionKind(id) === kind;
}

export function shouldCpuUseRaceDestructionSpell(id, cpuKinds, opponentKinds) {
  const kind = raceDestructionKind(id);
  if (!kind) return false;
  const cpuTargets = cpuKinds.filter((value) => value === kind).length;
  const opponentTargets = opponentKinds.filter((value) => value === kind).length;
  return opponentTargets > cpuTargets;
}

export function shouldCpuUseHeavyStorm(cpuSpellTrapCount, opponentSpellTrapCount, cpuFieldSpell = false, opponentFieldSpell = false) {
  const ownLoss = Math.max(0, cpuSpellTrapCount) + (cpuFieldSpell ? 1 : 0);
  const opponentLoss = Math.max(0, opponentSpellTrapCount) + (opponentFieldSpell ? 1 : 0);
  return opponentLoss > ownLoss;
}

export function strongestAttackIndex(attacks) {
  if (attacks.length === 0) return null;
  return attacks.reduce((bestIndex, attack, index) => attack > attacks[bestIndex] ? index : bestIndex, 0);
}

export function shouldPlayerChooseFlipTarget(owner, turn, phase) {
  return owner === "player";
}

const directAttackMonsters = new Set([
  "vol5-mystic-lamp",
  "vol5-leghul",
  "vol5-ooguchi",
  "vol5-jinzo-7",
  "vol5-rainbow-flower",
  "vol5-queens-double",
]);

export function canMonsterAttackDirectly(id) {
  return directAttackMonsters.has(id);
}

export function electricLizardAttackLockTurn(defenderId, attackerKind, currentTurn) {
  return defenderId === "vol4-electric-lizard" && attackerKind !== "アンデット族"
    ? currentTurn + 2
    : null;
}

export function canDeclareAttackOnTurn(attackLockedTurn, currentTurn) {
  return attackLockedTurn !== currentTurn;
}

export function attackDeclarationCost(id, lifePoints) {
  if (id !== "vol7-dark-elf") return 0;
  return lifePoints > 1000 ? 1000 : null;
}

export function endsBattlePhaseOnBattleDestruction(id, destroyed) {
  return id === "vol7-unhappy-maiden" && destroyed;
}

export function isMirrorForceDestructionTarget(position) {
  return position === "attack";
}

export function ironScorpionDestroyTurn(defenderId, attackerKind, currentTurn) {
  return defenderId === "vol4-iron-scorpion" && attackerKind !== "機械族"
    ? currentTurn + 4
    : null;
}

export function isIronScorpionDestructionDue(destroyTurn, currentTurn) {
  return destroyTurn === currentTurn;
}

const battleDamageEffects = Object.freeze({
  "vol5-white-magical-hat": "discard-random",
  "vol5-masked-sorcerer": "draw",
  "bo7-devil-cook": "opponent-draw-two",
});

export function battleDamageEffect(id) {
  return battleDamageEffects[id] ?? null;
}

export function battleAttackBonus(attackerId, defenderAttribute) {
  return attackerId === "bo7-flying-insect-soldier" && defenderAttribute === "風" ? 1000 : 0;
}

export function battleDefenseValue(defenderId, defenderDefense, attackerAttribute) {
  if (defenderId !== "bo3-dark-artist" || attackerAttribute !== "光") return defenderDefense;
  return Math.floor(Math.max(0, defenderDefense) / 2);
}

export function mechanicalSpiderDestroys(attackerId, defenderAttribute) {
  return attackerId === "bo4-mechanical-spider" && defenderAttribute === "闇";
}

export function foreignSwordsmanDestroyTurn(attackerId, currentTurn) {
  return attackerId === "bo4-foreign-swordsman" || attackerId === "bo4-zone-eater" ? currentTurn + 8 : null;
}

export function mysteriousPuppeteerLifeGain(faceUpMonsterIds, summonedCount = 1) {
  const puppeteers = faceUpMonsterIds.filter((id) => id === "bo5-mysterious-puppeteer").length;
  return puppeteers * Math.max(0, summonedCount) * 500;
}

export function positionChangeEffect(id, fromPosition, toPosition) {
  if (toPosition === "attack" && id === "bo5-dragon-killer") return "destroy-dragon";
  if (fromPosition === "defense" && toPosition === "attack" && id === "bo7-crass-clown") return "return-monster";
  if (fromPosition === "attack" && toPosition === "defense" && id === "bo7-dream-clown") return "destroy-monster";
  if (fromPosition === "attack" && toPosition === "defense" && id === "bo7-wisdom-devil") return "shuffle-deck";
  return null;
}

export function cockroachKnightReturns(id) {
  return id === "bo4-cockroach-knight";
}

export function patrolRoboCanInspect(faceUpMonsterIds, opponentSetCount) {
  return opponentSetCount > 0 && faceUpMonsterIds.includes("bo3-patrol-robo");
}

export function hourglassOriginalStats(id, atk, defense, faceUpTurn, currentTurn) {
  if (id !== "bo3-hourglass-courage" || !Number.isInteger(faceUpTurn) || !Number.isInteger(currentTurn)) {
    return { atk, def: defense };
  }
  const elapsedTurns = Math.max(0, currentTurn - faceUpTurn);
  return elapsedTurns < 3
    ? { atk: Math.floor(atk / 2), def: Math.floor(defense / 2) }
    : { atk: atk * 2, def: defense * 2 };
}

export function darkCastleUndeadBoost(faceUpTurns, currentTurn) {
  return faceUpTurns.reduce((total, turn) => total + Math.min(5, Math.max(1, currentTurn - turn + 1)) * 200, 0);
}

export function pumpkingTimedBonus(id, castlePresent, faceUpTurn, currentTurn) {
  if (id !== "bo7-pumpking" || !castlePresent || !Number.isInteger(faceUpTurn)) return 0;
  return Math.min(5, Math.max(1, currentTurn - faceUpTurn + 1)) * 100;
}

export function giantSpiderAttackLife(id, lifePoints, coinMatched) {
  if (id !== "bo7-giant-spider" || coinMatched) return Math.max(0, lifePoints);
  return Math.ceil(Math.max(0, lifePoints) / 2);
}

export function canPayMonsterEffect(lifePoints, cost) {
  return Number.isFinite(lifePoints) && Number.isFinite(cost) && cost >= 0 && lifePoints > cost;
}

export function aileSwordsmanAttackBonus(boostTurn, tributeCount, currentTurn) {
  if (boostTurn !== currentTurn || !Number.isInteger(tributeCount) || tributeCount < 1) return 0;
  return tributeCount * 700;
}

export function bottomDeckSelection(cards, selectedIndexes) {
  const selected = new Set(selectedIndexes);
  return {
    remaining: cards.filter((_, index) => !selected.has(index)),
    bottom: cards.filter((_, index) => selected.has(index)),
  };
}

export function gracefulCharityDraw(hand, deck) {
  if (deck.length < 3) return null;
  return { hand: [...hand, ...deck.slice(0, 3)], deck: deck.slice(3) };
}

export function selectedCards(cards, selectedIndexes) {
  const selected = new Set(selectedIndexes);
  return {
    remaining: cards.filter((_, index) => !selected.has(index)),
    chosen: cards.filter((_, index) => selected.has(index)),
  };
}

export function justDessertsDamage(monsterCount) {
  return Number.isInteger(monsterCount) && monsterCount > 0 ? monsterCount * 500 : 0;
}

export function temporaryBattleStatBonus(effectTurn, currentTurn) {
  return effectTurn === currentTurn ? 500 : 0;
}

export function canUseUltimateOffering(lifePoints, normalSummoned, fieldCount, hasSummonCandidate, fieldLimit = 5) {
  return lifePoints > 500 && normalSummoned === true && fieldCount < fieldLimit && hasSummonCandidate === true;
}

export function reverseAdjustedStat(base, adjusted, active) {
  if (!active) return Math.max(0, adjusted);
  return Math.max(0, base - (adjusted - base));
}

export function advanceSwordsTurns(turns) {
  const remaining = turns.map((turn) => turn - 1).filter((turn) => turn > 0);
  return { remaining, expired: turns.length - remaining.length };
}

export function takeGraveyardCard(cards, index) {
  if (!Number.isInteger(index) || index < 0 || index >= cards.length) return null;
  return {
    cardId: cards[index],
    remaining: cards.filter((_, cardIndex) => cardIndex !== index),
  };
}

export function moveDeckCard(cards, fromIndex, toIndex) {
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return [...cards];
  if (fromIndex < 0 || fromIndex >= cards.length || toIndex < 0 || toIndex >= cards.length) return [...cards];
  const next = [...cards];
  const [card] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, card);
  return next;
}

export function canActivateTributeToDoomed(handSize, fieldMonsterCount) {
  return handSize >= 2 && fieldMonsterCount > 0;
}

export function toggleLimitedSelection(values, value, limit = 5) {
  if (values.includes(value)) return values.filter((item) => item !== value);
  if (values.length >= limit) return [...values];
  return [...values, value];
}

export function canActivateCheerfulCoffin(cardTypes) {
  return cardTypes.includes("monster");
}

export function canActivateTwoProngedAttack(playerMonsterCount, opponentMonsterCount, trapIds) {
  return playerMonsterCount >= 2 && opponentMonsterCount >= 1 && trapIds.includes("stb-two-pronged-attack");
}

const guardianMonsters = new Set(["vol5-sanga", "vol5-kazejin", "vol5-suijin"]);

export function isGuardianMonster(id) {
  return guardianMonsters.has(id);
}

export function guardianAdjustedAttack(attack, activate) {
  return activate ? 0 : attack;
}

export function canBlastJugglerTarget(faceDown, attack) {
  return !faceDown && attack <= 1000;
}

export function deSpellDestroys(cardType, cardId = "") {
  return cardType === "spell" || cardId === "vol4-cocoon-evolution";
}

export function firstSpellTargetIndex(cardTypes) {
  const index = cardTypes.findIndex((cardType) => cardType === "spell");
  return index >= 0 ? index : null;
}

const faceUpTrapIds = new Set(["vol5-call-darkness", "stb-dragon-capture-jar"]);

export function isFaceUpTrapTarget(id) {
  return faceUpTrapIds.has(id);
}

export function firstFaceUpTrapIndex(ids) {
  const index = ids.findIndex(isFaceUpTrapTarget);
  return index >= 0 ? index : null;
}

const flipEffects = Object.freeze({
  "vol6-dragon-piper": "destroy-dragon-jar",
  "vol3-reaper-cards": "destroy-trap",
  "vol3-armed-ninja": "destroy-spell",
  "vol3-man-eater-bug": "destroy-monster",
  "vol3-skelengel": "draw",
  "vol3-hane-hane": "return-monster",
  "vol4-magician-faith": "recover-spell",
  "vol4-mask-darkness": "recover-trap",
  "vol5-big-eye": "reorder-five",
  "vol7-thunder-nyan-nyan": "gain-3000",
  "vol7-sword-queen": "damage-spell-traps",
  "bo5-trap-master": "destroy-trap",
  "bo5-needle-worm": "mill-five",
  "bo5-morphing-jar": "reload-five",
  "bo5-needle-ball": "pay-2000-damage-1000",
  "bo6-doppelganger": "destroy-two-set-spell-traps",
  "bo6-penguin-soldier": "return-two-monsters",
  "ex-033": "inspect-all-set",
});

export function flipEffect(id) {
  return flipEffects[id] ?? null;
}

export function phantomWallReturnsAttacker(defenderId, attackerDestroyed) {
  return defenderId === "ex-034" && !attackerDestroyed;
}

export function dragonTargetProtected(targetKind, targetFaceDown, faceUpLordCount) {
  return targetKind === "ドラゴン族" && !targetFaceDown && faceUpLordCount > 0;
}

export function flipLifeAmount(id, opponentSpellTrapCount = 0) {
  if (id === "vol7-thunder-nyan-nyan") return { gain: 3000, damage: 0 };
  if (id === "vol7-sword-queen") return { gain: 0, damage: Math.max(0, opponentSpellTrapCount) * 500 };
  return null;
}

export function graveyardLifeLoss(id) {
  return id === "vol7-thunder-nyan-nyan" ? 5000 : 0;
}

export function catapultTurtleDamage(originalAttack) {
  return Math.max(0, Math.floor((originalAttack ?? 0) / 2));
}

export function thunderDragonSearchIndexes(deck, limit = 2) {
  return deck.flatMap((id, index) => id === "vol7-thunder-dragon" ? [index] : []).slice(0, limit);
}

export function barrelDragonCoinResult(tosses) {
  const normalized = tosses.slice(0, 3).map(Boolean);
  const heads = normalized.filter(Boolean).length;
  return { heads, destroys: normalized.length === 3 && heads >= 2 };
}

export function canUseKuriboh(hand, attackerSide, battleDamage) {
  return attackerSide === "cpu" && battleDamage > 0 && hand.includes("vol7-kuriboh");
}

export function matangoStandbyDamage(faceUpIds) {
  return faceUpIds.filter((id) => id === "vol7-matango").length * 300;
}

export function canTransferMatango(lifePoints, opponentFieldCount, fieldLimit = 5) {
  return lifePoints > 500 && opponentFieldCount < fieldLimit;
}

export function canStopAttackTarget(position, faceDown) {
  return position === "attack" && !faceDown;
}

export function swappedMonsterStats(attack, defense, active) {
  return active ? { atk: defense ?? 0, def: attack ?? 0 } : { atk: attack ?? 0, def: defense ?? 0 };
}

export function isDragonCaptureJarLocked(kind, faceDown, jarActive) {
  return jarActive && !faceDown && kind === "ドラゴン族";
}

export function isElegantEgotistTarget(id) {
  return id === "vol4-harpie-lady" || id === "vol4-harpie-sisters";
}

export function canNormalSummonMonster(id, fusion = false) {
  return !fusion && id !== "vol4-harpie-sisters" && id !== "vol5-larvae-moth" && id !== "vol6-great-moth";
}

export function canSpecialSummonLarvaeMoth(currentTurn, cocoonEquippedTurn) {
  return canSpecialSummonMoth("vol5-larvae-moth", currentTurn, cocoonEquippedTurn);
}

export function canSpecialSummonMoth(id, currentTurn, cocoonEquippedTurn) {
  if (!Number.isInteger(cocoonEquippedTurn)) return false;
  if (id === "vol5-larvae-moth") return currentTurn - cocoonEquippedTurn >= 4;
  if (id === "vol6-great-moth") return currentTurn - cocoonEquippedTurn >= 8;
  return false;
}

export function canActivateChangeOfHeart(playerMonsterCount, opponentMonsterCount, fieldLimit = 5) {
  return playerMonsterCount < fieldLimit && opponentMonsterCount > 0;
}

export function canRespondWithAntiRaigeki(trapIds, spellId) {
  return spellId === "stb-raigeki" && trapIds.includes("vol5-anti-raigeki");
}

export function spellSpecificTrapResponse(trapIds, spellId) {
  const responseBySpell = {
    "vol1-dark-hole": "bo4-white-hole",
    "vol2-monster-reborn": "bo4-call-grave",
    "stb-harpies-feather-duster": "bo7-griffin-wing",
  };
  const trapId = responseBySpell[spellId] ?? null;
  return trapId && trapIds.includes(trapId) ? trapId : null;
}

export function royalDecreeNegatesTraps(playerActiveTrapIds, cpuActiveTrapIds) {
  return [...playerActiveTrapIds, ...cpuActiveTrapIds].includes("bo5-royal-decree");
}

export function magicThornDamage(discardCount, opponentActiveTrapIds, trapsNegated = false) {
  return !trapsNegated && opponentActiveTrapIds.includes("bo6-magic-thorn")
    ? Math.max(0, discardCount) * 500
    : 0;
}

export function canActivateSevenTools(lifePoints, trapIds) {
  return lifePoints > 1000 && trapIds.includes("vol6-seven-tools");
}

export function canActivateMagicJammer(handSize, trapIds) {
  return handSize > 0 && trapIds.includes("vol6-magic-jammer");
}

export function canActivateHornOfHeaven(monsterCount, trapIds) {
  return monsterCount > 0 && trapIds.includes("vol6-horn-heaven");
}

export function solemnJudgmentRemainingLp(lifePoints, trapIds) {
  return lifePoints > 0 && trapIds.includes("vol6-solemn-judgment") ? Math.ceil(lifePoints / 2) : null;
}

export function isMonsterRebornBlocked(playerSpellTrap, cpuSpellTrap) {
  return [...playerSpellTrap, ...cpuSpellTrap].includes("vol5-call-darkness");
}

export function fakeTrapCanProtect(trapIds, targetIndex) {
  return trapIds[targetIndex] !== "vol5-fake-trap" && trapIds.includes("vol5-fake-trap");
}

export function equippedMonsterStats(atk, defense, equippedIds) {
  const cocoonEquipped = equippedIds.includes("vol4-cocoon-evolution");
  const modifiers = equippedIds.reduce((result, id) => {
    if (id === "vol4-cocoon-evolution" || id === "vol7-germ-infection" || id === "vol7-paralyzing-potion") return result;
    if (id === "vol7-sword-deep-seated") return { atk: result.atk + 500, def: result.def + 500 };
    if (id === "bo7-magnetic-ring") return { atk: result.atk - 500, def: result.def - 500 };
    if (id === "bo7-doping") return { atk: result.atk + 700, def: result.def };
    if (id === "mr-axe-despair") return { atk: result.atk + 1000, def: result.def };
    if (id === "mr-black-pendant") return { atk: result.atk + 500, def: result.def };
    if (id === "mr-horn-light") return { atk: result.atk, def: result.def + 800 };
    if (id === "mr-malevolent-nuzzler") return { atk: result.atk + 700, def: result.def };
    if (id.startsWith("bo2-")) return { atk: result.atk + 400, def: result.def - 200 };
    return { atk: result.atk + 300, def: result.def + 300 };
  }, { atk: 0, def: 0 });
  return {
    atk: Math.max(0, (cocoonEquipped ? 0 : atk) + modifiers.atk),
    def: Math.max(0, (cocoonEquipped ? 2000 : defense) + modifiers.def),
  };
}

export function germInfectionPenalty(equippedIds, standbyCount = 0) {
  return equippedIds.includes("vol7-germ-infection") ? Math.max(0, standbyCount) * 300 : 0;
}

export function dopingPenalty(equippedIds, standbyCount = 0) {
  return equippedIds.includes("bo7-doping") ? Math.max(0, standbyCount) * 200 : 0;
}

export function paralyzingPotionPreventsAttack(equippedIds) {
  return equippedIds.includes("vol7-paralyzing-potion");
}

export function robbinGoblinCanTrigger(spellTrapIds, opponentHandSize) {
  return opponentHandSize > 0 && spellTrapIds.includes("vol7-robbin-goblin");
}

export function wormBeastReturns(id, faceDown, summonedTurn, currentTurn) {
  return id === "bo4-worm-beast" && !faceDown && summonedTurn === currentTurn;
}

const attributeAuraEffects = Object.freeze({
  "vol6-hoshiningen": { boost: "光", weaken: "闇" },
  "vol6-star-boy": { boost: "水", weaken: "炎" },
  "vol6-milus-radiant": { boost: "地", weaken: "風" },
  "vol6-little-chimera": { boost: "炎", weaken: "水" },
  "vol6-bladefly": { boost: "風", weaken: "地" },
  "vol6-witch-apprentice": { boost: "闇", weaken: "光" },
});

const fieldSpellRaceEffects = Object.freeze({
  "stb-forest": { boost: ["昆虫族", "獣族", "植物族", "獣戦士族"], weaken: [] },
  "stb-wasteland": { boost: ["恐竜族", "アンデット族", "岩石族"], weaken: [] },
  "stb-mountain": { boost: ["ドラゴン族", "鳥獣族", "雷族"], weaken: [] },
  "stb-sogen": { boost: ["戦士族", "獣戦士族"], weaken: [] },
  "stb-umi": { boost: ["魚族", "海竜族", "雷族", "水族"], weaken: ["機械族", "炎族"] },
  "stb-yami": { boost: ["魔法使い族", "悪魔族"], weaken: ["天使族"] },
});

export function fieldSpellStatModifier(kind, fieldSpellIds = []) {
  return fieldSpellIds.reduce((modifier, id) => {
    const effect = fieldSpellRaceEffects[id];
    if (effect?.boost.includes(kind)) return modifier + 200;
    if (effect?.weaken.includes(kind)) return modifier - 200;
    return modifier;
  }, 0);
}

export function bestCpuFieldSpell(fieldSpellIds, cpuKinds, opponentKinds) {
  return fieldSpellIds
    .map((id) => ({
      id,
      score: cpuKinds.reduce((sum, kind) => sum + fieldSpellStatModifier(kind, [id]), 0)
        - opponentKinds.reduce((sum, kind) => sum + fieldSpellStatModifier(kind, [id]), 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)[0]?.id ?? null;
}

export function continuousMonsterStats({ id, attribute, kind = "", atk, def: defense, handSize = 0, graveyardMonsterCount = 0, faceUpPlantCount = 0, faceUpMachineCount = 0, equipCount = 0, auraIds = [], allyIds = [], fieldSpellIds = [] }) {
  let nextAtk = atk;
  let nextDef = defense;
  if (id === "vol6-shadow-ghoul") nextAtk += graveyardMonsterCount * 100;
  if (id === "bo3-udan") nextAtk += faceUpPlantCount * 100;
  if (id === "bo5-machine-king") nextAtk += faceUpMachineCount * 100;
  if (id === "vol6-muka-muka") {
    nextAtk += handSize * 300;
    nextDef += handSize * 300;
  }
  if (id === "vol7-barbarian-1") nextAtk += allyIds.filter((allyId) => allyId === "vol7-barbarian-2").length * 500;
  if (id === "vol7-barbarian-2") nextAtk += allyIds.filter((allyId) => allyId === "vol7-barbarian-1").length * 500;
  if (id === "mr-maha-vailo") nextAtk += Math.max(0, equipCount) * 500;
  auraIds.forEach((auraId) => {
    const aura = attributeAuraEffects[auraId];
    if (aura?.boost === attribute) nextAtk += 500;
    if (aura?.weaken === attribute) nextAtk -= 400;
  });
  const fieldModifier = fieldSpellStatModifier(kind, fieldSpellIds);
  nextAtk += fieldModifier;
  nextDef += fieldModifier;
  return { atk: Math.max(0, nextAtk), def: Math.max(0, nextDef) };
}

export function canDeckSearchTarget(sourceId, target) {
  if (!target || target.cardType !== "monster") return false;
  if (sourceId === "vol6-sangan") return (target.atk ?? 0) <= 1500;
  if (sourceId === "vol6-witch-black-forest") return (target.def ?? 0) <= 1500;
  return false;
}

export const competitiveCpuDeckLatestPackId = "magic-ruler";

export const competitiveCpuDeck = Object.freeze([
  "mr-maha-vailo",
  "vol7-robbin-goblin",
  "vol5-white-magical-hat",
  ...Array(3).fill("vol3-skull-red-bird"),
  "vol7-rainbow-fish",
  "vol1-gaia",
  "vol7-barrel-dragon",
  ...Array(2).fill("vol7-prevent-rat"),
  "mr-axe-despair",
  ...Array(3).fill("vol3-giant-soldier-stone"),
  ...Array(3).fill("vol3-man-eater-bug"),
  "vol3-hane-hane",
  "vol6-sangan",
  "vol6-witch-black-forest",
  ...Array(2).fill("vol7-rainbow-fish"),
  "vol3-reaper-cards",
  ...Array(2).fill("vol2-curse-of-dragon"),
  ...Array(2).fill("vol7-dark-elf"),
  "vol1-dark-hole",
  "vol1-fissure",
  "vol7-tremendous-fire",
  "mr-mystical-space-typhoon",
  "vol1-trap-hole",
  "vol7-mirror-force",
  "mr-upstart-goblin",
  "vol2-swords-revealing-light",
  "vol2-monster-reborn",
  "vol3-pot-of-greed",
  "stb-polymerization",
  "stb-raigeki",
]);

export function bestCpuBattleTargetIndex(attack, targets) {
  let bestIndex = null;
  let bestScore = -1;
  targets.forEach((target, index) => {
    let score = -1;
    if (target.faceDown) score = 1;
    else if (target.position === "attack" && attack > target.atk) score = 2000 + attack - target.atk;
    else if (target.position === "defense" && attack > target.def) score = 1000 + target.def;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
}
