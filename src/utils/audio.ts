// Web Audio API Synthesizer for high-fidelity in-app VoidMC feedback

class VoidSoundFX {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Ominous dramatic strike sound warning
  playStrikeAlert() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Heavy bass oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);

      // Harsh dissonance alarm beep
      const alertOsc = ctx.createOscillator();
      const alertGain = ctx.createGain();
      alertOsc.type = 'triangle';
      alertOsc.frequency.setValueAtTime(880, now + 0.05);
      alertOsc.frequency.setValueAtTime(740, now + 0.25);
      alertOsc.frequency.setValueAtTime(587, now + 0.45);

      alertGain.gain.setValueAtTime(0.2, now + 0.05);
      alertGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      alertOsc.connect(alertGain);
      gain.connect(ctx.destination);
      alertOsc.start(now + 0.05);
      alertOsc.stop(now + 0.65);
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  playStrikeWarning() {
    this.playStrikeAlert();
  }

  // Smooth attendance approval chime
  playSuccess() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch {
      // Audio context ignored
    }
  }

  // Subtle button tick
  playTick() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio context ignored
    }
  }
}

export const soundFX = new VoidSoundFX();
