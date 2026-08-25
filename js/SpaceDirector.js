// ──────────────────────────────────────────────────────────────
// ── SPACEDIRECTOR ─────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Master coordination engine and timeline coordinator.
//              Enforces a Viewport-Agnostic Timeline by dynamically calculating
//              velocities against literal pixel metrics rather than static aspect values.
// Core Role:   Manages simulation speed states, synchronizes audio, visuals, and spawners
// Dependencies: CONFIG, AudioManager, Scene
//

class SpaceDirector
{
  // ── PRIVATE PROPERTIES ───────────────────────────────────────
  #audio;
  #scene;
  #spawnCountdown = 0;
  #hasSpawnedFirstShip = false;
  #currentMode = null;
  #modeConfigs = {};
  #boundResize;

  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor(audio, scene)
  {
    this.#audio = audio;
    this.#scene = scene;
    const initialDelay = (typeof CONFIG !== 'undefined' && CONFIG.DIRECTOR && typeof CONFIG.DIRECTOR.SHIP_FIRST_APPEAR_DELAY_SEC === 'number')
      ? CONFIG.DIRECTOR.SHIP_FIRST_APPEAR_DELAY_SEC
      : ((typeof CONFIG !== 'undefined' && CONFIG.cinematicTiming && CONFIG.cinematicTiming.initialShipEntryDelay) ? CONFIG.cinematicTiming.initialShipEntryDelay : 4.0);
    this.#spawnCountdown = initialDelay;
    this.#hasSpawnedFirstShip = false;
    this.#currentMode = 'med'; // Default launch speed state

    this.#initSimulationConfigs();

    // Log director initialization parameters
    const initialScreenW = (typeof window !== 'undefined') ? window.innerWidth : 1200;
    const initialScreenH = (typeof window !== 'undefined') ? window.innerHeight : 800;
    let initialScreenCat = 'Desktop';
    if (initialScreenW < 768) initialScreenCat = 'Mobile';
    else if (initialScreenW <= 1024) initialScreenCat = 'Tablet';
    else if (initialScreenW > 1920) initialScreenCat = 'Ultrawide';

    console.log(`[DIRECTOR INIT] First ship in: ${initialDelay.toFixed(1)}s | Mode: MED | Screen: ${initialScreenCat} (${initialScreenW}x${initialScreenH}px)`);

    this.#boundResize = () =>
    {
      this.recalibrateOnResize();
    };
    window.addEventListener('resize', this.#boundResize);
  }

  // ── PUBLIC GETTERS AND SETTERS ──────────────────────────────
  get audio() { return this.#audio; }
  set audio(val) { this.#audio = val; }

  get scene() { return this.#scene; }
  set scene(val) { this.#scene = val; }

  get currentMode() { return this.#currentMode; }
  set currentMode(val) { this.changeSimulationMode(val); }

  get spawnCountdown() { return this.#spawnCountdown; }
  set spawnCountdown(val) { this.#spawnCountdown = val; }

  get modeConfigs() { return this.#modeConfigs; }
  set modeConfigs(val) { this.#modeConfigs = val; }

  // ── UNIVERSAL TIME-BASED STATE DICTIONARY ──────────────────
  #initSimulationConfigs()
  {
    const dir = (typeof CONFIG !== 'undefined' && CONFIG.DIRECTOR) ? CONFIG.DIRECTOR : null;
    const baseFlight = (dir && typeof dir.SHIP_FLIGHT_DURATION_SEC === 'number') ? dir.SHIP_FLIGHT_DURATION_SEC : 45.0;
    const baseInterval = (dir && typeof dir.SHIP_RESPAWN_INTERVAL_SEC === 'number') ? (dir.SHIP_RESPAWN_INTERVAL_SEC * 1000) : 10000;
    const baseCrawl = (dir && typeof dir.CRAWL_SCROLL_DURATION_SEC === 'number') ? dir.CRAWL_SCROLL_DURATION_SEC : 95.0;
    const mults = (dir && dir.SPEED_MULTIPLIERS) ? dir.SPEED_MULTIPLIERS : null;

    const getModeCfg = (modeKey, defaultDurMult, defaultSpeedMult, defaultIntervalMult, defaultStar, defaultPitch) => {
      const m = (mults && mults[modeKey]) ? mults[modeKey] : {};
      const durMult = (typeof m.durationMultiplier === 'number') ? m.durationMultiplier : defaultDurMult;
      const respawnMult = (typeof m.respawnMultiplier === 'number') ? m.respawnMultiplier : defaultIntervalMult;
      return {
        shipInterval:       baseInterval * respawnMult,
        flightDuration:     baseFlight * durMult,
        baseScrollDuration: baseCrawl * durMult,
        starMode:           m.starMode || defaultStar,
        musicPitch:         m.pitch || defaultPitch
      };
    };

    this.#modeConfigs = {
      slow: getModeCfg('slow', 1.35, 0.74, 1.30, 'calm',  0.92),
      med:  getModeCfg('med',  1.00, 1.00, 1.00, 'drift', 1.00),
      fast: getModeCfg('fast', 0.65, 1.50, 0.70, 'drift', 1.10),
      warp: getModeCfg('warp', 0.20, 5.00, 0.25, 'warp',  1.25)
    };
  }

  // ── MASTER VELOCITY SCALER MATRIX ──────────────────────────
  // Calibrates simulation constants against real-time layout changes
  changeSimulationMode(modeId)
  {
    const cfg = this.#modeConfigs[modeId];
    if (!cfg) return;

    this.#currentMode = modeId;

    // 1. Proportional Crawl Rescaling
    if (this.#scene && this.#scene.crawl)
    {
      this.#scene.crawl.setSpeed(modeId);
    }

    // 2. Starfield Integration Handshake
    if (this.#scene && this.#scene.stars && typeof this.#scene.stars.setMode === 'function')
    {
      this.#scene.stars.setMode(cfg.starMode);
    }

    // 3. Celestial Background Spin Scaling
    if (this.#scene && this.#scene.backgroundObjects)
    {
      this.#scene.backgroundObjects.forEach(obj => {
        if (obj.type === 'planet')
        {
          obj.spinSpeed = 0.0005 * (cfg.flightDuration / 13.0);
        }
      });
    }

    // 4. Audio System Coordination
    if (this.#audio && typeof this.#audio.setPlaybackRate === 'function')
    {
      this.#audio.setPlaybackRate('ambient_track', cfg.musicPitch, 0.5);
    }

    // Seed frame delta countdown for next event only if initial ship has already flown
    if (this.#hasSpawnedFirstShip)
    {
      this.#scheduleNextSpawnUsingDelta(modeId);
    }

    // Log active simulation and crawl speeds
    const screenW = (this.#scene && this.#scene.canvas) ? this.#scene.canvas.width : window.innerWidth;
    const screenH = (this.#scene && this.#scene.canvas) ? this.#scene.canvas.height : window.innerHeight;
    let screenCat = 'Desktop';
    if (screenW < 768) screenCat = 'Mobile';
    else if (screenW <= 1024) screenCat = 'Tablet';
    else if (screenW > 1920) screenCat = 'Ultrawide';

    const crawlSpeedPx = (this.#scene && this.#scene.crawl && typeof this.#scene.crawl.pxPerSec === 'number')
      ? this.#scene.crawl.pxPerSec.toFixed(1)
      : (screenH / (cfg.baseScrollDuration || 65)).toFixed(1);

    console.log(`[SPEED CHANGE] Mode: ${modeId.toUpperCase()} | Ship Cruise: ${(cfg.flightDuration || 26).toFixed(1)}s | Crawl Speed: ~${crawlSpeedPx} px/s (${(cfg.baseScrollDuration || 65).toFixed(1)}s duration) | Screen: ${screenCat} (${screenW}x${screenH}px)`);
  }

  // ── PUBLIC DYNAMIC RESIZE CALL TRIGGER ─────────────────────
  recalibrateOnResize()
  {
    if (this.#currentMode)
    {
      this.changeSimulationMode(this.#currentMode);
    }
  }

  // ── MASTER FRAME HEARTBEAT ENGINE LOOP ─────────────────────
  update(dt)
  {
    // If a ship is currently active in scene, let it complete its passage
    if (this.#scene && this.#scene.ships && this.#scene.ships.length > 0)
    {
      return;
    }

    // Convert logic tick dt (where 1.0 = 1/60s) to real-world seconds
    const dtSeconds = dt * (typeof CONFIG !== 'undefined' && CONFIG.System ? CONFIG.System.FIXED_TIMESTEP : (1 / 60));
    this.#spawnCountdown -= dtSeconds;

    if (this.#spawnCountdown <= 0)
    {
      this.#hasSpawnedFirstShip = true;
      const deltaOvershoot = Math.max(0, Math.abs(this.#spawnCountdown)) * 60;

      if (this.#scene)
      {
        const currentCfg = this.#modeConfigs[this.#currentMode] || this.#modeConfigs.med;
        const flightDuration = currentCfg.flightDuration || 50.0;

        // Safely pull the active loop index blueprint direct from our scene class
        const currentShipBlueprint = this.#scene.getCurrentShipBlueprint();

        // Delivers the target blueprint and flight duration into the scene
        this.#scene.triggerPrecisionSpawn(currentShipBlueprint, deltaOvershoot, flightDuration);
      }

      this.#scheduleNextSpawnUsingDelta(this.#currentMode);
    }
  }

  // ── DELTA TIME-STEP COOLDOWN GENERATOR ─────────────────────
  #scheduleNextSpawnUsingDelta(modeId)
  {
    const cfg = this.#modeConfigs[modeId] || this.#modeConfigs.med;
    if (!cfg) return;

    const delayInSeconds = cfg.shipInterval / 1000;
    this.#spawnCountdown = delayInSeconds;
  }

  destroy()
  {
    if (this.#boundResize)
    {
      window.removeEventListener('resize', this.#boundResize);
    }
    this.#audio = null;
    this.#scene = null;
  }
}
