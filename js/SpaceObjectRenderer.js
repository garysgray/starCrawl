const PHYSICS_CONFIG = { BASE_RADIUS: 420, TEXTURE_WIDTH: 2400, TEXTURE_HEIGHT: 1000, SLICE_COUNT: 120, SLICE_OVERLAP: 0.5, MAP_STRETCH_MULT: 4 };
const COSMETIC_CONFIG = { GRIT_OPACITY: 0.05, CRATER_RIM_OPACITY: 0.1, SUN_HIGHLIGHT: '#7e8db5', DEEP_SPACE_DARK: '#0a0b14', TERMINATOR_SHADOW: '#000000', ATMOS_INNER_RADIUS: 0.9, ATMOS_OUTER_RADIUS: 1.05 };

class SpaceObjectRenderer {
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

        _generateTextureMap(spaceObject) {
        const canvas = document.createElement('canvas');
        canvas.width = PHYSICS_CONFIG.TEXTURE_WIDTH;
        canvas.height = PHYSICS_CONFIG.TEXTURE_HEIGHT;
        const tctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;

        tctx.fillStyle = spaceObject.baseColor;
        tctx.fillRect(0, 0, w, h);

        // ─────────────────────────────────────────────────────────────────────
        // 🛰️ STATION GENERATOR BLOCK (Zero randomness, locked structure)
        // ─────────────────────────────────────────────────────────────────────
        if (spaceObject.type === 'station') {
            // Draw exactly 4 subtle, faint structural panel lines in each hemisphere
            tctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
            tctx.lineWidth = 1.5;
            
            // Northern Hemisphere Lines
            const northGaps = [h * 0.12, h * 0.22, h * 0.32, h * 0.42];
            northGaps.forEach(y => {
                tctx.beginPath(); tctx.moveTo(0, y); tctx.lineTo(w, y); tctx.stroke();
            });

            // Southern Hemisphere Lines
            const southGaps = [h * 0.58, h * 0.68, h * 0.78, h * 0.88];
            southGaps.forEach(y => {
                tctx.beginPath(); tctx.moveTo(0, y); tctx.lineTo(w, y); tctx.stroke();
            });

            // Draw the thick, dominant equatorial centerline trench belt
            tctx.fillStyle = 'rgba(10, 11, 14, 0.98)';
            tctx.fillRect(0, (h / 2) - 10, w, 20);
            
            tctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            tctx.lineWidth = 1;
            tctx.beginPath();
            tctx.moveTo(0, h / 2); tctx.lineTo(w, h / 2);
            tctx.stroke();

            // Inject fine micro-greebles and window illumination panels away from the trench
            tctx.fillStyle = `rgba(255, 255, 255, 0.05)`;
            for (let i = 0; i < 250; i++) {
                const x = (i * 31) % w;
                const y = (i * 47) % h;
                if (Math.abs(y - h/2) > 30) { 
                    tctx.fillRect(x, y, 1.5, 1.5);
                }
            }

            /* 
              ANAMORPHIC DISH CALIBRATION:
              - dishX (w * 0.165): Pulls it back left, centering it in the upper-left quadrant.
              - dishY (h * 0.35): Centers it vertically in the top hemisphere, away from the top pole.
              - rX / rY: Using 110px width vs 78px height counteracts the 3D wrapping compression,
                forcing it into a visually immaculate round circle on your screen layout!
            */
            const dishX = w * 0.190; 
            const dishY = h * 0.40;
            const rX = 96; 
            const rY = 68;

            [0, -w, w].forEach(offset => {
                const cx = dishX + offset;
                
                tctx.fillStyle = '#2a2e36';
                tctx.beginPath();
                tctx.ellipse(cx, dishY, rX, rY, 0, 0, Math.PI * 2);
                tctx.fill();

                // Parabolic sunken shadow mapping gradient matching the ellipse dimensions
                const depthGrad = tctx.createRadialGradient(cx, dishY, rY * 0.15, cx, dishY, rX);
                depthGrad.addColorStop(0, 'rgba(12, 14, 18, 0.1)');
                depthGrad.addColorStop(0.7, 'rgba(10, 12, 15, 0.65)');
                depthGrad.addColorStop(1, 'rgba(4, 5, 6, 0.95)');
                tctx.fillStyle = depthGrad;
                tctx.beginPath();
                tctx.ellipse(cx, dishY, rX, rY, 0, 0, Math.PI * 2);
                tctx.fill();

                // Perimeter bezel casing outer rim highlight
                tctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
                tctx.lineWidth = 4;
                tctx.beginPath();
                tctx.ellipse(cx, dishY, rX * 0.95, rY * 0.95, 0, 0, Math.PI * 2);
                tctx.stroke();
                
                // Focal focus crystal emitter node point (offset slightly for 3D depth)
                tctx.fillStyle = '#16191e';
                tctx.beginPath();
                tctx.ellipse(cx - 8, dishY - 3, rX * 0.14, rY * 0.14, 0, 0, Math.PI * 2);
                tctx.fill();
            });
        } 
                // ─────────────────────────────────────────────────────────────────────
        // 🪐 ORIGINAL PLANET GENERATOR BLOCK (Maintains random organic gas bands)
        // ─────────────────────────────────────────────────────────────────────
        else {
            for (let i = 0; i < spaceObject.bandCount; i++) {
                const y = Math.random() * h;
                const bh = 20 + Math.random() * 80;
                const op = spaceObject.bandOpacityMin + Math.random() * (spaceObject.bandOpacityMax - spaceObject.bandOpacityMin);
                tctx.fillStyle = `rgba(0, 0, 0, ${op})`;
                tctx.fillRect(0, y, w, bh);
            }

            tctx.fillStyle = `rgba(255, 255, 255, ${COSMETIC_CONFIG.GRIT_OPACITY})`;
            for (let i = 0; i < spaceObject.gritCount; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h;
                tctx.fillRect(x, y, 1.5, 1.5);
                if (x < 50) tctx.fillRect(x + w, y, 1.5, 1.5);
                if (x > w - 50) tctx.fillRect(x - w, y, 1.5, 1.5);
            }

            const grps = spaceObject.craters || [];
            grps.forEach(grp => {
                const count = grp.count ?? 80;
                const minR = grp.minR ?? 5;
                const maxR = grp.maxR ?? 40;
                const color = grp.color || 'rgba(0,0,0,0.4)';
                const rimColor = grp.rimColor || `rgba(255,255,255,${COSMETIC_CONFIG.CRATER_RIM_OPACITY})`;
                const depthColor = grp.depthColor || 'rgba(0,0,0,0.4)';
                
                const yMin = (grp.latBand && Array.isArray(grp.latBand)) ? grp.latBand[0] * h : 0;
                const yMax = (grp.latBand && Array.isArray(grp.latBand)) ? grp.latBand[1] * h : h;

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
        }
        return canvas;
    }

    draw(ctx, spaceObject, canvasW, canvasH, alpha = 1.0) 
    {
        // FIXED MULTI-DEVICE SCALE FILTER:
        // By clamping layoutScale using Math.max(), we ensure that even if the 
        // screen shrinks down to a tiny 320px mobile viewport, the object footprint 
        // refuses to drop below a beautiful 0.65 scale multiplier threshold!
        const rawScale = canvasW / 1280;
        const layoutScale = Math.max(0.65, rawScale);
        
        const r = PHYSICS_CONFIG.BASE_RADIUS * spaceObject.scale * layoutScale;
        const px = canvasW * spaceObject.x;
        const py = canvasH * spaceObject.y;

        if (alpha === 0 || Math.random() < 0.01) {
            console.log(`🌍 SPACE OBJECT PROOF MONITOR:`);
            console.log(`   -> Active Entity Render Type: ${spaceObject.type.toUpperCase()}`);
            console.log(`   -> Frame Dimensions: Width=${canvasW}px, Height=${canvasH}px`);
            console.log(`   -> Layout Multiplier: ${layoutScale.toFixed(4)}`);
            console.log(`   -> Positioning Vector: Center=[X:${px.toFixed(0)}px, Y:${py.toFixed(0)}px] | Radius=${r.toFixed(1)}px`);
        }

        if (!spaceObject.textureMap) {
            spaceObject.textureMap = this._generateTextureMap(spaceObject);
        }
        
        if (this.bufferCanvas.width !== Math.ceil(r * 2)) {
            this.bufferCanvas.width = Math.ceil(r * 2);
            this.bufferCanvas.height = Math.ceil(r * 2);
        }

        this.bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
        this.bufferCtx.save();
        this.bufferCtx.translate(r, r);

        const scaledSliceCache = this.sliceCache.map(s => ({
            sx: s.sx * spaceObject.scale * layoutScale,
            txOffset: s.txOffset,
            step: s.step * spaceObject.scale * layoutScale
        }));

        this._drawSphereBase(this.bufferCtx, r);

        this.bufferCtx.save();
        this.bufferCtx.rotate(spaceObject.tilt);
        this._drawSurfaceTexture(this.bufferCtx, r, spaceObject, scaledSliceCache, alpha);
        this.bufferCtx.restore();

        this._drawShadowOverlay(this.bufferCtx, r, spaceObject.type);
        this._drawAtmosphereGlow(this.bufferCtx, r, spaceObject);
        this.bufferCtx.restore();

        ctx.save();
        ctx.translate(px, py);

        if (spaceObject.rings && spaceObject.rings.length > 0) {
            spaceObject.rings.forEach(rg => this._drawRingHalf(ctx, r, spaceObject, rg, 'back'));
        }
        
        ctx.drawImage(this.bufferCanvas, -r, -r);
        
        if (spaceObject.rings && spaceObject.rings.length > 0) {
            spaceObject.rings.forEach(rg => this._drawRingHalf(ctx, r, spaceObject, rg, 'front'));
        }

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

    _drawSurfaceTexture(ctx, r, spaceObject, scaledSlices, alpha) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.995, 0, Math.PI * 2);
        ctx.clip();

        const mapW = spaceObject.textureMap.width;
        const currentRot = spaceObject.rotation + (spaceObject.spinSpeed * alpha);
        
        // STRAIGHTEN THE LINES FOR THE STATION:
        // Force scrollX to 0 if the entity is an artificial station structure. 
        // This flattens the sphere mapping, causing panel lines to draw straight 
        // and keeping the superlaser weapon dish locked onto the front face!
        const scrollX = (spaceObject.type === 'station') 
            ? 0 
            : (currentRot % (Math.PI * 2)) * (mapW / (Math.PI * 2));

        for (let i = 0; i < scaledSlices.length; i++) {
            const slice = scaledSlices[i];
            const safeTX = (slice.txOffset + scrollX) % (mapW - 1);

            ctx.drawImage(
                spaceObject.textureMap,
                safeTX, 0, 1, spaceObject.textureMap.height,
                slice.sx, -r * (PHYSICS_CONFIG.MAP_STRETCH_MULT / 2),
                slice.step + PHYSICS_CONFIG.SLICE_OVERLAP,
                r * PHYSICS_CONFIG.MAP_STRETCH_MULT
            );
        }
        ctx.restore();
    }

        _drawShadowOverlay(ctx, r, objectType) {
        const ox = r * this.lightX * 0.5, oy = r * this.lightY * 0.5;
        const grad = ctx.createRadialGradient(ox, oy, r * 0.1, ox, oy, r * 1.15);
        
        // CINEMATIC TERMINATOR SHADOW FOR THE STATION:
        // By pushing the opacity stop to 0.98, the dark side falls off aggressively 
        // into near-total blackness, creating a high-contrast blend with background space!
        if (objectType === 'station') {
            grad.addColorStop(0.15, 'transparent');
            grad.addColorStop(0.70, 'rgba(0, 0, 0, 0.82)');
            grad.addColorStop(1, 'rgba(3, 4, 6, 0.98)');
        } else {
            grad.addColorStop(0.3, 'transparent');
            grad.addColorStop(1, COSMETIC_CONFIG.TERMINATOR_SHADOW);
        }
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
    }


        _drawAtmosphereGlow(ctx, r, spaceObject) {
        // STATION ATTENUATION: Mechanical space stations do not have thick, bright gas atmospheres.
        // We drop its opacity scale down to a faint silhouette wrap so it matches your dark reference image!
        const maxOpacity = (spaceObject.type === 'station') ? 0.08 : 0.28;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // 1. Inner limb atmospheric soft gradient wrap
        const innerGrad = ctx.createRadialGradient(0, 0, r * COSMETIC_CONFIG.ATMOS_INNER_RADIUS, 0, 0, r);
        innerGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        innerGrad.addColorStop(0.5, spaceObject.atmosColor.replace(/[\d.]+\)$/, `${maxOpacity * 0.4})`));
        innerGrad.addColorStop(1, spaceObject.atmosColor.replace(/[\d.]+\)$/, `${maxOpacity})`));
        
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // 2. Outer scattering exosphere glow bloom filter
        const outerGrad = ctx.createRadialGradient(0, 0, r, 0, 0, r * COSMETIC_CONFIG.ATMOS_OUTER_RADIUS);
        outerGrad.addColorStop(0, spaceObject.atmosColor.replace(/[\d.]+\)$/, `${maxOpacity})`));
        outerGrad.addColorStop(0.4, spaceObject.atmosColor.replace(/[\d.]+\)$/, `${maxOpacity * 0.3})`));
        outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = outerGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r * COSMETIC_CONFIG.ATMOS_OUTER_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

        _drawRingHalf(ctx, r, spaceObject, rg, layer) {
        // Validation check: Artificial station types skip planetary space dust systems entirely
        if (!rg || spaceObject.type === 'station') return;

        const innerR = r * rg.innerRadius;
        const outerR = r * rg.outerRadius;
        
        ctx.save();
        
        // Match drawing angles cleanly to the ring object configuration pitch
        ctx.rotate(rg.tilt);
        
        // Scale the canvas vertical Y-axis down to compress the circles into 3D ellipses
        ctx.scale(1, 0.28); 

        // Set up the layer clipping coordinates to handle depth perspective
        // Front layers clip below the equator; back layers clip above the equator
        ctx.beginPath();
        if (layer === 'front') {
            ctx.rect(-outerR - 10, 0, (outerR * 2) + 20, outerR + 10);
        } else {
            ctx.rect(-outerR - 10, -outerR - 10, (outerR * 2) + 20, outerR + 10);
        }
        ctx.clip();

        // Render the concentric ring geometry with custom linear texturing
        const ringGrad = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
        ringGrad.addColorStop(0, 'rgba(0,0,0,0)');
        ringGrad.addColorStop(0.1, rg.color);
        ringGrad.addColorStop(0.5, rg.color.replace(/[\d.]+\)$/, '0.08)'));
        ringGrad.addColorStop(0.8, rg.color);
        ringGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.strokeStyle = ringGrad;
        ctx.lineWidth = outerR - innerR;
        
        ctx.beginPath();
        ctx.arc(0, 0, innerR + (ctx.lineWidth / 2), 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

}
