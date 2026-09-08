import type { Card } from "./card-data";

export type CpuOpponent = {
  id: string;
  name: string;
  title: string;
  mark: string;
  ace: string;
  strategy: string;
  difficulty: 4 | 5;
  deck: string[];
  fusionDeck: string[];
};

type OpponentDefinition = Omit<CpuOpponent, "deck" | "fusionDeck"> & {
  featured: string[];
  kinds: string[];
  attributes?: string[];
  support?: string[];
  fusionDeck?: string[];
};

const universalSupport = [
  "vol1-dark-hole",
  "vol1-fissure",
  "vol3-stop-defense",
  "mr-axe-despair",
  "vol2-swords-revealing-light",
  "vol2-monster-reborn",
  "vol3-pot-of-greed",
  "stb-raigeki",
  "pr99-feather-duster",
  "vol1-trap-hole",
  "vol1-trap-hole",
  "vol7-mirror-force",
  "vol7-tremendous-fire",
  "mr-upstart-goblin",
  "mr-confiscation",
  "mr-forceful-sentry",
];

const themeKeywords: Record<string, string[]> = {
  "yami-yugi": ["ブラック・マジシャン", "クリボー", "ガイア", "オシリス"],
  "seto-kaiba": ["青眼", "ブルーアイズ", "ドラゴン", "オベリスク"],
  "joey-wheeler": ["真紅眼", "レッドアイズ", "時の魔術師", "戦士"],
  "mai-valentine": ["ハーピィ", "アマゾネス"],
  "weevil-underwood": ["昆虫", "モス", "インセクト"],
  "rex-raptor": ["恐竜", "ザウルス", "レッドアイズ"],
  "mako-tsunami": ["海", "フィッシュ", "シャーク", "クラーケン"],
  "espa-roba": ["機械", "人造人間", "サイコ", "キャノン"],
  arkana: ["ブラック・マジシャン", "魔術師", "マジシャン"],
  "yami-bakura": ["ゴースト", "アンデット", "墓地", "オカルト"],
  strings: ["オシリス", "手札", "スライム"],
  "lumis-umbra": ["仮面", "マスク", "光", "闇"],
  odion: ["罠", "神殿", "アポピス"],
  "ishizu-ishtar": ["墓守", "天使", "聖なる", "墓地"],
  "yami-marik": ["ラー", "拷問", "溶岩", "闇"],
};

const rarityScore = { SE: 5, UR: 4, SR: 3, R: 2, N: 1 } as const;

const definitions: OpponentDefinition[] = [
  {
    id: "yami-yugi", name: "闇遊戯", title: "王の記憶を継ぐ決闘者", mark: "遊", difficulty: 5,
    ace: "ブラック・マジシャン／オシリスの天空竜", strategy: "魔法使いと罠を組み合わせ、切り札で逆転する王道デッキ。",
    featured: ["g4-02-slifer", "vol1-dark-magician", "vol1-dark-magician", "ca-51", "vol4-summoned-skull", "vol1-gaia", "vol7-kuriboh", "vol6-sangan"],
    kinds: ["魔法使い族", "戦士族", "悪魔族"],
    support: ["stb-yami", "vol1-book-secret-arts", "mr-spellbinding-circle", "vol5-change-heart"],
    fusionDeck: ["vol3-gaia-dragon-champion"],
  },
  {
    id: "seto-kaiba", name: "海馬瀬人", title: "最強を求めるデュエリスト", mark: "海", difficulty: 5,
    ace: "青眼の白龍／オベリスクの巨神兵", strategy: "高攻撃力のドラゴンと機械で正面から制圧するパワーデッキ。",
    featured: ["g4-01-obelisk", "stb-blue-eyes", "stb-blue-eyes", "pr99-seiyaryu", "vol7-barrel-dragon", "ex-084", "vol6-cannon-soldier"],
    kinds: ["ドラゴン族", "機械族"],
    support: ["stb-mountain", "vol3-dragon-treasure", "ex-085", "pr99-crush-card"],
    fusionDeck: ["pr99-blue-eyes-ultimate"],
  },
  {
    id: "joey-wheeler", name: "城之内克也", title: "不屈の凡骨デュエリスト", mark: "城", difficulty: 4,
    ace: "真紅眼の黒竜／時の魔術師", strategy: "戦士とギャンブル効果で劣勢をひっくり返す粘り強いデッキ。",
    featured: ["vol3-red-eyes", "pr99-time-wizard", "vol6-baby-dragon", "vol1-gaia", "vol7-barbarian-1", "vol7-barbarian-2", "ex-009"],
    kinds: ["戦士族", "獣戦士族", "ドラゴン族"],
    support: ["vol1-legendary-sword", "pr99-kunai-chain", "vol7-shield-sword", "vol5-change-heart"],
    fusionDeck: ["pr99-meteor-black-dragon"],
  },
  {
    id: "mai-valentine", name: "孔雀舞", title: "華麗なるハーピィ使い", mark: "舞", difficulty: 4,
    ace: "ハーピィ・レディ三姉妹", strategy: "鳥獣族を装備魔法で強化し、魔法・罠もまとめて吹き飛ばす。",
    featured: ["vol4-harpie-lady", "vol4-harpie-lady", "vol4-harpie-lady", "vol4-harpie-sisters", "vol4-harpie-sisters"],
    kinds: ["鳥獣族"], attributes: ["風"],
    support: ["vol4-elegant-egotist", "vol3-electro-whip", "pr99-cyber-bondage", "pr99-feather-duster", "stb-mountain"],
  },
  {
    id: "weevil-underwood", name: "インセクター羽蛾", title: "狡猾な昆虫使い", mark: "羽", difficulty: 4,
    ace: "究極完全態・グレート・モス", strategy: "昆虫を並べ、除去と強化を重ねて大型昆虫へつなぐ。",
    featured: ["pr99-perfect-moth", "vol6-great-moth", "vol5-larvae-moth", "vol5-killer-needle", "vol3-kamakiriman", "stb-basic-insect"],
    kinds: ["昆虫族"],
    support: ["stb-forest", "vol2-laser-cannon-armor", "pr99-insect-armor", "vol7-germ-infection"],
  },
  {
    id: "rex-raptor", name: "ダイナソー竜崎", title: "恐竜パワーの使い手", mark: "竜", difficulty: 4,
    ace: "真紅眼の黒竜／メガザウラー", strategy: "恐竜族の高い打点とドラゴンの切り札で押し切る。",
    featured: ["vol3-red-eyes", "bo7-megazowler", "vol2-wild-raptor", "vol3-anthrosaurus", "vol1-mammoth-graveyard", "vol4-crawling-dragon"],
    kinds: ["恐竜族", "ドラゴン族"],
    support: ["stb-wasteland", "vol2-raise-body-heat", "vol3-dragon-treasure", "pr99-salamandra"],
  },
  {
    id: "mako-tsunami", name: "梶木漁太", title: "海を知り尽くす決闘者", mark: "梶", difficulty: 4,
    ace: "海竜神／レインボー・フィッシュ", strategy: "海で水属性を強化し、高守備と奇襲で盤面を支配する。",
    featured: ["bo6-kairyu-shin", "vol7-rainbow-fish", "vol7-rainbow-fish", "vol5-roaring-ocean-snake", "bo4-deepsea-shark", "bo7-jellyfish"],
    kinds: ["水族", "魚族", "海竜族"], attributes: ["水"],
    support: ["stb-umi", "vol1-power-kaishin", "bo2-steel-shell", "bo7-heavy-storm"],
  },
  {
    id: "espa-roba", name: "エスパー絽場", title: "電脳サイキック決闘者", mark: "絽", difficulty: 4,
    ace: "リボルバー・ドラゴン／機械王", strategy: "機械族を強化し、効果ダメージと除去で主導権を握る。",
    featured: ["ca-00", "vol7-barrel-dragon", "bo5-machine-king", "vol6-cannon-soldier", "vol6-cannon-soldier", "bo3-machine-soldier", "vol7-mechanical-soldier"],
    kinds: ["機械族", "雷族"],
    support: ["vol2-machine-conversion-factory", "vol4-acid-storm", "mr-chain-energy", "bo5-just-desserts"],
  },
  {
    id: "arkana", name: "パンドラ", title: "奇術師のブラック・マジシャン", mark: "奇", difficulty: 4,
    ace: "ブラック・マジシャン", strategy: "闇の魔法使いを装備と妨害で支え、一撃の威力を高める。",
    featured: ["vol1-dark-magician", "vol1-dark-magician", "mr-maha-vailo", "vol4-magician-faith", "vol5-masked-sorcerer", "ex-033"],
    kinds: ["魔法使い族"], attributes: ["闇"],
    support: ["stb-yami", "vol1-book-secret-arts", "mr-black-pendant", "mr-darkness-approaches", "mr-spellbinding-circle"],
  },
  {
    id: "yami-bakura", name: "闇バクラ", title: "オカルトデッキの使い手", mark: "獏", difficulty: 5,
    ace: "ゴースト王－パンプキング－", strategy: "悪魔・アンデットと墓地利用で相手をじわじわ追い詰める。",
    featured: ["bo7-pumpking", "vol3-reaper-cards", "vol4-mask-darkness", "bo5-dragon-zombie", "vol5-armored-zombie", "vol5-magical-ghost"],
    kinds: ["悪魔族", "アンデット族"], attributes: ["闇"],
    support: ["stb-yami", "vol1-violet-crystal", "mr-gravekeepers-servant", "vol3-gravedigger-ghoul", "vol5-soul-release"],
  },
  {
    id: "strings", name: "人形", title: "寡黙なる神の操り手", mark: "人", difficulty: 5,
    ace: "オシリスの天空竜", strategy: "守備とドローで手札を蓄え、オシリスの攻撃力へ変える。",
    featured: ["g4-02-slifer", "vol2-holy-elf", "vol2-spirit-harp", "vol3-giant-soldier-stone", "vol6-sangan", "vol6-witch-black-forest"],
    kinds: ["岩石族", "魔法使い族", "天使族"],
    support: ["bo4-graceful-charity", "mr-upstart-goblin", "vol3-pot-of-greed", "vol2-swords-revealing-light", "ex-040"],
  },
  {
    id: "lumis-umbra", name: "光の仮面＆闇の仮面", title: "仮面コンビの刺客", mark: "仮", difficulty: 5,
    ace: "仮面魔道士／闇の仮面", strategy: "光と闇のモンスター、罠、表示変更を絡めて動きを封じる。",
    featured: ["vol5-masked-sorcerer", "vol5-masked-sorcerer", "vol4-mask-darkness", "vol4-mask-darkness", "stb-masked-clown", "vol7-dark-elf"],
    kinds: ["魔法使い族", "悪魔族"], attributes: ["光", "闇"],
    support: ["mr-spellbinding-circle", "mr-darkness-approaches", "vol7-paralyzing-potion", "vol7-stop-attack", "mr-fairys-hand-mirror"],
  },
  {
    id: "odion", name: "リシド", title: "忠節の罠使い", mark: "守", difficulty: 5,
    ace: "罠カード連鎖", strategy: "多数の罠で召喚・攻撃・魔法を止め、反撃の隙を作る。",
    featured: ["vol4-mask-darkness", "vol4-mask-darkness", "vol3-giant-soldier-stone", "bo2-stone-ghost", "vol3-reaper-cards"],
    kinds: ["岩石族", "悪魔族", "魔法使い族"], attributes: ["地", "闇"],
    support: ["ca-10", "vol6-solemn-judgment", "vol6-magic-jammer", "vol6-seven-tools", "vol6-horn-heaven", "vol7-mirror-force", "vol1-trap-hole", "pr99-acid-trap-hole", "stb-two-pronged-attack", "ex-040", "mr-snake-fang"],
  },
  {
    id: "ishizu-ishtar", name: "イシズ・イシュタール", title: "未来を見通す守護者", mark: "命", difficulty: 5,
    ace: "聖なる魔術師／ホーリー・エルフ", strategy: "高守備の光属性と墓地操作で耐え、確実な反撃を狙う。",
    featured: ["vol4-magician-faith", "vol4-magician-faith", "vol2-holy-elf", "vol2-spirit-harp", "vol6-witch-black-forest", "pr99-goddess-whim"],
    kinds: ["天使族", "魔法使い族"], attributes: ["光"],
    support: ["ca-31", "ca-32", "mr-chorus-sanctuary", "vol5-soul-release", "mr-painful-choice", "bo4-graceful-charity", "mr-fairys-hand-mirror"],
  },
  {
    id: "yami-marik", name: "闇マリク", title: "闇のゲームの支配者", mark: "闇", difficulty: 5,
    ace: "ラーの翼神竜", strategy: "バーンと手札破壊で消耗させ、ラーの爆発力で決着をつける。",
    featured: ["g4-03-ra", "vol7-dark-elf", "vol7-dark-elf", "vol4-summoned-skull", "vol3-man-eater-bug", "vol6-cannon-soldier"],
    kinds: ["悪魔族", "魔法使い族"], attributes: ["闇"],
    support: ["vol7-tremendous-fire", "bo5-just-desserts", "bo6-magic-thorn", "mr-chain-energy", "mr-delinquent-duo", "mr-confiscation"],
  },
];

function addWithLimit(target: string[], id: string, limit = 3) {
  if (target.filter((entry) => entry === id).length < limit) target.push(id);
}

function combatScore(card: Card) {
  const levelPenalty = (card.level ?? 0) > 4 ? 500 : 0;
  return Math.max(card.atk ?? 0, card.def ?? 0) + (card.effect ? 280 : 0) - levelPenalty;
}

export function createCpuOpponents(cards: Card[]): CpuOpponent[] {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const mainMonsters = cards.filter((card) => card.cardType === "monster" && !card.fusion && !card.ritual && !card.id.startsWith("g4-"));

  return definitions.map((definition) => {
    const keywords = themeKeywords[definition.id] ?? [];
    const matchesKeyword = (card: Card) => keywords.some((keyword) => card.name.includes(keyword));
    const monsters: string[] = [];
    definition.featured.forEach((id) => {
      const card = byId.get(id);
      if (card?.cardType === "monster" && !card.fusion) addWithLimit(monsters, id);
    });

    const themed = mainMonsters
      .filter((card) => definition.kinds.includes(card.kind) || definition.attributes?.includes(card.attribute ?? "") || matchesKeyword(card))
      .sort((a, b) => combatScore(b) + (matchesKeyword(b) ? 1200 : 0) - combatScore(a) - (matchesKeyword(a) ? 1200 : 0));
    const lowLevel = themed.filter((card) => (card.level ?? 0) <= 4);
    const highLevel = themed.filter((card) => (card.level ?? 0) > 4);
    const fallback = mainMonsters.slice().sort((a, b) => combatScore(b) - combatScore(a));

    for (const pool of [lowLevel, lowLevel, highLevel, themed, fallback]) {
      for (const card of pool) {
        if (monsters.length >= 24) break;
        addWithLimit(monsters, card.id, pool === fallback ? 1 : 2);
      }
      if (monsters.length >= 24) break;
    }

    const support: string[] = [];
    const automaticThemeSupport = cards
      .filter((card) => card.cardType !== "monster" && matchesKeyword(card))
      .sort((a, b) => rarityScore[b.rarity] - rarityScore[a.rarity])
      .map((card) => card.id);
    for (const id of [...automaticThemeSupport, ...(definition.support ?? []), ...universalSupport]) {
      const card = byId.get(id);
      if (support.length >= 16) break;
      if (card && card.cardType !== "monster") addWithLimit(support, id);
    }
    for (const id of universalSupport) {
      if (support.length >= 16) break;
      if (byId.has(id)) addWithLimit(support, id);
    }

    const deck = [...monsters, ...support].slice(0, 40);
    const counts = new Map<string, number>();
    deck.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    if (deck.length !== 40 || [...counts.values()].some((count) => count > 3)) {
      throw new Error(`${definition.name}のCPUデッキ構築に失敗しました。`);
    }

    return {
      id: definition.id,
      name: definition.name,
      title: definition.title,
      mark: definition.mark,
      ace: definition.ace,
      strategy: definition.strategy,
      difficulty: definition.difficulty,
      deck,
      fusionDeck: (definition.fusionDeck ?? []).filter((id) => byId.get(id)?.fusion),
    };
  });
}
