// ── Scene.js ───────────────────────────────────────────────────
// Owns the visual simulation components: stars, background objects, ships, crawl.
// Driven directly by the SpaceDirector lifecycle clock.

class Scene {
  constructor(audio) {
    this.stars = new StarField();
    this.crawl = new Crawl(audio);
    this.ships = [];

    // Factory picks the correct subclass blueprint from the Celestial Catalog
    const selectedBlueprint = CELESTIAL_CATALOG.deathStarAlpha;
    
    let activeSpaceObject;
    if (selectedBlueprint && selectedBlueprint.objectType === 'station') {
        activeSpaceObject = new SpaceStationEntity(selectedBlueprint);
    } else {
        activeSpaceObject = new PlanetEntity(selectedBlueprint || CELESTIAL_CATALOG.gasGiantAlpha);
    }

    // Tracker array for background celestial entities
    this.backgroundObjects = [ activeSpaceObject ];

    // Viewport Canvases Initialization
    this.canvas = document.getElementById('ships');
    this.ctx = this.canvas.getContext('2d');
    this.renderer = new ShipRenderer();

    this.spaceObjCanvas = document.getElementById('space-object');
    this.spaceObjCtx    = this.spaceObjCanvas.getContext('2d');
    this.spaceObjRenderer = new SpaceObjectRenderer();

    // Central Space Director hooks into the experience
    this.director = new SpaceDirector(audio, this);
    this.director.changeSimulationMode('med');

    this._resize();
    window.addEventListener('resize', () => {
      this._resize();
      if (this.crawl && typeof this.crawl.recalculateBounds === 'function') {
        this.crawl.recalculateBounds();
      }
      if (this.director && typeof this.director.recalibrateOnResize === 'function') {
        this.director.recalibrateOnResize();
      }
    });
  }

  // ---- Setup & Viewport Bounds ----------------------------------------------
  _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width            = w;
    this.canvas.height           = h;
    this.spaceObjCanvas.width    = w;
    this.spaceObjCanvas.height   = h;

    if (Math.random() < 0.01) {
        console.log(`📊 CANVAS BOUND DIAGNOSTIC: Width=${w}px | Height=${h}px`);
    }
  }

  // ── DETACHED TIME-SYNCHRONIZED SPAWNER ────────────────────────────────────
  // Listens strictly to your true config file defaults! No more forced adjustments.
  triggerPrecisionSpawn(deltaOvershoot, calculatedVelocity) {
    const totalInFleet = this.ships.length;
    if (totalInFleet > 0) return;

    // Instantiates ship using your exact, pristine SceneConfig data layout
    const newShip = new Ship(CONFIG.shipTuning); 
    newShip.hasEnteredViewLog = false;
    
    // Honor your exact spawnY configuration value (e.g. 1000) perfectly
    if (CONFIG.shipTuning && CONFIG.shipTuning.spawnY !== undefined) {
        newShip.yPct = CONFIG.shipTuning.spawnY; 
    }

    const screenHeight = this.canvas.height || window.innerHeight;
    
    // Map the time-calibrated physics step speed vector from the SpaceDirector
    if (calculatedVelocity !== undefined) {
        newShip.speed = ((calculatedVelocity / screenHeight) * 100) / 60;
    }
    
    // Process standard delta sub-frame offsets cleanly
    const fixedTimestep = (CONFIG.System && CONFIG.System.FIXED_TIMESTEP) 
        ? CONFIG.System.FIXED_TIMESTEP 
        : 1 / 60;
        
    const initialOffset = (newShip.speed * deltaOvershoot * fixedTimestep * 60);
    newShip.yPct -= initialOffset;

    this.ships.push(newShip);
  }

  // ---- Loop Core ------------------------------------------------------------
  update(dt) {
    this.stars.update(dt);
    this.crawl.update(dt);
    this.director.update(dt);

    // Progress background object states
    this.backgroundObjects.forEach(obj => obj.update(dt));

    // Update fleet positions
    for (let i = this.ships.length - 1; i >= 0; i--) {
      const s = this.ships[i];
      s.update(null, dt);

      if (!s.hasEnteredViewLog && s.yPct <= 100 && s.yPct >= 0) {
        s.hasEnteredViewLog = true;
      }

      if (s.isDead()) {
        this.ships.splice(i, 1);
        console.log(`💀 SHIP REMOVED. Fleet size: ${this.ships.length}`);
      }
    }
  }

  draw(alpha) {
    this.stars.draw(alpha);
    this._drawBackgroundEntities(alpha); 
    this._drawShips(alpha);
    this.crawl.draw(alpha);
  }

  _drawBackgroundEntities(alpha) {
    const ctx = this.spaceObjCtx;
    const w = this.spaceObjCanvas.width;
    const h = this.spaceObjCanvas.height;

    ctx.clearRect(0, 0, w, h);
    this.backgroundObjects.forEach(obj => {
      this.spaceObjRenderer.draw(ctx, obj, w, h, alpha);
    });
  }

  _drawShips(alpha) {
    const { ctx, canvas } = this;
    const w = canvas.width;  
    const h = canvas.height; 

    ctx.clearRect(0, 0, w, h);
    
    const PCT_DIVISOR = 100;
    const fixedTimestep = CONFIG.System.FIXED_TIMESTEP || 0.0166;

    for (let i = 0; i < this.ships.length; i++) {
      const s = this.ships[i];
      
      // RESTORED: Standard subtraction syntax matching baseline engine behaviors
      const interpolatedYPct = s.yPct - (s.speed * alpha * fixedTimestep * 60);
      const interpolatedXPct = s.xPct + (s.driftX * alpha * fixedTimestep * 60);

      const drawX = (interpolatedXPct / PCT_DIVISOR) * w;
      const drawY = (interpolatedYPct / PCT_DIVISOR) * h;
      
      if (Math.random() < 0.01 || alpha === 0) { 
          console.log(`✈️ STARSHIP CONSOLE READOUT: X=${s.xPct.toFixed(1)}% | Y=${s.yPct.toFixed(1)}% | Pixel DrawY=${drawY.toFixed(0)}px`);
      }

      const finalScale = s.getScale(w, null);

      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.scale(1, s.flattenY);
      ctx.rotate(Math.PI * s.rotation);
      ctx.scale(finalScale, finalScale);
      ctx.globalAlpha = s.alpha;

      this.renderer.draw(ctx);
      ctx.restore();
    }
  }
}
