// ──────────────────────────────────────────────────────────────
// ── CONFIG ────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
// Description: Centralized configuration store for all project settings,
//              system parameters, and runtime constants.
// Dependencies: None (base-level application dependency)

// ============================================================================
// DIRECTOR MASTER TIMING, WAYPOINTS & MOTION CONTROLS
// Adjust these numbers anytime to fine-tune the cinematic flow to your liking!
// MED is the Master Baseline (100%). SLOW & FAST dynamically scale from MED.
// ============================================================================
const DIRECTOR_SETTINGS = Object.freeze({
  // ── 1. MASTER SHIP TRAJECTORY & TIMING (MED BASELINE) ─────────────────────
  SHIP_FIRST_APPEAR_DELAY_SEC: 1.0,   // Delay in seconds before 1st ship starts its flight
  SHIP_FLIGHT_DURATION_SEC:    40.0,  // Total flight duration across the screen in seconds (MED)
  SHIP_RESPAWN_INTERVAL_SEC:   1.0,  // Cooldown in seconds AFTER a ship exits before the next one starts (MED)

  // Explicit Start & End Waypoints (% of screen coordinates: [X, Y])
  // Start: X=90%, Y=112% (just below bottom-right edge of screen - appears in ~3s)
  // End:   X=10%, Y=-25% (cleanly past the top-left edge of screen)
   SHIP_START_POS: Object.freeze({ x: 105.0, y: 250.0 }),
  SHIP_END_POS:   Object.freeze({ x: 25.0, y: -150.0 }),
  SHIP_ROTATION:  1.48, // Ship heading tilt in multiples of π (1.50 = straight up, 1.48 = gentle left diagonal)

  // ── 2. MASTER CRAWL TEXT TIMING & SPEED (MED BASELINE) ────────────────────
  CRAWL_START_DELAY_SEC:     1.0,   // Seconds after page load before crawl starts scrolling
  CRAWL_SCROLL_DURATION_SEC: 250.0,  // Master target duration in seconds on reference PC screen (MED)
  CRAWL_REF_DISTANCE_PX:     24300, // Reference PC text scroll distance to anchor reading velocity

  // ── 3. SPEED MODE MULTIPLIERS (Applied to MED Baseline) ───────────────────
  // When user picks SLOW or FAST in the UI, all speeds scale cleanly from Master MED
  SPEED_MULTIPLIERS: Object.freeze({
    slow: Object.freeze({
      durationMultiplier: 1.35,  // ~35% longer flight & scroll duration (more relaxed & majestic)
      speedMultiplier:    0.74,  // ~26% slower velocity
      respawnMultiplier:  1.30,  // slightly longer gap between ships
      pitch:              0.92,
      starMode:           'calm'
    }),
    med: Object.freeze({
      durationMultiplier: 1.00,  // 100% exact Master Config numbers (Default)
      speedMultiplier:    1.00,  // 100% exact Master Config numbers (Default)
      respawnMultiplier:  1.00,
      pitch:              1.00,
      starMode:           'drift'
    }),
    fast: Object.freeze({
      durationMultiplier: 0.65,  // ~35% shorter flight & scroll duration (brisk & rapid)
      speedMultiplier:    1.50,  // ~50% faster velocity
      respawnMultiplier:  0.70,  // shorter gap between ships
      pitch:              1.10,
      starMode:           'drift'
    }),
    warp: Object.freeze({
      durationMultiplier: 0.20,  // Warp speed
      speedMultiplier:    5.00,
      respawnMultiplier:  0.25,
      pitch:              1.25,
      starMode:           'warp'
    })
  }),

  // ── 4. CELESTIAL & PLANET SYNC ───────────────────────────────────────────
  PLANET_START_POS:         Object.freeze({ x: 0.85, y: 0.80 }), // Standard background position
  PLANET_SPIN_SPEED:        0.0005, // Background axial rotation rate
  PLANET_TRANSITION_AT_PCT: 0.50,   // Point along ship flight (0.50 = 50% midpoint) where eclipse triggers

  // ── 5. AUTO-RESET ON REFRESH ─────────────────────────────────────────────
  FORCE_CLEAN_RESTART_ON_REFRESH: true // Guarantees crawl text and ship always start at t=0 on page reload
});

// ── GLOBAL ENUMS ─────────────────────────────────────────────
const UI_ACTIONS = Object.freeze({
  SET_SPEED:   0,  // Slow / Med / Fast text crawl speed
  SET_STARS:   1,  // Calm / Drift / Warp background modes
  OPEN_EDITOR: 2   // Toggles the custom editor panel
});

const STORAGE_KEYS = Object.freeze({
  CRAWL_SPEED: 'starCrawl_speed',
  STAR_MODE:   'starCrawl_stars'
});

const SPEED_MODES = Object.freeze({
  SLOW: 'slow',
  MED:  'med',
  FAST: 'fast'
});

const STAR_MODES = Object.freeze({
  CALM:  'calm',
  DRIFT: 'drift',
  WARP:  'warp'
});

// ── ENGINE MATH & TIMING CONSTANTS ───────────────────────────
// Grouped into a flat object to prevent global redeclaration errors.
const SHARED_SYSTEM_MATH = Object.freeze({
  FIXED_TIMESTEP: 1 / 60,   // 60Hz logic updates
  MAX_FRAME_TIME: 0.25,     // Clamp lag spikes
  MAX_STEPS:      5,        // Prevent loop spiral of death
  SAFE_START_MS:  100,      // Poll interval waiting for canvas sizing
  IDLE_TIMEOUT:   200       // Delay before starting the loop
});

// ── INTERNAL CONFIGURATION DATA STRUCTURE ────────────────────
const _configData = {
  // ── Master Cinematic Timing Controls ──────────────────────
  // Adjust overall speeds and synchronize world milestones here:
  cinematicTiming: Object.freeze({
    // Flight duration in seconds for each speed mode:
    // Increase for slower/more majestic pass, decrease for faster pass
    flightDuration: Object.freeze({
      slow: 36.0,
      med:  26.0,
      fast: 15.0,
      warp: 4.5
    }),
    // Delay before the first ship begins entering the bottom of the screen (in seconds)
    initialShipEntryDelay: 3.0,
    // Crawl text full passage duration in seconds for each speed mode
    crawlDuration: Object.freeze({
      slow: 85.0,
      med:  65.0,
      fast: 35.0,
      warp: 12.0
    })
  }),

  // ── Crawl Speeds (pixels per tick at base screen height) ───
  crawlSpeed: Object.freeze({
    slow: 0.4,
    med:  0.9,
    fast: 2.0
  }),

  // ── Crawl Layout Tuning ────────────────────────────────────
  crawlLayout: Object.freeze({
    baseH:     900,
    resetMult: 2,
    spacerH:   600
  }),

  // ── Star Modes & Density ───────────────────────────────────
  starModes: Object.freeze({
    calm:  Object.freeze({ speed: 0.05, stretch: 1,  count: 250 }),
    drift: Object.freeze({ speed: 0.3,  stretch: 2,  count: 350 }),
    warp:  Object.freeze({ speed: 4.0,  stretch: 18, count: 500 })
  }),

  // ── Star Visual Constants ──────────────────────────────────
  starVisuals: Object.freeze({
    baseH:            900,
    sizeMin:          0.2,
    sizeRange:        1.8,
    speedMin:         0.5,
    speedRange:       0.5,
    twinkleCalmRate:  0.015,
    twinkleDriftRate: 0.02,
    warpOpacityMin:   0.4,
    warpOpacityRange: 0.6,
    driftOpacityBase: 0.5,
    driftOpacityAmp:  0.3,
    calmOpacityBase:  0.4,
    calmOpacityAmp:   0.35
  }),

  // ── Ship Spawner Timing ────────────────────────────────────
  shipInterval: Object.freeze({
    narrow:     8000,   // 8 seconds between ships on mobile
    wide:       12000,  // 12 seconds between ships on desktop
    breakpoint: 1024
  }),

  // ── Default Ship Vector & Physics Tuning ───────────────────
  shipTuning: Object.freeze({
    spawnX:      100,    // 100% = right edge
    spawnY:      250,    // 250% = below bottom
    speed:       0.15,   // moves up 0.15% screen height per tick
    driftX:      -0.04,  // drifts left 0.04% screen width per tick
    size:        1.0,    // scale as % of screen width
    shrink:      0.0001, // scale reduction as ship recedes
    flattenY:    0.3,    // vertical squash for belly perspective
    rotation:    1.48,   // angle in multiples of π (1.5 = straight up)
    fadeOutZone: -999,   // % from top where fade begins
    fadeSpeed:   0.008   // alpha reduction per tick
  }),

  // ── Space Object Physics ───────────────────────────────────
  spacePhysics: Object.freeze({
    BASE_RADIUS:      420,
    TEXTURE_WIDTH:    2400,
    TEXTURE_HEIGHT:   1000,
    SLICE_COUNT:      120,
    SLICE_OVERLAP:    0.5,
    MAP_STRETCH_MULT: 4
  }),

  // ── Space Object Cosmetics ─────────────────────────────────
  spaceCosmetics: Object.freeze({
    GRIT_OPACITY:        0.05,
    CRATER_RIM_OPACITY:  0.1,
    SUN_HIGHLIGHT:       '#7e8db5',
    DEEP_SPACE_DARK:     '#0a0b14',
    TERMINATOR_SHADOW:   '#000000',
    ATMOS_INNER_RADIUS:  0.9,
    ATMOS_OUTER_RADIUS:  1.05
  }),

  // ── Audio Constants ────────────────────────────────────────
  audio: Object.freeze({
    droneBufSecs:     4,
    droneFilter1Freq: 80,
    droneFilter1Q:    0.8,
    droneFilter2Freq: 320,
    droneFilter2Q:    2,
    droneGainTarget:  0.18,
    droneFadeDelay:   1,
    droneFadeTime:    3,
    droneLfoFreq:     0.08,
    droneLfoDepth:    0.04,
    clickBufSecs:     0.04,
    clickFilterFreq:  1800,
    clickGainStart:   0.8,
    clickGainEnd:     0.001,
    clickDecayTime:   0.04,
    noiseMin:         -1,
    noiseRange:       2
  }),

  // ── HUD Interface Tuning ───────────────────────────────────
  hud: Object.freeze({
    autoHideMs:    3000,
    transitionCss: 'opacity 0.6s ease, transform 0.6s ease'
  }),

  // ── Deterministic Simulation Timeline Modes ────────────────
  simulationModes: Object.freeze({
    slow: Object.freeze({
      shipInterval:       Math.round(DIRECTOR_SETTINGS.SHIP_RESPAWN_INTERVAL_SEC * 1.2 * 1000),
      flightDuration:     DIRECTOR_SETTINGS.SHIP_FLIGHT_DURATION_SEC * 1.35,
      baseScrollDuration: DIRECTOR_SETTINGS.CRAWL_SCROLL_DURATION_SEC * 1.30,
      starMode:           'calm',
      musicPitch:         0.90
    }),
    med:  Object.freeze({
      shipInterval:       Math.round(DIRECTOR_SETTINGS.SHIP_RESPAWN_INTERVAL_SEC * 1000),
      flightDuration:     DIRECTOR_SETTINGS.SHIP_FLIGHT_DURATION_SEC,
      baseScrollDuration: DIRECTOR_SETTINGS.CRAWL_SCROLL_DURATION_SEC,
      starMode:           'drift',
      musicPitch:         1.00
    }),
    fast: Object.freeze({
      shipInterval:       Math.round(DIRECTOR_SETTINGS.SHIP_RESPAWN_INTERVAL_SEC * 0.5 * 1000),
      flightDuration:     DIRECTOR_SETTINGS.SHIP_FLIGHT_DURATION_SEC * 0.55,
      baseScrollDuration: DIRECTOR_SETTINGS.CRAWL_SCROLL_DURATION_SEC * 0.55,
      starMode:           'drift',
      musicPitch:         1.10
    }),
    warp: Object.freeze({
      shipInterval:       Math.round(DIRECTOR_SETTINGS.SHIP_RESPAWN_INTERVAL_SEC * 0.15 * 1000),
      flightDuration:     DIRECTOR_SETTINGS.SHIP_FLIGHT_DURATION_SEC * 0.18,
      baseScrollDuration: DIRECTOR_SETTINGS.CRAWL_SCROLL_DURATION_SEC * 0.20,
      starMode:           'warp',
      musicPitch:         1.25
    })
  })
};

// ── PUBLIC CONFIG INTERFACE ─────────────────────────────────
const CONFIG = {
  // 1. Master Director Tuning Variables
  DIRECTOR:        DIRECTOR_SETTINGS,

  // 2. Math and Global Enums
  System:          SHARED_SYSTEM_MATH,
  UIActions:       UI_ACTIONS,
  StorageKeys:     STORAGE_KEYS,
  SpeedModes:      SPEED_MODES,
  StarModes:       STAR_MODES,

  // 3. Static Configurations
  cinematicTiming: _configData.cinematicTiming,
  crawlSpeed:      _configData.crawlSpeed,
  crawlLayout:     _configData.crawlLayout,
  starModes:       _configData.starModes,
  starVisuals:     _configData.starVisuals,
  shipInterval:    _configData.shipInterval,
  shipTuning:      _configData.shipTuning,
  spacePhysics:    _configData.spacePhysics,
  spaceCosmetics:  _configData.spaceCosmetics,
  audio:           _configData.audio,
  hud:             _configData.hud,
  simulationModes: _configData.simulationModes
};

// Freeze the interface root
Object.freeze(CONFIG);

// ── UTILITY STORAGE WRAPPER ──────────────────────────────────
const StorageUtil = {
  get(key, fallbackValue) {
    try {
      const savedData = localStorage.getItem("starCrawlSettings");
      if (savedData) {
        const settings = JSON.parse(savedData);
        if (settings[key] !== undefined) return settings[key];
      }
    } catch (e) {
      console.error(`StorageUtil: Failed to read key "${key}"`, e);
    }
    return fallbackValue;
  },

  set(key, value) {
    try {
      const savedData = localStorage.getItem("starCrawlSettings");
      const currentSettings = savedData ? JSON.parse(savedData) : {};
      currentSettings[key] = value;
      localStorage.setItem("starCrawlSettings", JSON.stringify(currentSettings));
    } catch (e) {
      console.error(`StorageUtil: Failed to save key "${key}"`, e);
    }
  }
};
