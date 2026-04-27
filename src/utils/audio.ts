// Web Audio API helper for sound effects

class AudioController {
  private ctx: AudioContext | null = null;
  
  private getSettings() {
    try {
      const saved = localStorage.getItem('vo2trofia_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          soundEnabled: parsed.settings?.soundEnabled ?? true,
          vibrationEnabled: parsed.settings?.vibrationEnabled ?? true
        };
      }
    } catch(e) {}
    return { soundEnabled: true, vibrationEnabled: true };
  }

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public async playBeep(type: 'short' | 'long' = 'short') {
    const { soundEnabled, vibrationEnabled } = this.getSettings();
    
    if (vibrationEnabled) {
      try {
        if (navigator.vibrate) {
          navigator.vibrate(type === 'short' ? 100 : 400);
        }
      } catch(e) {}
    }

    if (!soundEnabled) return;

    try {
      this.init();
      if (!this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      if (type === 'short') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime); // 800Hz
        gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime); // 1200Hz
        gainNode.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
      }
    } catch(e) {
      console.warn("Audio play failed", e);
    }
  }

  public async playVictory() {
    const { soundEnabled, vibrationEnabled } = this.getSettings();

    if (vibrationEnabled) {
      try {
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 400]);
        }
      } catch(e) {}
    }

    if (!soundEnabled) return;

    try {
      this.init();
      if (!this.ctx) return;
      
      // Simple major chord arpeggio (C4, E4, G4, C5)
      const frequencies = [261.63, 329.63, 392.00, 523.25];
      const duration = 0.15;
      
      frequencies.forEach((freq, index) => {
        const osc = this.ctx!.createOscillator();
        const gainNode = this.ctx!.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx!.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + index * duration);
        
        gainNode.gain.setValueAtTime(0, this.ctx!.currentTime + index * duration);
        gainNode.gain.linearRampToValueAtTime(0.3, this.ctx!.currentTime + index * duration + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + index * duration + duration);
        
        osc.start(this.ctx!.currentTime + index * duration);
        osc.stop(this.ctx!.currentTime + index * duration + duration);
      });
      
      // Sustain last note
      const lastOsc = this.ctx.createOscillator();
      const lastGain = this.ctx.createGain();
      lastOsc.connect(lastGain);
      lastGain.connect(this.ctx.destination);
      
      lastOsc.type = 'triangle';
      lastOsc.frequency.setValueAtTime(frequencies[3], this.ctx.currentTime + frequencies.length * duration);
      
      lastGain.gain.setValueAtTime(0.3, this.ctx.currentTime + frequencies.length * duration);
      lastGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + frequencies.length * duration + 1.0);
      
      lastOsc.start(this.ctx.currentTime + frequencies.length * duration);
      lastOsc.stop(this.ctx.currentTime + frequencies.length * duration + 1.0);
      
    } catch(e) {
      console.warn("Audio play failed", e);
    }
  }
}

export const audioController = new AudioController();
