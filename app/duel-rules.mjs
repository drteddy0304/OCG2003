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
});

export function simpleSpellEffect(id) {
  return simpleSpellEffects[id] ?? null;
}

export function shouldCpuUseSimpleSpell(id, currentLp, startingLp = 8000) {
  const effect = simpleSpellEffect(id);
  if (!effect) return false;
  return effect.damage > 0 || currentLp <= startingLp - effect.gain;
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

export function strongestAttackIndex(attacks) {
  if (attacks.length === 0) return null;
  return attacks.reduce((bestIndex, attack, index) => attack > attacks[bestIndex] ? index : bestIndex, 0);
}

export function shouldPlayerChooseFlipTarget(owner, turn, phase) {
  return owner === "player" && (turn === "player" || phase === "battle");
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
});

export function battleDamageEffect(id) {
  return battleDamageEffects[id] ?? null;
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
});

export function flipEffect(id) {
  return flipEffects[id] ?? null;
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
  const regularEquipCount = equippedIds.filter((id) => id !== "vol4-cocoon-evolution").length;
  return {
    atk: (cocoonEquipped ? 0 : atk) + regularEquipCount * 300,
    def: (cocoonEquipped ? 2000 : defense) + regularEquipCount * 300,
  };
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

export function continuousMonsterStats({ id, attribute, kind = "", atk, def: defense, handSize = 0, graveyardMonsterCount = 0, auraIds = [], fieldSpellIds = [] }) {
  let nextAtk = atk;
  let nextDef = defense;
  if (id === "vol6-shadow-ghoul") nextAtk += graveyardMonsterCount * 100;
  if (id === "vol6-muka-muka") {
    nextAtk += handSize * 300;
    nextDef += handSize * 300;
  }
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

export const competitiveCpuDeck = Object.freeze([
  ...Array(3).fill("vol3-rogue-doll"),
  ...Array(3).fill("vol3-skull-red-bird"),
  "vol2-wild-raptor",
  ...Array(2).fill("vol1-gaia"),
  ...Array(2).fill("vol2-holy-elf"),
  "stb-mountain",
  ...Array(3).fill("vol3-giant-soldier-stone"),
  ...Array(3).fill("vol3-man-eater-bug"),
  ...Array(3).fill("vol3-hane-hane"),
  ...Array(2).fill("vol3-witty-phantom"),
  "vol3-reaper-cards",
  ...Array(2).fill("vol2-curse-of-dragon"),
  ...Array(2).fill("vol1-dark-magician"),
  "vol1-dark-hole",
  ...Array(2).fill("vol1-fissure"),
  "vol4-acid-storm",
  ...Array(3).fill("vol1-trap-hole"),
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
