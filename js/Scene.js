// ──────────────────────────────────────────────────────────────
// ── SCENE ─────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Owns the visual simulation components: stars, background objects, ships, crawl.
// Core Role:   Manages visual canvas elements and rendering passes
// Dependencies: CONFIG, StarField, Crawl, Ship, ShipRenderer, SpaceObject, SpaceObjectRenderer
//

class Scene 
{
  // ── PRIVATE PROPERTIES ───────────────────────────────────────
  #stars;
  #crawl;
  #ships = [];
  #backgroundObjects = [];
  #canvas;
  #ctx;
  #renderer;
  #spaceObjCanvas;
  #spaceObjCtx;
  #spaceObjRenderer;
  #boundResize;

  // Track the progression loops as plain index counters
  #planetIndex = 0;
  #shipIndex = 0;
  #telemetryTimer = 0; // Periodic logger every 3 seconds

  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor(audio) 
  {
    this.#stars = new StarField();
    this.#crawl = new Crawl(audio);
    this.#ships = [];

    // Turn catalog keys into an indexed list array to load the first element
    const planetList = Object.values(CELESTIAL_CATALOG);
    const initialBlueprint = planetList[this.#planetIndex];
    
    // Choose between a planet or station entity based explicitly on data attributes
    const activeSpaceObj = (initialBlueprint.objectType === 'station')
      ? new SpaceStationEntity(initialBlueprint)
      : new PlanetEntity(initialBlueprint);

    this.#backgroundObjects = [ activeSpaceObj ];

    // Viewport Canvases Initialization
    this.#canvas = document.getElementById('ships');
    this.#ctx = this.#canvas ? this.#canvas.getContext('2d') : null;
    this.#renderer = new ShipRenderer();

    this.#spaceObjCanvas = document.getElementById('space-object');
    this.#spaceObjCtx    = this.#spaceObjCanvas ? this.#spaceObjCanvas.getContext('2d') : null;
    this.#spaceObjRenderer = new SpaceObjectRenderer();

    this.#resize();
    this.#boundResize = () =>
    {
      this.#resize();
      if (this.#crawl && typeof this.#crawl.recalculateBounds === 'function') 
      {
        this.#crawl.recalculateBounds();
      }
    };
    window.addEventListener('resize', this.#boundResize);
  }

  // ── PUBLIC GETTERS & SETTERS ────────────────────────────────
  get stars() { return this.#stars; }
  set stars(val) { this.#stars = val; }

  get crawl() { return this.#crawl; }
  set crawl(val) { this.#crawl = val; }

  get ships() { return this.#ships; }
  set ships(val) { this.#ships = val; }

  get backgroundObjects() { return this.#backgroundObjects; }
  set backgroundObjects(val) { this.#backgroundObjects = val; }

  get canvas() { return this.#canvas; }
  get ctx() { return this.#ctx; }

  get spaceObjCanvas() { return this.#spaceObjCanvas; }
  get spaceObjCtx() { return this.#spaceObjCtx; }

  get renderer() { return this.#renderer; }
  get spaceObjRenderer() { return this.#spaceObjRenderer; }

  // ── Setup & Viewport Bounds ─────────────────────────────────
  #resize() 
  {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (this.#canvas)
    {
      this.#canvas.width = w;
      this.#canvas.height = h;
    }
    if (this.#spaceObjCanvas)
    {
      this.#spaceObjCanvas.width = w;
      this.#spaceObjCanvas.height = h;
    }
  }

  // ── Helper Loggers for Diagnostics & Fine-Tuning ────────────
  #getScreenInfo(w, h)
  {
    const width = w || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const height = h || (typeof window !== 'undefined' ? window.innerHeight : 600);
    let category = 'Desktop';
    if (width < 768) {
      category = 'Mobile';
    } else if (width <= 1024) {
      category = 'Tablet';
    } else if (width > 1920) {
      category = 'Ultrawide';
    }
    return { category, width, height, label: `${category} (${width}x${height}px)` };
  }

  #getShipName(blueprint, ship)
  {
    const typeMap = {
      starDestroyer: 'Star Destroyer',
      corvette:      'Blockade Runner',
      fighter:       'Scout Fighter'
    };
    const key = (ship && ship.shipType) || (blueprint && (blueprint.shipType || blueprint.objectType)) || 'ship';
    return typeMap[key] || key;
  }

  #getPlanetName(index)
  {
    const keys = (typeof CELESTIAL_CATALOG !== 'undefined') ? Object.keys(CELESTIAL_CATALOG) : [];
    if (!keys.length) return 'Unknown';
    const key = keys[((index % keys.length) + keys.length) % keys.length];
    const nameMap = {
      gasGiantAlpha:  'Gas Giant',
      deathStarAlpha: 'Death Star',
      tatooine:       'Tatooine',
      hoth:           'Hoth',
      endor:          'Endor',
      mustafar:       'Mustafar',
      bespin:         'Bespin',
      dagobah:        'Dagobah',
      coruscant:      'Coruscant'
    };
    return nameMap[key] || key;
  }

  // ── Time-Synchronized Spawner ──────────────────────────────
  // The ship blueprint parameter and target flight duration are passed in from SpaceDirector!
  triggerPrecisionSpawn(selectedBlueprint, deltaOvershoot, targetDurationOrVelocity) 
  {
    const totalInFleet = this.#ships.length;
    if (totalInFleet > 0) return;

    const canvasW = (this.#canvas && this.#canvas.width) ? this.#canvas.width : window.innerWidth;
    const canvasH = (this.#canvas && this.#canvas.height) ? this.#canvas.height : window.innerHeight;

    const durationSec = (typeof targetDurationOrVelocity === 'number' && targetDurationOrVelocity > 0 && targetDurationOrVelocity < 300)
      ? targetDurationOrVelocity
      : 50.0;

    const newShip = Ship.create(selectedBlueprint); 
    newShip.hasEnteredViewLog = false;
    newShip.calculateSpeedForDuration(canvasW, canvasH, durationSec);
    
    const fixedTimestep = (typeof CONFIG !== 'undefined' && CONFIG.System && CONFIG.System.FIXED_TIMESTEP) 
      ? CONFIG.System.FIXED_TIMESTEP 
      : 1 / 60;
        
    const overshootDt = deltaOvershoot * (fixedTimestep / (1 / 60));
    if (overshootDt > 0)
    {
      newShip.update(null, overshootDt);
    }

    this.#ships.push(newShip);

    // ── DEBUG LOG: Clean Plain Text Spawning Data ──────────
    const screenInfo = this.#getScreenInfo(canvasW, canvasH);
    const shipName = this.#getShipName(selectedBlueprint, newShip);
    const totalDistPx = Math.hypot(
      ((newShip.endX - newShip.startX) / 100) * canvasW,
      ((newShip.endY - newShip.startY) / 100) * canvasH
    );
    const speedPxPerSec = totalDistPx / durationSec;
    const distanceToScreen = Math.max(0, newShip.yPct - 100);
    const speedPctYPerSec = Math.abs(newShip.endY - newShip.startY) / durationSec;
    const etaSeconds = (speedPctYPerSec > 0) ? (distanceToScreen / speedPctYPerSec) : 0;
    const crawlSpeedPx = (this.#crawl && typeof this.#crawl.pxPerSec === 'number') ? this.#crawl.pxPerSec.toFixed(1) : 'N/A';
    const crawlDur = (this.#crawl && typeof this.#crawl.duration === 'number') ? this.#crawl.duration.toFixed(1) : 'N/A';

    console.log(`[SHIP SPAWN] Type: ${shipName} | Screen: ${screenInfo.label} | Ship Speed: ${speedPxPerSec.toFixed(1)} px/s (${durationSec.toFixed(1)}s duration) | Enters screen in: ${etaSeconds.toFixed(1)}s | Crawl Speed: ${crawlSpeedPx} px/s (${crawlDur}s duration)`);
  }

  // ── Loop Core ──────────────────────────────────────────────
  update(dt) 
  {
    if (this.#stars) this.#stars.update(dt);
    if (this.#crawl) this.#crawl.update(dt);

    if (this.#backgroundObjects)
    {
      this.#backgroundObjects.forEach(obj => obj.update(dt));
    }

    const canvasW = (this.#canvas && this.#canvas.width) ? this.#canvas.width : window.innerWidth;
    const canvasH = (this.#canvas && this.#canvas.height) ? this.#canvas.height : window.innerHeight;

    for (let i = this.#ships.length - 1; i >= 0; i--) 
    {
      const s = this.#ships[i];
      s.update(null, dt);

      // Log when ship nose visibly enters the viewport (Y <= 100%)
      if (!s.hasEnteredViewLog && s.yPct <= 100 && s.yPct >= 0) 
      {
        s.hasEnteredViewLog = true;
        const screenInfo = this.#getScreenInfo(canvasW, canvasH);
        const shipName = this.#getShipName(null, s);
        const totalDistPx = Math.hypot(
          ((s.endX - s.startX) / 100) * canvasW,
          ((s.endY - s.startY) / 100) * canvasH
        );
        const speedPxPerSec = totalDistPx / s.duration;
        const shipXpx = Math.round((s.xPct / 100) * canvasW);
        const shipYpx = Math.round((s.yPct / 100) * canvasH);
        console.log(`[SHIP VISIBLE] ${shipName} entered screen | Pos: (${s.xPct.toFixed(1)}%, ${s.yPct.toFixed(1)}%) = [${shipXpx}px, ${shipYpx}px] | Speed: ${speedPxPerSec.toFixed(1)} px/s | Screen: ${screenInfo.label}`);
      }

      // ── CINEMATIC ECLIPSE PLANET SWAP ──────────────────────────────
      // When the massive ship hull reaches the transition percentage of its path,
      // silently swap the background planet behind the ship!
      const transitionPct = (typeof CONFIG !== 'undefined' && CONFIG.DIRECTOR && typeof CONFIG.DIRECTOR.PLANET_TRANSITION_AT_PCT === 'number')
        ? CONFIG.DIRECTOR.PLANET_TRANSITION_AT_PCT
        : 0.50;

      if (!s.hasSwappedPlanet && s.progress >= transitionPct)
      {
        s.hasSwappedPlanet = true;
        const shipName = this.#getShipName(null, s);
        const shipXpx = Math.round((s.xPct / 100) * canvasW);
        const shipYpx = Math.round((s.yPct / 100) * canvasH);
        console.log(`[SHIP MIDPOINT] ${shipName} reached 50% pass | Pos: (${s.xPct.toFixed(1)}%, ${s.yPct.toFixed(1)}%) = [${shipXpx}px, ${shipYpx}px]`);
        this.#cycleNextPlanet();
      }

      // Check when the current ship finishes its flight profile passage
      if (s.isDead(canvasW, canvasH)) 
      {
        if (!s.hasSwappedPlanet)
        {
          this.#cycleNextPlanet();
        }
        const shipName = this.#getShipName(null, s);
        const nextDelay = (typeof CONFIG !== 'undefined' && CONFIG.DIRECTOR && typeof CONFIG.DIRECTOR.SHIP_RESPAWN_INTERVAL_SEC === 'number')
          ? CONFIG.DIRECTOR.SHIP_RESPAWN_INTERVAL_SEC
          : 10.0;
        console.log(`[SHIP EXIT] ${shipName} cleared top of screen. Next ship spawn in: ${nextDelay.toFixed(1)}s`);
        this.#ships.splice(i, 1);
        this.#cycleNextShip(); // Advance ship pointer for the next launch
      }
    }

    // ── PERIODIC COORDINATE TELEMETRY (Every 3.0 seconds while active) ──
    const dtSeconds = (dt || 1) * (typeof CONFIG !== 'undefined' && CONFIG.System ? CONFIG.System.FIXED_TIMESTEP : (1 / 60));
    this.#telemetryTimer += dtSeconds;
    if (this.#telemetryTimer >= 3.0)
    {
      this.#telemetryTimer = 0;
      const screenInfo = this.#getScreenInfo(canvasW, canvasH);
      
      // Crawl state
      let crawlStr = 'Crawl: idle';
      if (this.#crawl)
      {
        const crawlY = (typeof this.#crawl.yPos === 'number') ? this.#crawl.yPos.toFixed(0) : '0';
        const crawlSpd = (typeof this.#crawl.pxPerSec === 'number') ? this.#crawl.pxPerSec.toFixed(1) : '0';
        const crawlTot = (typeof this.#crawl.totalDistance === 'number') ? this.#crawl.totalDistance.toFixed(0) : '1000';
        crawlStr = `Crawl: Y=${crawlY}px / ${crawlTot}px (${crawlSpd} px/s)`;
      }

      // Ship state
      if (this.#ships.length > 0)
      {
        const activeShip = this.#ships[0];
        const shipName = this.#getShipName(null, activeShip);
        const shipXpx = Math.round((activeShip.xPct / 100) * canvasW);
        const shipYpx = Math.round((activeShip.yPct / 100) * canvasH);
        const totalDistPx = Math.hypot(
          ((activeShip.endX - activeShip.startX) / 100) * canvasW,
          ((activeShip.endY - activeShip.startY) / 100) * canvasH
        );
        const shipSpd = totalDistPx / activeShip.duration;
        console.log(`[STATUS] Ship: ${shipName} at (${activeShip.xPct.toFixed(1)}%, ${activeShip.yPct.toFixed(1)}%) = [${shipXpx}px, ${shipYpx}px] (${shipSpd.toFixed(1)} px/s, ${(activeShip.progress * 100).toFixed(0)}%) | ${crawlStr} | Screen: ${screenInfo.label}`);
      }
      else
      {
        console.log(`[STATUS] Ship: (none active in fleet) | ${crawlStr} | Screen: ${screenInfo.label}`);
      }
    }
  }

  // ── Asset Cycling Mechanisms ───────────────────────────────
  #cycleNextPlanet()
  {
    const planetList = Object.values(CELESTIAL_CATALOG);
    if (!planetList.length) return;

    const prevPlanetName = this.#getPlanetName(this.#planetIndex);

    this.#planetIndex = (this.#planetIndex + 1) % planetList.length;
    const nextPlanetBlueprint = planetList[this.#planetIndex];
    const newPlanetName = this.#getPlanetName(this.#planetIndex);
    const queuedNextPlanetName = this.#getPlanetName(this.#planetIndex + 1);

    const nextSpaceObj = (nextPlanetBlueprint.objectType === 'station')
      ? new SpaceStationEntity(nextPlanetBlueprint)
      : new PlanetEntity(nextPlanetBlueprint);

    this.#backgroundObjects = [ nextSpaceObj ];

    const canvasW = (this.#canvas && this.#canvas.width) ? this.#canvas.width : window.innerWidth;
    const canvasH = (this.#canvas && this.#canvas.height) ? this.#canvas.height : window.innerHeight;
    const screenInfo = this.#getScreenInfo(canvasW, canvasH);

    console.log(`[PLANET CHANGED] Active: ${newPlanetName} | Next in queue: ${queuedNextPlanetName} | Screen: ${screenInfo.label}`);
  }

  #cycleNextShip()
  {
    const shipList = Object.values(SHIP_CATALOG);
    if (!shipList.length) return;

    this.#shipIndex = (this.#shipIndex + 1) % shipList.length;
  }

  // Public getter method allowing the external loop to read what ship index is currently active!
  getCurrentShipBlueprint()
  {
    const shipList = Object.values(SHIP_CATALOG);
    return shipList[this.#shipIndex];
  }

  draw(alpha) 
  {
    if (this.#stars) this.#stars.draw(alpha);
    this.#drawBackgroundEntities(alpha); 
    this.#drawShips(alpha);
    if (this.#crawl) this.#crawl.draw(alpha);
  }

  #drawBackgroundEntities(alpha) 
  {
    if (!this.#spaceObjCtx || !this.#spaceObjCanvas) return;
    const ctx = this.#spaceObjCtx;
    const w = this.#spaceObjCanvas.width;
    const h = this.#spaceObjCanvas.height;

    ctx.clearRect(0, 0, w, h);
    if (this.#backgroundObjects)
    {
      this.#backgroundObjects.forEach(obj => {
        this.#spaceObjRenderer.draw(ctx, obj, w, h, alpha);
      });
    }
  }

  #drawShips(alpha) 
  {
    if (!this.#ctx || !this.#canvas) return;
    const ctx = this.#ctx;
    const canvas = this.#canvas;
    const w = canvas.width;  
    const h = canvas.height; 

    ctx.clearRect(0, 0, w, h);
    
    const fixedTimestep = (typeof CONFIG !== 'undefined' && CONFIG.System) ? CONFIG.System.FIXED_TIMESTEP : (1 / 60);

    for (let i = 0; i < this.#ships.length; i++) 
    {
      const s = this.#ships[i];
      this.#renderer.draw(ctx, s, w, h, alpha, fixedTimestep);
    }
  }

  destroy()
  {
    if (this.#boundResize)
    {
      window.removeEventListener('resize', this.#boundResize);
    }
    this.#ships = [];
    this.#backgroundObjects = [];
  }
}
