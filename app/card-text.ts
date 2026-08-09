import type { Card, Rarity } from "./card-data";

export const rarityNames: Record<Rarity, string> = {
  SE: "シークレットレア",
  UR: "ウルトラレア",
  SR: "スーパーレア",
  R: "レア",
  N: "ノーマル",
};

const descriptions: Record<string, string> = {
  "vol1-legendary-sword": "戦士族モンスター1体のATK・DEFを300アップする。",
  "vol1-beast-fangs": "獣族モンスター1体のATK・DEFを300アップする。",
  "vol1-violet-crystal": "アンデット族モンスター1体のATK・DEFを300アップする。",
  "vol1-book-secret-arts": "魔法使い族モンスター1体のATK・DEFを300アップする。",
  "vol1-power-kaishin": "水族モンスター1体のATK・DEFを300アップする。",
  "vol1-dark-hole": "フィールドのモンスターをすべて破壊する。",
  "vol1-red-medicine": "自分のLPを500回復する。",
  "vol1-sparks": "相手に200ダメージを与える。",
  "vol1-fissure": "相手フィールドの最もATKが低い表側モンスター1体を破壊する。",
  "vol1-trap-hole": "相手がATK1000以上のモンスターを召喚した時、そのモンスターを破壊する。",
  "vol2-dark-energy": "悪魔族モンスター1体のATK・DEFを300アップする。",
  "vol2-laser-cannon-armor": "昆虫族モンスター1体のATK・DEFを300アップする。",
  "vol2-vile-germs": "植物族モンスター1体のATK・DEFを300アップする。",
  "vol2-machine-conversion-factory": "機械族モンスター1体のATK・DEFを300アップする。",
  "vol2-raise-body-heat": "恐竜族モンスター1体のATK・DEFを300アップする。",
  "vol2-goblin-secret-remedy": "自分のLPを600回復する。",
  "vol2-final-flame": "相手に600ダメージを与える。",
  "vol2-swords-revealing-light": "相手モンスターを表側にし、相手の攻撃を3ターン封じる。",
  "vol2-monster-reborn": "自分または相手の墓地からモンスター1体を特殊召喚する。",
  "vol2-de-spell": "フィールドのカード1枚を確認し、魔法カードなら破壊する。",
  "vol3-reaper-cards": "リバース：フィールドの罠カード1枚を確認し、罠カードなら破壊する。",
  "vol3-armed-ninja": "リバース：フィールドの魔法カード1枚を確認し、魔法カードなら破壊する。",
  "vol3-man-eater-bug": "リバース：フィールドのモンスター1体を破壊する。",
  "vol3-skelengel": "リバース：デッキからカードを1枚ドローする。",
  "vol3-hane-hane": "リバース：フィールドのモンスター1体を持ち主の手札に戻す。",
  "vol3-silver-bow-arrow": "天使族モンスター1体のATK・DEFを300アップする。",
  "vol3-dragon-treasure": "ドラゴン族モンスター1体のATK・DEFを300アップする。",
  "vol3-electro-whip": "雷族モンスター1体のATK・DEFを300アップする。",
  "vol3-mystical-moon": "獣戦士族モンスター1体のATK・DEFを300アップする。",
  "vol3-stop-defense": "相手の守備表示モンスター1体を攻撃表示に変更する。",
  "vol3-follow-wind": "鳥獣族モンスター1体のATK・DEFを300アップする。",
  "vol3-pot-of-greed": "デッキからカードを2枚ドローする。",
  "vol3-gravedigger-ghoul": "相手の墓地からモンスターを2体まで除外する。",
  "vol4-cocoon-evolution": "手札から表側表示のプチモスに装備できる。装備中はATK0・DEF2000になる。",
  "vol4-magician-faith": "リバース：自分の墓地から魔法カード1枚を手札に戻す。",
  "vol4-iron-scorpion": "このカードと戦闘した機械族以外のモンスターに時限カウンターを置き、3ターン後に破壊する。",
  "vol4-electric-lizard": "このカードを攻撃したアンデット族以外のモンスターは、次のターン攻撃できない。",
  "vol4-mask-darkness": "リバース：自分の墓地から罠カード1枚を手札に戻す。",
  "vol4-harpie-sisters": "通常召喚できない。万華鏡－華麗なる分身－の効果で特殊召喚する。",
  "vol4-eternal-drought": "フィールドの水族モンスターをすべて破壊する。",
  "vol4-breath-god": "フィールドの岩石族モンスターをすべて破壊する。",
  "vol4-acid-storm": "フィールドの機械族モンスターをすべて破壊する。",
  "vol4-warrior-elimination": "フィールドの戦士族モンスターをすべて破壊する。",
  "vol4-insecticide": "フィールドの昆虫族モンスターをすべて破壊する。",
  "vol4-elegant-egotist": "ハーピィ・レディがいる時、手札・デッキからハーピィ1体を特殊召喚する。",
  "bo1-blue-potion": "自分のLPを400回復する。",
  "bo1-thunder": "相手に300ダメージを与える。",
  "stb-dragon-capture-jar": "フィールドのドラゴン族モンスターを守備表示にし、表示形式の変更を封じる。",
  "stb-forest": "昆虫・獣・植物・獣戦士族のATK・DEFを200アップする。",
  "stb-wasteland": "恐竜・アンデット・岩石族のATK・DEFを200アップする。",
  "stb-mountain": "ドラゴン・鳥獣・雷族のATK・DEFを200アップする。",
  "stb-sogen": "戦士・獣戦士族のATK・DEFを200アップする。",
  "stb-umi": "水・魚・海竜・雷族を強化し、機械・炎族を弱体化する。",
  "stb-yami": "魔法使い・悪魔族を強化し、天使族を弱体化する。",
  "stb-raigeki": "相手フィールドのモンスターをすべて破壊する。",
  "stb-moyan-curry": "自分のLPを200回復する。",
  "stb-fireball": "相手に500ダメージを与える。",
  "stb-polymerization": "融合素材モンスターを使い、融合モンスター1体を融合召喚する。",
  "stb-remove-trap": "フィールドの表側表示の罠カード1枚を破壊する。",
  "stb-two-pronged-attack": "自分のモンスター2体を破壊し、相手のモンスター1体を破壊する。",
};

export function cardDescription(card: Card) {
  if (descriptions[card.id]) return descriptions[card.id];
  if (card.fusion) return "融合素材を使って融合召喚するモンスター。";
  if (card.effect) return "効果モンスター。詳細な効果処理は順次対応予定。";
  if (card.cardType === "spell") return "魔法カード。詳細な効果処理は順次対応予定。";
  if (card.cardType === "trap") return "罠カード。詳細な効果処理は順次対応予定。";
  return "通常モンスター。";
}
