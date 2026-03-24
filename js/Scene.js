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

    // Spawn timer — initial delay before first ship
    this.spawnTimer = new Timer('ShipSpawner', 45, timerModes.COUNTDOWN, false);
    this.spawnTimer.start();

 

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  // ---- Setup ----------------------------------------------------------------
  _resize()
  {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // ---- Spawning -------------------------------------------------------------
  _getInterval()
  {
    return window.innerWidth >= SHIP_INTERVAL.breakpoint
      ? SHIP_INTERVAL.wide
      : SHIP_INTERVAL.narrow;
  }

  _spawnShip()
  {
    //console.log("i spawned");
    //console.log(this.ships.length );
    if (this.ships.length > 0) return;
    this.ships.push(new Ship(SHIP_TUNING.spawnX, SHIP_TUNING.spawnY));
  }

  _handleSpawnTick()
  {
    if (this.ships.length === 0) this._spawnShip();
    const nextDelaySec = this._getInterval() / 1000;
    this.spawnTimer.setAndStart(nextDelaySec);
    //console.log(`Next ship in: ${nextDelaySec} seconds.`);
  }

  // ---- Loop -----------------------------------------------------------------
  update(dt)
  {
    this.stars.update(dt);
    this.crawl.update(dt);

    // Timer-based spawning
    if (this.spawnTimer.update(dt)) this._handleSpawnTick();

    // Update ships
    for (let i = this.ships.length - 1; i >= 0; i--)
    {
      const s = this.ships[i];
      s.update(SHIP_TUNING, dt);
      if (s.isDead()) this.ships.splice(i, 1);
    }
  }

  draw()
  {
    this.stars.draw();

    // Draw ships
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < this.ships.length; i++)
    {
      const s     = this.ships[i];
      const drawX = (s.xPct / 100) * w;
      const drawY = (s.yPct / 100) * h;
      const scale = s.getScale(w, SHIP_TUNING);

      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.scale(scale, scale * SHIP_TUNING.flattenY);
      ctx.rotate(Math.PI * SHIP_TUNING.rotation);
      ctx.globalAlpha = s.alpha;
      this.renderer.draw(ctx);
      ctx.restore();
    }

    this.crawl.draw();
  }
}