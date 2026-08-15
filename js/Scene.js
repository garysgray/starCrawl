// ── Scene ─────────────────────────────────────────────────────
// Owns everything visual and temporal — stars, ships, crawl, cues.
// Controller owns infrastructure (audio, hud). Scene owns the experience.
const timerModes = 
{
     COUNTDOWN: "countdown", 
     COUNTUP: "countup" 
};

class Scene
{
  constructor(audio)
  {
    this.stars  = new StarField();
    this.crawl  = new Crawl(audio);
    this.ships  = [];

    this.canvas = document.getElementById('ships');
    this.ctx    = this.canvas.getContext('2d');
    this.renderer = new ShipRenderer();

    this.planetCanvas   = document.getElementById('planet');
    this.planetCtx      = this.planetCanvas.getContext('2d');
    this.planetRenderer = new PlanetRenderer();

    // Spawn timer — initial delay before first ship
    this.spawnTimer = new Timer('ShipSpawner', 5, timerModes.COUNTDOWN, false);
    this.spawnTimer.start();

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  // ---- Setup ----------------------------------------------------------------
  _resize()
  {
    this.canvas.width        = window.innerWidth;
    this.canvas.height       = window.innerHeight;
    this.planetCanvas.width  = window.innerWidth;
    this.planetCanvas.height = window.innerHeight;
  }

  // ---- Spawning -------------------------------------------------------------
  _getInterval()
  {
    // FIX: Read breakpoint and window limits from the new CONFIG root
    return window.innerWidth >= CONFIG.shipInterval.breakpoint
      ? CONFIG.shipInterval.wide
      : CONFIG.shipInterval.narrow;
  }

  _spawnShip()
  {
    if (this.ships.length > 0) return;
    // FIX: Read spawn vectors directly from the centralized framework configuration
    this.ships.push(new Ship(CONFIG.shipTuning.spawnX, CONFIG.shipTuning.spawnY));
  }

  _handleSpawnTick()
  {
    if (this.ships.length === 0) this._spawnShip();
    const nextDelaySec = this._getInterval() / 1000;
    this.spawnTimer.setAndStart(nextDelaySec);
  }

  // ---- Loop -----------------------------------------------------------------
  update(dt)
  {
    this.stars.update(dt);
    this.crawl.update(dt);

    // Timer-based spawning
    if (this.spawnTimer.update(dt)) this._handleSpawnTick();

    this.planetRenderer.rotation += PLANET_TUNING.spinSpeed * (dt || 1);

    // Update ships
    for (let i = this.ships.length - 1; i >= 0; i--)
    {
      const s = this.ships[i];
      // FIX: Drive the delta updates using the new central tuning properties
      s.update(CONFIG.shipTuning, dt);
      if (s.isDead()) this.ships.splice(i, 1);
    }
  }

  // Accepts the sub-frame timing 'alpha' fraction from the controller
  draw(alpha)
  {
    this.stars.draw(alpha);
    this._drawPlanet();
    this._drawShips(alpha); // Passes alpha down to smooth out ship motion
    this.crawl.draw(alpha);
  }

  // Redundant translate/scale actions stripped out. 
  // The optimized PlanetRenderer handles its own positioning transformations internally.
  _drawPlanet()
  {
    const ctx = this.planetCtx;
    const w   = this.planetCanvas.width;
    const h   = this.planetCanvas.height;

    ctx.clearRect(0, 0, w, h);
    
    // Pass context alongside the width/height parameters so PlanetRenderer calculates offsets cleanly
    this.planetRenderer.draw(ctx, w, h);
  }

  // Leverages alpha interpolation to slide ship rendering vectors smoothly
  _drawShips(alpha)
  {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < this.ships.length; i++)
    {
      const s = this.ships[i];
      
      // FIX: Establish the screen scale variable cleanly using central settings parameters
      const screenScale = SHIP_BASE_H / window.innerHeight;
      const currentSpeed  = CONFIG.shipTuning.speed * screenScale;
      const currentDriftX = CONFIG.shipTuning.driftX * screenScale;
      
      // Interpolate percentage variables safely between clock ticks
      const interpolatedYPct = s.yPct - (currentSpeed * alpha * (FIXED_TIMESTEP || 1/60));
      const interpolatedXPct = s.xPct + (currentDriftX * alpha * (FIXED_TIMESTEP || 1/60));

      const drawX = (interpolatedXPct / PCT_DIVISOR) * w;
      const drawY = (interpolatedYPct / PCT_DIVISOR) * h;
      
      // FIX: Pass the canvas width down to get your native size layout using CONFIG
      const finalScale = s.getScale(w, CONFIG.shipTuning);

      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.scale(finalScale, finalScale * CONFIG.shipTuning.flattenY);
      ctx.rotate(Math.PI * CONFIG.shipTuning.rotation);
      ctx.globalAlpha = s.alpha;
      this.renderer.draw(ctx);
      ctx.restore();
    }
  }
}
