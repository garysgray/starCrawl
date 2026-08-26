// ──────────────────────────────────────────────────────────────
// ── ENGINE ───────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Core system coordinator that initializes and connects all subsystems
// Core Role:   Maintains references to all major systems and handles their interactions
// Dependencies: CONFIG, AudioManager, Scene, SpaceDirector, HUD, UIManager
//

class Engine
{
  // ── PRIVATE PROPERTIES ──────────────────────────────────────
  #audio;
  #scene;
  #director;
  #hud;
  #ui;

  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor()
  {
    // Pull user settings from storage
    const settings = this.#loadSettingsFromStorage();

    // Instantiate core subsystem layers (Composition Root)
    this.#audio = new AudioManager();
    this.#scene = new Scene(this.#audio);
    this.#director = new SpaceDirector(this.#audio, this.#scene);
    this.#hud = new HUD(CONFIG.hud);
    this.#ui = new UIManager(this.#audio, this.#scene, this.#director);

    // UI Component Registration
    this.#ui.registerComponent('primary_hud', this.#hud);

    // Handle browser audio autoplay restriction
    document.addEventListener('click', () => { this.#audio.resume(); }, { once: true });

    // Trigger system startup sequence
    this.start(settings.activeSpeed, settings.activeStars);
  }

  // ── PUBLIC SUBSYSTEM ACCESSORS ─────────────────────────────
  get audio() { return this.#audio; }
  set audio(val) { this.#audio = val; }

  get scene() { return this.#scene; }
  set scene(val) { this.#scene = val; }

  get director() { return this.#director; }
  set director(val) { this.#director = val; }

  get hud() { return this.#hud; }
  set hud(val) { this.#hud = val; }

  get ui() { return this.#ui; }
  set ui(val) { this.#ui = val; }

  // ── STORAGE LOADER ─────────────────────────────────────────
  #loadSettingsFromStorage()
  {
    return {
      activeSpeed: StorageUtil.get(CONFIG.StorageKeys.CRAWL_SPEED, CONFIG.SpeedModes.MED),
      activeStars: StorageUtil.get(CONFIG.StorageKeys.STAR_MODE, CONFIG.StarModes.DRIFT)
    };
  }

  // ── FRAME LIFECYCLE ────────────────────────────────────────
  // Called by Main's gameLoop with the FIXED_TIMESTEP delta time
  update(dt)
  {
    if (this.#director && typeof this.#director.update === 'function')
    {
      this.#director.update(dt);
    }
    if (this.#scene && typeof this.#scene.update === 'function')
    {
      this.#scene.update(dt);
    }
  }

  draw(alpha)
  {
    if (this.#scene && typeof this.#scene.draw === 'function')
    {
      this.#scene.draw(alpha);
    }
  }

  // ── INITIAL SYSTEM START ───────────────────────────────────
  start(speedMode, starMode)
  {
    // Apply speed settings to crawl and simulation director
    if (this.#scene && this.#scene.crawl)
    {
      this.#scene.crawl.setSpeed(speedMode);
    }

    if (this.#director && typeof this.#director.changeSimulationMode === 'function')
    {
      this.#director.changeSimulationMode(speedMode);
    }

    // Apply star mode
    if (this.#scene && this.#scene.stars)
    {
      this.#scene.stars.setMode(starMode);
    }

    // Broadcast initial layout states to UI components
    if (this.#ui && typeof this.#ui.initLayoutStates === 'function')
    {
      this.#ui.initLayoutStates([
        { actionType: CONFIG.UIActions.SET_SPEED, value: speedMode },
        { actionType: CONFIG.UIActions.SET_STARS, value: starMode }
      ]);
    }
  }

  // ── MASTER CLEANUP LIFECYCLE ───────────────────────────────
  shutdown()
  {
    console.log("Engine: Commencing complete system teardown...");
    if (this.#ui && this.#ui.components)
    {
      this.#ui.components.forEach((c) => {
        if (c && typeof c.destroy === 'function') c.destroy();
      });
    }
    if (this.#ui && typeof this.#ui.destroy === 'function') this.#ui.destroy();
    if (this.#director && typeof this.#director.destroy === 'function') this.#director.destroy();
    if (this.#scene && typeof this.#scene.destroy === 'function') this.#scene.destroy();
    if (this.#audio && typeof this.#audio.stopAll === 'function') this.#audio.stopAll();

    this.#audio = null;
    this.#scene = null;
    this.#director = null;
    this.#hud = null;
    this.#ui = null;
    console.log("Engine: Teardown complete.");
  }
}
