// ── ShipRenderer ─────────────────────────────────────────────
// All colours and gradient stops in one place for easy tweaking

// Hull
const HULL_DARK    = '#6e7382';
const HULL_MID     = '#aaafbe';
const HULL_SHADOW  = 'rgba(100, 105, 120, 1)';

// Upper deck
const UPPER_DARK   = '#a0a5b4';
const UPPER_MID    = '#e6ebf5';

// Panels / structure
const DARK_PANEL   = 'rgb(21, 22, 23)';
const SPINE_COL    = 'rgb(154, 163, 181)';
const ENGINE_HOUS  = 'rgba(70, 75, 90, 1)';
const TAIL_TRIM    = 'rgb(160, 165, 175)';

// Cockpit
const COCKPIT_DARK = 'rgba(30, 35, 50, 0.9)';
const COCKPIT_GLOW = 'rgba(120, 180, 255, 0.6)';

// Engines
const ENG_OUTER    = 'rgba(50, 55, 70, 1)';
const ENG_MID      = 'rgba(80, 120, 180, 0.9)';
const ENG_CORE     = 'rgba(240, 248, 255, 1)';
const ENG_PLUME    = 'rgba(100, 180, 255,';   // alpha appended at runtime
const ENG_TAIL     = 'rgba(120, 180, 255, 0.6)';

// Engine positions (Y offsets from ship centre)
const ENGINE_Y = [-44, 0, 44];

class ShipRenderer
{
  // 1. ADDED CONSTRUCTOR: Run once to lock static gradients in memory cache
  constructor(ctx)
  {
    // If a canvas context is available, pre-render the static gradients immediately
    if (ctx) {
      this._initStaticGradients(ctx);
    }
  }

  // Helper function to build gradients if context isn't ready in the constructor
  _initStaticGradients(ctx)
  {
    this.hullGrad = ctx.createLinearGradient(0, -110, 0, 110);
    this.hullGrad.addColorStop(0,   HULL_DARK);
    this.hullGrad.addColorStop(0.5, HULL_MID);
    this.hullGrad.addColorStop(1,   HULL_DARK);

    this.upperGrad = ctx.createLinearGradient(0, -55, 0, 55);
    this.upperGrad.addColorStop(0,   UPPER_DARK);
    this.upperGrad.addColorStop(0.5, UPPER_MID);
    this.upperGrad.addColorStop(1,   UPPER_DARK);
  }

  draw(ctx)
  {
    // 2. LAZY RESCUE: If renderer wasn't given a context at setup, build it once here
    if (!this.hullGrad) {
      this._initStaticGradients(ctx);
    }

    // Pass the cached memory gradients down to drawing sub-functions
    this._drawHull(ctx, this.hullGrad, this.upperGrad);
    this._drawSidePanels(ctx);
    this._drawSpine(ctx);
    this._drawTail(ctx, this.hullGrad, this.upperGrad);
    this._drawEngineHousing(ctx);
    this._drawEngines(ctx);
    this._drawCockpit(ctx);
  }

  // ---- Hull -----------------------------------------------------------------
  _drawHull(ctx, hullGrad, upperGrad)
  {
    ctx.fillStyle = hullGrad;
    ctx.beginPath();
    ctx.moveTo(250, 0); ctx.lineTo(-180, -110); ctx.lineTo(-180, 110);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = HULL_SHADOW;
    ctx.beginPath();
    ctx.moveTo(225, 0); ctx.lineTo(-105, -60); ctx.lineTo(-165, -60);
    ctx.lineTo(-165, 60); ctx.lineTo(-105, 60);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = upperGrad;
    ctx.beginPath();
    ctx.moveTo(220, 0); ctx.lineTo(-100, -55); ctx.lineTo(-160, -55);
    ctx.lineTo(-160, 55); ctx.lineTo(-100, 55);
    ctx.closePath(); ctx.fill();
  }

  // ---- Side Panels ----------------------------------------------------------
  _drawSidePanels(ctx)
  {
    ctx.fillStyle = DARK_PANEL;

    // Port (top)
    ctx.beginPath();
    ctx.moveTo(162, -10); ctx.lineTo(-100, -80); ctx.lineTo(-180, -110);
    ctx.lineTo(-160, -55); ctx.lineTo(-60, -40);
    ctx.closePath(); ctx.fill();

    // Starboard (bottom)
    ctx.beginPath();
    ctx.moveTo(162, 10); ctx.lineTo(-100, 80); ctx.lineTo(-180, 110);
    ctx.lineTo(-160, 55); ctx.lineTo(-60, 40);
    ctx.closePath(); ctx.fill();
  }

  // ---- Spine ----------------------------------------------------------------
  _drawSpine(ctx)
  {
    ctx.fillStyle = SPINE_COL;
    ctx.beginPath();
    ctx.moveTo(200, 0); ctx.lineTo(50, -8); ctx.lineTo(-140, -6);
    ctx.lineTo(-140, 6); ctx.lineTo(50, 8);
    ctx.closePath(); ctx.fill();
  }

  // ---- Tail -----------------------------------------------------------------
  _drawTail(ctx, hullGrad, upperGrad)
  {
    ctx.fillStyle = DARK_PANEL;
    ctx.beginPath();
    ctx.moveTo(-68, -14); ctx.lineTo(-68, 14); ctx.lineTo(-130, 35); ctx.lineTo(-130, -35);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = ENG_TAIL;
    ctx.beginPath();
    ctx.moveTo(-73, -13); ctx.lineTo(-73, 13); ctx.lineTo(-127, 33); ctx.lineTo(-127, -33);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = DARK_PANEL;
    ctx.beginPath();
    ctx.moveTo(-74, -12); ctx.lineTo(-74, 12); ctx.lineTo(-130, -35); ctx.lineTo(-130, 35);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = upperGrad;
    ctx.beginPath();
    ctx.moveTo(-77, -11); ctx.lineTo(-77, 11); ctx.lineTo(-127, 31); ctx.lineTo(-127, -31);
    ctx.closePath(); ctx.fill();
  }

  // ---- Engine Housing -------------------------------------------------------
  _drawEngineHousing(ctx)
  {
    ctx.fillStyle = ENGINE_HOUS;
    ctx.fillRect(-180, -65, 40, 130);
  }

  // ---- Engines --------------------------------------------------------------
  _drawEngines(ctx)
  {
    const flicker = Math.random() * 0.2 + 0.8;   
    const time    = Date.now() * 0.005;            

    ENGINE_Y.forEach(y =>
    {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      
      // Plumes must stay dynamic because of the random frame flicker value,
      // but caching the hull above means we are down to just 3 clean variations.
      const plume = ctx.createLinearGradient(-162, y, -320, y);
      plume.addColorStop(0, `${ENG_PLUME} ${0.5 * flicker})`);
      plume.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = plume;
      ctx.beginPath();
      ctx.moveTo(-162, y - 20);
      ctx.lineTo(-280 - (Math.sin(time + y) * 15), y);   
      ctx.lineTo(-162, y + 20);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = ENG_OUTER;
      ctx.beginPath(); ctx.arc(-162, y, 24, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = ENG_MID;
      ctx.beginPath(); ctx.arc(-162, y, 18, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = ENG_CORE;
      ctx.beginPath(); ctx.arc(-162, y, 6 + (Math.sin(time) * 1), 0, Math.PI * 2); ctx.fill();
    });
  }

  // ---- Cockpit --------------------------------------------------------------
  _drawCockpit(ctx)
  {
    ctx.fillStyle = COCKPIT_DARK;
    ctx.beginPath();
    ctx.moveTo(60, -6); ctx.lineTo(140, -2); ctx.lineTo(140, 2); ctx.lineTo(60, 6);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = COCKPIT_GLOW;
    ctx.beginPath();
    ctx.moveTo(80, -3); ctx.lineTo(125, -1); ctx.lineTo(125, 1); ctx.lineTo(80, 3);
    ctx.closePath(); ctx.fill();
  }
}
