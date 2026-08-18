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

    draw(ctx, spaceObject, canvasW, canvasH, alpha = 1.0) {
        // FIXED MULTI-DEVICE SCALE FILTER
        const rawScale = canvasW / 1280;
        const layoutScale = Math.max(0.65, rawScale);
        
        const r = PHYSICS_CONFIG.BASE_RADIUS * spaceObject.scale * layoutScale;
        const px = canvasW * spaceObject.x;
        const py = canvasH * spaceObject.y;

        // if (alpha === 0 || Math.random() < 0.01) {
        //     console.log(`🌍 SPACE OBJECT PROOF MONITOR:`);
        //     console.log(`   -> Active Entity Render Type: ${spaceObject.type.toUpperCase()}`);
        //     console.log(`   -> Frame Dimensions: Width=${canvasW}px, Height=${canvasH}px`);
        //     console.log(`   -> Layout Multiplier: ${layoutScale.toFixed(4)}`);
        //     console.log(`   -> Positioning Vector: Center=[X:${px.toFixed(0)}px, Y:${py.toFixed(0)}px] | Radius=${r.toFixed(1)}px`);
        //}

        // SELF-RENDERING HANDSHAKE:
        // Instead of the renderer guessing how to draw the skin, it asks the 
        // space object entity to generate its own custom procedural canvas texture!
        if (!spaceObject.textureMap) {
            spaceObject.textureMap = spaceObject.generateTexture(
                PHYSICS_CONFIG.TEXTURE_WIDTH, 
                PHYSICS_CONFIG.TEXTURE_HEIGHT, 
                COSMETIC_CONFIG
            );
        }
        
        if (this.bufferCanvas.width !== Math.ceil(r * 2)) {
            this.bufferCanvas.width = Math.ceil(r * 2);
            this.bufferCanvas.height = Math.ceil(r * 2);

            // Forces the browser to run high-quality bilinear filtering on 1px column slice steps
            this.bufferCtx.imageSmoothingEnabled = true;
            this.bufferCtx.imageSmoothingQuality = 'high';
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
        // 👇 FIX: Read directly from the individual class configuration instance
        const maxOpacity = spaceObject.rimOpacity;
        
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
