// ── Ship ──────────────────────────────────────────────────────

// Screen height everything is normalised against — keeps speed
// consistent across all screen sizes
const SHIP_BASE_H    = 900;

// Ship is removed once it travels this far above the screen top
const SHIP_DEAD_ZONE = -150;

// Divisor for converting percentage units to a 0-1 scale
const PCT_DIVISOR    = 100;

class Ship
{
  constructor(xPct, yPct)
  {
    this.xPct  = xPct;  // position as % of screen width
    this.yPct  = yPct;  // position as % of screen height
    this.alpha = 1;
  }

  // ---- Loop -----------------------------------------------------------------
  // Moves the ship and fades it out as it approaches the top of the screen
  update(tuning, dt)
  {
    // Normalise to base screen height so speed feels same on all screens
    const scale = SHIP_BASE_H / window.innerHeight;

    this.yPct -= tuning.speed  * dt * scale;
    this.xPct += tuning.driftX * dt * scale;

    // Fade out as ship approaches the top fade zone
    if (this.yPct < tuning.fadeOutZone)
      this.alpha = Math.max(0, this.alpha - tuning.fadeSpeed * dt);
  }

  // ---- State ----------------------------------------------------------------
  // Ship is removed once fully offscreen or fully transparent
  isDead()
  {
    return this.yPct < SHIP_DEAD_ZONE || this.alpha <= 0;
  }

  // Returns the pixel scale for this ship based on screen width and depth shrink
  getScale(w, tuning)
  {
    const basePx   = (w / PCT_DIVISOR) * tuning.size;
    const shrinkPx = (w / PCT_DIVISOR) * tuning.shrink;
    return basePx - ((1 - (this.yPct / PCT_DIVISOR)) * shrinkPx);
  }
}