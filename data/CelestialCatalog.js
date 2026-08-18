// ── CelestialCatalog.js ──────────────────────────────────────────────────────
// Completely streamlined down to unique visual profiles. Common parameters 
// are automatically supplied by their respective SpaceObject subclasses!

const CELESTIAL_CATALOG = {
    gasGiantAlpha: {
        objectType:     'planet',
        x:              0.85,
        y:              0.8,
        scale:          0.8,
        tilt:           0.2, 
        spinSpeed:      0.0005,
        baseColor:      '#1e2135',
        atmosColor:     'rgba(100, 150, 255, 0.22)',
        
        // Custom asset mappings that define the look of this specific gas world
        rings: [
            { innerRadius: 1.35, outerRadius: 1.75, color: 'rgba(76, 93, 116, 0.3)', tilt: 0.35 },
            { innerRadius: 1.80, outerRadius: 2.05, color: 'rgba(80, 68, 109, 0.18)', tilt: 0.35 }
        ]
    },

    deathStarAlpha: {
        objectType:     'station',
        x:              0.85,   
        y:              0.8,    
        scale:          0.8,    
        tilt:           0.0,    
        spinSpeed:      0.0,    
        baseColor:      '#41464e', 
        atmosColor:     'rgba(80, 85, 95, 0.06)',

        // 👇 CONFIG SECTOR: Easily slide the dish center around right here!
        dishXRatio:     0.18,  // Moves it slightly further right on the map canvas
        dishYRatio:     0.41   // Shifts it slightly higher toward the north pole
    }
};

if (typeof Object.freeze === 'function') Object.freeze(CELESTIAL_CATALOG);




