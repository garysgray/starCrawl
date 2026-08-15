class Ship
{
  constructor(config, spawnX, spawnY)
  {
    this.xPct  = spawnX ?? (config.spawnX ?? 100);  
    this.yPct  = spawnY ?? (config.spawnY ?? 250);  
    this.alpha = 1;

    this.speed       = config.speed       ?? 0.12;
    this.driftX      = config.driftX      ?? -0.03;
    this.size        = config.size        ?? 1.0;
    this.shrink      = config.shrink      ?? 0.0001;
    this.flattenY    = config.flattenY    ?? 0.3;
    this.rotation    = config.rotation    ?? 1.48;
    this.fadeOutZone = config.fadeOutZone ?? -999;
    this.fadeSpeed   = config.fadeSpeed   ?? 0.008;
  }

  update(config, dt)
  {
    // Evaluates smooth frames directly from your Main.js ticks loop
    this.yPct -= this.speed;
    this.xPct += this.driftX;

    if (this.yPct < this.fadeOutZone) {
      this.alpha = Math.max(0, this.alpha - this.fadeSpeed);
    }
  }

  isDead()
  {
    return this.yPct < -150 || this.alpha <= 0;
  }

  getScale(w, config)
  {
    const PCT_DIVISOR = 100;
    const basePx   = (w / PCT_DIVISOR) * this.size;
    const shrinkPx = (w / PCT_DIVISOR) * this.shrink;
    return basePx - ((1 - (this.yPct / PCT_DIVISOR)) * shrinkPx);
  }
}
