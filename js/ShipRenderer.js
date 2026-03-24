// ── ShipRenderer ─────────────────────────────────────────────
// All colours and coordinate constants in one place for easy tweaking

// ---- Hull colours -----------------------------------------------------------
const HULL_DARK    = '#4a4f5c';
const HULL_MID     = '#7a7f8e';
const HULL_SHADOW  = 'rgba(60, 65, 78, 1)';

// ---- Upper deck colours -----------------------------------------------------
const UPPER_DARK   = '#6e7382';
const UPPER_MID    = '#9aa0b0';

// ---- Structure colours ------------------------------------------------------
const DARK_PANEL   = 'rgb(21, 22, 23)';
const SPINE_COL    = 'rgb(100, 108, 124)';
const ENGINE_HOUS  = 'rgba(70, 75, 90, 1)';

// ---- Cockpit colours --------------------------------------------------------
const COCKPIT_DARK = 'rgba(30, 35, 50, 0.9)';
const COCKPIT_GLOW = 'rgba(120, 180, 255, 0.6)';

// ---- Engine colours ---------------------------------------------------------
const ENG_OUTER    = 'rgba(50, 55, 70, 1)';
const ENG_MID      = 'rgba(80, 120, 180, 0.9)';
const ENG_CORE     = 'rgba(240, 248, 255, 1)';
const ENG_PLUME    = 'rgba(100, 180, 255,';    // alpha appended at runtime
const ENG_TAIL     = 'rgba(120, 180, 255, 0.6)';

// ---- Hull geometry ----------------------------------------------------------
const HULL_NOSE_X         =  250;   // nose tip x
const HULL_TAIL_X         = -180;   // tail rear x
const HULL_HALF_H         =  110;   // half height at tail
const HULL_GRAD_Y         =  110;   // gradient span half height

const SHADOW_NOSE_X       =  225;
const SHADOW_INNER_X      = -105;
const SHADOW_OUTER_X      = -165;
const SHADOW_HALF_H       =   60;

const UPPER_NOSE_X        =  220;
const UPPER_INNER_X       = -100;
const UPPER_OUTER_X       = -160;
const UPPER_HALF_H        =   55;
const UPPER_GRAD_Y        =   55;   // gradient span half height

// ---- Side panel geometry ----------------------------------------------------
const PANEL_NOSE_X        =  162;
const PANEL_NOSE_Y        =   10;
const PANEL_MID_X         = -100;
const PANEL_MID_Y         =   80;
const PANEL_OUTER_Y       =  110;
const PANEL_INNER_X       = -160;
const PANEL_INNER_Y       =   55;
const PANEL_FRONT_X       =  -60;
const PANEL_FRONT_Y       =   40;

// ---- Spine geometry ---------------------------------------------------------
const SPINE_NOSE_X        =  200;
const SPINE_MID_X         =   50;
const SPINE_TAIL_X        = -140;
const SPINE_HALF_W        =    8;   // half width at mid
const SPINE_TAIL_HALF_W   =    6;   // half width at tail

// ---- Tail geometry ----------------------------------------------------------
const TAIL_FRONT_X        =  -70;
const TAIL_FRONT_HALF_H   =   14;
const TAIL_REAR_X         = -130;
const TAIL_REAR_HALF_H    =   35;

const TAIL_L1_FRONT_X     =  -73;
const TAIL_L1_FRONT_HALF_H=   13;
const TAIL_L1_REAR_X      = -127;
const TAIL_L1_REAR_HALF_H =   33;

const TAIL_L2_FRONT_X     =  -75;
const TAIL_L2_FRONT_HALF_H=   12;
const TAIL_L2_REAR_HALF_H =   31;

const TAIL_L3_FRONT_X     =  -77;
const TAIL_L3_FRONT_HALF_H=   11;
const TAIL_L3_REAR_X      = -127;
const TAIL_L3_REAR_HALF_H =   31;

// ---- Engine housing geometry ------------------------------------------------
const ENG_HOUS_X          = -180;
const ENG_HOUS_Y          =  -65;
const ENG_HOUS_W          =   40;
const ENG_HOUS_H          =  130;

// ---- Engine geometry --------------------------------------------------------
const ENGINE_Y            = [-44, 0, 44];  // Y offsets from ship centre
const ENG_X               = -162;          // X position of all engine bells
const ENG_PLUME_TIP_X     = -280;          // base plume tip X before sway
const ENG_PLUME_HALF_H    =   20;          // half height of plume triangle
const ENG_PLUME_SWAY      =   15;          // max sway amplitude
const ENG_PLUME_MAX_ALPHA =  0.5;          // max plume opacity
const ENG_TIME_SCALE      = 0.005;         // Date.now multiplier for animation
const ENG_FLICKER_MIN     =  0.8;          // min brightness multiplier
const ENG_FLICKER_RANGE   =  0.2;          // brightness flicker range
const ENG_OUTER_R         =   24;          // outer bell radius
const ENG_MID_R           =   18;          // mid glow radius
const ENG_CORE_R          =    6;          // base core radius
const ENG_CORE_PULSE      =    1;          // core pulse amplitude
const ENG_GRAD_TIP_X      = -320;          // plume gradient end x

// ---- Cockpit geometry -------------------------------------------------------
const COCK_FRAME_X1       =   60;
const COCK_FRAME_X2       =  140;
const COCK_FRAME_HALF_H1  =    6;
const COCK_FRAME_HALF_H2  =    2;
const COCK_GLOW_X1        =   80;
const COCK_GLOW_X2        =  125;
const COCK_GLOW_HALF_H1   =    3;
const COCK_GLOW_HALF_H2   =    1;

class ShipRenderer
{
  draw(ctx)
  {
    // Build gradients fresh each draw — they are tied to the ctx transform
    const hullGrad = ctx.createLinearGradient(0, -HULL_GRAD_Y, 0, HULL_GRAD_Y);
    hullGrad.addColorStop(0,   HULL_DARK);
    hullGrad.addColorStop(0.5, HULL_MID);
    hullGrad.addColorStop(1,   HULL_DARK);

    const upperGrad = ctx.createLinearGradient(0, -UPPER_GRAD_Y, 0, UPPER_GRAD_Y);
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
    ctx.moveTo(HULL_NOSE_X, 0);
    ctx.lineTo(HULL_TAIL_X, -HULL_HALF_H);
    ctx.lineTo(HULL_TAIL_X,  HULL_HALF_H);
    ctx.closePath(); ctx.fill();

    // Shadow strip underneath the upper deck edge
    ctx.fillStyle = HULL_SHADOW;
    ctx.beginPath();
    ctx.moveTo(SHADOW_NOSE_X,   0);
    ctx.lineTo(SHADOW_INNER_X, -SHADOW_HALF_H);
    ctx.lineTo(SHADOW_OUTER_X, -SHADOW_HALF_H);
    ctx.lineTo(SHADOW_OUTER_X,  SHADOW_HALF_H);
    ctx.lineTo(SHADOW_INNER_X,  SHADOW_HALF_H);
    ctx.closePath(); ctx.fill();

    // Upper deck panel — sits on top of the shadow strip
    ctx.fillStyle = upperGrad;
    ctx.beginPath();
    ctx.moveTo(UPPER_NOSE_X,   0);
    ctx.lineTo(UPPER_INNER_X, -UPPER_HALF_H);
    ctx.lineTo(UPPER_OUTER_X, -UPPER_HALF_H);
    ctx.lineTo(UPPER_OUTER_X,  UPPER_HALF_H);
    ctx.lineTo(UPPER_INNER_X,  UPPER_HALF_H);
    ctx.closePath(); ctx.fill();
  }

  // ---- Side Panels ----------------------------------------------------------
  // Dark angled panels on port and starboard — give the ship its wedge depth
  _drawSidePanels(ctx)
  {
    ctx.fillStyle = DARK_PANEL;

    // Port (top)
    ctx.beginPath();
    ctx.moveTo( PANEL_NOSE_X,  -PANEL_NOSE_Y);
    ctx.lineTo( PANEL_MID_X,   -PANEL_MID_Y);
    ctx.lineTo( HULL_TAIL_X,   -PANEL_OUTER_Y);
    ctx.lineTo( PANEL_INNER_X, -PANEL_INNER_Y);
    ctx.lineTo( PANEL_FRONT_X, -PANEL_FRONT_Y);
    ctx.closePath(); ctx.fill();

    // Starboard (bottom)
    ctx.beginPath();
    ctx.moveTo( PANEL_NOSE_X,   PANEL_NOSE_Y);
    ctx.lineTo( PANEL_MID_X,    PANEL_MID_Y);
    ctx.lineTo( HULL_TAIL_X,    PANEL_OUTER_Y);
    ctx.lineTo( PANEL_INNER_X,  PANEL_INNER_Y);
    ctx.lineTo( PANEL_FRONT_X,  PANEL_FRONT_Y);
    ctx.closePath(); ctx.fill();
  }

  // ---- Spine ----------------------------------------------------------------
  // Central ridge running nose to tail — gives the hull a raised keel line
  _drawSpine(ctx)
  {
    ctx.fillStyle = SPINE_COL;
    ctx.beginPath();
    ctx.moveTo(SPINE_NOSE_X,  0);
    ctx.lineTo(SPINE_MID_X,  -SPINE_HALF_W);
    ctx.lineTo(SPINE_TAIL_X, -SPINE_TAIL_HALF_W);
    ctx.lineTo(SPINE_TAIL_X,  SPINE_TAIL_HALF_W);
    ctx.lineTo(SPINE_MID_X,   SPINE_HALF_W);
    ctx.closePath(); ctx.fill();
  }

  // ---- Tail -----------------------------------------------------------------
  // Layered trapezoid panels forming the rear section behind the engine housing
  _drawTail(ctx, hullGrad, upperGrad)
  {
    // Outermost dark shell
    ctx.fillStyle = DARK_PANEL;
    ctx.beginPath();
    ctx.moveTo(TAIL_FRONT_X, -TAIL_FRONT_HALF_H);
    ctx.lineTo(TAIL_FRONT_X,  TAIL_FRONT_HALF_H);
    ctx.lineTo(TAIL_REAR_X,   TAIL_REAR_HALF_H);
    ctx.lineTo(TAIL_REAR_X,  -TAIL_REAR_HALF_H);
    ctx.closePath(); ctx.fill();

    // Blue tint layer — gives a slight iridescent rim
    ctx.fillStyle = ENG_TAIL;
    ctx.beginPath();
    ctx.moveTo(TAIL_L1_FRONT_X, -TAIL_L1_FRONT_HALF_H);
    ctx.lineTo(TAIL_L1_FRONT_X,  TAIL_L1_FRONT_HALF_H);
    ctx.lineTo(TAIL_L1_REAR_X,   TAIL_L1_REAR_HALF_H);
    ctx.lineTo(TAIL_L1_REAR_X,  -TAIL_L1_REAR_HALF_H);
    ctx.closePath(); ctx.fill();

    // Dark inset before the top panel
    ctx.fillStyle = DARK_PANEL;
    ctx.beginPath();
    ctx.moveTo(TAIL_L2_FRONT_X, -TAIL_L2_FRONT_HALF_H);
    ctx.lineTo(TAIL_L2_FRONT_X,  TAIL_L2_FRONT_HALF_H);
    ctx.lineTo(TAIL_REAR_X,     -TAIL_L2_REAR_HALF_H);
    ctx.lineTo(TAIL_REAR_X,      TAIL_L2_REAR_HALF_H);
    ctx.closePath(); ctx.fill();

    // Top hull-grad panel — flush face of the tail block
    ctx.fillStyle = upperGrad;
    ctx.beginPath();
    ctx.moveTo(TAIL_L3_FRONT_X, -TAIL_L3_FRONT_HALF_H);
    ctx.lineTo(TAIL_L3_FRONT_X,  TAIL_L3_FRONT_HALF_H);
    ctx.lineTo(TAIL_L3_REAR_X,   TAIL_L3_REAR_HALF_H);
    ctx.lineTo(TAIL_L3_REAR_X,  -TAIL_L3_REAR_HALF_H);
    ctx.closePath(); ctx.fill();
  }

  // ---- Engine Housing -------------------------------------------------------
  // Flat rectangular block at the very rear — mounts the three engine bells
  _drawEngineHousing(ctx)
  {
    ctx.fillStyle = ENGINE_HOUS;
    ctx.fillRect(ENG_HOUS_X, ENG_HOUS_Y, ENG_HOUS_W, ENG_HOUS_H);
  }

  // ---- Engines --------------------------------------------------------------
  // Three engine bells with animated plumes — the only dynamic part of the ship
  _drawEngines(ctx)
  {
    const flicker = ENG_FLICKER_MIN + (Math.random() * ENG_FLICKER_RANGE);
    const time    = Date.now() * ENG_TIME_SCALE;

    ENGINE_Y.forEach(y =>
    {
      // Plume — additive blend so it glows over whatever is behind it
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const plume = ctx.createLinearGradient(ENG_X, y, ENG_GRAD_TIP_X, y);
      plume.addColorStop(0, `${ENG_PLUME} ${ENG_PLUME_MAX_ALPHA * flicker})`);
      plume.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = plume;
      ctx.beginPath();
      ctx.moveTo(ENG_X, y - ENG_PLUME_HALF_H);
      ctx.lineTo(ENG_PLUME_TIP_X - (Math.sin(time + y) * ENG_PLUME_SWAY), y);
      ctx.lineTo(ENG_X, y + ENG_PLUME_HALF_H);
      ctx.fill();
      ctx.restore();

      // Outer bell ring
      ctx.fillStyle = ENG_OUTER;
      ctx.beginPath(); ctx.arc(ENG_X, y, ENG_OUTER_R, 0, Math.PI * 2); ctx.fill();

      // Mid glow ring
      ctx.fillStyle = ENG_MID;
      ctx.beginPath(); ctx.arc(ENG_X, y, ENG_MID_R, 0, Math.PI * 2); ctx.fill();

      // Bright pulsing core
      ctx.fillStyle = ENG_CORE;
      ctx.beginPath();
      ctx.arc(ENG_X, y, ENG_CORE_R + (Math.sin(time) * ENG_CORE_PULSE), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ---- Cockpit --------------------------------------------------------------
  // Narrow viewport strip near the nose — dark surround with a blue glow slit
  _drawCockpit(ctx)
  {
    // Dark window frame
    ctx.fillStyle = COCKPIT_DARK;
    ctx.beginPath();
    ctx.moveTo(COCK_FRAME_X1, -COCK_FRAME_HALF_H1);
    ctx.lineTo(COCK_FRAME_X2, -COCK_FRAME_HALF_H2);
    ctx.lineTo(COCK_FRAME_X2,  COCK_FRAME_HALF_H2);
    ctx.lineTo(COCK_FRAME_X1,  COCK_FRAME_HALF_H1);
    ctx.closePath(); ctx.fill();

    // Interior glow
    ctx.fillStyle = COCKPIT_GLOW;
    ctx.beginPath();
    ctx.moveTo(COCK_GLOW_X1, -COCK_GLOW_HALF_H1);
    ctx.lineTo(COCK_GLOW_X2, -COCK_GLOW_HALF_H2);
    ctx.lineTo(COCK_GLOW_X2,  COCK_GLOW_HALF_H2);
    ctx.lineTo(COCK_GLOW_X1,  COCK_GLOW_HALF_H1);
    ctx.closePath(); ctx.fill();
  }
}