// ── 1. CONFIGURATION ────────────────────────────────────────────────────────

const PHYSICS_CONFIG = {
    BASE_RADIUS:      420,
    TEXTURE_WIDTH:   2400,
    TEXTURE_HEIGHT:  1000,
    SLICE_COUNT:      120,
    SLICE_OVERLAP:    0.5,
    MAP_STRETCH_MULT:   4,
};

const COSMETIC_CONFIG = {
    GRIT_OPACITY:         0.05,
    CRATER_RIM_OPACITY:   0.1,
    SUN_HIGHLIGHT:        '#7e8db5',
    DEEP_SPACE_DARK:      '#0a0b14',
    TERMINATOR_SHADOW:    '#000000',
    ATMOS_INNER_RADIUS:   0.9,
    ATMOS_OUTER_RADIUS:   1.05,
};

// ── 2. PLANET TUNING  (edit these to change the planet's look) ───────────────
//
//  Every key is optional — sensible defaults are used when omitted.
//
//  RINGS
//  ─────
//  rings: [
//    { innerRadius: 1.3, outerRadius: 1.7, color: 'rgba(180,160,120,0.35)', tilt: 0.4 },
//    { innerRadius: 1.8, outerRadius: 2.0, color: 'rgba(140,120,90,0.2)',   tilt: 0.4 },
//  ]
//
//  BANDS (surface stripes)
//  ───────────────────────
//  bandCount: 12          — number of dark latitude stripes (0 = none)
//  bandOpacityMin: 0.05   — faintest band alpha
//  bandOpacityMax: 0.20   — darkest band alpha
//
//  CRATERS
//  ───────
//  craters: [
//    {
//      count:      80,                       // how many in this group
//      minR:        5,                       // smallest radius (texture px)
//      maxR:       20,                       // largest radius
//      color:      'rgba(0,0,0,0.45)',       // pit fill
//      rimColor:   'rgba(255,255,255,0.15)', // highlight rim
//      depthColor: 'rgba(0,0,0,0.5)',        // inner shadow for 3-D depth
//      latBand:    [0.2, 0.8],              // [minY, maxY] 0-1 fraction of texture height
//                                            //   0 = north pole, 1 = south pole
//                                            //   omit to scatter across whole surface
//    },
//  ]
//  Falls back to flat craterCount/craterMinR/craterMaxR/craterColor if craters[] absent.
//
//  GRIT
//  ────
//  gritCount: 5000        — surface noise dots
//
//  ATMOSPHERE
//  ──────────
//  atmosColor: 'rgba(100,150,255,0.22)'
//  atmosInnerRadius: 0.9  — override COSMETIC_CONFIG per-planet
//  atmosOuterRadius: 1.05

const PLANET_TUNING = {
    x:         0.85,
    y:         0.8,
    scale:     0.8,
    tilt:      0.2,
    spinSpeed: 0.0005,

    // 0	Perfectly Upright. The planet spins straight left-to-right.
    // 0.2 to 0.5	Natural Tilt. Looks like Earth or Mars (slight diagonal).
    // 1.0	Heavy Tilt. A very noticeable diagonal spin (approx 60°).
    // 1.57	Sideways. The planet is spinning "up and down" (like Uranus).
    // 3.14	Upside Down. The "North Pole" is now at the bottom.

    // Colors
    baseColor:  '#1e2135',
    atmosColor: 'rgba(100, 150, 255, 0.22)',

    // Grit
    gritCount: 5000,

    // Band controls
    bandCount:        12,
    bandOpacityMin:   0.05,
    bandOpacityMax:   0.20,

    // Craters — array of groups, just like rings
    // Each group is painted independently so you can mix large sparse craters
    // with dense small ones, or pin a group to a latitude band.
    craters: [
        {
            count:      120,
            minR:         5,
            maxR:        20,
            color:      'rgba(0,0,0,0.4)',
            rimColor:   'rgba(255,255,255,0.12)',
            depthColor: 'rgba(0,0,0,0.45)',
            // no latBand → scattered everywhere
        },
        {
            count:      15,
            minR:       25,
            maxR:       55,
            color:      'rgba(0,0,0,0.35)',
            rimColor:   'rgba(255,255,255,0.08)',
            depthColor: 'rgba(0,0,0,0.5)',
            // no latBand → scattered everywhere
        },
        {
            count:      40,
            minR:        3,
            maxR:        8,
            color:      'rgba(0,0,0,0.3)',
            rimColor:   'rgba(255,255,255,0.18)',
            depthColor: 'rgba(0,0,0,0.35)',
            latBand:    [0.0, 0.25],   // north pole region
        },
    ],

    // Rings (array — add as many objects as you like, or set to [] for none)
    // rings: [
    //     { innerRadius: 1.35, outerRadius: 1.75, color: 'rgba(180,160,120,0.30)', tilt: 0.35 },
    //     { innerRadius: 1.80, outerRadius: 2.05, color: 'rgba(130,110,80,0.18)',  tilt: 0.35 },
    // ],
    rings: [
              { innerRadius: 1.35, outerRadius: 1.75, color: 'rgba(76, 93, 116, 0.3)', tilt: 0.35 },
              { innerRadius: 1.80, outerRadius: 2.05, color: 'rgba(80, 68, 109, 0.18)',  tilt: 0.35 },
          ],
};

// ── 3. PLANET RENDERER ──────────────────────────────────────────────────────

class PlanetRenderer {
    constructor() {
        this.lightX   = 0.5;
        this.lightY   = -0.25;
        this.rotation = 0;
        this.map      = this._createInternalMap();
    }

    // ── Texture map ──────────────────────────────────────────────────────────

    _createInternalMap() {
        const canvas = document.createElement('canvas');
        canvas.width  = PHYSICS_CONFIG.TEXTURE_WIDTH;
        canvas.height = PHYSICS_CONFIG.TEXTURE_HEIGHT;
        const tctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;

        // 1. Base colour
        tctx.fillStyle = PLANET_TUNING.baseColor || '#1e2135';
        tctx.fillRect(0, 0, w, h);

        // 2. Bands — driven entirely by PLANET_TUNING
        const bandCount      = PLANET_TUNING.bandCount      ?? 12;
        const bandOpacityMin = PLANET_TUNING.bandOpacityMin ?? 0.05;
        const bandOpacityMax = PLANET_TUNING.bandOpacityMax ?? 0.20;

        for (let i = 0; i < bandCount; i++) {
            const y   = Math.random() * h;
            const bh  = 20 + Math.random() * 80;
            const op  = bandOpacityMin + Math.random() * (bandOpacityMax - bandOpacityMin);
            tctx.fillStyle = `rgba(0, 0, 0, ${op})`;
            tctx.fillRect(0, y, w, bh);
        }

        // 3. Grit
        const gritCount = PLANET_TUNING.gritCount ?? 5000;
        tctx.fillStyle  = `rgba(255, 255, 255, ${COSMETIC_CONFIG.GRIT_OPACITY})`;
        for (let i = 0; i < gritCount; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            tctx.fillRect(x, y, 1.5, 1.5);
            // wrap seam
            if (x < 50)       tctx.fillRect(x + w, y, 1.5, 1.5);
            if (x > w - 50)   tctx.fillRect(x - w, y, 1.5, 1.5);
        }

        // 4. Craters — loop over groups array, fall back to legacy flat props
        const craterGroups = PLANET_TUNING.craters ?? [{
            count:      PLANET_TUNING.craterCount ?? 150,
            minR:       PLANET_TUNING.craterMinR  ?? 5,
            maxR:       PLANET_TUNING.craterMaxR  ?? 45,
            color:      PLANET_TUNING.craterColor || 'rgba(0,0,0,0.4)',
            rimColor:   `rgba(255,255,255,${COSMETIC_CONFIG.CRATER_RIM_OPACITY})`,
            depthColor: 'rgba(0,0,0,0.4)',
        }];

        craterGroups.forEach(grp => {
            const count      = grp.count      ?? 80;
            const minR       = grp.minR       ?? 5;
            const maxR       = grp.maxR       ?? 40;
            const color      = grp.color      || 'rgba(0,0,0,0.4)';
            const rimColor   = grp.rimColor   || `rgba(255,255,255,${COSMETIC_CONFIG.CRATER_RIM_OPACITY})`;
            const depthColor = grp.depthColor || 'rgba(0,0,0,0.4)';

            // latBand: [minFrac, maxFrac] of texture height (0=top, 1=bottom)
            const yMin = grp.latBand ? grp.latBand[0] * h : 0;
            const yMax = grp.latBand ? grp.latBand[1] * h : h;

            for (let i = 0; i < count; i++) {
                const x  = Math.random() * w;
                const y  = yMin + Math.random() * (yMax - yMin);
                const cr = minR + Math.pow(Math.random(), 2) * (maxR - minR);

                [0, -w, w].forEach(offset => {
                    const cx = x + offset;

                    // Pit fill
                    tctx.fillStyle = color;
                    tctx.beginPath();
                    tctx.arc(cx, y, cr, 0, Math.PI * 2);
                    tctx.fill();

                    // Depth — inner radial shadow for 3-D bowl look
                    const depthGrad = tctx.createRadialGradient(cx, y, cr * 0.3, cx, y, cr);
                    depthGrad.addColorStop(0, 'transparent');
                    depthGrad.addColorStop(1, depthColor);
                    tctx.fillStyle = depthGrad;
                    tctx.beginPath();
                    tctx.arc(cx, y, cr, 0, Math.PI * 2);
                    tctx.fill();

                    // Rim highlight
                    tctx.strokeStyle = rimColor;
                    tctx.lineWidth   = Math.max(1, cr * 0.08);
                    tctx.beginPath();
                    tctx.arc(cx, y, cr * 0.92, 0, Math.PI * 2);
                    tctx.stroke();
                });
            }
        });

        return canvas;
    }

    // ── Main draw call ───────────────────────────────────────────────────────

    draw(ctx, canvasW, canvasH) {
        const r  = PHYSICS_CONFIG.BASE_RADIUS * (PLANET_TUNING.scale || 0.5);
        const px = canvasW  * (PLANET_TUNING.x || 0.75);
        const py = canvasH  * (PLANET_TUNING.y || 0.8);

        ctx.save();
        ctx.translate(px, py);

        const rings = PLANET_TUNING.rings || [];

        // 1. Back half of each ring (draws behind the planet)
        rings.forEach(rg => this._drawRingHalf(ctx, r, rg, 'back'));

        // 2. Full planet
        this._drawSphereBase(ctx, r);

        ctx.save();
        ctx.rotate(PLANET_TUNING.tilt || 0);
        this._drawSurfaceTexture(ctx, r);
        ctx.restore();

        this._drawShadowOverlay(ctx, r);
        this._drawAtmosphereGlow(ctx, r);

        // 3. Front half of each ring (draws in front of the planet)
        rings.forEach(rg => this._drawRingHalf(ctx, r, rg, 'front'));

        ctx.restore();
    }

    // ── Sphere base ──────────────────────────────────────────────────────────

    _drawSphereBase(ctx, r) {
        const lx   = r * this.lightX, ly = r * this.lightY;
        const grad = ctx.createRadialGradient(lx, ly, r * 0.1, 0, 0, r);
        grad.addColorStop(0, COSMETIC_CONFIG.SUN_HIGHLIGHT);
        grad.addColorStop(1, COSMETIC_CONFIG.DEEP_SPACE_DARK);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Surface texture ──────────────────────────────────────────────────────

    _drawSurfaceTexture(ctx, r) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.995, 0, Math.PI * 2);
        ctx.clip();

        const mapW    = this.map.width;
        const scrollX = (this.rotation % (Math.PI * 2)) * (mapW / (Math.PI * 2));
        const step    = (r * 2) / PHYSICS_CONFIG.SLICE_COUNT;

        for (let i = 0; i < PHYSICS_CONFIG.SLICE_COUNT; i++) {
            const sx     = -r + (i * step);
            const angle  = Math.asin(sx / r);
            const tx     = ((angle + Math.PI / 2) / Math.PI) * (mapW / 2) + scrollX;
            const safeTX = tx % (mapW - 1);

            ctx.drawImage(
                this.map,
                safeTX, 0, 1, this.map.height,
                sx, -r * (PHYSICS_CONFIG.MAP_STRETCH_MULT / 2),
                step + PHYSICS_CONFIG.SLICE_OVERLAP,
                r * PHYSICS_CONFIG.MAP_STRETCH_MULT
            );
        }
        ctx.restore();
    }

    // ── Shadow / terminator ───────────────────────────────────────────────────

    _drawShadowOverlay(ctx, r) {
        const ox   = r * this.lightX * 0.5, oy = r * this.lightY * 0.5;
        const grad = ctx.createRadialGradient(ox, oy, r * 0.1, ox, oy, r * 1.15);
        grad.addColorStop(0.3, 'transparent');
        grad.addColorStop(1, COSMETIC_CONFIG.TERMINATOR_SHADOW);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Atmosphere glow ───────────────────────────────────────────────────────

    _drawAtmosphereGlow(ctx, r) {
        const innerR = (PLANET_TUNING.atmosInnerRadius ?? COSMETIC_CONFIG.ATMOS_INNER_RADIUS);
        const outerR = (PLANET_TUNING.atmosOuterRadius ?? COSMETIC_CONFIG.ATMOS_OUTER_RADIUS);
        const grad   = ctx.createRadialGradient(0, 0, r * innerR, 0, 0, r * outerR);
        grad.addColorStop(0, PLANET_TUNING.atmosColor || 'rgba(100,150,255,0.22)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r * outerR, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Rings ─────────────────────────────────────────────────────────────────
    //
    //  Each ring object in PLANET_TUNING.rings:
    //  {
    //    innerRadius: 1.3,              // multiplier of planet radius
    //    outerRadius: 1.7,
    //    color: 'rgba(180,160,120,0.35)',
    //    tilt: 0.35,                    // radians
    //    scaleY: 0.28,                  // perspective squash (0.1 = edge-on, 0.5 = more face-on)
    //  }
    //
    //  The ring is split into back (π→2π) and front (0→π) halves so the
    //  planet naturally occludes the correct portion.

    _drawRingHalf(ctx, r, rg, half) {
        const innerR = r * (rg.innerRadius ?? 1.3);
        const outerR = r * (rg.outerRadius ?? 1.7);
        const tilt   = rg.tilt  ?? (PLANET_TUNING.tilt || 0);
        const scaleY = rg.scaleY ?? 0.28;

        // Which arc half?
        // "back"  = bottom of the ellipse = visually behind planet → π to 2π (going clockwise)
        // "front" = top of the ellipse    = visually in front      → 0 to π
        const startAngle = half === 'back' ? Math.PI : 0;
        const endAngle   = half === 'back' ? Math.PI * 2 : Math.PI;

        ctx.save();
        ctx.rotate(tilt);
        ctx.scale(1, scaleY);

        const grad = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
        grad.addColorStop(0,    'transparent');
        grad.addColorStop(0.15, rg.color || 'rgba(180,160,120,0.30)');
        grad.addColorStop(0.85, rg.color || 'rgba(180,160,120,0.30)');
        grad.addColorStop(1,    'transparent');

        ctx.fillStyle = grad;

        // Draw annulus arc for just this half
        ctx.beginPath();
        ctx.arc(0, 0, outerR, startAngle, endAngle);
        ctx.arc(0, 0, innerR, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}