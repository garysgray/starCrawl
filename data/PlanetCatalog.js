const PLANET_CATALOG = {
    gasGiantAlpha: {
        x: 0.85,
        y: 0.8,
        scale: 0.8,
        tilt: 0.2,
        spinSpeed: 0.0005,
        baseColor: '#1e2135',
        atmosColor: 'rgba(100, 150, 255, 0.22)',
        gritCount: 5000,
        bandCount: 12,
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
    }
};
