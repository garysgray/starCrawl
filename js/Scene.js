// ── Scene ─────────────────────────────────────────────────────
// Owns everything visual and temporal — stars, ships, crawl, cues.
// Controller owns infrastructure (audio, hud). Scene owns the experience.

const timerModes = {
  COUNTDOWN: "countdown", 
  COUNTUP: "countup" 
};

class Scene {
  constructor(audio) {
    this.stars = new StarField();
    this.crawl = new Crawl(audio);
    this.ships = [];

    // 1. Pick your catalog target item securely
    const selectedBlueprint = CELESTIAL_CATALOG.gasGiantAlpha; // Switch to gasGiantAlpha to load the blue planet!
    
    // 2. DYNAMIC CELESTIAL FACTORY LOOKUP: Spawns the explicit subclass matching your object token
    let activeSpaceObject;
    if (selectedBlueprint && selectedBlueprint.objectType === 'station') {
        activeSpaceObject = new SpaceStationEntity(selectedBlueprint);
    } else {
        activeSpaceObject = new PlanetEntity(selectedBlueprint || CELESTIAL_CATALOG.gasGiantAlpha);
    }

    // UNIFIED UNIVERSE REFACTOR: Replaced planets array with generic space object tracker array
    this.backgroundObjects = [ activeSpaceObject ];

    this.canvas = document.getElementById('ships');
    this.ctx = this.canvas.getContext('2d');
    this.renderer = new ShipRenderer();

    // UNIFIED UNIVERSE REFACTOR: Purged planet DOM tags and updated variables to matching SpaceObject tokens
    this.spaceObjCanvas = document.getElementById('space-object');
    this.spaceObjCtx    = this.spaceObjCanvas.getContext('2d');
    this.spaceObjRenderer = new SpaceObjectRenderer();

    // Spawn timer — initial delay before first ship
    this.spawnTimer = new Timer('ShipSpawner', 5, timerModes.COUNTDOWN, false);
    this.spawnTimer.start();

    this._resize();
    window.addEventListener('resize', () => 
    {
      // 1. Scene updates its internal canvas pixel resolutions first
      this._resize();
      
      // 2. BROADCAST SIGNAL: Call the crawl engine's individual bounds calculator
      if (this.crawl && typeof this.crawl.recalculateBounds === 'function') 
      {
        this.crawl.recalculateBounds();
      }
    });
  }

  // ---- Setup ----------------------------------------------------------------
  _resize()
  {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // FIX ALIGNMENT: Force canvas size to match the real browser window edge-to-edge
    this.canvas.width            = w;
    this.canvas.height           = h;
    
    // UNIFIED UNIVERSE REFACTOR: Realigned width/height bindings to spaceObj tokens
    this.spaceObjCanvas.width    = w;
    this.spaceObjCanvas.height   = h;

    // CANVAS BOUND DIAGNOSTIC: Tracks exactly how your canvas boundaries overlay your screen
    const shipsCanvas = document.getElementById('ships');
    if (shipsCanvas) {
        const rect = shipsCanvas.getBoundingClientRect();
        console.log(`📊 CANVAS BOUND DIAGNOSTIC:`);
        console.log(`   -> Browser Window: Width=${w}px, Height=${h}px`);
        console.log(`   -> Canvas Layout Element: Left=${rect.left}px, Top=${rect.top}px, Width=${rect.width}px, Height=${rect.height}px`);
    }
  }

  // ---- Spawning -------------------------------------------------------------
  _getInterval()
  {
    return window.innerWidth >= CONFIG.shipInterval.breakpoint
      ? CONFIG.shipInterval.wide
      : CONFIG.shipInterval.narrow;
  }

  _spawnShip()
  {
    const totalInFleet = this.ships.length;

    if (totalInFleet > 0) {
      return;
    }

    const targetConfig = SHIP_CATALOG.starDestroyerClass;
    if (targetConfig) {
      const newShip = new Ship(targetConfig);
      newShip.hasEnteredViewLog = false; 
      this.ships.push(newShip);
      console.log(`🚀 SHIP SPAWNED! Active Fleet Size: ${this.ships.length} | Initial Position: Y=${newShip.yPct}%`);
    }
  }

  _handleSpawnTick()
  {
    const nextDelaySec = this._getInterval() / 1000;
    this.spawnTimer.setAndStart(nextDelaySec);
    this._spawnShip();
  }

  // ---- Loop -----------------------------------------------------------------
  update(dt)
  {
    this.stars.update(dt);
    this.crawl.update(dt);

    if (this.spawnTimer.update(dt)) this._handleSpawnTick();

    // UNIFIED UNIVERSE REFACTOR: Progress updates over generic backgroundObjects loop
    this.backgroundObjects.forEach(obj => obj.update(dt));

    for (let i = this.ships.length - 1; i >= 0; i--)
    {
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

  // Accepts the sub-frame timing 'alpha' fraction from the controller
  draw(alpha) {
    this.stars.draw(alpha);
    this._drawBackgroundEntities(alpha); // UNIFIED UNIVERSE REFACTOR: Call renamed visual rendering loop
    this._drawShips(alpha);
    this.crawl.draw(alpha);
  }

  // UNIFIED UNIVERSE REFACTOR: Consolidated drawing sweep over background space entities
  _drawBackgroundEntities(alpha) {
    const ctx = this.spaceObjCtx;
    const w = this.spaceObjCanvas.width;
    const h = this.spaceObjCanvas.height;

    ctx.clearRect(0, 0, w, h);
    
    // Iterates cleanly over whatever combination of subclasses occupy your background tracker
    this.backgroundObjects.forEach(obj => {
      this.spaceObjRenderer.draw(ctx, obj, w, h, alpha);
    });
  }

  _drawShips(alpha)
  {
    const { ctx, canvas } = this;
    const w = canvas.width;  
    const h = canvas.height; 

    ctx.clearRect(0, 0, w, h);
    
    const SHIP_BASE_H = 900;
    const PCT_DIVISOR = 100;
    const fixedTimestep = CONFIG.System.FIXED_TIMESTEP;

    for (let i = 0; i < this.ships.length; i++)
    {
      const s = this.ships[i];
      
      const screenScaleY = SHIP_BASE_H / h;
      
      const interpolatedYPct = s.yPct - (s.speed * alpha * fixedTimestep * 60 * screenScaleY);
      const interpolatedXPct = s.xPct + (s.driftX * alpha * fixedTimestep * 60);

      const drawX = (interpolatedXPct / PCT_DIVISOR) * w;
      const drawY = (interpolatedYPct / PCT_DIVISOR) * h;
      
      const finalScale = s.getScale(w, null);

      ctx.save();
      ctx.translate(drawX, drawY);
      
      ctx.scale(1, s.flattenY);
      ctx.rotate(Math.PI * s.rotation);
      ctx.scale(finalScale, finalScale);
      
      ctx.globalAlpha = s.alpha;

      if (alpha === 0 || Math.random() < 0.01) { 
          const currentTransform = ctx.getTransform();
          const calculatedSkew = (currentTransform.b + currentTransform.c).toFixed(4);
          console.log(`📐 ENGINE DIAGNOSTIC PROOF:`);
          console.log(`   -> Position: X=${drawX.toFixed(0)}px, Y=${drawY.toFixed(0)}px`);
          console.log(`   -> Real-Time Skew Factor: ${calculatedSkew} (Must equal 0.0000 for normal proportions)`);
      }

      this.renderer.draw(ctx);
      ctx.restore();
    }
  }
}
