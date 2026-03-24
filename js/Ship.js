// ── Ship ──────────────────────────────────────────────────────
class Ship
{
  constructor(xPct, yPct)
  {
    this.xPct  = xPct;   // position as % of screen width
    this.yPct  = yPct;   // position as % of screen height
    this.alpha = 1;
  }

  // ---- Loop -----------------------------------------------------------------
  // Moves the ship and fades it out as it approaches the top of the screen
  update(tuning, dt)
  {
    const tick = dt * 60;
    this.yPct -= tuning.speed * tick;
    this.xPct += tuning.driftX * tick;

    if (this.yPct < tuning.fadeOutZone)
      this.alpha = Math.max(0, this.alpha - tuning.fadeSpeed * tick);
  }
  // ---- State ----------------------------------------------------------------
  // Ship is removed once fully offscreen or fully transparent
  isDead()
  {
    return this.yPct < -150 || this.alpha <= 0;
  }

  // Returns the pixel scale for this ship based on screen width and depth shrink
  getScale(w, tuning)
  {
    const basePx   = (w / 100) * tuning.size;
    const shrinkPx = (w / 100) * tuning.shrink;
    return basePx - ((1 - (this.yPct / 100)) * shrinkPx);
  }
}