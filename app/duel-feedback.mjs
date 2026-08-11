const trapNames = [
  "落とし穴",
  "聖なるバリア－ミラーフォース－",
  "ミラーフォース",
  "盗賊の七つ道具",
  "マジック・ジャマー",
  "昇天の角笛",
  "神の宣告",
  "避雷針",
  "偽物のわな",
  "はさみ撃ち",
  "闇からの呼び声",
];

export function isPendingActionMessage(message) {
  return /[？?]\s*$/.test(message)
    || message.includes("発動しますか")
    || message.includes("選んでください")
    || message.includes("選択してください");
}

export function feedbackForMessage(message) {
  if (!message) return [];
  if (isPendingActionMessage(message)) return [];
  if (message.includes("を発動") && !message.includes("発動せず") && trapNames.some((name) => message.includes(name))) {
    const trap = trapNames.find((name) => message.includes(name)) ?? "罠カード";
    return [{ kind: "trap", title: "TRAP OPEN", detail: trap, message, duration: 2600 }];
  }
  if (message.includes("リバース") || message.includes("の効果で") || message.includes("の効果が発動")) {
    const monster = message.match(/(?:の)?([^。]+?)(?:がリバース|の効果で|の効果が発動)/)?.[1]?.replace(/^CPUの|^自分の/, "") ?? "モンスター効果";
    return [{ kind: "effect", title: "MONSTER EFFECT", detail: monster, message, duration: 2600 }];
  }
  if (message.includes("直接攻撃")) {
    const attacker = message.match(/^(?:CPUの)?(.+?)の直接攻撃/)?.[1] ?? "DIRECT ATTACK";
    return [{ kind: "attack", title: "DIRECT ATTACK", detail: attacker, message, duration: 2000 }];
  }
  if (message.includes("を攻撃")) {
    const match = message.match(/^(?:CPUの)?(.+?)が(.+?)を攻撃/);
    const battle = match ? `${match[1]}  VS  ${match[2]}` : "BATTLE";
    const feedback = [{ kind: "attack", title: "ATTACK", detail: battle, message, duration: 1800 }];
    if (message.includes("破壊されない")) feedback.push({ kind: "guard", title: "DEFENSE", detail: "攻撃を防いだ", message, duration: 2000 });
    else if (message.includes("破壊")) feedback.push({ kind: "destroy", title: "DESTROY", detail: "モンスター撃破", message, duration: 2200 });
    return feedback;
  }
  if (message.includes("を発動") && !message.includes("発動せず")) {
    const card = message.match(/^(?:CPUが)?(.+?)を発動/)?.[1] ?? "魔法カード";
    return [{ kind: "spell", title: "SPELL ACTIVATE", detail: card, message, duration: 2600 }];
  }
  if (message.includes("を破壊した") || message.includes("を破壊。") || message.includes("すべてのモンスターを破壊")) {
    return [{ kind: "destroy", title: "DESTROY", detail: "モンスター撃破", message, duration: 2200 }];
  }
  if (message.includes("を召喚") || message.includes("特殊召喚")) {
    const monster = message.match(/^(?:CPUが)?(.+?)を(?:特殊)?召喚/)?.[1] ?? "モンスター";
    return [{ kind: "summon", title: "SUMMON", detail: monster, message, duration: 1900 }];
  }
  return [];
}
