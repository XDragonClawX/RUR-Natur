// Procedural Audio Synthesizer for RurNova - Cozy Dorfromantik Theme
// Synthesizes a tranquil acoustic-like lofi-ambient soundtrack and soft sound effects in-browser.

class AudioSystem {
  private static instance: AudioSystem | null = null;
  
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  private isMusicPlaying: boolean = false;
  private musicVolume: number = 0.35;
  private sfxVolume: number = 0.4;
  
  // Music scheduler state
  private musicTimer: number | null = null;
  private padNotes: number[] = [130.81, 146.83, 164.81, 196.00, 220.00]; // Pentatonic C (C3, D3, E3, G3, A3)
  private pluckNotes: number[] = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 784.00, 880.00]; // Pentatonic Plucks (C4-A5)
  private currentPadOscs: { osc: OscillatorNode; gain: GainNode }[] = [];
  
  public static getInstance(): AudioSystem {
    if (!AudioSystem.instance) {
      AudioSystem.instance = new AudioSystem();
    }
    return AudioSystem.instance;
  }

  private initContext() {
    if (this.ctx) return;
    
    // Create AudioContext with fallback
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    this.ctx = new AudioContextClass();
    
    // Master routing
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    
    // Music branch
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);
    
    // SFX branch
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);
  }

  public resume() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- VOLUME CONTROLS ---
  public getMusicPlaying(): boolean {
    return this.isMusicPlaying;
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.1);
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.1);
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  // --- PROCEDURAL BACKGROUND SOUNDTRACK ---
  public toggleMusic() {
    this.resume();
    if (this.isMusicPlaying) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  public startMusic() {
    this.resume();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    
    // Play warm background pad
    this.playAmbientPad();
    
    // Start scheduler for cozy guitar/harp/piano plucks
    this.scheduleNextMelodyNote();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    
    // Stop active warm pads
    this.currentPadOscs.forEach(p => {
      try {
        p.gain.gain.cancelScheduledValues(0);
        if (this.ctx) {
          p.gain.gain.setValueAtTime(p.gain.gain.value, this.ctx.currentTime);
          p.gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
          p.osc.stop(this.ctx.currentTime + 1.3);
        } else {
          p.osc.stop();
        }
      } catch (e) {
        // Safe play
      }
    });
    this.currentPadOscs = [];
  }

  // Plays a slow-moving, low-pass filtered chord pad
  private playAmbientPad() {
    if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
    
    // Clean old
    this.currentPadOscs = [];

    // Choose 3 notes from pentatonic pool to create a major 7 / add9 wash
    const chord = [this.padNotes[0], this.padNotes[2], this.padNotes[4]];
    
    chord.forEach((freq) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime); // very muffled
      
      gainNode.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      // Slow attack (3.5 seconds)
      gainNode.gain.exponentialRampToValueAtTime(0.06, this.ctx.currentTime + 4.0);
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.musicGain);
      
      osc.start();
      
      this.currentPadOscs.push({ osc, gain: gainNode });
    });
  }

  private scheduleNextMelodyNote() {
    if (!this.isMusicPlaying || !this.ctx) return;
    
    // Synthesize a beautiful harp pluck note
    const noteFreq = this.pluckNotes[Math.floor(Math.random() * this.pluckNotes.length)];
    const now = this.ctx.currentTime;
    
    this.synthesizeHarpPluck(noteFreq, now);
    
    // Schedule next note between 1.2s and 4.0s (delightfully irregular/ambient tempo)
    const delay = 1200 + Math.random() * 2800;
    this.musicTimer = window.setTimeout(() => {
      this.scheduleNextMelodyNote();
    }, delay);
  }

  private synthesizeHarpPluck(freq: number, time: number) {
    if (!this.ctx || !this.musicGain) return;
    
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const delay = this.ctx.createDelay();
    const delayFeedback = this.ctx.createGain();
    
    // Blend of triangle and sine wave for a clean wooden pluck
    osc.type = Math.random() > 0.5 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, time);
    
    // Lofi lowpass filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, time);
    
    // Cozy envelope: Instant pop, slow organic decay
    gainNode.gain.setValueAtTime(0.0001, time);
    gainNode.gain.linearRampToValueAtTime(0.18, time + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 2.4);
    
    // Echo delay
    delay.delayTime.setValueAtTime(0.38, time);
    delayFeedback.gain.setValueAtTime(0.35, time); // eco gain
    
    // Routing: osc -> filter -> gainNode -> delay -> feed -> back to delay
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.musicGain);
    
    // Feedback echo loop
    gainNode.connect(delay);
    delay.connect(delayFeedback);
    delayFeedback.connect(this.musicGain); // mix echo in master music stream
    delayFeedback.connect(delay); // loop back
    
    osc.start(time);
    osc.stop(time + 2.5);
  }

  // --- SOFT SOUND EFFECTS (SFX) ---
  
  // Soft water-pop for minor UI choices / hover
  public playClick() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sine';
    // quickly slide frequency down like a drop of water
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
    
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    
    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Harmonious, joyful arpeggio when building is placed
  public playBuild() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    // Harmonious major 7th arpeggio: C4 (261), E4 (329), G4 (392), B4 (493)
    const notes = [261.63, 329.63, 392.00, 493.88];
    
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const noteTime = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1300, noteTime);
      
      gainNode.gain.setValueAtTime(0.0001, noteTime);
      gainNode.gain.linearRampToValueAtTime(0.12, noteTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.85);
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.9);
    });
  }

  // Soft low sweeping rustle/dust sweep for demolish removal
  public playDelete() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.35);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Delightful glittering bell sound for rewards or high stats
  public playSuccess() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 784.00, 1046.50]; // Beautiful high C-major arpeggio (C5,E5,G5,C6)
    
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const noteTime = now + idx * 0.045;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      
      gainNode.gain.setValueAtTime(0.0001, noteTime);
      gainNode.gain.linearRampToValueAtTime(0.1, noteTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.2);
      
      osc.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      osc.start(noteTime);
      osc.stop(noteTime + 1.3);
    });
  }

  // Warm, soft acoustic double chime alert
  public playAlert() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    [293.66, 349.23].forEach((freq, idx) => { // D4 -> F4 warm notifier
      if (!this.ctx || !this.sfxGain) return;
      const noteTime = now + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);
      
      gainNode.gain.setValueAtTime(0.0001, noteTime);
      gainNode.gain.linearRampToValueAtTime(0.15, noteTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6);
      
      osc.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.7);
    });
  }
}

export const audio = AudioSystem.getInstance();
