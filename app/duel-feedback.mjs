export function feedbackForMessage(message) {
  if (!message) return [];
  if (message.includes("落とし穴を発動")) {
    return [{ kind: "trap", title: "TRAP OPEN", detail: "落とし穴", message, duration: 1250 }];
  }
  if (message.includes("リバース") || message.includes("の効果で")) {
    const monster = message.match(/(?:の)?([^。]+?)(?:がリバース|の効果で)/)?.[1]?.replace(/^CPUの|^自分の/, "") ?? "モンスター効果";
    return [{ kind: "effect", title: "MONSTER EFFECT", detail: monster, message, duration: 1200 }];
  }
  if (message.includes("直接攻撃")) {
    const attacker = message.match(/^(?:CPUの)?(.+?)の直接攻撃/)?.[1] ?? "DIRECT ATTACK";
    return [{ kind: "attack", title: "DIRECT ATTACK", detail: attacker, message, duration: 1050 }];
  }
  if (message.includes("を攻撃")) {
    const match = message.match(/^(?:CPUの)?(.+?)が(.+?)を攻撃/);
    const battle = match ? `${match[1]}  VS  ${match[2]}` : "BATTLE";
    const feedback = [{ kind: "attack", title: "ATTACK", detail: battle, message, duration: 900 }];
    if (message.includes("破壊されない")) feedback.push({ kind: "guard", title: "DEFENSE", detail: "攻撃を防いだ", message, duration: 1000 });
    else if (message.includes("破壊")) feedback.push({ kind: "destroy", title: "DESTROY", detail: "モンスター撃破", message, duration: 1100 });
    return feedback;
  }
  if (message.includes("を発動")) {
    const card = message.match(/^(?:CPUが)?(.+?)を発動/)?.[1] ?? "魔法カード";
    return [{ kind: "spell", title: "SPELL ACTIVATE", detail: card, message, duration: 1250 }];
  }
  if (message.includes("を破壊した") || message.includes("を破壊。") || message.includes("すべてのモンスターを破壊")) {
    return [{ kind: "destroy", title: "DESTROY", detail: "モンスター撃破", message, duration: 1100 }];
  }
  if (message.includes("を召喚") || message.includes("特殊召喚")) {
    const monster = message.match(/^(?:CPUが)?(.+?)を(?:特殊)?召喚/)?.[1] ?? "モンスター";
    return [{ kind: "summon", title: "SUMMON", detail: monster, message, duration: 1000 }];
  }
  return [];
}
