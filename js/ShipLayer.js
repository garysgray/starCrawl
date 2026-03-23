// ── ShipLayer ─────────────────────────────────────────────────
class ShipLayer
{
  constructor()
  {
    this.canvas   = document.getElementById('ships');
    this.ctx      = this.canvas.getContext('2d');
    this.ships    = [];
    this.renderer = new ShipRenderer();

    this._resize();
    window.addEventListener('resize', () => this._resize());

    // Delay first spawn so the scene has time to settle before a ship appears
    if (this.ships.length < 1)
    {
        setTimeout(() =>
      {
        this._spawnShip();
        this._scheduleNext();
      }, 3000);
    }
  }

  // ---- Setup ----------------------------------------------------------------
  _resize()
  {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // ---- Spawning -------------------------------------------------------------
  // Queues the next ship on a randomised interval defined in SHIP_INTERVAL
  _scheduleNext()
  {
    const delay = SHIP_INTERVAL.min + Math.random() * SHIP_INTERVAL.range;
    setTimeout(() => { this._spawnShip(); this._scheduleNext(); }, delay);
  }

  // Adds a new ship at the spawn position defined in SHIP_TUNING
  _spawnShip()
  {
    this.ships.push(new Ship(SHIP_TUNING.spawnX, SHIP_TUNING.spawnY));
  }

  // ---- Loop -----------------------------------------------------------------
  // Advances all ships and removes any that have gone offscreen or faded out
  update(dt)
  {
    for (let i = this.ships.length - 1; i >= 0; i--)
    {
      const s = this.ships[i];
      s.update(SHIP_TUNING);
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
}