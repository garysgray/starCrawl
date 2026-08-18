// ── SpaceObject Base Class ────────────────────────────────────────────────────
class SpaceObject {
    constructor(config) {
        if (this.constructor === SpaceObject) {
            throw new TypeError("Cannot instantiate base abstract class SpaceObject directly.");
        }
        
        // Universal tracking variables shared by ALL background space objects
        this.type       = config.objectType || 'generic';
        this.x          = config.x ?? 0.85; 
        this.y          = config.y ?? 0.8;  
        this.scale      = config.scale ?? 0.8;
        this.tilt       = config.tilt ?? 0;
        this.spinSpeed  = config.spinSpeed ?? 0.0;
        this.baseColor  = config.baseColor || '#1c1c1c';
        this.atmosColor = config.atmosColor || 'rgba(255,255,255,0.1)';
        this.rotation   = 0;
        this.textureMap = null; 

        // 👇 NEW ARCHITECTURAL ADDITIONS DECOUPLED FROM THE RENDERER:
        // Individual entities now completely own where their light sources fall
        this.lightX     = config.lightX ?? 0.5;
        this.lightY     = config.lightY ?? -0.25;
        this.rimOpacity = config.rimOpacity ?? 0.28;
        this.shadowStops = config.shadowStops || [];
    }

    update(dt) {
        this.rotation += this.spinSpeed * dt;
    }

    // Abstract method interface ensuring every child object knows how to build its skin
    generateTexture() {
        throw new Error("Abstract method generateTexture() must be implemented by subclass.");
    }
}

// ── Planet Subclass Component ─────────────────────────────────────────────────
class PlanetEntity extends SpaceObject {
    constructor(config) {
        super(config);
        
        // CLASS DEFAULT FALLBACKS: Cleared out of CelestialCatalog completely!
        this.gritCount      = config.gritCount ?? 5000;
        this.bandCount      = config.bandCount ?? 12;
        this.bandOpacityMin = config.bandOpacityMin ?? 0.05;
        this.bandOpacityMax = config.bandOpacityMax ?? 0.20;
        this.rings          = config.rings || [];
        
        // 👇 DEFINE PLANET LIGHTING METRICS NATIVELY:
        this.rimOpacity     = config.rimOpacity ?? 0.28; // Soft atmospheric neon glow
        this.shadowStops    = config.shadowStops || [
            { stop: 0.3, color: 'transparent' },
            { stop: 1.0, color: '#000000' } // (Maps to your original COSMETIC_CONFIG.TERMINATOR_SHADOW)
        ];

        // Default gas giant crater array structure automatically populated if missing
        this.craters = config.craters || [
            { count: 120, minR: 5, maxR: 20, color: 'rgba(0,0,0,0.4)', rimColor: 'rgba(255,255,255,0.12)', depthColor: 'rgba(0,0,0,0.45)' },
            { count: 15, minR: 25, maxR: 55, color: 'rgba(0,0,0,0.35)', rimColor: 'rgba(255,255,255,0.08)', depthColor: 'rgba(0,0,0,0.5)' },
            { count: 40, minR: 3, maxR: 8, color: 'rgba(0,0,0,0.3)', rimColor: 'rgba(255,255,255,0.18)', depthColor: 'rgba(0,0,0,0.35)', latBand: [0.0, 0.25] }
        ];
        
        //console.log(`🪐 CELESTIAL FACTORY: Instantiated a PlanetEntity subclass object layout.`);
    }

    // SELF-RENDERING: This child class explicitly owns the random organic gas planet math
    generateTexture(w, h, cosmeticConfig) {
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const tctx = canvas.getContext('2d');

        tctx.fillStyle = this.baseColor;
        tctx.fillRect(0, 0, w, h);

        // Render Gas Bands
        for (let i = 0; i < this.bandCount; i++) {
            const y = Math.random() * h;
            const bh = 20 + Math.random() * 80;
            const op = this.bandOpacityMin + Math.random() * (this.bandOpacityMax - this.bandOpacityMin);
            tctx.fillStyle = `rgba(0, 0, 0, ${op})`;
            tctx.fillRect(0, y, w, bh);
        }

        // Render Surface Noise Grit
        tctx.fillStyle = `rgba(255, 255, 255, ${cosmeticConfig.GRIT_OPACITY})`;
        for (let i = 0; i < this.gritCount; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            tctx.fillRect(x, y, 1.5, 1.5);
            if (x < 50) tctx.fillRect(x + w, y, 1.5, 1.5);
            if (x > w - 50) tctx.fillRect(x - w, y, 1.5, 1.5);
        }

        // The fine-tuned anamorphic ratio to counteract the projection stretch
        const verticalStretchRatio = 1.45;

        // Render Crater Layers
        this.craters.forEach(grp => {
            const count = grp.count ?? 80;
            const minR = grp.minR ?? 5;
            const maxR = grp.maxR ?? 40;
            
            const yMin = (grp.latBand && Array.isArray(grp.latBand)) ? grp.latBand[0] * h : 0;
            const yMax = (grp.latBand && Array.isArray(grp.latBand)) ? grp.latBand[1] * h : h;

            // 👇 THE FIXED GEOMETRIC CRATER DISTRIBUTION:
            // Spaced evenly across the available texture grid coordinates forever
            for (let i = 0; i < count; i++) {
                // Distribute horizontally using clean, static steps
                const x = (i / count) * w;
                
                // Distribute vertically using a deterministic mathematical offset wave pattern
                const waveOffset = Math.sin(i * 2.3) * 0.5 + 0.5;
                const y = yMin + waveOffset * (yMax - yMin);
                
                // Cycle through a predictable sequence of crater sizes instead of pure random scales
                const sizeStep = (i % 4) / 3;
                const cr = minR + sizeStep * (maxR - minR);

                const rX = cr;
                const rY = cr / verticalStretchRatio;

                const color = grp.color || 'rgba(0,0,0,0.4)';
                const depthColor = grp.depthColor || 'rgba(0,0,0,0.4)';
                const rimColor = grp.rimColor || `rgba(255,255,255,${cosmeticConfig.CRATER_RIM_OPACITY})`;

                [0, -w, w].forEach(offset => {
                    const cx = x + offset;
                    
                    tctx.save();
                    tctx.translate(cx, y);
                    tctx.scale(1, 1 / verticalStretchRatio);

                    // 1. Base Crater Solid Base Pocket
                    tctx.fillStyle = color;
                    tctx.beginPath(); tctx.arc(0, 0, cr, 0, Math.PI * 2); tctx.fill();

                    // 2. Internal Radial Depth Shadow
                    const depthGrad = tctx.createRadialGradient(0, 0, cr * 0.3, 0, 0, cr);
                    depthGrad.addColorStop(0, 'transparent'); 
                    depthGrad.addColorStop(1, depthColor);
                    tctx.fillStyle = depthGrad; 
                    tctx.beginPath(); tctx.arc(0, 0, cr, 0, Math.PI * 2); tctx.fill();

                    // 3. Softened Rim Highlight
                    tctx.save();
                    tctx.strokeStyle = rimColor; 
                    tctx.lineWidth = Math.max(1, cr * 0.08);
                    tctx.shadowBlur = 2;
                    tctx.shadowColor = rimColor;
                    tctx.beginPath(); tctx.arc(0, 0, cr * 0.92, 0, Math.PI * 2); tctx.stroke();
                    tctx.restore();
                    
                    tctx.restore();
                });
            }
        });
        return canvas;
    }
}

// ── Space Station Subclass Component ──────────────────────────────────────────
class SpaceStationEntity extends SpaceObject {
    constructor(config) {
        super(config);
        
        // CLASS DEFAULT FALLBACKS:
        this.gritCount      = config.gritCount ?? 9500;
        this.bandCount      = config.bandCount ?? 55;
        this.bandOpacityMin = config.bandOpacityMin ?? 0.15;
        this.bandOpacityMax = config.bandOpacityMax ?? 0.32;
        this.craters        = config.craters || []; 
        this.rings          = []; // Hard lock out natural rings
        
        // 👇 1. THE CINEMATIC REVERSE LIGHTING OVERHAUL:
        // Lift the hull paint to a lighter, cool model-kit primer gray for maximum contrast
        this.baseColor      = config.baseColor || '#7d8491'; 
        
        // Kill the center hot-spot bubble completely by defaulting the undercoat sphere to absolute black
        this.baseHighlight  = config.baseHighlight || '#000000';

        // Pop the rim-light up slightly to catch the beautiful left-hand structural crest curves
        this.rimOpacity     = config.rimOpacity ?? 0.26; 

        // Preserving your custom adjustable weapon variables completely pristine!
        this.dishXRatio     = config.dishXRatio ?? 0.165; 
        this.dishYRatio     = config.dishYRatio ?? 0.38;  

        //console.log(`🛰️ CELESTIAL FACTORY: Instantiated a SpaceStationEntity cinematic layout refactor.`);
    }


    // SELF-RENDERING placeholder for station architecture panels (to be built out next!)
        // SELF-RENDERING: This child class explicitly owns the mechanical station surface assets
        generateTexture(w, h, cosmeticConfig) {
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const tctx = canvas.getContext('2d');
        
        // 1. Solid Base Hull Metal Coating
        tctx.fillStyle = this.baseColor;
        tctx.fillRect(0, 0, w, h);
        
        // 2. Uniform Horizontal Panel Latitudes
        // We use a fixed loop index to place perfectly spaced plates
        tctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        const horizontalLinesCount = 20; 
        for (let i = 0; i <= horizontalLinesCount; i++) {
            const stripeY = (i / horizontalLinesCount) * h;
            // Alternates line thickness elegantly between 2px and 4px based on rows
            const stripeH = (i % 2 === 0) ? 4 : 2; 
            tctx.fillRect(0, stripeY, w, stripeH);
        }
        
        // 3. Structured Vertical Hull Plating Blocks
        // Creates a predictable mechanical block pattern across the texture width
        tctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
        const verticalColumnsCount = 16;
        for (let j = 0; j < verticalColumnsCount; j++) {
            const panelX = (j / verticalColumnsCount) * w;
            // Offsets every other panel block slightly to look like real armor plates
            const panelW = (w / verticalColumnsCount) * 0.45;
            tctx.fillRect(panelX, 0, panelW, h);
        }

        // 4. Deterministic Surface Technical Noise Grit
        // Replaced Math.random with a fixed math stride loop so grit stays static
        tctx.fillStyle = `rgba(255, 255, 255, ${cosmeticConfig.GRIT_OPACITY * 0.3})`;
        const gritStrideX = 17;
        const gritStrideY = 11;
        for (let x = 0; x < w; x += gritStrideX) {
            for (let y = 0; y < h; y += gritStrideY) {
                // Creates a pseudo-noise pattern that never shifts or recalculates randomly
                const shiftY = (x % 3 === 0) ? y + 4 : y;
                tctx.fillRect(x, shiftY, 1, 1);
            }
        }

        // 5. Immaculate Deep Equatorial Structural Trench Channel
        const trenchY = h * 0.5;
        const trenchH = 14; 
        
        tctx.fillStyle = 'rgba(10, 12, 16, 0.88)';
        tctx.fillRect(0, trenchY - trenchH / 2, w, trenchH);
        
        tctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
        tctx.fillRect(0, (trenchY - trenchH / 2) - 2, w, 2);
        tctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        tctx.fillRect(0, trenchY + trenchH / 2, w, 2);

        // 6. Anamorphic Superlaser Weapon Dish Matrix Placement
        const dishX = w * this.dishXRatio;
        const dishY = h * this.dishYRatio;
        const rX = 96;
        const rY = 68;

        tctx.fillStyle = 'rgba(28, 31, 38, 0.9)';
        tctx.beginPath(); tctx.ellipse(dishX, dishY, rX, rY, 0, 0, Math.PI * 2); tctx.fill();

        tctx.strokeStyle = 'rgba(12, 14, 18, 0.95)'; tctx.lineWidth = 4;
        tctx.beginPath(); tctx.ellipse(dishX, dishY, rX * 0.6, rY * 0.6, 0, 0, Math.PI * 2); tctx.stroke();
        tctx.beginPath(); tctx.ellipse(dishX, dishY, rX * 0.3, rY * 0.3, 0, 0, Math.PI * 2); tctx.stroke();

        tctx.fillStyle = 'rgba(15, 17, 22, 0.98)';
        tctx.beginPath(); tctx.ellipse(dishX, dishY, rX * 0.12, rY * 0.12, 0, 0, Math.PI * 2); tctx.fill();

        tctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'; tctx.lineWidth = 3;
        tctx.beginPath(); tctx.ellipse(dishX, dishY, rX * 0.98, rY * 0.98, 0, 0, Math.PI * 2); tctx.stroke();
        
        return canvas;
    }


}
