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
    },

    // ── Star Wars-Inspired Planetary Expansions ─────────────────────────────
    tatooine: {
        objectType:     'planet',
        x:              0.85,
        y:              0.8,
        scale:          0.8,
        tilt:           0.12,
        spinSpeed:      0.0004,
        baseColor:      '#d4a373', // Sandy tan/beige desert surface
        atmosColor:     'rgba(235, 185, 130, 0.18)', // Subtle warm dusty amber atmosphere
        rimOpacity:     0.22,
        gritCount:      7000,      // Dry, rocky surface grit
        bandCount:      8,         // Sparse dune / wind-swept dust bands
        bandOpacityMin: 0.03,
        bandOpacityMax: 0.10,
        craters: [
            // Darker brown surface variations, rocky canyons & basins
            { count: 90, minR: 8, maxR: 28, color: 'rgba(92, 58, 30, 0.45)', depthColor: 'rgba(60, 36, 18, 0.55)', rimColor: 'rgba(245, 215, 175, 0.25)' },
            { count: 20, minR: 30, maxR: 65, color: 'rgba(110, 70, 35, 0.35)', depthColor: 'rgba(75, 42, 20, 0.5)', rimColor: 'rgba(230, 195, 155, 0.18)' },
            { count: 50, minR: 3, maxR: 10, color: 'rgba(80, 48, 22, 0.4)', depthColor: 'rgba(50, 28, 12, 0.4)', rimColor: 'rgba(255, 230, 190, 0.3)', latBand: [0.3, 0.7] }
        ]
    },

    hoth: {
        objectType:     'planet',
        x:              0.85,
        y:              0.8,
        scale:          0.8,
        tilt:           -0.15,
        spinSpeed:      0.0003,
        baseColor:      '#e8eff7', // Glacial white/light gray icy surface
        atmosColor:     'rgba(165, 215, 255, 0.35)', // Cold pale cyan-blue atmospheric haze
        rimOpacity:     0.32,
        gritCount:      2500,      // Fine crystalline ice sheen
        bandCount:      6,         // Sparse blizzard / glacial drift bands
        bandOpacityMin: 0.02,
        bandOpacityMax: 0.08,
        craters: [
            // Pale blue icy crevasses, frozen rifts, and sparse impacts
            { count: 35, minR: 10, maxR: 35, color: 'rgba(140, 175, 210, 0.3)', depthColor: 'rgba(100, 140, 180, 0.45)', rimColor: 'rgba(255, 255, 255, 0.45)' },
            { count: 12, minR: 30, maxR: 70, color: 'rgba(120, 160, 195, 0.25)', depthColor: 'rgba(85, 125, 165, 0.35)', rimColor: 'rgba(255, 255, 255, 0.3)' }
        ]
    },

    endor: {
        objectType:     'planet',
        x:              0.85,
        y:              0.8,
        scale:          0.8,
        tilt:           0.25,
        spinSpeed:      0.00045,
        baseColor:      '#1f3b26', // Deep forest-green canopy
        atmosColor:     'rgba(70, 150, 95, 0.20)', // Darker organic biosphere atmosphere
        rimOpacity:     0.24,
        gritCount:      6500,      // Dense organic foliage detail
        bandCount:      14,        // Weather fronts and canopy moisture bands
        bandOpacityMin: 0.06,
        bandOpacityMax: 0.18,
        craters: [
            // Earthen brown landmasses, river valleys, and mountain clearings
            { count: 110, minR: 6, maxR: 24, color: 'rgba(54, 40, 24, 0.55)', depthColor: 'rgba(36, 26, 14, 0.65)', rimColor: 'rgba(110, 140, 80, 0.22)' },
            { count: 18, minR: 25, maxR: 50, color: 'rgba(48, 34, 18, 0.45)', depthColor: 'rgba(30, 20, 10, 0.55)', rimColor: 'rgba(95, 130, 70, 0.15)' },
            { count: 45, minR: 3, maxR: 9, color: 'rgba(38, 55, 30, 0.5)', depthColor: 'rgba(22, 36, 18, 0.5)', rimColor: 'rgba(130, 175, 100, 0.25)', latBand: [0.2, 0.8] }
        ]
    },

    mustafar: {
        objectType:     'planet',
        x:              0.85,
        y:              0.8,
        scale:          0.8,
        tilt:           -0.1,
        spinSpeed:      0.0006,
        baseColor:      '#181416', // Dark charcoal/black rocky crust
        atmosColor:     'rgba(255, 65, 20, 0.42)', // Strong fiery red/orange warm atmospheric glow
        rimOpacity:     0.45,
        gritCount:      4500,      // Volcanic ash & cinders
        bandCount:      10,        // Billowing ash clouds
        bandOpacityMin: 0.12,
        bandOpacityMax: 0.30,
        craters: [
            // Glowing red/orange lava lakes, calderas, and incandescent magma rifts
            { count: 85, minR: 8, maxR: 26, color: 'rgba(210, 45, 10, 0.75)', depthColor: 'rgba(255, 120, 20, 0.9)', rimColor: 'rgba(255, 190, 50, 0.7)' },
            { count: 22, minR: 28, maxR: 60, color: 'rgba(180, 30, 5, 0.65)', depthColor: 'rgba(240, 85, 10, 0.8)', rimColor: 'rgba(255, 140, 30, 0.55)' },
            { count: 50, minR: 4, maxR: 12, color: 'rgba(230, 60, 15, 0.8)', depthColor: 'rgba(255, 160, 40, 0.95)', rimColor: 'rgba(255, 220, 80, 0.85)', latBand: [0.35, 0.65] }
        ]
    },

    bespin: {
        objectType:     'planet',
        x:              0.85,
        y:              0.8,
        scale:          0.8,
        tilt:           0.08,
        spinSpeed:      0.0007,
        baseColor:      '#d49755', // Warm golden/cream cloud mantle
        atmosColor:     'rgba(245, 180, 100, 0.32)', // Layered gold/peach atmospheric glow
        rimOpacity:     0.30,
        gritCount:      800,       // Silky smooth gaseous atmosphere
        bandCount:      28,        // Dense horizontal cloud-band layers
        bandOpacityMin: 0.08,
        bandOpacityMax: 0.28,
        craters:        []         // Pure gas giant — zero terrestrial craters/rocks
    },

    dagobah: {
        objectType:     'planet',
        x:              0.85,
        y:              0.8,
        scale:          0.8,
        tilt:           0.18,
        spinSpeed:      0.00035,
        baseColor:      '#242a1e', // Dark murky olive-brown wetland surface
        atmosColor:     'rgba(105, 135, 80, 0.28)', // Murky green atmospheric haze
        rimOpacity:     0.26,
        gritCount:      5500,      // Organic silt & wetland noise
        bandCount:      16,        // Low-lying swamp fog and cloud decks
        bandOpacityMin: 0.08,
        bandOpacityMax: 0.22,
        craters: [
            // Irregular dark murky lagoons, stagnant bogs, and marsh depressions
            { count: 95, minR: 7, maxR: 25, color: 'rgba(18, 28, 16, 0.65)', depthColor: 'rgba(10, 18, 10, 0.75)', rimColor: 'rgba(80, 110, 60, 0.2)' },
            { count: 20, minR: 28, maxR: 58, color: 'rgba(28, 36, 20, 0.55)', depthColor: 'rgba(15, 24, 12, 0.65)', rimColor: 'rgba(65, 95, 50, 0.15)' }
        ]
    },

    coruscant: {
        objectType:     'planet',
        x:              0.85,
        y:              0.8,
        scale:          0.8,
        tilt:           0.05,
        spinSpeed:      0.00025,
        baseColor:      '#3b2d42', // Deep bruised violet-purple and metallic bronze base
        atmosColor:     'rgba(195, 145, 215, 0.24)', // Soft lavender and warm copper atmospheric limb haze
        rimOpacity:     0.38,
        gritCount:      1200,      // Smooth technocentric surface texture
        bandCount:      24,        // Complex interconnected concentric node rings & circuitry lanes
        bandOpacityMin: 0.08,
        bandOpacityMax: 0.24,
        craters: [
            // High-intensity golden-white megacity capital hubs & deep chasms
            { count: 110, minR: 5, maxR: 20, color: 'rgba(22, 16, 28, 0.75)', depthColor: 'rgba(10, 6, 13, 0.85)', rimColor: 'rgba(255, 120, 60, 0.65)' },
            { count: 24, minR: 24, maxR: 52, color: 'rgba(18, 12, 24, 0.65)', depthColor: 'rgba(8, 4, 10, 0.80)', rimColor: 'rgba(255, 150, 80, 0.50)' },
            { count: 50, minR: 2, maxR: 8, color: 'rgba(26, 18, 34, 0.80)', depthColor: 'rgba(12, 8, 16, 0.90)', rimColor: 'rgba(255, 200, 120, 0.70)', latBand: [0.2, 0.8] }
        ]
    }
};

if (typeof Object.freeze === 'function') Object.freeze(CELESTIAL_CATALOG);




