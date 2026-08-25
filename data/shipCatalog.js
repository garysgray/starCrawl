// ── ShipCatalog.js ────────────────────────────────────────────────────────────
// Completely streamlined down to unique ship classes and flight profiles.
// Geometry, coloration, and drawing logic are managed by their respective Ship subclasses!

const SHIP_CATALOG = {
    starDestroyerAlpha: {
        shipType:    'starDestroyer',
        spawnX:      100,
        spawnY:      135,   // Starts just below the screen bottom
        speed:       0.15,  // Default fallback speed
        driftX:      -0.04, // Gentle horizontal cross-drift vector
        size:        1.0,
        shrink:      0.0001,
        flattenY:    0.3,
        rotation:    1.48,
        fadeOutZone: -999,
        fadeSpeed:   0.008
    },

    // Backward-compatible alias for existing configurations
    starDestroyerClass: {
        shipType:    'starDestroyer',
        spawnX:      100,   
        spawnY:      135,   
        speed:       0.15,  
        driftX:      -0.04, 
        size:        1.0,   
        shrink:      0.0001,   
        flattenY:    0.3,   
        rotation:    1.48,  
        fadeOutZone: -999,   
        fadeSpeed:   0.008  
    },

    rebelCorvetteAlpha: {
        shipType:    'corvette',
        spawnX:      95,
        spawnY:      125,
        speed:       0.20,
        driftX:      -0.035,
        size:        0.75,
        shrink:      0.00012,
        flattenY:    0.32,
        rotation:    1.48,
        fadeOutZone: -999,
        fadeSpeed:   0.010,
        accentColor: '#aa2b2b'
    },

    fighterScoutAlpha: {
        shipType:    'fighter',
        spawnX:      90,
        spawnY:      120,
        speed:       0.32,
        driftX:      -0.055,
        size:        0.42,
        shrink:      0.00018,
        flattenY:    0.35,
        rotation:    1.48,
        fadeOutZone: -999,
        fadeSpeed:   0.012
    }
};

if (typeof Object.freeze === 'function') Object.freeze(SHIP_CATALOG);
