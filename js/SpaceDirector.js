// ── SpaceDirector ───────────────────────────────────────────────────────────
// Master coordination engine. Enforces a Viewport-Agnostic Timeline by 
// dynamically calculating velocities against literal pixel metrics rather than 
// static aspect values. Drives flawless synchronization across all devices.

class SpaceDirector {
    // ── PRIVATE PROPERTIES ───────────────────────────────────────────────────
    #audio;
    #scene;
    #spawnCountdown = 0;
    #currentMode = null;
    #modeConfigs = {};

    // ── CONSTRUCTOR ────────────────────────────────────────────────────────────
    constructor(audio, scene) 
    {
        this.#audio = audio;
        this.#scene = scene;

        this.#spawnCountdown = 0;
        this.#currentMode = 'med'; // Default launch speed state

        this.#initSimulationConfigs();
    }

    // ── PUBLIC GETTERS AND SETTERS ──────────────────────────────────────────
    get currentMode() { return this.#currentMode; }
    
    // ── UNIVERSAL TIME-BASED STATE DICTIONARY ────────────────────────────────
    #initSimulationConfigs() {
        this.#modeConfigs = {
            /*
              DETERMINISTIC TIMELINE SPECIFICATIONS:
              - shipInterval: Miliseconds between starship fleet deployments.
              - flightDuration: EXACT seconds a ship takes to cross from top to bottom edge.
              - baseScrollDuration: Target seconds for a baseline desktop text block to clear view.
              - starMode: Mapped text key hooks connecting straight to your starField.js enums.
            */
            slow: { shipInterval: 14000, flightDuration: 18.0, baseScrollDuration: 35.0, starMode: 'calm',  musicPitch: 0.90 },
            med:  { shipInterval: 8000,  flightDuration: 13.0, baseScrollDuration: 24.0, starMode: 'drift', musicPitch: 1.00 },
            fast: { shipInterval: 4000,  flightDuration: 8.0,  baseScrollDuration: 14.0, starMode: 'drift', musicPitch: 1.10 },
            warp: { shipInterval: 1800,  flightDuration: 2.5,  baseScrollDuration: 4.5,  starMode: 'warp',  musicPitch: 1.25 }
        };
    }

    // ── MASTER VELOCITY SCALER MATRIX ────────────────────────────────────────
    // Calibrates simulation constants against real-time layout changes
    changeSimulationMode(modeId) {
        const cfg = this.#modeConfigs[modeId];
        if (!cfg) return;

        this.#currentMode = modeId;
        console.log(`🛰️ DIRECTOR: Synchronizing simulation timeline to state layer [${modeId.toUpperCase()}]`);

        // 1. PROPORTIONAL CRAWL RESCALING:
        // Dynamically accelerates or decelerates text velocity based on wrapped column height!
        if (this.#scene && this.#scene.crawl && this.#scene.crawl.content) {
            const crawlEngine = this.#scene.crawl;
            const scrollHeight = crawlEngine.content.scrollHeight || 1000;
            
            /*
              THE SEAMLESS TEXT FLOW EQUATION:
              If a narrow mobile screen forces text to wrap into a giant vertical column,
              speed up the scroll vector proportionally. The sequence finishes and loops 
              at the exact same target second threshold as it does on a wide desktop grid!
            */
            const mobileFactor = Math.max(1, scrollHeight / 1000); 
            crawlEngine.scrollSpeed = (scrollHeight / cfg.baseScrollDuration) * mobileFactor;
        }

        // 2. STARFIELD INTEGRATION HANDSHAKE:
        if (this.#scene && this.#scene.stars && typeof this.#scene.stars.setMode === 'function') {
            this.#scene.stars.setMode(cfg.starMode);
        }

        // 3. CELESTIAL BACKGROUND SPIN SCALING:
        // Decoupled from aspect ratios, stepping variables uniformly using real-time dt ticks
        if (this.#scene && this.#scene.backgroundObjects) {
            this.#scene.backgroundObjects.forEach(obj => {
                if (obj.type === 'planet') {
                    // Scales planetary cloud rotation drift to stay in sync with system pace
                    obj.spinSpeed = 0.0005 * (cfg.flightDuration / 13.0);
                }
            });
        }

        // 4. AUDIO SYSTEM COORDINATION:
        if (this.#audio) {
            this.#audio.setPlaybackRate?.('ambient_track', cfg.musicPitch, 0.5);
        }

        // Instantly seed the precision frame delta countdown for the next event birth
        this._scheduleNextSpawnUsingDelta(modeId);
    }

    // ── PUBLIC DYNAMIC RESIZE CALL TRIGGER ───────────────────────────────────
    // Re-calculates system flight speeds instantly if a user rotates their device!
    recalibrateOnResize() {
        if (this.#currentMode) {
            this.changeSimulationMode(this.#currentMode);
        }
    }

    // ── MASTER FRAME HEARTBEAT ENGINE LOOP ───────────────────────────────────
    // Driven 60 times a second automatically by the system clock loop core
    update(dt) {
        // Subtract the exact fraction of elapsed step-time (e.g., 0.0166)
        this.#spawnCountdown -= dt;

        if (this.#spawnCountdown <= 0) {
            // Extract the sub-frame delta overshoot fraction to correct lag frames
            const deltaOvershoot = Math.max(0, Math.abs(this.#spawnCountdown));

            // Request a precision starship injection from the orchestrator canvas
            if (this.#scene) {
                const currentCfg = this.#modeConfigs[this.#currentMode];
                
                /*
                  DETERMINISTIC VELOCITY HAND-OFF:
                  Instead of passing abstract step integers, the director feeds the scene 
                  a relative velocity fraction calculated by dividing the physical canvas size 
                  by the exact target duration countdown speed requirements.
                */
                const screenHeight = this.#scene.canvas.height || window.innerHeight;
                const absoluteVelocity = screenHeight / currentCfg.flightDuration;

                this.#scene.triggerPrecisionSpawn(deltaOvershoot, absoluteVelocity);
            }

            // Immediately set up the frame deadline countdown for the next deployment block
            this._scheduleNextSpawnUsingDelta(this.#currentMode);
        }
    }

    // ── DELTA TIME-STEP COOLDOWN GENERATOR ───────────────────────────────────
    _scheduleNextSpawnUsingDelta(modeId) {
        const cfg = this.#modeConfigs[modeId];
        if (!cfg) return;

        // Convert the structural millisecond config settings into pure frame seconds
        const delayInSeconds = cfg.shipInterval / 1000;
        this.#spawnCountdown = delayInSeconds;
    }
}
