// ── ShipLayer ─────────────────────────────────────────────────

const timerModes = 
{
     COUNTDOWN: "countdown", 
     COUNTUP: "countup" 
};
class ShipLayer
{
  constructor()
  {
    this.canvas   = document.getElementById('ships');
    this.ctx      = this.canvas.getContext('2d');
    this.ships    = [];
    this.renderer = new ShipRenderer();

    // Create the spawner timer (45 seconds initial delay)
    this.spawnTimer = new Timer("ShipSpawner", 45, timerModes.COUNTDOWN, false);
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

  // Adds a new ship at the spawn position defined in SHIP_TUNING
  _spawnShip()
  {
    if (this.ships.length > 0) return; // safety

    console.log("i spawned");
    console.log(this.ships.length );
    this.ships.push(new Ship(SHIP_TUNING.spawnX, SHIP_TUNING.spawnY));
  }

  // ---- Loop -----------------------------------------------------------------
  // Advances all ships and removes any that have gone offscreen or faded out
  update(dt)
  {
    // Update the timer
    if (this.spawnTimer.update(dt)) {
        // .update() returns true when the timer finishes
        this._handleSpawnTick();
    }

    for (let i = this.ships.length - 1; i >= 0; i--)
    {
      const s = this.ships[i];
      s.update(SHIP_TUNING, dt);
      if (s.isDead()) this.ships.splice(i, 1);
    }
  }

  // Draws all active ships — position and scale converted from % to pixels
  draw()
  {
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
      ctx.scale(scale, scale * SHIP_TUNING.flattenY);  // flattenY squashes for belly-view perspective
      ctx.rotate(Math.PI * SHIP_TUNING.rotation);
      ctx.globalAlpha = s.alpha;
      this.renderer.draw(ctx);
      ctx.restore();
    }
  }

  _handleSpawnTick() 
  {
    // 1. Spawn the ship if possible
    if (this.ships.length === 0) 
    {
        this._spawnShip();
    }

    // 2. Get the next interval (in ms) and convert to seconds
    const nextDelayMs = this._getInterval();
    const nextDelaySec = nextDelayMs / 1000;
    console.log(`Next ship in: ${nextDelaySec} seconds.`);

    // 3. Restart the timer with the new duration
    this.spawnTimer.setAndStart(nextDelaySec);
  }
}

