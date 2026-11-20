// Every sound is synthesised: wind, rain, birds by day, crickets at night,
// footsteps and the small clicks of the interface. No audio files.
let ctx, master, windGain, rainGain, noise;
let on = true, started = false, night = 0, rain = 0;

function noiseBuffer() {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function loop(filterType, freq, q) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  src.connect(filter).connect(gain).connect(master);
  src.start();
  return gain;
}

function tone(freq, to, at, length, volume, type = 'sine') {
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + length);
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + length * 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(master);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

function creatures() {
  if (!started) return;
  const t = ctx.currentTime;
  if (rain < 0.5 && night < 0.5 && Math.random() < 0.6) {
    const base = 2300 + Math.random() * 1800, notes = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < notes; i++) tone(base * (1 + i * 0.06), base * 1.35, t + i * 0.13, 0.1, 0.022);
  } else if (night >= 0.5 && rain < 0.5) {
    for (let i = 0; i < 7; i++) tone(4300, 4250, t + i * 0.06, 0.04, 0.012, 'triangle');
  }
  setTimeout(creatures, 900 + Math.random() * 2600);
}

export const audio = {
  // Browsers only allow sound after a gesture, so this runs on the first one.
  start() {
    if (started) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = on ? 1 : 0;
      master.connect(ctx.destination);
      noise = noiseBuffer();
      windGain = loop('bandpass', 420, 0.6);
      windGain.gain.value = 0.05;
      rainGain = loop('highpass', 1700, 0.3);
      started = true;
      creatures();
    } catch { /* no audio on this device: the meadow is simply quiet */ }
  },
  setOn(value) {
    on = value;
    if (started) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.08);
  },
  setWeather(rainAmount, nightAmount) {
    rain = rainAmount;
    night = nightAmount;
    if (!started) return;
    rainGain.gain.setTargetAtTime(rain * 0.11, ctx.currentTime, 0.3);
    windGain.gain.setTargetAtTime(0.045 + rain * 0.05 + Math.sin(ctx.currentTime * 0.4) * 0.015, ctx.currentTime, 0.5);
  },
  step() {
    if (!started) return;
    const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    src.buffer = noise;
    filter.type = 'lowpass';
    filter.frequency.value = 700 + Math.random() * 500;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(filter).connect(gain).connect(master);
    src.start(t, Math.random());
    src.stop(t + 0.1);
  },
  pop() {
    if (started) tone(520, 880, ctx.currentTime, 0.09, 0.05);
  },
  chime() {
    if (!started) return;
    [523, 659, 784].forEach((f, i) => tone(f, f, ctx.currentTime + i * 0.09, 0.5, 0.04, 'triangle'));
  },
};
