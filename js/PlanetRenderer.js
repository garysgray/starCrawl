const PHYSICS_CONFIG = { BASE_RADIUS: 420, TEXTURE_WIDTH: 2400, TEXTURE_HEIGHT: 1000, SLICE_COUNT: 120, SLICE_OVERLAP: 0.5, MAP_STRETCH_MULT: 4 };
const COSMETIC_CONFIG = { GRIT_OPACITY: 0.05, CRATER_RIM_OPACITY: 0.1, SUN_HIGHLIGHT: '#7e8db5', DEEP_SPACE_DARK: '#0a0b14', TERMINATOR_SHADOW: '#000000', ATMOS_INNER_RADIUS: 0.9, ATMOS_OUTER_RADIUS: 1.05 };

class PlanetRenderer {
    constructor() {
        this.lightX = 0.5;
        this.lightY = -0.25;

        // Universal offscreen buffer caches
        this.bufferCanvas = document.createElement('canvas');
        this.bufferCtx = this.bufferCanvas.getContext('2d');

        // Precompute the heavy 120-iteration trigonometry loops exactly once
        this.sliceCache = [];
        const baseR = PHYSICS_CONFIG.BASE_RADIUS;
        const step = (baseR * 2) / PHYSICS_CONFIG.SLICE_COUNT;
        
        for (let i = 0; i < PHYSICS_CONFIG.SLICE_COUNT; i++) {
            const sx = -baseR + (i * step);
            const angle = Math.asin(sx / baseR); 
            const txOffset = ((angle + Math.PI / 2) / Math.PI) * (PHYSICS_CONFIG.TEXTURE_WIDTH / 2);
            this.sliceCache.push({ sx, txOffset, step });
        }
    }

    _generateTextureMap(planet) {
        const canvas = document.createElement('canvas');
        canvas.width = PHYSICS_CONFIG.TEXTURE_WIDTH;
        canvas.height = PHYSICS_CONFIG.TEXTURE_HEIGHT;
        const tctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;

        tctx.fillStyle = planet.baseColor;
        tctx.fillRect(0, 0, w, h);

        for (let i = 0; i < planet.bandCount; i++) {
            const y = Math.random() * h;
            const bh = 20 + Math.random() * 80;
            const op = planet.bandOpacityMin + Math.random() * (planet.bandOpacityMax - planet.bandOpacityMin);
            tctx.fillStyle = `rgba(0, 0, 0, ${op})`;
            tctx.fillRect(0, y, w, bh);
        }

        tctx.fillStyle = `rgba(255, 255, 255, ${COSMETIC_CONFIG.GRIT_OPACITY})`;
        for (let i = 0; i < planet.gritCount; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            tctx.fillRect(x, y, 1.5, 1.5);
            if (x < 50) tctx.fillRect(x + w, y, 1.5, 1.5);
            if (x > w - 50) tctx.fillRect(x - w, y, 1.5, 1.5);
        }

        const grps = planet.craters || [{ count: 150, minR: 5, maxR: 45, color: 'rgba(0,0,0,0.4)', rimColor: `rgba(255,255,255,${COSMETIC_CONFIG.CRATER_RIM_OPACITY})`, depthColor: 'rgba(0,0,0,0.4)' }];
        grps.forEach(grp => {
            const count = grp.count ?? 80;
            const minR = grp.minR ?? 5;
            const maxR = grp.maxR ?? 40;
            const color = grp.color || 'rgba(0,0,0,0.4)';
            const rimColor = grp.rimColor || `rgba(255,255,255,${COSMETIC_CONFIG.CRATER_RIM_OPACITY})`;
            const depthColor = grp.depthColor || 'rgba(0,0,0,0.4)';
            const yMin = grp.latBand ? grp.latBand[0] * h : 0;
            const yMax = grp.latBand ? grp.latBand[1] * h : h;

            for (let i = 0; i < count; i++) {
                const x = Math.random() * w;
                const y = yMin + Math.random() * (yMax - yMin);
                const cr = minR + Math.pow(Math.random(), 2) * (maxR - minR);

                [0, -w, w].forEach(offset => {
                    const cx = x + offset;
                    tctx.fillStyle = color;
                    tctx.beginPath();
                    tctx.arc(cx, y, cr, 0, Math.PI * 2);
                    tctx.fill();

                    const depthGrad = tctx.createRadialGradient(cx, y, cr * 0.3, cx, y, cr);
                    depthGrad.addColorStop(0, 'transparent');
                    depthGrad.addColorStop(1, depthColor);
                    tctx.fillStyle = depthGrad;
                    tctx.beginPath();
                    tctx.arc(cx, y, cr, 0, Math.PI * 2);
                    tctx.fill();

                    tctx.strokeStyle = rimColor;
                    tctx.lineWidth = Math.max(1, cr * 0.08);
                    tctx.beginPath();
                    tctx.arc(cx, y, cr * 0.92, 0, Math.PI * 2);
                    tctx.stroke();
                });
            }
        });
        return canvas;
    }

    draw(ctx, planet, canvasW, canvasH, alpha = 1.0) {
        // FIXED CELESTIAL METRIC BASELINE:
        // Anchors sizing against a standard 1280 design box multiplier.
        // This stops the gas giant from inflating into huge pixel bounds on desktop monitors!
        const layoutScale = canvasW / 1280;
        
        const r = PHYSICS_CONFIG.BASE_RADIUS * planet.scale * layoutScale;
        const px = canvasW * planet.x;
        const py = canvasH * planet.y;

        // PROOF STATEMENT MONITOR: Prints out structural values once every 120 ticks
        if (alpha === 0 || Math.random() < 0.01) {
            console.log(`🌍 CELESTIAL PROOF MONITOR:`);
            console.log(`   -> Active Frame Width Metric: ${canvasW}px`);
            console.log(`   -> Visual Layout Scale Factor Applied: ${layoutScale.toFixed(4)}`);
            console.log(`   -> Planet Positioning Profile: Center=[X:${px.toFixed(0)}px, Y:${py.toFixed(0)}px] | Physical Radius=${r.toFixed(1)}px`);
        }

        if (!planet.textureMap) {
            planet.textureMap = this._generateTextureMap(planet);
        }
        
        // Resize buffer canvas configuration dynamically to match current planet scale
        if (this.bufferCanvas.width !== Math.ceil(r * 2)) {
            this.bufferCanvas.width = Math.ceil(r * 2);
            this.bufferCanvas.height = Math.ceil(r * 2);
        }

        this.bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
        this.bufferCtx.save();
        this.bufferCtx.translate(r, r);

        // Scale global rendering sub-routines to match layout boundary ratios safely
        const scaledSliceCache = this.sliceCache.map(s => ({
            sx: s.sx * planet.scale * layoutScale,
            txOffset: s.txOffset,
            step: s.step * planet.scale * layoutScale
        }));

        this._drawSphereBase(this.bufferCtx, r);

        this.bufferCtx.save();
        this.bufferCtx.rotate(planet.tilt);
        this._drawSurfaceTexture(this.bufferCtx, r, planet, scaledSliceCache, alpha);
        this.bufferCtx.restore();

        this._drawShadowOverlay(this.bufferCtx, r);
        this._drawAtmosphereGlow(this.bufferCtx, r, planet);
        this.bufferCtx.restore();

        // Draw composite components directly to main canvas context
        ctx.save();
        ctx.translate(px, py);

        planet.rings.forEach(rg => this._drawRingHalf(ctx, r, planet, rg, 'back'));
        ctx.drawImage(this.bufferCanvas, -r, -r);
        planet.rings.forEach(rg => this._drawRingHalf(ctx, r, planet, rg, 'front'));

        ctx.restore();
    }

    _drawSphereBase(ctx, r) {
        const lx = r * this.lightX, ly = r * this.lightY;
        const grad = ctx.createRadialGradient(lx, ly, r * 0.1, 0, 0, r);
        grad.addColorStop(0, COSMETIC_CONFIG.SUN_HIGHLIGHT);
        grad.addColorStop(1, COSMETIC_CONFIG.DEEP_SPACE_DARK);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawSurfaceTexture(ctx, r, planet, scaledSlices, alpha) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.995, 0, Math.PI * 2);
        ctx.clip();

        const mapW = planet.textureMap.width;
        // Interpolate physics state frame changes using alpha tracking bridge
        const currentRot = planet.rotation + (planet.spinSpeed * alpha);
        const scrollX = (currentRot % (Math.PI * 2)) * (mapW / (Math.PI * 2));

        for (let i = 0; i < scaledSlices.length; i++) {
            const slice = scaledSlices[i];
            const safeTX = (slice.txOffset + scrollX) % (mapW - 1);

            ctx.drawImage(
                planet.textureMap,
                safeTX, 0, 1, planet.textureMap.height,
                slice.sx, -r * (PHYSICS_CONFIG.MAP_STRETCH_MULT / 2),
                slice.step + PHYSICS_CONFIG.SLICE_OVERLAP,
                r * PHYSICS_CONFIG.MAP_STRETCH_MULT
            );
        }
        ctx.restore();
    }

    _drawShadowOverlay(ctx, r) {
        const ox = r * this.lightX * 0.5, oy = r * this.lightY * 0.5;
        const grad = ctx.createRadialGradient(ox, oy, r * 0.1, ox, oy, r * 1.15);
        grad.addColorStop(0.3, 'transparent');
        grad.addColorStop(1, COSMETIC_CONFIG.TERMINATOR_SHADOW);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
    }
    _drawAtmosphereGlow(ctx, r, planet) {
        const innerR = (planet.atmosInnerRadius ?? COSMETIC_CONFIG.ATMOS_INNER_RADIUS);
        const outerR = (planet.atmosOuterRadius ?? COSMETIC_CONFIG.ATMOS_OUTER_RADIUS);
        const grad = ctx.createRadialGradient(0, 0, r * innerR, 0, 0, r * outerR);
        grad.addColorStop(0, planet.atmosColor);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r * outerR, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawRingHalf(ctx, r, planet, rg, half) {
        const innerR = r * (rg.innerRadius ?? 1.3);
        const outerR = r * (rg.outerRadius ?? 1.7);
        const tilt = rg.tilt ?? planet.tilt;
        const scaleY = rg.scaleY ?? 0.28;

        const startAngle = half === 'back' ? Math.PI : 0;
        const endAngle = half === 'back' ? Math.PI * 2 : Math.PI;

        ctx.save();
        ctx.rotate(tilt);
        ctx.scale(1, scaleY);

        const grad = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.15, rg.color);
        grad.addColorStop(0.85, rg.color);
        grad.addColorStop(1, 'transparent');

        ctx.strokeStyle = grad;
        ctx.lineWidth = outerR - innerR;
        ctx.beginPath();
        ctx.arc(0, 0, (innerR + outerR) / 2, startAngle, endAngle);
        ctx.stroke();
        ctx.restore();
    }
}
