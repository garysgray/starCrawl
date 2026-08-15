// ── SceneConfig.js ──────────────────────────────────────────────────────────
// Consolidated system constants, frozen UI enums, and data tuning metrics

const UI_ACTIONS = Object.freeze({
  SET_SPEED:     0,  // Slow / Med / Fast text crawl speed
  SET_STARS:     1,  // Calm / Drift / Warp background modes
  OPEN_EDITOR:   2   // Toggles the custom editor panel
});

const STORAGE_KEYS = Object.freeze({
  CRAWL_SPEED:  'starCrawl_speed',
  STAR_MODE:    'starCrawl_stars'
});

const SHARED_SYSTEM_MATH = Object.freeze({
  FIXED_TIMESTEP:      1 / 60,
  MAX_FRAME_TIME:      0.25,
  MAX_STEPS:           5
});

// Your explicit, tuned ship spawner constants
const SHIP_INTERVAL = Object.freeze({
  narrow:     8000,   // 8 seconds between ships on mobile
  wide:       12000,  // 12 seconds between ships on desktop
  breakpoint: 1024
});

// Your explicit, tuned ship vector and physics constants
const SHIP_TUNING = Object.freeze({
  spawnX:      100,    // 100% = right edge
  spawnY:      250,    // 250% = well below the bottom
  speed:       0.15,   // moves up 0.15% of screen height per tick
  driftX:      -0.04,  // drifts left 0.04% of screen width per tick
  size:        1,      // scale as % of screen width
  shrink:      0.0001, // scale reduction as ship recedes
  flattenY:    0.3,    // vertical squash for belly-view perspective
  rotation:    1.48,   // angle in multiples of π (1.5 = straight up)
  fadeOutZone: -999,   // % from top where fade begins
  fadeSpeed:   0.008   // alpha reduction per tick
});

// The unified container object that exposes everything to the engine
const CONFIG = {
  System:      SHARED_SYSTEM_MATH,
  UIActions:   UI_ACTIONS,
  StorageKeys: STORAGE_KEYS,
  shipInterval: SHIP_INTERVAL,
  shipTuning:   SHIP_TUNING,
  hud: Object.freeze({
    autoHideMs:    3000,
    transitionCss: 'opacity 0.6s ease, transform 0.6s ease',
  })
};

Object.freeze(CONFIG);

// Universal local storage interface wrapper
const StorageUtil = {
    get(key, fallbackValue) {
        try {
            const savedData = localStorage.getItem("siteSettings");
            if (savedData) {
                const settings = JSON.parse(savedData);
                if (settings[key] !== undefined) return settings[key];
            }
        } catch (e) { console.error(`StorageUtil: Failed to read key "${key}"`, e); }
        return fallbackValue;
    },
    set(key, value) {
        try {
            const savedData = localStorage.getItem("siteSettings");
            const currentSettings = savedData ? JSON.parse(savedData) : {};
            currentSettings[key] = value;
            localStorage.setItem("siteSettings", JSON.stringify(currentSettings));
        } catch (e) { console.error(`StorageUtil: Failed to save key "${key}"`, e); }
    }
};
