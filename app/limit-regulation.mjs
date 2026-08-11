export const LIMIT_REGULATION_DATE = "2003-10-15";

export const LIMITED_CARD_NAMES = Object.freeze([
  "封印されし者の左足",
  "封印されし者の左腕",
  "封印されし者の右足",
  "封印されし者の右腕",
  "ヴァンパイア・ロード",
  "お注射天使リリー",
  "混沌帝龍 －終焉の使者－",
  "カオス・ソルジャー －開闢の使者－",
  "キラー・スネーク",
  "クリッター",
  "黒き森のウィッチ",
  "混沌の黒魔術師",
  "サイバーポッド",
  "人造人間－サイコ・ショッカー",
  "同族感染ウィルス",
  "ドル・ドラ",
  "ならず者傭兵部隊",
  "ファイバーポッド",
  "封印されしエクゾディア",
  "魔鏡導士リフレクト・バウンダー",
  "魔導サイエンティスト",
  "魔導戦士 ブレイカー",
  "八汰烏",
  "悪夢の蜃気楼",
  "いたずら好きな双子悪魔",
  "押収",
  "大嵐",
  "苦渋の選択",
  "心変わり",
  "強引な番兵",
  "強奪",
  "強欲な壺",
  "サンダー・ボルト",
  "死者蘇生",
  "団結の力",
  "蝶の短剣－エルマ",
  "手札抹殺",
  "天使の施し",
  "成金ゴブリン",
  "ハーピィの羽根帚",
  "早すぎた埋葬",
  "光の護封剣",
  "ブラック・ホール",
  "魔導師の力",
  "王宮の勅命",
  "現世と冥界の逆転",
  "聖なるバリア －ミラーフォース－",
  "停戦協定",
  "破壊輪",
  "魔法の筒",
  "無謀な欲張り",
  "リビングデッドの呼び声",
]);

export const SEMI_LIMITED_CARD_NAMES = Object.freeze([
  "暗黒のマンティコア",
  "カオスポッド",
  "切り込み隊長",
  "処刑人－マキュラ",
  "メタモルポット",
  "強制転移",
  "増援",
  "抹殺の使徒",
  "ラストバトル！",
]);

const limitedNames = new Set(LIMITED_CARD_NAMES);
const semiLimitedNames = new Set(SEMI_LIMITED_CARD_NAMES);

function cardName(cardOrName) {
  return typeof cardOrName === "string" ? cardOrName : cardOrName?.name ?? "";
}

export function cardLimitStatus(cardOrName) {
  const name = cardName(cardOrName);
  if (limitedNames.has(name)) return "limited";
  if (semiLimitedNames.has(name)) return "semi-limited";
  return "unlimited";
}

export function cardCopyLimit(cardOrName) {
  const status = cardLimitStatus(cardOrName);
  if (status === "limited") return 1;
  if (status === "semi-limited") return 2;
  return 3;
}
