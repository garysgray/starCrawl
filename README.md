![Game Splash](assets/starCrawl.png)


# Star Crawl
A Star Wars-inspired interactive space scene built with vanilla JavaScript and Canvas. Features a scrolling text crawl, animated starfield, flyby spaceship, and a slowly rotating planet.

---

## Project Structure

```
starcrawl_ref/
├── index.html                  # Main DOM layers, Canvas viewports, HUD & Editor Overlay
│
├── assets/
│   └── starCrawl.png           # Splash artwork
│
├── css/
│   ├── layout.css              # Viewport sizing, Canvas stacking order & z-index layers
│   └── style.css               # 3D CSS crawl perspective, HUD aesthetics & responsive rules
│
├── data/
│   ├── crawl-text.js           # Default opening crawl story script
│   ├── CelestialCatalog.js     # Planet & celestial sphere definitions, craters & rings
│   └── ShipCatalog.js          # Starship catalog specifications & visual configurations
│
└── js/
    ├── Config.js               # Centralized config: Director settings, multipliers, speeds & constants
    ├── SoundRecipes.js         # Synthesis recipes for procedural Web Audio effects
    ├── UIComponent.js          # Base component class for UI widgets
    ├── AudioManager.js         # Web Audio API engine (noise generators, biquad filters, gain envelopes)
    ├── UIManager.js            # Coordinator for HUD toggles, editor modal, and user input
    ├── SpaceDirector.js        # Timeline conductor: ship spawns, speed modes & celestial transitions
    ├── StarField.js            # Multi-mode parallax particle starfield (Calm, Drift, Warp)
    ├── Ship.js                 # Ship entity instance & screen-coordinate trajectory interpolation
    ├── ShipRenderer.js         # Canvas 2D vector renderer for capital ships, engines & weapons
    ├── SpaceObject.js          # Base & derived celestial sphere entity models
    ├── SpaceObjectRenderer.js  # Sphere ray-projection, 3D crater mapping & ring pass renderer
    ├── Crawl.js                # DOM 3D perspective crawl parser, ticker & velocity manager
    ├── Timer.js                # Delta-time countdown and trigger coordinator
    ├── Hud.js                  # Floating HUD control interface & auto-hide controller
    ├── Scene.js                # Composition coordinator for active rendering canvases & layers
    ├── Engine.js               # Composition root: wires subsystems, audio unlock, and state
    └── Main.js                 # Fixed 60Hz timestep game loop entry point
```
---

## System Architecture

The application runs on an orchestrated 60Hz fixed-timestep game loop pattern:

```
[Main.js (Game Loop)] ──── 60Hz fixed tick ────> [Engine.js]
                                                      │
                       ┌──────────────────────────────┼──────────────────────────────┐
                       ▼                              ▼                              ▼
               [SpaceDirector]                  [Scene.js]                     [UIManager]
               - Master timeline                - StarField                    - Primary HUD
               - Speed multipliers              - Ships & Fleet                - Text Editor
               - Spawn intervals                - Celestial Sphere             - LocalStorage
               - Planet eclipse                 - 3D Crawl DOM                 - Keyboard / Mouse
                       │                              │                              │
                       ▼                              ▼                              ▼
                 [Ship Catalog]             [Canvases & CSS 3D]               [AudioManager]
               [Celestial Catalog]          [Specialized Renderers]          [SoundRecipes]
```

1. **`Main.js`**: Drives the `requestAnimationFrame` loop. Executes logic at a locked fixed timestep (`1/60s`) while rendering at the monitor's native refresh rate.
2. **`Engine.js`**: Central composition root. Loads saved user preferences, instantiates all managers, manages Web Audio autoplay unlocking, and coordinates system startup.
3. **`SpaceDirector.js`**: Orchestrates cinematic timing. Listens to speed state changes (`slow`, `med`, `fast`, `warp`), calculates scaled durations, handles the ship spawn queue, and triggers planet transitions when a ship crosses the midpoint.
4. **`Scene.js`**: Owns all rendering layers. Manages canvas contexts (`#stars`, `#ships`, `#space-object`, `#noise`), coordinates object updates, and translates normalized coordinate positions into pixel viewports.
5. **`UIManager.js` & `Hud.js`**: Controls interactive buttons, auto-hides HUD controls during inactivity, and powers the live markdown text editor overlay.

** — new ShipRenderer, random or cue-driven selection

---
## Controls & HUD

- **Speed Group**:
  - `Slow`: Relaxed, majestic cinematic pace ($\times 1.35$ duration).
  - `Med`: Default balanced standard ($100\%$ master config).
  - `Fast`: Brisk, accelerated flyby ($\times 0.65$ duration).
- **Stars Group**: Toggle between `Calm`, `Drift`, and `Warp` starfield behaviors.
- **Edit Text**: Opens the interactive in-app editor overlay to test and preview custom crawl scripts instantly.
- **Auto-Hide**: The HUD gently fades away after a few seconds of inactivity and reappears upon cursor movement or touch.

---
## Browser Compatibility & Standards

Runs directly in any modern browser without requiring compilation or node build tools:
- **HTML5 Canvas 2D** (`CanvasRenderingContext2D`)
- **Web Audio API** (`AudioContext`, `BiquadFilterNode`, `GainNode`)
- **CSS 3D Transforms** (`perspective`, `rotateX`, `translate3d`)
- **Modern JavaScript** (ES6+ Classes, Private Fields `#`, Modules/Scripts)
- **Local Storage API** (User settings and script persistence)

---
## Planned Next Steps
1. **StateMachine** — BOOT, SCENE, SETTINGS, TRANSITION states
2. **Settings page** — replace HUD with a full screen settings state
3. **Transition system** — fade between states
4. **EventBus + ScrollClock** — cue-based ship spawning at dramatic crawl moments
5. **Second scene** — FlyoverScene or similar, same update/draw contract
6. **Second ship type
---