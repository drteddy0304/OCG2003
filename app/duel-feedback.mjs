export function feedbackForMessage(message) {
  if (!message) return [];
  if (message.includes("落とし穴を発動")) {
    return [{ kind: "trap", title: "TRAP", detail: "罠発動", duration: 850 }];
  }
  if (message.includes("リバース") || message.includes("の効果で")) {
    return [{ kind: "effect", title: "MONSTER EFFECT", detail: "効果発動", duration: 800 }];
  }
  if (message.includes("直接攻撃")) {
    return [{ kind: "attack", title: "DIRECT ATTACK", detail: "直接攻撃", duration: 650 }];
  }
  if (message.includes("を攻撃")) {
    const feedback = [{ kind: "attack", title: "ATTACK", detail: "攻撃", duration: 500 }];
    if (message.includes("破壊されない")) feedback.push({ kind: "guard", title: "BLOCK", detail: "守備成功", duration: 700 });
    else if (message.includes("破壊")) feedback.push({ kind: "destroy", title: "DESTROY", detail: "撃破", duration: 700 });
    return feedback;
  }
  if (message.includes("を発動")) {
    return [{ kind: "spell", title: "SPELL", detail: "魔法発動", duration: 800 }];
  }
  if (message.includes("を破壊した") || message.includes("を破壊。") || message.includes("すべてのモンスターを破壊")) {
    return [{ kind: "destroy", title: "DESTROY", detail: "撃破", duration: 700 }];
  }
  if (message.includes("を召喚") || message.includes("特殊召喚")) {
    return [{ kind: "summon", title: "SUMMON", detail: "召喚", duration: 600 }];
  }
  return [];
}
