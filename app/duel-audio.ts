export type DuelSound = "attack" | "destroy" | "guard" | "effect" | "spell" | "trap" | "summon";

let audioContext: AudioContext | null = null;
let masterInput: GainNode | null = null;
let bgmInput: GainNode | null = null;
let bgmTimer: number | null = null;
let bgmNextStart = 0;
const bgmSources = new Set<OscillatorNode | AudioBufferSourceNode>();

export type DuelBgmThemeId = "yami-yugi" | "seto-kaiba" | "joey-wheeler" | "mai-valentine" | "weevil-underwood" | "rex-raptor" | "mako-tsunami" | "espa-roba" | "arkana" | "yami-bakura" | "strings" | "lumis-umbra" | "odion" | "ishizu-ishtar" | "yami-marik" | "pegasus" | "bandit-keith";

type DuelBgmTheme = {
  title: string;
  bpm: number;
  root: number;
  minor: boolean;
  lead: OscillatorType;
  motif: readonly (number | null)[];
  progression: readonly number[];
  groove: 0 | 1 | 2;
};

// 既存作品の旋律は使わず、キャラクターの戦い方を音色・速度・和声で表現した17曲。
export const DUEL_BGM_THEMES: Record<DuelBgmThemeId, DuelBgmTheme> = {
  "yami-yugi": { title: "王の逆転劇", bpm: 152, root: 57, minor: true, lead: "square", motif: [0, null, 3, 7, 10, 7, 12, null, 10, 7, 3, 5, 7, null, 2, null], progression: [0, -2, -5, -3], groove: 1 },
  "seto-kaiba": { title: "蒼眼オーバードライブ", bpm: 170, root: 59, minor: true, lead: "sawtooth", motif: [0, 12, 7, 15, 14, 10, 7, null, 3, 7, 10, 15, 14, 12, 7, 10], progression: [0, -5, -2, 2], groove: 2 },
  "joey-wheeler": { title: "炎のラストチャンス", bpm: 158, root: 60, minor: false, lead: "square", motif: [0, 4, 7, null, 9, 7, 4, 2, 0, null, 4, 7, 12, 9, 7, null], progression: [0, -5, -3, -7], groove: 1 },
  "mai-valentine": { title: "ハーピィ・ハイウェイ", bpm: 166, root: 62, minor: false, lead: "triangle", motif: [7, 9, 12, 11, 9, 7, 4, null, 7, 12, 14, 12, 11, 9, 7, 4], progression: [0, -3, -5, 2], groove: 2 },
  "weevil-underwood": { title: "インセクト・グリッチ", bpm: 144, root: 55, minor: true, lead: "square", motif: [0, 1, 7, null, 6, 3, 1, 0, 12, 7, 6, 3, 1, null, -2, null], progression: [0, 1, -5, -1], groove: 2 },
  "rex-raptor": { title: "ジュラシック・ストンプ", bpm: 134, root: 52, minor: true, lead: "sawtooth", motif: [0, 0, 7, null, 3, 3, 10, null, 7, 5, 3, 0, -2, 0, null, null], progression: [0, -2, -5, -7], groove: 0 },
  "mako-tsunami": { title: "ディープブルー・カレント", bpm: 138, root: 57, minor: false, lead: "triangle", motif: [0, null, 2, 7, 9, null, 7, 4, 2, 4, 7, 11, 9, 7, 4, null], progression: [0, -5, 2, -3], groove: 1 },
  "espa-roba": { title: "サイキック・サーキット", bpm: 174, root: 58, minor: true, lead: "square", motif: [0, 7, 3, 10, 5, 12, 7, 14, 12, 10, 7, 5, 3, 1, 0, -2], progression: [0, 3, -2, 5], groove: 2 },
  arkana: { title: "クリムゾン・イリュージョン", bpm: 148, root: 56, minor: true, lead: "sawtooth", motif: [0, null, 6, 7, 3, 10, 9, null, 7, 3, 1, 6, 7, 12, 10, null], progression: [0, 1, -4, -1], groove: 1 },
  "yami-bakura": { title: "オカルト・クロック", bpm: 126, root: 54, minor: true, lead: "square", motif: [0, null, 1, null, 7, 6, 3, null, 0, 10, 7, 6, 1, null, -1, null], progression: [0, -1, -5, 1], groove: 0 },
  strings: { title: "サイレント・パペット", bpm: 120, root: 50, minor: true, lead: "triangle", motif: [0, null, null, 7, 3, null, 10, null, 7, null, 3, 1, 0, null, -2, null], progression: [0, -5, -3, -1], groove: 0 },
  "lumis-umbra": { title: "マスクド・パラドックス", bpm: 162, root: 58, minor: true, lead: "square", motif: [0, 7, 1, 6, 3, 10, 5, 12, 7, 6, 3, 1, 0, 3, -1, null], progression: [0, 6, -1, 5], groove: 2 },
  odion: { title: "トラップ・テンプル", bpm: 136, root: 53, minor: true, lead: "sawtooth", motif: [0, null, 3, 5, 7, null, 6, 3, 0, 1, 3, null, 10, 7, 5, null], progression: [0, -5, 1, -2], groove: 0 },
  "ishizu-ishtar": { title: "未来の記憶", bpm: 130, root: 57, minor: false, lead: "triangle", motif: [0, 2, 4, null, 9, 7, 4, null, 2, 4, 7, 11, 9, 7, 4, 2], progression: [0, 2, -3, -5], groove: 1 },
  "yami-marik": { title: "太陽神マッドネス", bpm: 178, root: 55, minor: true, lead: "sawtooth", motif: [0, 12, 6, 13, 7, 15, 10, 14, 12, 7, 6, 3, 1, 0, -1, -5], progression: [0, 1, 6, -2], groove: 2 },
  pegasus: { title: "トゥーン・マスカレード", bpm: 146, root: 60, minor: false, lead: "triangle", motif: [0, 4, 7, 11, 12, 9, 7, 4, 2, 6, 9, 14, 12, 11, 7, null], progression: [0, 4, -3, 2], groove: 1 },
  "bandit-keith": { title: "メタル・ギャンブラー", bpm: 168, root: 52, minor: true, lead: "sawtooth", motif: [0, 7, 0, 10, 3, 12, 7, 15, 12, 10, 7, 3, 0, -2, 0, null], progression: [0, -5, 3, -2], groove: 2 },
};

let activeBgmTheme: DuelBgmThemeId | null = null;

function context() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  if (audioContext.state === "suspended") void audioContext.resume();
  if (!masterInput) {
    masterInput = audioContext.createGain();
    const compressor = audioContext.createDynamicsCompressor();
    const reverb = audioContext.createConvolver();
    const wet = audioContext.createGain();
    const impulse = audioContext.createBuffer(2, audioContext.sampleRate * 0.8, audioContext.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length) ** 2.5;
    }
    reverb.buffer = impulse;
    wet.gain.value = 0.18;
    compressor.threshold.value = -18;
    compressor.knee.value = 16;
    compressor.ratio.value = 7;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.22;
    masterInput.gain.value = 0.72;
    masterInput.connect(compressor);
    masterInput.connect(reverb).connect(wet).connect(compressor);
    compressor.connect(audioContext.destination);
  }
  return audioContext;
}

function tone(ctx: AudioContext, start: number, duration: number, from: number, to: number, type: OscillatorType, volume: number) {
  if (!masterInput) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(20, from), start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.025, duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(masterInput);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function noise(ctx: AudioContext, start: number, duration: number, volume: number, filterType: BiquadFilterType = "lowpass", from = 2400, to = 120) {
  if (!masterInput) return;
  const length = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = filterType;
  filter.Q.value = filterType === "bandpass" ? 1.4 : 0.7;
  filter.frequency.setValueAtTime(from, start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(masterInput);
  source.start(start);
}

function midiFrequency(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

function chipNote(ctx: AudioContext, start: number, duration: number, note: number, type: OscillatorType, volume: number) {
  if (!bgmInput) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = midiFrequency(note);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.setValueAtTime(volume * 0.72, start + Math.max(0.012, duration * 0.72));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(bgmInput);
  bgmSources.add(oscillator);
  oscillator.onended = () => bgmSources.delete(oscillator);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function chipNoise(ctx: AudioContext, start: number, duration: number, volume: number, highpass = 1200) {
  if (!bgmInput) return;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = highpass;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(bgmInput);
  bgmSources.add(source);
  source.onended = () => bgmSources.delete(source);
  source.start(start);
}

function scheduleCharacterSong(ctx: AudioContext, start: number, theme: DuelBgmTheme) {
  const step = 60 / theme.bpm / 4;
  const sectionEnergy = [1, 2, 2, 3] as const;
  const chordShape = theme.minor ? [0, 3, 7, 10] : [0, 4, 7, 11];
  const sectionLength = theme.motif.length * 2;
  const totalSteps = sectionLength * sectionEnergy.length;
  for (let index = 0; index < totalSteps; index += 1) {
    const section = Math.floor(index / sectionLength);
    const local = index % sectionLength;
    const energy = sectionEnergy[section];
    const at = start + index * step;
    const progressionRoot = theme.root + theme.progression[Math.floor(local / 4) % theme.progression.length];
    const motif = theme.motif[(local + section * 3) % theme.motif.length];
    const octave = section === 3 ? 12 : section === 0 ? -12 : 0;
    if (motif !== null && !(section === 0 && local % 2 === 1)) {
      chipNote(ctx, at, step * (energy === 3 ? 1.65 : 1.15), theme.root + motif + octave, theme.lead, 0.1 + energy * 0.018);
      if (energy === 3 && local % 4 === 0) chipNote(ctx, at, step * 2.6, theme.root + motif, "triangle", 0.045);
    }
    if (local % (energy === 1 ? 2 : 1) === 0) {
      chipNote(ctx, at, step * 0.72, progressionRoot + chordShape[local % chordShape.length], "triangle", 0.045 + energy * 0.01);
    }
    if (local % 4 === 0) chipNote(ctx, at, step * 3.5, progressionRoot - 24, theme.groove === 0 ? "triangle" : "square", 0.09 + energy * 0.012);
    const kickRate = theme.groove === 2 ? 2 : 4;
    if (local % kickRate === 0 && (section > 0 || local >= 8)) chipNote(ctx, at, step * 0.82, 28 + theme.groove, "sine", 0.14 + energy * 0.02);
    if (local % 4 === 2 && section > 0) chipNoise(ctx, at, step * 0.75, 0.035 + energy * 0.012, theme.groove === 0 ? 1300 : 2200);
    if (energy === 3 && theme.groove > 0 && local % 2 === 1) chipNoise(ctx, at, step * 0.28, 0.014, 5200);
  }
  return totalSteps * step;
}

export function duelBgmTitle(themeId: string) {
  return DUEL_BGM_THEMES[themeId as DuelBgmThemeId]?.title ?? DUEL_BGM_THEMES["yami-yugi"].title;
}

export function startDuelBgm(enabled: boolean, themeId: string = "yami-yugi") {
  if (!enabled) return;
  const resolvedTheme = (themeId in DUEL_BGM_THEMES ? themeId : "yami-yugi") as DuelBgmThemeId;
  if (bgmTimer !== null && activeBgmTheme === resolvedTheme) return;
  if (bgmTimer !== null) stopDuelBgm();
  const ctx = context();
  if (!ctx || !masterInput) return;
  activeBgmTheme = resolvedTheme;
  const theme = DUEL_BGM_THEMES[resolvedTheme];
  bgmInput ??= ctx.createGain();
  bgmInput.gain.value = 0.2;
  bgmInput.connect(masterInput);
  bgmNextStart = ctx.currentTime + 0.06;
  const scheduleAhead = () => {
    while (bgmNextStart < ctx.currentTime + 2.2) bgmNextStart += scheduleCharacterSong(ctx, bgmNextStart, theme);
  };
  scheduleAhead();
  bgmTimer = window.setInterval(scheduleAhead, 700);
}

export function stopDuelBgm() {
  if (bgmTimer !== null) window.clearInterval(bgmTimer);
  bgmTimer = null;
  activeBgmTheme = null;
  bgmSources.forEach((source) => {
    try { source.stop(); } catch { /* already stopped */ }
  });
  bgmSources.clear();
  if (bgmInput) {
    bgmInput.disconnect();
    bgmInput = null;
  }
}

export function unlockDuelAudio(enabled: boolean) {
  if (!enabled) return;
  const ctx = context();
  if (!ctx || !masterInput) return;
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  const oscillator = ctx.createOscillator();
  oscillator.connect(gain).connect(masterInput);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.01);
}

export function playDuelSound(kind: DuelSound, enabled: boolean) {
  if (!enabled) return;
  const ctx = context();
  if (!ctx) return;
  const now = ctx.currentTime + 0.015;

  if (kind === "attack") {
    noise(ctx, now, 0.46, 0.25, "bandpass", 5200, 380);
    tone(ctx, now, 0.34, 980, 58, "sawtooth", 0.16);
    tone(ctx, now + 0.12, 0.34, 105, 38, "sine", 0.22);
    noise(ctx, now + 0.18, 0.16, 0.13, "highpass", 4800, 900);
    return;
  }
  if (kind === "destroy") {
    [0, 0.055, 0.12].forEach((delay, index) => noise(ctx, now + delay, 0.42 - index * 0.06, 0.23 - index * 0.03, "lowpass", 3800, 90));
    tone(ctx, now, 0.55, 190, 34, "square", 0.18);
    tone(ctx, now + 0.025, 0.42, 82, 31, "sine", 0.28);
    [1200, 1660, 2240].forEach((frequency, index) => tone(ctx, now + index * 0.035, 0.14, frequency, frequency / 2, "triangle", 0.055));
    return;
  }
  if (kind === "guard") {
    noise(ctx, now, 0.12, 0.1, "highpass", 6500, 1800);
    [220, 440, 790, 1180].forEach((frequency, index) => tone(ctx, now + index * 0.008, 0.52 - index * 0.045, frequency, frequency * 0.82, "sine", 0.105 / (1 + index * 0.22)));
    tone(ctx, now + 0.06, 0.28, 95, 55, "triangle", 0.16);
    return;
  }
  if (kind === "trap") {
    [0, 0.12, 0.24].forEach((delay) => tone(ctx, now + delay, 0.1, 1080, 720, "square", 0.085));
    noise(ctx, now + 0.28, 0.38, 0.19, "bandpass", 3200, 260);
    tone(ctx, now + 0.28, 0.46, 170, 39, "sawtooth", 0.18);
    return;
  }
  if (kind === "spell") {
    [330, 440, 554, 660, 880].forEach((frequency, index) => {
      tone(ctx, now + index * 0.075, 0.5, frequency, frequency * 1.07, index % 2 ? "sine" : "triangle", 0.075);
      tone(ctx, now + 0.24 + index * 0.075, 0.42, frequency * 1.5, frequency * 1.58, "sine", 0.035);
    });
    noise(ctx, now, 0.7, 0.045, "highpass", 7000, 1800);
    return;
  }
  if (kind === "effect") {
    tone(ctx, now, 0.72, 95, 760, "sawtooth", 0.09);
    tone(ctx, now + 0.08, 0.65, 180, 980, "triangle", 0.075);
    [520, 690, 910].forEach((frequency, index) => tone(ctx, now + 0.3 + index * 0.065, 0.34, frequency, frequency * 0.86, "sine", 0.06));
    noise(ctx, now + 0.1, 0.58, 0.055, "bandpass", 800, 3600);
    return;
  }
  tone(ctx, now, 0.68, 70, 620, "triangle", 0.12);
  tone(ctx, now + 0.18, 0.52, 140, 940, "sine", 0.08);
  [392, 523, 659].forEach((frequency, index) => tone(ctx, now + 0.38 + index * 0.05, 0.4, frequency, frequency, "sine", 0.055));
}
