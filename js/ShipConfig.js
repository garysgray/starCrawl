//const SHIP_INTERVAL = { min: 20000, range: 0 };
const SHIP_INTERVAL =
{
  narrow:     20000,
  wide:       45000,
  breakpoint: 1024
};


const SHIP_TUNING = 
{
  // Position as % of screen dimensions (0-100 = on screen, >100 = off screen)
  spawnX:      100,    // 100% = right edge
  spawnY:      250,    // 250% = well below the bottom

  // Movement per tick as % of screen
  speed:       0.15,   // moves up 0.15% of screen height per tick
  driftX:      -0.04,  // drifts left 0.04% of screen width per tick

  // Visual
  size:        1,      // scale as % of screen width
  shrink:      0.0001, // scale reduction as ship recedes
  flattenY:    0.3,    // vertical squash for belly-view perspective
  rotation:    1.48,   // angle in multiples of π (1.5 = straight up)

  // Fade (set fadeOutZone to -999 to disable)
  fadeOutZone: -999,   // % from top where fade begins
  fadeSpeed:   0.008,  // alpha reduction per tick
};