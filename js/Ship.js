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
  // update(tuning, dt)
  update(tuning, dt)
  {
    // Normalize to a base screen height so speed feels the same on all screens
    const BASE_H = 900;
    const scale  = BASE_H / window.innerHeight;

    this.yPct -= tuning.speed * dt * scale;
    this.xPct += tuning.driftX * dt * scale;

    if (this.yPct < tuning.fadeOutZone)
      this.alpha = Math.max(0, this.alpha - tuning.fadeSpeed * dt);
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