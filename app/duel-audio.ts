export type DuelSound = "attack" | "destroy" | "guard" | "effect" | "spell" | "trap" | "summon";

let audioContext: AudioContext | null = null;

function context() {
  if (typeof window === "undefined") return null;
  audioContext ??= new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function tone(ctx: AudioContext, start: number, duration: number, from: number, to: number, type: OscillatorType, volume: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noise(ctx: AudioContext, start: number, duration: number, volume: number) {
  const length = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1300, start);
  filter.frequency.exponentialRampToValueAtTime(140, start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(start);
}

export function unlockDuelAudio(enabled: boolean) {
  if (!enabled) return;
  const ctx = context();
  if (!ctx) return;
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  const oscillator = ctx.createOscillator();
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.01);
}

export function playDuelSound(kind: DuelSound, enabled: boolean) {
  if (!enabled) return;
  const ctx = context();
  if (!ctx) return;
  const now = ctx.currentTime + 0.01;
  if (kind === "attack") {
    tone(ctx, now, 0.22, 520, 75, "sawtooth", 0.13);
    return;
  }
  if (kind === "destroy") {
    noise(ctx, now, 0.32, 0.18);
    tone(ctx, now, 0.34, 150, 42, "triangle", 0.16);
    return;
  }
  if (kind === "guard") {
    tone(ctx, now, 0.09, 190, 150, "square", 0.1);
    tone(ctx, now + 0.1, 0.12, 230, 170, "square", 0.08);
    return;
  }
  if (kind === "trap") {
    tone(ctx, now, 0.35, 920, 110, "square", 0.1);
    noise(ctx, now + 0.04, 0.18, 0.08);
    return;
  }
  if (kind === "spell") {
    [440, 660, 880].forEach((frequency, index) => tone(ctx, now + index * 0.075, 0.25, frequency, frequency * 1.08, "sine", 0.07));
    return;
  }
  if (kind === "effect") {
    tone(ctx, now, 0.42, 240, 720, "triangle", 0.09);
    tone(ctx, now + 0.12, 0.35, 720, 310, "sine", 0.06);
    return;
  }
  tone(ctx, now, 0.32, 130, 520, "triangle", 0.09);
}
