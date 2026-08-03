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
    return { attackerDestroyed: true, defenderDestroyed: false, attackerDamage: defense - attack, defenderDamage: 0 };
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

export function deSpellDestroys(cardType) {
  return cardType === "spell";
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
});

export function flipEffect(id) {
  return flipEffects[id] ?? null;
}
