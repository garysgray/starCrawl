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
  draw(ctx)
  {
    // Build gradients fresh each draw — they are tied to the ctx transform
    const hullGrad = ctx.createLinearGradient(0, -110, 0, 110);
    hullGrad.addColorStop(0,   HULL_DARK);
    hullGrad.addColorStop(0.5, HULL_MID);
    hullGrad.addColorStop(1,   HULL_DARK);

    const upperGrad = ctx.createLinearGradient(0, -55, 0, 55);
    upperGrad.addColorStop(0,   UPPER_DARK);
    upperGrad.addColorStop(0.5, UPPER_MID);
    upperGrad.addColorStop(1,   UPPER_DARK);

    this._drawHull(ctx, hullGrad, upperGrad);
    this._drawSidePanels(ctx);
    this._drawSpine(ctx);
    this._drawTail(ctx, hullGrad, upperGrad);
    this._drawEngineHousing(ctx);
    this._drawEngines(ctx);
    this._drawCockpit(ctx);
  }

  // ---- Hull -----------------------------------------------------------------
  // Three layers: outer hull triangle, shadow band, upper deck panel
  _drawHull(ctx, hullGrad, upperGrad)
  {
    // Outer hull — full triangle from nose to tail corners
    ctx.fillStyle = hullGrad;
    ctx.beginPath();
    ctx.moveTo(250, 0); ctx.lineTo(-180, -110); ctx.lineTo(-180, 110);
    ctx.closePath(); ctx.fill();

    // Shadow strip underneath the upper deck edge
    ctx.fillStyle = HULL_SHADOW;
    ctx.beginPath();
    ctx.moveTo(225, 0); ctx.lineTo(-105, -60); ctx.lineTo(-165, -60);
    ctx.lineTo(-165, 60); ctx.lineTo(-105, 60);
    ctx.closePath(); ctx.fill();

    // Upper deck panel — sits on top of the shadow strip
    ctx.fillStyle = upperGrad;
    ctx.beginPath();
    ctx.moveTo(220, 0); ctx.lineTo(-100, -55); ctx.lineTo(-160, -55);
    ctx.lineTo(-160, 55); ctx.lineTo(-100, 55);
    ctx.closePath(); ctx.fill();
  }

  // ---- Side Panels ----------------------------------------------------------
  // Dark angled panels on port and starboard — give the ship its wedge depth
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
  // Central ridge running nose to tail — gives the hull a raised keel line
  _drawSpine(ctx)
  {
    ctx.fillStyle = SPINE_COL;
    ctx.beginPath();
    ctx.moveTo(200, 0); ctx.lineTo(50, -8); ctx.lineTo(-140, -6);
    ctx.lineTo(-140, 6); ctx.lineTo(50, 8);
    ctx.closePath(); ctx.fill();
  }

  // ---- Tail -----------------------------------------------------------------
  // Layered trapezoid panels forming the rear section behind the engine housing
  _drawTail(ctx, hullGrad, upperGrad)
  {
    // Outermost dark shell
    ctx.fillStyle = DARK_PANEL;
    ctx.beginPath();
    ctx.moveTo(-70, -14); ctx.lineTo(-70, 14); ctx.lineTo(-130, 35); ctx.lineTo(-130, -35);
    ctx.closePath(); ctx.fill();

    // Blue tint layer — gives a slight iridescent rim
    ctx.fillStyle = ENG_TAIL;
    ctx.beginPath();
    ctx.moveTo(-73, -13); ctx.lineTo(-73, 13); ctx.lineTo(-127, 33); ctx.lineTo(-127, -33);
    ctx.closePath(); ctx.fill();

    // Dark inset before the top panel
    ctx.fillStyle = DARK_PANEL;
    ctx.beginPath();
    ctx.moveTo(-75, -12); ctx.lineTo(-75, 12); ctx.lineTo(-125, 31); ctx.lineTo(-125, -31);
    ctx.closePath(); ctx.fill();

    // Top hull-grad panel — flush face of the tail block
    ctx.fillStyle = upperGrad;
    ctx.beginPath();
    ctx.moveTo(-77, -11); ctx.lineTo(-77, 11); ctx.lineTo(-127, 31); ctx.lineTo(-127, -31);
    ctx.closePath(); ctx.fill();
  }

  // ---- Engine Housing -------------------------------------------------------
  // Flat rectangular block at the very rear — mounts the three engine bells
  _drawEngineHousing(ctx)
  {
    ctx.fillStyle = ENGINE_HOUS;
    ctx.fillRect(-180, -65, 40, 130);
  }

  // ---- Engines --------------------------------------------------------------
  // Three engine bells with animated plumes — the only dynamic part of the ship
  _drawEngines(ctx)
  {
    const flicker = Math.random() * 0.2 + 0.8;   // random brightness each frame
    const time    = Date.now() * 0.005;            // drives plume sway + core pulse

    ENGINE_Y.forEach(y =>
    {
      // Plume — additive blend so it glows over whatever is behind it
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const plume = ctx.createLinearGradient(-162, y, -320, y);
      plume.addColorStop(0, `${ENG_PLUME} ${0.5 * flicker})`);
      plume.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = plume;
      ctx.beginPath();
      ctx.moveTo(-162, y - 20);
      ctx.lineTo(-280 - (Math.sin(time + y) * 15), y);   // tip sways with time
      ctx.lineTo(-162, y + 20);
      ctx.fill();
      ctx.restore();

      // Outer bell ring
      ctx.fillStyle = ENG_OUTER;
      ctx.beginPath(); ctx.arc(-162, y, 24, 0, Math.PI * 2); ctx.fill();

      // Mid glow ring
      ctx.fillStyle = ENG_MID;
      ctx.beginPath(); ctx.arc(-162, y, 18, 0, Math.PI * 2); ctx.fill();

      // Bright pulsing core
      ctx.fillStyle = ENG_CORE;
      ctx.beginPath(); ctx.arc(-162, y, 6 + (Math.sin(time) * 1), 0, Math.PI * 2); ctx.fill();
    });
  }

  // ---- Cockpit --------------------------------------------------------------
  // Narrow viewport strip near the nose — dark surround with a blue glow slit
  _drawCockpit(ctx)
  {
    // Dark window frame
    ctx.fillStyle = COCKPIT_DARK;
    ctx.beginPath();
    ctx.moveTo(60, -6); ctx.lineTo(140, -2); ctx.lineTo(140, 2); ctx.lineTo(60, 6);
    ctx.closePath(); ctx.fill();

    // Interior glow
    ctx.fillStyle = COCKPIT_GLOW;
    ctx.beginPath();
    ctx.moveTo(80, -3); ctx.lineTo(125, -1); ctx.lineTo(125, 1); ctx.lineTo(80, 3);
    ctx.closePath(); ctx.fill();
  }
}