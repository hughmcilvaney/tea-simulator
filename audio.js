// All sound effects are synthesised with WebAudio — no audio files needed.
export class Sfx {
  constructor() {
    this.ctx = null;
    this._tap = null;
    this._boil = null;
    this._pour = null;
  }

  _ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  _noiseBuffer(seconds = 2) {
    const ctx = this._ensure();
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  /* Continuous filtered-noise stream (tap water / pouring). Returns stop fn. */
  _waterNoise({ freq = 1400, q = 0.6, gain = 0.22, attack = 0.08 }) {
    const ctx = this._ensure();
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(2);
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + attack);
    src.connect(bp).connect(hp).connect(g).connect(ctx.destination);
    src.start();
    return () => {
      const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      src.stop(t + 0.35);
    };
  }

  tapOn() { this.tapOff(); this._tap = this._waterNoise({ freq: 1600, q: 0.5, gain: 0.26 }); }
  tapOff() { if (this._tap) { this._tap(); this._tap = null; } }

  pourOn() { this.pourOff(); this._pour = this._waterNoise({ freq: 900, q: 0.8, gain: 0.2, attack: 0.15 }); }
  pourOff() { if (this._pour) { this._pour(); this._pour = null; } }

  /* Kettle boil: low rumble + noise swelling over `dur` seconds. */
  boilOn(dur = 6) {
    this.boilOff();
    const ctx = this._ensure();
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(2);
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(300, ctx.currentTime);
    lp.frequency.linearRampToValueAtTime(2400, ctx.currentTime + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.02, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + dur * 0.85);
    g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + dur);
    src.connect(lp).connect(g).connect(ctx.destination);
    src.start();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(48, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(66, ctx.currentTime + dur);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.001, ctx.currentTime);
    og.gain.linearRampToValueAtTime(0.06, ctx.currentTime + dur * 0.7);
    og.gain.linearRampToValueAtTime(0.0, ctx.currentTime + dur);
    osc.connect(og).connect(ctx.destination);
    osc.start();
    this._boil = () => {
      const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      src.stop(t + 0.5);
      osc.stop(t + 0.1);
    };
  }
  boilOff() { if (this._boil) { this._boil(); this._boil = null; } }

  /* Short mechanical click (kettle switch). */
  click() {
    const ctx = this._ensure();
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 2200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  /* Spoon clink — bright decaying sine with slight detune. */
  clink() {
    const ctx = this._ensure();
    const f = 2900 + Math.random() * 900;
    for (const [freq, amp] of [[f, 0.09], [f * 2.76, 0.03]]) {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(amp, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.connect(g).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  }

  /* Soft plop (teabag / sugar). */
  plop() {
    const ctx = this._ensure();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  }

  /* Error buzz. */
  error() {
    const ctx = this._ensure();
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 150;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  /* Little success chime. */
  chime() {
    const ctx = this._ensure();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      const t = ctx.currentTime + i * 0.13;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  }
}
