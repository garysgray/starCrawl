// ── Ship Base Class & Subclass Entities ──────────────────────────────────────
// Decoupled entity architecture: Every ship entity owns its physical geometry,
// hull texturing, engine systems, and cosmetic palettes.

class Ship
{
  // ── PRIVATE BASE PROPERTIES ──────────────────────────────────
  #shipType;
  #startX = 90.0;
  #startY = 112.0;
  #endX   = 10.0;
  #endY   = -25.0;
  #xPct   = 90.0;
  #yPct   = 112.0;
  #alpha  = 1;
  #duration = 50.0;
  #elapsedTime = 0.0;
  #progress = 0.0;

  #speed;
  #driftX;
  #size;
  #shrink;
  #flattenY;
  #rotation;
  #fadeOutZone;
  #fadeSpeed;
  #hasEnteredViewLog = false;
  #hasSwappedPlanet = false;

  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor(config = {}, spawnX, spawnY)
  {
    if (this.constructor === Ship)
    {
      throw new TypeError("Cannot instantiate base abstract class Ship directly.");
    }

    const dir = (typeof CONFIG !== 'undefined' && CONFIG.DIRECTOR) ? CONFIG.DIRECTOR : null;
    const defaultStart = (dir && dir.SHIP_START_POS) ? dir.SHIP_START_POS : { x: 90.0, y: 112.0 };
    const defaultEnd   = (dir && dir.SHIP_END_POS)   ? dir.SHIP_END_POS   : { x: 10.0, y: -25.0 };
    const defaultRot   = (dir && typeof dir.SHIP_ROTATION === 'number') ? dir.SHIP_ROTATION : 1.48;

    this.#shipType    = config.shipType || config.objectType || 'starDestroyer';
    this.#startX      = spawnX ?? (config.startX ?? defaultStart.x);
    this.#startY      = spawnY ?? (config.startY ?? defaultStart.y);
    this.#endX        = config.endX ?? defaultEnd.x;
    this.#endY        = config.endY ?? defaultEnd.y;
    this.#duration    = (config.duration && config.duration > 0) ? config.duration : ((dir && dir.SHIP_FLIGHT_DURATION_SEC) ? dir.SHIP_FLIGHT_DURATION_SEC : 50.0);

    this.#xPct        = this.#startX;
    this.#yPct        = this.#startY;
    this.#elapsedTime = 0.0;
    this.#progress    = 0.0;
    this.#alpha       = 1;

    this.#size        = config.size        ?? 1.0;
    this.#shrink      = config.shrink      ?? 0.0001;
    this.#flattenY    = config.flattenY    ?? 0.3;
    this.#rotation    = config.rotation    ?? defaultRot;
    this.#fadeOutZone = config.fadeOutZone ?? -999;
    this.#fadeSpeed   = config.fadeSpeed   ?? 0.008;

    // Derived step rates for backwards-compatible telemetry / renderer
    const totalFrames = this.#duration * 60;
    this.#speed  = Math.abs(this.#startY - this.#endY) / totalFrames;
    this.#driftX = (this.#endX - this.#startX) / totalFrames;

    this.#hasEnteredViewLog = false;
    this.#hasSwappedPlanet  = false;
  }

  // ── Trajectory Geometry Bounds (in unscaled local coordinate units) ──
  get noseUnits() { return 250; }
  get tailUnits() { return 300; }

  // ── Waypoint-Aware Trajectory Helpers ──────────────────────
  get startX() { return this.#startX; }
  get startY() { return this.#startY; }
  get endX()   { return this.#endX; }
  get endY()   { return this.#endY; }
  get progress() { return this.#progress; }
  get duration() { return this.#duration; }

  setTrajectory(startX, startY, endX, endY, durationSec)
  {
    this.#startX = startX;
    this.#startY = startY;
    this.#endX = endX;
    this.#endY = endY;
    if (typeof durationSec === 'number' && durationSec > 0)
    {
      this.#duration = durationSec;
    }
    const totalFrames = this.#duration * 60;
    this.#speed  = Math.abs(this.#startY - this.#endY) / totalFrames;
    this.#driftX = (this.#endX - this.#startX) / totalFrames;
    this.updatePosition();
  }

  setDuration(newDuration)
  {
    if (typeof newDuration === 'number' && newDuration > 0)
    {
      this.#duration = newDuration;
      this.#elapsedTime = this.#progress * newDuration;
      const totalFrames = this.#duration * 60;
      this.#speed  = Math.abs(this.#startY - this.#endY) / totalFrames;
      this.#driftX = (this.#endX - this.#startX) / totalFrames;
    }
  }

  getSpawnY(w, h)
  {
    return this.#startY;
  }

  getDespawnY(w, h)
  {
    return this.#endY;
  }

  calculateSpeedForDuration(w, h, durationSeconds)
  {
    const targetSeconds = (typeof durationSeconds === 'number' && durationSeconds > 0) ? durationSeconds : this.#duration;
    this.setDuration(targetSeconds);
    return this.#speed;
  }

  // ── PUBLIC GETTERS & SETTERS ────────────────────────────────
  get shipType() { return this.#shipType; }
  set shipType(val) { this.#shipType = val; }

  get xPct() { return this.#xPct; }
  set xPct(val) { this.#xPct = val; }

  get yPct() { return this.#yPct; }
  set yPct(val) { this.#yPct = val; }

  get alpha() { return this.#alpha; }
  set alpha(val) { this.#alpha = val; }

  get speed() { return this.#speed; }
  set speed(val) { this.#speed = val; }

  get driftX() { return this.#driftX; }
  set driftX(val) { this.#driftX = val; }

  get size() { return this.#size; }
  set size(val) { this.#size = val; }

  get shrink() { return this.#shrink; }
  set shrink(val) { this.#shrink = val; }

  get flattenY() { return this.#flattenY; }
  set flattenY(val) { this.#flattenY = val; }

  get rotation() { return this.#rotation; }
  set rotation(val) { this.#rotation = val; }

  get fadeOutZone() { return this.#fadeOutZone; }
  set fadeOutZone(val) { this.#fadeOutZone = val; }

  get fadeSpeed() { return this.#fadeSpeed; }
  set fadeSpeed(val) { this.#fadeSpeed = val; }

  get hasEnteredViewLog() { return this.#hasEnteredViewLog; }
  set hasEnteredViewLog(val) { this.#hasEnteredViewLog = val; }

  get hasSwappedPlanet() { return this.#hasSwappedPlanet; }
  set hasSwappedPlanet(val) { this.#hasSwappedPlanet = val; }

  // ── Frame Update & Waypoint Interpolation ───────────────────
  updatePosition()
  {
    this.#xPct = this.#startX + this.#progress * (this.#endX - this.#startX);
    this.#yPct = this.#startY + this.#progress * (this.#endY - this.#startY);
  }

  update(config, dt)
  {
    const stepMult = (dt !== undefined && dt !== null) ? dt : 1;
    const fixedTimestep = (typeof CONFIG !== 'undefined' && CONFIG.System) ? CONFIG.System.FIXED_TIMESTEP : (1 / 60);
    const dtSeconds = stepMult * fixedTimestep;

    this.#elapsedTime += dtSeconds;
    this.#progress = Math.min(1.0, this.#elapsedTime / this.#duration);
    this.updatePosition();

    if (this.#yPct < this.#fadeOutZone)
    {
      this.#alpha = Math.max(0, this.#alpha - (this.#fadeSpeed * stepMult));
    }
  }

  isDead(w, h)
  {
    if (this.#alpha <= 0) return true;
    return this.#progress >= 1.0;
  }

  getScale(w, config)
  {
    const PCT_DIVISOR = 100;
    const basePx   = (w / PCT_DIVISOR) * this.#size;
    const shrinkPx = (w / PCT_DIVISOR) * this.#shrink;
    return basePx - ((1 - (this.#yPct / PCT_DIVISOR)) * shrinkPx);
  }

  // Abstract rendering contract ensuring every ship subclass knows how to draw itself
  drawShip(ctx)
  {
    throw new Error("Abstract method drawShip() must be implemented by subclass.");
  }

  // ── STATIC FACTORY CREATOR ─────────────────────────────────
  static create(config = {}, spawnX, spawnY)
  {
    const type = (config.shipType || config.objectType || '').toLowerCase();
    switch (type)
    {
      case 'corvette':
      case 'rebelcorvette':
      case 'blockaderunner':
        return new CorvetteEntity(config, spawnX, spawnY);
      case 'fighter':
      case 'scout':
      case 'interceptor':
        return new FighterEntity(config, spawnX, spawnY);
      case 'stardestroyer':
      case 'destroyer':
      case 'capital':
      default:
        return new StarDestroyerEntity(config, spawnX, spawnY);
    }
  }
}

// ── Star Destroyer Subclass Component ─────────────────────────────────────────
class StarDestroyerEntity extends Ship
{
  // ── PRIVATE PROPERTIES ───────────────────────────────────────
  #hullDark;
  #hullMid;
  #hullShadow;
  #upperDark;
  #upperMid;
  #darkPanel;
  #spineColor;
  #engineHous;
  #tailTrim;
  #cockpitDark;
  #cockpitGlow;
  #engOuter;
  #engMid;
  #engCore;
  #engPlume;
  #engTail;
  #engineY = [-44, 0, 44];
  #hullGrad = null;
  #upperGrad = null;

  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor(config = {}, spawnX, spawnY)
  {
    super(config, spawnX, spawnY);

    this.#hullDark    = config.hullDark    || '#6e7382';
    this.#hullMid     = config.hullMid     || '#aaafbe';
    this.#hullShadow  = config.hullShadow  || 'rgba(100, 105, 120, 1)';

    this.#upperDark   = config.upperDark   || '#a0a5b4';
    this.#upperMid    = config.upperMid    || '#e6ebf5';

    this.#darkPanel   = config.darkPanel   || 'rgb(21, 22, 23)';
    this.#spineColor  = config.spineColor  || 'rgb(154, 163, 181)';
    this.#engineHous  = config.engineHous  || 'rgba(70, 75, 90, 1)';
    this.#tailTrim    = config.tailTrim    || 'rgb(160, 165, 175)';

    this.#cockpitDark = config.cockpitDark || 'rgba(30, 35, 50, 0.9)';
    this.#cockpitGlow = config.cockpitGlow || 'rgba(120, 180, 255, 0.6)';

    this.#engOuter    = config.engOuter    || 'rgba(50, 55, 70, 1)';
    this.#engMid      = config.engMid      || 'rgba(80, 120, 180, 0.9)';
    this.#engCore     = config.engCore     || 'rgba(240, 248, 255, 1)';
    this.#engPlume    = config.engPlume    || 'rgba(100, 180, 255,';
    this.#engTail     = config.engTail     || 'rgba(120, 180, 255, 0.6)';
    this.#engineY     = config.engineY     || [-44, 0, 44];
  }

  // ── PUBLIC GETTERS & SETTERS ────────────────────────────────
  get hullDark() { return this.#hullDark; }
  set hullDark(val) { this.#hullDark = val; }

  get hullMid() { return this.#hullMid; }
  set hullMid(val) { this.#hullMid = val; }

  get hullShadow() { return this.#hullShadow; }
  set hullShadow(val) { this.#hullShadow = val; }

  get upperDark() { return this.#upperDark; }
  set upperDark(val) { this.#upperDark = val; }

  get upperMid() { return this.#upperMid; }
  set upperMid(val) { this.#upperMid = val; }

  get darkPanel() { return this.#darkPanel; }
  set darkPanel(val) { this.#darkPanel = val; }

  get spineColor() { return this.#spineColor; }
  set spineColor(val) { this.#spineColor = val; }

  get engineHous() { return this.#engineHous; }
  set engineHous(val) { this.#engineHous = val; }

  get tailTrim() { return this.#tailTrim; }
  set tailTrim(val) { this.#tailTrim = val; }

  get cockpitDark() { return this.#cockpitDark; }
  set cockpitDark(val) { this.#cockpitDark = val; }

  get cockpitGlow() { return this.#cockpitGlow; }
  set cockpitGlow(val) { this.#cockpitGlow = val; }

  get engOuter() { return this.#engOuter; }
  set engOuter(val) { this.#engOuter = val; }

  get engMid() { return this.#engMid; }
  set engMid(val) { this.#engMid = val; }

  get engCore() { return this.#engCore; }
  set engCore(val) { this.#engCore = val; }

  get engPlume() { return this.#engPlume; }
  set engPlume(val) { this.#engPlume = val; }

  get engTail() { return this.#engTail; }
  set engTail(val) { this.#engTail = val; }

  get engineY() { return this.#engineY; }
  set engineY(val) { this.#engineY = val; }

  get hullGrad() { return this.#hullGrad; }
  set hullGrad(val) { this.#hullGrad = val; }

  get upperGrad() { return this.#upperGrad; }
  set upperGrad(val) { this.#upperGrad = val; }

  // Star Destroyer geometry: nose at +250, engine plumes extend to -320
  get noseUnits() { return 250; }
  get tailUnits() { return 320; }

  // ── PRIVATE GEOMETRY BUILDERS ──────────────────────────────
  #initStaticGradients(ctx)
  {
    this.#hullGrad = ctx.createLinearGradient(0, -110, 0, 110);
    this.#hullGrad.addColorStop(0,   this.#hullDark);
    this.#hullGrad.addColorStop(0.5, this.#hullMid);
    this.#hullGrad.addColorStop(1,   this.#hullDark);

    this.#upperGrad = ctx.createLinearGradient(0, -55, 0, 55);
    this.#upperGrad.addColorStop(0,   this.#upperDark);
    this.#upperGrad.addColorStop(0.5, this.#upperMid);
    this.#upperGrad.addColorStop(1,   this.#upperDark);
  }

  #drawHull(ctx)
  {
    ctx.fillStyle = this.#hullGrad;
    ctx.beginPath();
    ctx.moveTo(250, 0); ctx.lineTo(-180, -110); ctx.lineTo(-180, 110);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = this.#hullShadow;
    ctx.beginPath();
    ctx.moveTo(225, 0); ctx.lineTo(-105, -60); ctx.lineTo(-165, -60);
    ctx.lineTo(-165, 60); ctx.lineTo(-105, 60);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = this.#upperGrad;
    ctx.beginPath();
    ctx.moveTo(220, 0); ctx.lineTo(-100, -55); ctx.lineTo(-160, -55);
    ctx.lineTo(-160, 55); ctx.lineTo(-100, 55);
    ctx.closePath(); ctx.fill();
  }

  #drawSidePanels(ctx)
  {
    ctx.fillStyle = this.#darkPanel;

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

  #drawSpine(ctx)
  {
    ctx.fillStyle = this.#spineColor;
    ctx.beginPath();
    ctx.moveTo(200, 0); ctx.lineTo(50, -8); ctx.lineTo(-140, -6);
    ctx.lineTo(-140, 6); ctx.lineTo(50, 8);
    ctx.closePath(); ctx.fill();
  }

  #drawTail(ctx)
  {
    ctx.fillStyle = this.#darkPanel;
    ctx.beginPath();
    ctx.moveTo(-68, -14); ctx.lineTo(-68, 14); ctx.lineTo(-130, 35); ctx.lineTo(-130, -35);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = this.#engTail;
    ctx.beginPath();
    ctx.moveTo(-73, -13); ctx.lineTo(-73, 13); ctx.lineTo(-127, 33); ctx.lineTo(-127, -33);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = this.#darkPanel;
    ctx.beginPath();
    ctx.moveTo(-74, -12); ctx.lineTo(-74, 12); ctx.lineTo(-130, -35); ctx.lineTo(-130, 35);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = this.#upperGrad;
    ctx.beginPath();
    ctx.moveTo(-77, -11); ctx.lineTo(-77, 11); ctx.lineTo(-127, 31); ctx.lineTo(-127, -31);
    ctx.closePath(); ctx.fill();
  }

  #drawEngineHousing(ctx)
  {
    ctx.fillStyle = this.#engineHous;
    ctx.fillRect(-180, -65, 40, 130);
  }

  #drawEngines(ctx)
  {
    const flicker = Math.random() * 0.2 + 0.8;   
    const time    = Date.now() * 0.005;            

    this.#engineY.forEach(y =>
    {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      
      const plume = ctx.createLinearGradient(-162, y, -320, y);
      plume.addColorStop(0, `${this.#engPlume} ${0.5 * flicker})`);
      plume.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = plume;
      ctx.beginPath();
      ctx.moveTo(-162, y - 20);
      ctx.lineTo(-280 - (Math.sin(time + y) * 15), y);   
      ctx.lineTo(-162, y + 20);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = this.#engOuter;
      ctx.beginPath(); ctx.arc(-162, y, 24, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = this.#engMid;
      ctx.beginPath(); ctx.arc(-162, y, 18, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = this.#engCore;
      ctx.beginPath(); ctx.arc(-162, y, 6 + (Math.sin(time) * 1), 0, Math.PI * 2); ctx.fill();
    });
  }

  #drawCockpit(ctx)
  {
    ctx.fillStyle = this.#cockpitDark;
    ctx.beginPath();
    ctx.moveTo(60, -6); ctx.lineTo(140, -2); ctx.lineTo(140, 2); ctx.lineTo(60, 6);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = this.#cockpitGlow;
    ctx.beginPath();
    ctx.moveTo(80, -3); ctx.lineTo(125, -1); ctx.lineTo(125, 1); ctx.lineTo(80, 3);
    ctx.closePath(); ctx.fill();
  }

  // ── SELF-RENDERING INTERFACE ────────────────────────────────
  drawShip(ctx)
  {
    if (!this.#hullGrad)
    {
      this.#initStaticGradients(ctx);
    }

    this.#drawHull(ctx);
    this.#drawSidePanels(ctx);
    this.#drawSpine(ctx);
    this.#drawTail(ctx);
    this.#drawEngineHousing(ctx);
    this.#drawEngines(ctx);
    this.#drawCockpit(ctx);
  }
}

// ── Corvette Subclass Component ───────────────────────────────────────────────
class CorvetteEntity extends Ship
{
  // ── PRIVATE PROPERTIES ───────────────────────────────────────
  #hullDark;
  #hullMid;
  #hullShadow;
  #accentColor;
  #darkPanel;
  #cockpitDark;
  #cockpitGlow;
  #engOuter;
  #engCore;
  #engPlume;
  #enginePositions = [-38, -20, 0, 20, 38];
  #hullGrad = null;

  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor(config = {}, spawnX, spawnY)
  {
    super(config, spawnX, spawnY);

    this.#hullDark        = config.hullDark        || '#606470';
    this.#hullMid         = config.hullMid         || '#dcdfe8';
    this.#hullShadow      = config.hullShadow      || 'rgba(70, 75, 88, 1)';
    this.#accentColor     = config.accentColor     || '#b03030';
    this.#darkPanel       = config.darkPanel       || 'rgb(25, 27, 32)';
    this.#cockpitDark     = config.cockpitDark     || 'rgba(20, 24, 35, 0.95)';
    this.#cockpitGlow     = config.cockpitGlow     || 'rgba(100, 200, 255, 0.7)';
    this.#engOuter        = config.engOuter        || 'rgba(45, 50, 60, 1)';
    this.#engCore         = config.engCore         || 'rgba(255, 240, 220, 1)';
    this.#engPlume        = config.engPlume        || 'rgba(255, 145, 50,';
    this.#enginePositions = config.enginePositions || [-38, -20, 0, 20, 38];
  }

  // ── PUBLIC GETTERS & SETTERS ────────────────────────────────
  get hullDark() { return this.#hullDark; }
  set hullDark(val) { this.#hullDark = val; }

  get hullMid() { return this.#hullMid; }
  set hullMid(val) { this.#hullMid = val; }

  get accentColor() { return this.#accentColor; }
  set accentColor(val) { this.#accentColor = val; }

  get enginePositions() { return this.#enginePositions; }
  set enginePositions(val) { this.#enginePositions = val; }

  // Corvette geometry: hammerhead nose extends to x=+180, engine array to x=-150
  get noseUnits() { return 180; }
  get tailUnits() { return 220; }

  // ── PRIVATE GEOMETRY BUILDERS ──────────────────────────────
  #initGradients(ctx)
  {
    this.#hullGrad = ctx.createLinearGradient(0, -50, 0, 50);
    this.#hullGrad.addColorStop(0,   this.#hullDark);
    this.#hullGrad.addColorStop(0.5, this.#hullMid);
    this.#hullGrad.addColorStop(1,   this.#hullDark);
  }

  #drawFuselage(ctx)
  {
    // Main cylindrical hull body
    ctx.fillStyle = this.#hullGrad;
    ctx.beginPath();
    ctx.moveTo(120, -18); ctx.lineTo(-120, -28); ctx.lineTo(-120, 28); ctx.lineTo(120, 18);
    ctx.closePath(); ctx.fill();

    // Red racing / livery stripes
    ctx.fillStyle = this.#accentColor;
    ctx.fillRect(-60, -22, 140, 6);
    ctx.fillRect(-60, 16, 140, 6);

    // Mechanical greeble spine
    ctx.fillStyle = this.#darkPanel;
    ctx.fillRect(-90, -8, 160, 16);
  }

  #drawHammerhead(ctx)
  {
    // Front hammerhead command bridge
    ctx.fillStyle = this.#hullMid;
    ctx.beginPath();
    ctx.moveTo(150, -42); ctx.lineTo(170, -35); ctx.lineTo(170, 35); ctx.lineTo(150, 42);
    ctx.lineTo(110, 22);  ctx.lineTo(110, -22);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = this.#accentColor;
    ctx.beginPath();
    ctx.moveTo(155, -28); ctx.lineTo(168, -22); ctx.lineTo(168, 22); ctx.lineTo(155, 28);
    ctx.closePath(); ctx.fill();

    // Glowing cockpit visor
    ctx.fillStyle = this.#cockpitGlow;
    ctx.fillRect(160, -15, 8, 30);
  }

  #drawEngines(ctx)
  {
    const flicker = Math.random() * 0.25 + 0.75;
    const time    = Date.now() * 0.006;

    // Engine block housing
    ctx.fillStyle = this.#engOuter;
    ctx.fillRect(-155, -46, 35, 92);

    this.#enginePositions.forEach(y =>
    {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const plume = ctx.createLinearGradient(-155, y, -260, y);
      plume.addColorStop(0, `${this.#engPlume} ${0.6 * flicker})`);
      plume.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = plume;
      ctx.beginPath();
      ctx.moveTo(-155, y - 10);
      ctx.lineTo(-240 - (Math.sin(time + y) * 12), y);
      ctx.lineTo(-155, y + 10);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = this.#engOuter;
      ctx.beginPath(); ctx.arc(-155, y, 12, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = this.#engCore;
      ctx.beginPath(); ctx.arc(-155, y, 5 + (Math.sin(time) * 0.8), 0, Math.PI * 2); ctx.fill();
    });
  }

  #drawDetails(ctx)
  {
    // Communications radar dish
    ctx.strokeStyle = this.#hullDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-20, 0, 16, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
  }

  // ── SELF-RENDERING INTERFACE ────────────────────────────────
  drawShip(ctx)
  {
    if (!this.#hullGrad)
    {
      this.#initGradients(ctx);
    }
    this.#drawFuselage(ctx);
    this.#drawHammerhead(ctx);
    this.#drawDetails(ctx);
    this.#drawEngines(ctx);
  }
}

// ── Starfighter Subclass Component ────────────────────────────────────────────
class FighterEntity extends Ship
{
  // ── PRIVATE PROPERTIES ───────────────────────────────────────
  #hullDark;
  #hullMid;
  #darkPanel;
  #cockpitGlow;
  #engPlume;
  #engCore;

  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor(config = {}, spawnX, spawnY)
  {
    super(config, spawnX, spawnY);

    this.#hullDark    = config.hullDark    || '#2d3340';
    this.#hullMid     = config.hullMid     || '#50596b';
    this.#darkPanel   = config.darkPanel   || '#12151b';
    this.#cockpitGlow = config.cockpitGlow || 'rgba(100, 255, 150, 0.85)';
    this.#engPlume    = config.engPlume    || 'rgba(80, 255, 160,';
    this.#engCore     = config.engCore     || 'rgba(230, 255, 240, 1)';
  }

  // ── PUBLIC GETTERS & SETTERS ────────────────────────────────
  get hullDark() { return this.#hullDark; }
  set hullDark(val) { this.#hullDark = val; }

  get hullMid() { return this.#hullMid; }
  set hullMid(val) { this.#hullMid = val; }

  get cockpitGlow() { return this.#cockpitGlow; }
  set cockpitGlow(val) { this.#cockpitGlow = val; }

  // Fighter geometry: wings extend to x=+80, engine plumes extend to x=-120
  get noseUnits() { return 100; }
  get tailUnits() { return 140; }

  // ── PRIVATE GEOMETRY BUILDERS ──────────────────────────────
  #drawWings(ctx)
  {
    // Port solar radiator wing
    ctx.fillStyle = this.#darkPanel;
    ctx.beginPath();
    ctx.moveTo(80, -90); ctx.lineTo(-80, -110); ctx.lineTo(-80, -50); ctx.lineTo(80, -30);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = this.#hullMid; ctx.lineWidth = 2; ctx.stroke();

    // Starboard solar radiator wing
    ctx.beginPath();
    ctx.moveTo(80, 90); ctx.lineTo(-80, 110); ctx.lineTo(-80, 50); ctx.lineTo(80, 30);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = this.#hullMid; ctx.lineWidth = 2; ctx.stroke();

    // Wing pylons / connecting struts
    ctx.fillStyle = this.#hullDark;
    ctx.fillRect(-20, -70, 40, 140);
  }

  #drawCockpitPod(ctx)
  {
    // Central pressurized cockpit sphere
    ctx.fillStyle = this.#hullMid;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();

    // Cockpit viewport
    ctx.fillStyle = this.#cockpitGlow;
    ctx.beginPath();
    ctx.arc(14, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = this.#darkPanel;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  #drawEngines(ctx)
  {
    const flicker = Math.random() * 0.3 + 0.7;
    const time    = Date.now() * 0.008;

    [-14, 14].forEach(y =>
    {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const plume = ctx.createLinearGradient(-30, y, -120, y);
      plume.addColorStop(0, `${this.#engPlume} ${0.7 * flicker})`);
      plume.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = plume;
      ctx.beginPath();
      ctx.moveTo(-30, y - 8);
      ctx.lineTo(-100 - (Math.sin(time + y) * 10), y);
      ctx.lineTo(-30, y + 8);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = this.#engCore;
      ctx.beginPath(); ctx.arc(-30, y, 4, 0, Math.PI * 2); ctx.fill();
    });
  }

  // ── SELF-RENDERING INTERFACE ────────────────────────────────
  drawShip(ctx)
  {
    this.#drawWings(ctx);
    this.#drawCockpitPod(ctx);
    this.#drawEngines(ctx);
  }
}

// ── Aliases for developer convenience ─────────────────────────
const StarDestroyerShip = StarDestroyerEntity;
const CorvetteShip = CorvetteEntity;
const FighterShip = FighterEntity;
