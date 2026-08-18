// ── CelestialCatalog.js ──────────────────────────────────────────────────────
// Central data records for all background space objects and environments.

const CELESTIAL_CATALOG = {
    gasGiantAlpha: {
        objectType:     'planet',
        x:              0.85,
        y:              0.8,
        scale:          0.8,
        tilt:           0.2, // Cinematic depth tilt layout axis
        spinSpeed:      0.0005, // Continuous planetary surface rotation vector
        baseColor:      '#1e2135',
        atmosColor:     'rgba(100, 150, 255, 0.22)',
        gritCount:      5000,
        bandCount:      12,
        bandOpacityMin: 0.05,
        bandOpacityMax: 0.20,
        craters: [
            { count: 120, minR: 5, maxR: 20, color: 'rgba(0,0,0,0.4)', rimColor: 'rgba(255,255,255,0.12)', depthColor: 'rgba(0,0,0,0.45)' },
            { count: 15, minR: 25, maxR: 55, color: 'rgba(0,0,0,0.35)', rimColor: 'rgba(255,255,255,0.08)', depthColor: 'rgba(0,0,0,0.5)' },
            { count: 40, minR: 3, maxR: 8, color: 'rgba(0,0,0,0.3)', rimColor: 'rgba(255,255,255,0.18)', depthColor: 'rgba(0,0,0,0.35)', latBand: [0.0, 0.25] }
        ],
        rings: [
            { innerRadius: 1.35, outerRadius: 1.75, color: 'rgba(76, 93, 116, 0.3)', tilt: 0.35 },
            { innerRadius: 1.80, outerRadius: 2.05, color: 'rgba(80, 68, 109, 0.18)', tilt: 0.35 }
        ]
    },

    deathStarAlpha: {
        objectType:     'station',
        // SPATIAL POSITION MATCH: Fits the identical visual tracking spot of your original planet
        x:              0.85,   
        y:              0.8,    
        scale:          0.8,    
        tilt:           0.0,    // FIXED AXIS: Hard 0.0 tilt eliminates horizontal curving!
        spinSpeed:      0.0,    // STATION STABILITY: Keeps the weapon array completely stationary
        baseColor:      '#41464e', // Calibrated armor plate grey base
        atmosColor:     'rgba(80, 85, 95, 0.06)', // Faint metallic ambient envelope shading
        
        // Mechanical Plating Details
        bandCount:      55,     // Dense horizontal deck splits
        bandOpacityMin: 0.15,   // Structural gap depth contrast
        bandOpacityMax: 0.32,   
        gritCount:      9500,   // Dense hangar window detailing
        
        // Superlaser Primary Weapon Assembly (Stamped out via your craters architecture)
        craters: [
            {
                count:      1,       
                minR:       46,      // Sized to match your classic movie reference photo proportions
                maxR:       46,
                color:      '#24282f', // Dark steel concave reflection mirror tint
                rimColor:   'rgba(255, 255, 255, 0.14)', // Outer weapon casing molding edge highlight
                depthColor: 'rgba(0, 0, 0, 0.65)',        // Core compression shadow depth drops
                
                /* 
                  CALIBRATED COORDINATE TARGETING:
                  Shifts the layout calculation vertically to exactly 35% depth on the face of 
                  the sphere, perfectly locking the weapon dish onto the upper-left sunlit hemisphere section!
                */
                latBand:    [0.35, 0.35] 
            }
        ],
        rings: [] // A mechanical military battlestation has no natural planetary debris rings
    }
};

if (typeof Object.freeze === 'function') Object.freeze(CELESTIAL_CATALOG);
