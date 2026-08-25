// ──────────────────────────────────────────────────────────────
// ── SOUND RECIPES ─────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Procedural audio blueprints defining synthesis parameters
//              for all sound effects in the project.
// Core Role:   Provides AudioManager with instructions for generating
//              dynamic sound effects from white noise
// Dependencies: CONFIG
//

const SoundRecipes = 
{
  // ── UI Sounds ──────────────────────────────────────────────
  ui_click: 
  {
    // Total duration of generated audio buffer
    bufferSecs: () => (typeof CONFIG !== 'undefined' && CONFIG.audio?.clickBufSecs) ? CONFIG.audio.clickBufSecs : 0.04,
    
    // Highpass filter removes low frequencies for crispness
    filters: [{
      type: 'highpass',
      frequency: () => (typeof CONFIG !== 'undefined' && CONFIG.audio?.clickFilterFreq) ? CONFIG.audio.clickFilterFreq : 1800
    }],
    
    // Fast attack envelope with exponential decay
    envelope: {
      peak: () => (typeof CONFIG !== 'undefined' && CONFIG.audio?.clickGainStart) ? CONFIG.audio.clickGainStart : 0.8,
      endTime: () => (typeof CONFIG !== 'undefined' && CONFIG.audio?.clickDecayTime) ? CONFIG.audio.clickDecayTime : 0.04
    }
  },

  // ── Space Ambient & Flyby Effects ──────────────────────────
  ship_flyby:
  {
    bufferSecs: () => 3.5,
    filters: [
      {
        type: 'bandpass',
        frequency: () => 180,
        Q: () => 2.5
      },
      {
        type: 'lowpass',
        frequency: () => 650
      }
    ],
    envelope: (cfg, vol = 0.2) => ({
      peak: vol,
      attack: 1.0,
      holdAt: 1.5,
      endTime: 3.5
    })
  },

  hyperspace_pulse:
  {
    bufferSecs: () => 1.2,
    filters: [
      {
        type: 'highpass',
        frequency: () => 400
      },
      {
        type: 'bandpass',
        frequency: () => 1200,
        Q: () => 4.0
      }
    ],
    envelope: {
      peak: 0.35,
      attack: 0.05,
      holdAt: 0.2,
      endTime: 1.2
    }
  }
};
