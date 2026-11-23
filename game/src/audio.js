// Procedural Web Audio API sound engine & Synthwave Radio (zero external audio files).

const STATIONS = [
  { id: 'synth', name: 'NEON SYNTH FM' },
  { id: 'chill', name: 'COASTLINE CHILL' },
  { id: 'off', name: 'RADIO OFF' },
];

export function createAudio() {
  let ctx = null;
  let master = null;
  let stationIndex = 0;
  let beatTimer = 0;
  let step = 0;
  let sirenTimer = 0;

  function unlock() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.28;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
    }
  }

  function tone(freq, dur, type = 'sawtooth', vol = 0.12, slideTo = null) {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + dur);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function noise(dur, vol = 0.16, hpFreq = 900) {
    if (!ctx || !master) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = hpFreq;
    const g = ctx.createGain();
    const now = ctx.currentTime;
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(now);
  }

  // Miami synthwave bass & arpeggio notes (A minor / F / C / G)
  const synthBass = [110, 110, 110, 110, 87.3, 87.3, 87.3, 87.3, 130.8, 130.8, 130.8, 130.8, 98, 98, 98, 98];
  const synthArp = [440, 523.25, 659.25, 523.25, 349.23, 440, 523.25, 440, 523.25, 659.25, 783.99, 659.25, 392, 493.88, 587.33, 493.88];
  const chillNotes = [261.63, 329.63, 392.0, 493.88, 220.0, 261.63, 329.63, 392.0];

  function update(dt, wantedLevel, isPlaying) {
    if (!ctx || !isPlaying) return;

    // Radio music sequencer
    const st = STATIONS[stationIndex];
    if (st.id !== 'off') {
      const stepDur = st.id === 'synth' ? 0.135 : 0.28;
      beatTimer += dt;
      if (beatTimer >= stepDur) {
        beatTimer -= stepDur;
        if (st.id === 'synth') {
          const i = step % 16;
          tone(synthBass[i], 0.12, 'sawtooth', 0.055);
          if (i % 2 === 0) tone(synthArp[i], 0.1, 'triangle', 0.032);
          if (i % 4 === 0) tone(65, 0.11, 'sine', 0.09, 32);
          if (i % 4 === 2) noise(0.06, 0.045, 2200);
        } else {
          const i = step % chillNotes.length;
          tone(chillNotes[i], 0.32, 'sine', 0.04);
          if (i % 2 === 0) tone(chillNotes[i] * 0.5, 0.26, 'triangle', 0.035);
        }
        step++;
      }
    }

    // Subtle police siren pulse when wanted
    if (wantedLevel > 0) {
      sirenTimer += dt;
      if (sirenTimer >= 0.85) {
        sirenTimer = 0;
        tone(620, 0.36, 'sine', 0.038, 920);
      }
    }
  }

  return {
    unlock,
    update,
    getStationName() {
      return STATIONS[stationIndex].name;
    },
    cycleRadio() {
      unlock();
      stationIndex = (stationIndex + 1) % STATIONS.length;
      tone(520, 0.07, 'triangle', 0.08, 760);
      return STATIONS[stationIndex].name;
    },
    playShot(weaponId) {
      if (!ctx) return;
      if (weaponId === 'melee') {
        noise(0.07, 0.12, 400);
      } else if (weaponId === 'shotgun') {
        noise(0.2, 0.28, 350);
        tone(120, 0.15, 'sawtooth', 0.18, 36);
      } else if (weaponId === 'smg') {
        noise(0.06, 0.14, 1400);
        tone(220, 0.05, 'square', 0.07, 90);
      } else {
        noise(0.1, 0.18, 950);
        tone(180, 0.08, 'sawtooth', 0.1, 55);
      }
    },
    playExplosion() {
      if (!ctx) return;
      noise(0.45, 0.35, 140);
      tone(95, 0.42, 'sawtooth', 0.24, 24);
    },
    playCash() {
      if (!ctx) return;
      tone(740, 0.09, 'triangle', 0.12);
      setTimeout(() => tone(987, 0.14, 'triangle', 0.12), 75);
    },
    playClout() {
      if (!ctx) return;
      tone(587, 0.08, 'sine', 0.09, 880);
    },
    playGator() {
      if (!ctx) return;
      noise(0.24, 0.18, 1800);
      tone(115, 0.22, 'sawtooth', 0.1, 70);
    },
    playDrift() {
      if (!ctx) return;
      noise(0.08, 0.05, 2400);
    },
    playNitro() {
      if (!ctx) return;
      noise(0.18, 0.12, 700);
      tone(220, 0.2, 'sawtooth', 0.08, 420);
    },
  };
}
