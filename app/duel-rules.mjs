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

export function strongestAttackIndex(attacks) {
  if (attacks.length === 0) return null;
  return attacks.reduce((bestIndex, attack, index) => attack > attacks[bestIndex] ? index : bestIndex, 0);
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

export function deSpellDestroys(cardType, cardId = "") {
  return cardType === "spell" || cardId === "vol4-cocoon-evolution";
}

export function firstSpellTargetIndex(cardTypes) {
  const index = cardTypes.findIndex((cardType) => cardType === "spell");
  return index >= 0 ? index : null;
}

const flipEffects = Object.freeze({
  "vol3-reaper-cards": "destroy-trap",
  "vol3-armed-ninja": "destroy-spell",
  "vol3-man-eater-bug": "destroy-monster",
  "vol3-skelengel": "draw",
  "vol3-hane-hane": "return-monster",
  "vol4-magician-faith": "recover-spell",
  "vol4-mask-darkness": "recover-trap",
});

export function flipEffect(id) {
  return flipEffects[id] ?? null;
}

export function isElegantEgotistTarget(id) {
  return id === "vol4-harpie-lady" || id === "vol4-harpie-sisters";
}

export function canNormalSummonMonster(id, fusion = false) {
  return !fusion && id !== "vol4-harpie-sisters";
}

export function equippedMonsterStats(atk, defense, equippedIds) {
  const cocoonEquipped = equippedIds.includes("vol4-cocoon-evolution");
  const regularEquipCount = equippedIds.filter((id) => id !== "vol4-cocoon-evolution").length;
  return {
    atk: (cocoonEquipped ? 0 : atk) + regularEquipCount * 300,
    def: (cocoonEquipped ? 2000 : defense) + regularEquipCount * 300,
  };
}

export const competitiveCpuDeck = Object.freeze([
  ...Array(3).fill("vol3-rogue-doll"),
  ...Array(3).fill("vol3-skull-red-bird"),
  ...Array(3).fill("vol2-wild-raptor"),
  ...Array(3).fill("vol2-holy-elf"),
  ...Array(3).fill("vol3-giant-soldier-stone"),
  ...Array(3).fill("vol3-man-eater-bug"),
  ...Array(3).fill("vol3-hane-hane"),
  ...Array(3).fill("vol3-witty-phantom"),
  ...Array(2).fill("vol2-curse-of-dragon"),
  ...Array(2).fill("vol1-dark-magician"),
  "vol1-dark-hole",
  ...Array(3).fill("vol1-fissure"),
  ...Array(3).fill("vol1-trap-hole"),
  "vol2-swords-revealing-light",
  "vol2-monster-reborn",
  "vol3-pot-of-greed",
  ...Array(2).fill("vol3-stop-defense"),
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
