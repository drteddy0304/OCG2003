export type DuelSound = "attack" | "destroy" | "guard" | "effect" | "spell" | "trap" | "summon";

let audioContext: AudioContext | null = null;
let masterInput: GainNode | null = null;
let bgmInput: GainNode | null = null;
let bgmTimer: number | null = null;
let bgmNextStart = 0;
const bgmSources = new Set<OscillatorNode | AudioBufferSourceNode>();

type SongSection = {
  melody: readonly (number | null)[];
  chords: readonly (readonly number[])[];
  bass: readonly number[];
  energy: 1 | 2 | 3;
};

const MODERN_JPOP_CHIP_SONG: readonly SongSection[] = [
  {
    // Intro: 短いフックを提示し、後半からリズム隊が入る。
    melody: [
      76, null, 78, 80, null, 83, 80, null, 78, null, 76, 75, 76, null, 71, null,
      76, 78, 80, null, 83, null, 85, 83, 80, 78, 76, null, 75, 76, 78, null,
    ],
    chords: [[57, 60, 64, 68], [55, 59, 62, 66], [52, 56, 59, 64], [54, 57, 61, 64]],
    bass: [33, 31, 28, 30],
    energy: 1,
  },
  {
    // Verse: シンコペーションを増やし、カードを切るような細かい旋律にする。
    melody: [
      73, null, 76, 78, null, 76, 80, null, 78, null, 76, null, 73, 71, null, 73,
      null, 76, 78, null, 80, 78, 76, null, 71, 73, null, 76, 75, null, 71, null,
      73, 76, null, 78, 80, null, 83, 80, null, 78, 76, 75, null, 76, 78, null,
      80, null, 83, 85, 83, null, 80, 78, 76, null, 75, 73, 71, 73, 75, null,
    ],
    chords: [[57, 60, 64, 68], [52, 56, 59, 64], [55, 59, 62, 66], [54, 57, 61, 64], [57, 60, 64, 68], [52, 56, 59, 64], [55, 59, 62, 66], [59, 62, 66, 69]],
    bass: [33, 28, 31, 30, 33, 28, 31, 35],
    energy: 2,
  },
  {
    // Pre-chorus: 音域と和音を段階的に上げてサビへ接続。
    melody: [
      76, null, 78, null, 80, null, 83, null, 78, null, 80, null, 83, null, 85, null,
      80, 81, 83, null, 85, 83, 88, null, 85, 83, 81, 80, 78, 80, 83, 85,
    ],
    chords: [[50, 54, 57, 61], [52, 56, 59, 64], [54, 57, 61, 64], [55, 59, 62, 66]],
    bass: [26, 28, 30, 31],
    energy: 2,
  },
  {
    // Chorus: 跳躍のある主旋律と高速アルペジオで解放感を作る。
    melody: [
      85, 83, 80, null, 88, null, 85, 83, 81, 80, 78, null, 80, 83, 85, null,
      83, 80, 78, 76, null, 80, 83, 85, 88, null, 85, 83, 80, 78, 76, null,
      85, 83, 80, null, 88, 90, 88, 85, 83, null, 81, 80, 78, 80, 83, null,
      85, 88, 90, null, 88, 85, 83, 80, 81, 83, 80, 78, 76, null, 73, null,
    ],
    chords: [[57, 60, 64, 68], [55, 59, 62, 66], [52, 56, 59, 64], [54, 57, 61, 64], [57, 60, 64, 68], [55, 59, 62, 66], [52, 56, 59, 64], [59, 62, 66, 69]],
    bass: [33, 31, 28, 30, 33, 31, 28, 35],
    energy: 3,
  },
] as const;

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

function scheduleSongSection(ctx: AudioContext, start: number, section: SongSection) {
  const step = 60 / 158 / 4;
  section.melody.forEach((note, index) => {
    const at = start + index * step;
    const chordIndex = Math.floor(index / 8) % section.chords.length;
    const chord = section.chords[chordIndex];
    if (note !== null) {
      chipNote(ctx, at, step * (section.energy === 3 ? 1.7 : 1.25), note, "square", section.energy === 3 ? 0.16 : 0.13);
      if (section.energy === 3 && index % 4 === 0) chipNote(ctx, at, step * 2.8, note - 12, "triangle", 0.055);
    }
    const arpRate = section.energy === 1 ? 2 : 1;
    if (index % arpRate === 0) chipNote(ctx, at, step * 0.78, chord[index % chord.length], "triangle", 0.055 + section.energy * 0.012);
    if (index % 8 === 0) chipNote(ctx, at, step * 7.1, section.bass[chordIndex], "square", 0.105 + section.energy * 0.016);
    if (index % 4 === 0 && (section.energy > 1 || index >= 16)) chipNote(ctx, at, step * 0.9, 29, "sine", 0.16 + section.energy * 0.025);
    if (index % 8 === 4 && (section.energy > 1 || index >= 16)) chipNoise(ctx, at, step * 1.8, 0.045 + section.energy * 0.018, 1800);
    if (section.energy === 3 && index % 2 === 1) chipNoise(ctx, at, step * 0.36, 0.018, 5400);
    if (section.energy === 2 && index % 4 === 2) chipNoise(ctx, at, step * 0.28, 0.014, 5000);
  });
  return section.melody.length * step;
}

function scheduleChipSong(ctx: AudioContext, start: number) {
  return MODERN_JPOP_CHIP_SONG.reduce((elapsed, section) => elapsed + scheduleSongSection(ctx, start + elapsed, section), 0);
}

export function startDuelBgm(enabled: boolean) {
  if (!enabled || bgmTimer !== null) return;
  const ctx = context();
  if (!ctx || !masterInput) return;
  bgmInput ??= ctx.createGain();
  bgmInput.gain.value = 0.2;
  bgmInput.connect(masterInput);
  bgmNextStart = ctx.currentTime + 0.06;
  const scheduleAhead = () => {
    while (bgmNextStart < ctx.currentTime + 2.2) bgmNextStart += scheduleChipSong(ctx, bgmNextStart);
  };
  scheduleAhead();
  bgmTimer = window.setInterval(scheduleAhead, 700);
}

export function stopDuelBgm() {
  if (bgmTimer !== null) window.clearInterval(bgmTimer);
  bgmTimer = null;
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
