// ── ShipRenderer ─────────────────────────────────────────────
// Decoupled Generic Renderer: Handles coordinate transformations, resolution-independent
// scaling, interpolation, and alpha blending, delegating procedural geometry to Ship entities.

class ShipRenderer
{
  // ── PRIVATE PROPERTIES ───────────────────────────────────────
  #smoothingEnabled = true;

  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor(ctx)
  {
    this.#smoothingEnabled = true;
  }

  // ── PUBLIC GETTERS & SETTERS ────────────────────────────────
  get smoothingEnabled() { return this.#smoothingEnabled; }
  set smoothingEnabled(val) { this.#smoothingEnabled = val; }

  // ── DECOUPLED RENDERING PIPELINE ────────────────────────────
  draw(ctx, ship, canvasW, canvasH, alpha = 1.0, fixedTimestep = 1 / 60)
  {
    if (!ctx) return;

    // Direct mode if ship is not provided or if called with transformed context
    if (!ship) return;

    const PCT_DIVISOR = 100;
    const w = canvasW || (ctx.canvas ? ctx.canvas.width : window.innerWidth);
    const h = canvasH || (ctx.canvas ? ctx.canvas.height : window.innerHeight);

    // Dynamic frame-delta sub-pixel interpolation
    const interpolatedYPct = ship.yPct - (ship.speed * alpha * fixedTimestep * 60);
    const interpolatedXPct = ship.xPct + (ship.driftX * alpha * fixedTimestep * 60);

    const drawX = (interpolatedXPct / PCT_DIVISOR) * w;
    const drawY = (interpolatedYPct / PCT_DIVISOR) * h;
    const finalScale = ship.getScale(w, null);

    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.scale(1, ship.flattenY);
    ctx.rotate(Math.PI * ship.rotation);
    ctx.scale(finalScale, finalScale);
    ctx.globalAlpha = Math.max(0, Math.min(1, ship.alpha));

    // SELF-RENDERING HANDSHAKE:
    // Ask the Ship entity subclass to draw its custom procedural geometry!
    if (typeof ship.drawShip === 'function')
    {
      ship.drawShip(ctx);
    }
    else if (typeof ship.draw === 'function')
    {
      ship.draw(ctx);
    }

    ctx.restore();
  }
}
