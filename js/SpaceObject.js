// ── SpaceObject Base Class ────────────────────────────────────────────────────
class SpaceObject {
    // ── PRIVATE PROPERTIES ───────────────────────────────────────
    #type;
    #x;
    #y;
    #driftX = 0;
    #driftY = 0;
    #scale;
    #tilt;
    #spinSpeed;
    #baseColor;
    #atmosColor;
    #rotation = 0;
    #textureMap = null;
    #lightX;
    #lightY;
    #rimOpacity;
    #shadowStops = [];

    // ── CONSTRUCTOR ────────────────────────────────────────────
    constructor(config = {}) {
        if (this.constructor === SpaceObject) {
            throw new TypeError("Cannot instantiate base abstract class SpaceObject directly.");
        }
        
        // Universal tracking variables shared by ALL background space objects
        this.#type        = config.objectType || 'generic';
        this.#x           = config.x ?? 0.85; 
        this.#y           = config.y ?? 0.8;  
        this.#driftX      = config.driftX ?? 0.0;
        this.#driftY      = config.driftY ?? 0.0;
        this.#scale       = config.scale ?? 0.8;
        this.#tilt        = config.tilt ?? 0;
        this.#spinSpeed   = config.spinSpeed ?? 0.0;
        this.#baseColor   = config.baseColor || '#1c1c1c';
        this.#atmosColor  = config.atmosColor || 'rgba(255,255,255,0.1)';
        this.#rotation    = 0;
        this.#textureMap  = null; 

        this.#lightX      = config.lightX ?? 0.5;
        this.#lightY      = config.lightY ?? -0.25;
        this.#rimOpacity  = config.rimOpacity ?? 0.28;
        this.#shadowStops = config.shadowStops || [];
    }

    // ── PUBLIC GETTERS & SETTERS ────────────────────────────────
    get type() { return this.#type; }
    set type(val) { this.#type = val; }

    get x() { return this.#x; }
    set x(val) { this.#x = val; }

    get y() { return this.#y; }
    set y(val) { this.#y = val; }

    get driftX() { return this.#driftX; }
    set driftX(val) { this.#driftX = val; }

    get driftY() { return this.#driftY; }
    set driftY(val) { this.#driftY = val; }

    get scale() { return this.#scale; }
    set scale(val) { this.#scale = val; }

    get tilt() { return this.#tilt; }
    set tilt(val) { this.#tilt = val; }

    get spinSpeed() { return this.#spinSpeed; }
    set spinSpeed(val) { this.#spinSpeed = val; }

    get baseColor() { return this.#baseColor; }
    set baseColor(val) { this.#baseColor = val; }

    get atmosColor() { return this.#atmosColor; }
    set atmosColor(val) { this.#atmosColor = val; }

    get rotation() { return this.#rotation; }
    set rotation(val) { this.#rotation = val; }

    get textureMap() { return this.#textureMap; }
    set textureMap(val) { this.#textureMap = val; }

    get lightX() { return this.#lightX; }
    set lightX(val) { this.#lightX = val; }

    get lightY() { return this.#lightY; }
    set lightY(val) { this.#lightY = val; }

    get rimOpacity() { return this.#rimOpacity; }
    set rimOpacity(val) { this.#rimOpacity = val; }

    get shadowStops() { return this.#shadowStops; }
    set shadowStops(val) { this.#shadowStops = val; }

    update(dt) {
        this.#rotation += this.#spinSpeed * dt;
        if (this.#driftX !== 0) this.#x += this.#driftX * dt;
        if (this.#driftY !== 0) this.#y += this.#driftY * dt;
    }

    // Abstract method interface ensuring every child object knows how to build its skin
    generateTexture(w, h, cosmeticConfig) {
        throw new Error("Abstract method generateTexture() must be implemented by subclass.");
    }
}

// ── Planet Subclass Component ─────────────────────────────────────────────────
class PlanetEntity extends SpaceObject {
    // ── PRIVATE PROPERTIES ───────────────────────────────────────
    #gritCount;
    #bandCount;
    #bandOpacityMin;
    #bandOpacityMax;
    #rings = [];
    #craters = [];

    // ── CONSTRUCTOR ────────────────────────────────────────────
    constructor(config = {}) {
        super(config);
        
        this.#gritCount      = config.gritCount ?? 5000;
        this.#bandCount      = config.bandCount ?? 12;
        this.#bandOpacityMin = config.bandOpacityMin ?? 0.05;
        this.#bandOpacityMax = config.bandOpacityMax ?? 0.20;
        this.#rings          = config.rings || [];
        
        this.rimOpacity      = config.rimOpacity ?? 0.28;
        this.shadowStops     = config.shadowStops || [
            { stop: 0.3, color: 'transparent' },
            { stop: 1.0, color: '#000000' }
        ];

        this.#craters = config.craters || [
            { count: 120, minR: 5, maxR: 20, color: 'rgba(0,0,0,0.4)', rimColor: 'rgba(255,255,255,0.12)', depthColor: 'rgba(0,0,0,0.45)' },
            { count: 15, minR: 25, maxR: 55, color: 'rgba(0,0,0,0.35)', rimColor: 'rgba(255,255,255,0.08)', depthColor: 'rgba(0,0,0,0.5)' },
            { count: 40, minR: 3, maxR: 8, color: 'rgba(0,0,0,0.3)', rimColor: 'rgba(255,255,255,0.18)', depthColor: 'rgba(0,0,0,0.35)', latBand: [0.0, 0.25] }
        ];
    }

    // ── PUBLIC GETTERS & SETTERS ────────────────────────────────
    get gritCount() { return this.#gritCount; }
    set gritCount(val) { this.#gritCount = val; }

    get bandCount() { return this.#bandCount; }
    set bandCount(val) { this.#bandCount = val; }

    get bandOpacityMin() { return this.#bandOpacityMin; }
    set bandOpacityMin(val) { this.#bandOpacityMin = val; }

    get bandOpacityMax() { return this.#bandOpacityMax; }
    set bandOpacityMax(val) { this.#bandOpacityMax = val; }

    get rings() { return this.#rings; }
    set rings(val) { this.#rings = val; }

    get craters() { return this.#craters; }
    set craters(val) { this.#craters = val; }

    // SELF-RENDERING: This child class explicitly owns the random organic gas planet math
    generateTexture(w, h, cosmeticConfig) {
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const tctx = canvas.getContext('2d');

        tctx.fillStyle = this.baseColor;
        tctx.fillRect(0, 0, w, h);

        // Render Gas Bands
        for (let i = 0; i < this.#bandCount; i++) {
            const y = Math.random() * h;
            const bh = 20 + Math.random() * 80;
            const op = this.#bandOpacityMin + Math.random() * (this.#bandOpacityMax - this.#bandOpacityMin);
            tctx.fillStyle = `rgba(0, 0, 0, ${op})`;
            tctx.fillRect(0, y, w, bh);
        }

        // Render Surface Noise Grit
        tctx.fillStyle = `rgba(255, 255, 255, ${cosmeticConfig.GRIT_OPACITY})`;
        for (let i = 0; i < this.#gritCount; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            tctx.fillRect(x, y, 1.5, 1.5);
            if (x < 50) tctx.fillRect(x + w, y, 1.5, 1.5);
            if (x > w - 50) tctx.fillRect(x - w, y, 1.5, 1.5);
        }

        // The fine-tuned anamorphic ratio to counteract the projection stretch
        const verticalStretchRatio = 1.45;

        // Render Crater Layers
        this.#craters.forEach(grp => {
            const count = grp.count ?? 80;
            const minR = grp.minR ?? 5;
            const maxR = grp.maxR ?? 40;
            
            const yMin = (grp.latBand && Array.isArray(grp.latBand)) ? grp.latBand[0] * h : 0;
            const yMax = (grp.latBand && Array.isArray(grp.latBand)) ? grp.latBand[1] * h : h;

            for (let i = 0; i < count; i++) {
                const x = (i / count) * w;
                const waveOffset = Math.sin(i * 2.3) * 0.5 + 0.5;
                const y = yMin + waveOffset * (yMax - yMin);
                
                const sizeStep = (i % 4) / 3;
                const cr = minR + sizeStep * (maxR - minR);

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
    // ── PRIVATE PROPERTIES ───────────────────────────────────────
    #gritCount;
    #bandCount;
    #bandOpacityMin;
    #bandOpacityMax;
    #craters = [];
    #rings = [];
    #baseHighlight;
    #dishXRatio;
    #dishYRatio;

    // ── CONSTRUCTOR ────────────────────────────────────────────
    constructor(config = {}) {
        super(config);
        
        this.#gritCount      = config.gritCount ?? 9500;
        this.#bandCount      = config.bandCount ?? 55;
        this.#bandOpacityMin = config.bandOpacityMin ?? 0.15;
        this.#bandOpacityMax = config.bandOpacityMax ?? 0.32;
        this.#craters        = config.craters || []; 
        this.#rings          = []; 
        
        this.baseColor       = config.baseColor || '#7d8491'; 
        this.#baseHighlight  = config.baseHighlight || '#000000';
        this.rimOpacity      = config.rimOpacity ?? 0.26; 

        this.#dishXRatio     = config.dishXRatio ?? 0.165; 
        this.#dishYRatio     = config.dishYRatio ?? 0.38;  
    }

    // ── PUBLIC GETTERS & SETTERS ────────────────────────────────
    get gritCount() { return this.#gritCount; }
    set gritCount(val) { this.#gritCount = val; }

    get bandCount() { return this.#bandCount; }
    set bandCount(val) { this.#bandCount = val; }

    get bandOpacityMin() { return this.#bandOpacityMin; }
    set bandOpacityMin(val) { this.#bandOpacityMin = val; }

    get bandOpacityMax() { return this.#bandOpacityMax; }
    set bandOpacityMax(val) { this.#bandOpacityMax = val; }

    get craters() { return this.#craters; }
    set craters(val) { this.#craters = val; }

    get rings() { return this.#rings; }
    set rings(val) { this.#rings = val; }

    get baseHighlight() { return this.#baseHighlight; }
    set baseHighlight(val) { this.#baseHighlight = val; }

    get dishXRatio() { return this.#dishXRatio; }
    set dishXRatio(val) { this.#dishXRatio = val; }

    get dishYRatio() { return this.#dishYRatio; }
    set dishYRatio(val) { this.#dishYRatio = val; }

    // SELF-RENDERING: This child class explicitly owns the mechanical station surface assets
    generateTexture(w, h, cosmeticConfig) {
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const tctx = canvas.getContext('2d');
        
        // 1. Solid Base Hull Metal Coating
        tctx.fillStyle = this.baseColor;
        tctx.fillRect(0, 0, w, h);
        
        // 2. Uniform Horizontal Panel Latitudes
        tctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        const horizontalLinesCount = 20; 
        for (let i = 0; i <= horizontalLinesCount; i++) {
            const stripeY = (i / horizontalLinesCount) * h;
            const stripeH = (i % 2 === 0) ? 4 : 2; 
            tctx.fillRect(0, stripeY, w, stripeH);
        }
        
        // 3. Structured Vertical Hull Plating Blocks
        tctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
        const verticalColumnsCount = 16;
        for (let j = 0; j < verticalColumnsCount; j++) {
            const panelX = (j / verticalColumnsCount) * w;
            const panelW = (w / verticalColumnsCount) * 0.45;
            tctx.fillRect(panelX, 0, panelW, h);
        }

        // 4. Deterministic Surface Technical Noise Grit
        tctx.fillStyle = `rgba(255, 255, 255, ${cosmeticConfig.GRIT_OPACITY * 0.3})`;
        const gritStrideX = 17;
        const gritStrideY = 11;
        for (let x = 0; x < w; x += gritStrideX) {
            for (let y = 0; y < h; y += gritStrideY) {
                const shiftY = (x % 3 === 0) ? y + 4 : y;
                tctx.fillRect(x, shiftY, 1, 1);
            }
        }

        // 5. Equatorial Structural Trench Channel
        const trenchY = h * 0.5;
        const trenchH = 14; 
        
        tctx.fillStyle = 'rgba(10, 12, 16, 0.88)';
        tctx.fillRect(0, trenchY - trenchH / 2, w, trenchH);
        
        tctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
        tctx.fillRect(0, (trenchY - trenchH / 2) - 2, w, 2);
        tctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        tctx.fillRect(0, trenchY + trenchH / 2, w, 2);

        // 6. Anamorphic Superlaser Weapon Dish Matrix Placement
        const dishX = w * this.#dishXRatio;
        const dishY = h * this.#dishYRatio;
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
