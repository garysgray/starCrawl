# Space Crawl
A Star Wars-inspired interactive space scene built with vanilla JavaScript and Canvas. Features a scrolling text crawl, animated starfield, and flyby spaceship.

---

## Project Structure
```
/
├── index.html
├── css/
│   └── style.css
├── data/
│   └── crawl-text.js
└── js/
    ├── Main.js
    ├── Controller.js
    ├── Scene.js
    ├── StarField.js
    ├── ShipConfig.js
    ├── Ship.js
    ├── ShipRenderer.js
    ├── SpaceAudio.js
    ├── Crawl.js
    ├── Timer.js
    └── Hud.js
```

---

## Architecture
The project uses a fixed-timestep game loop pattern adapted from traditional game development.

**`Main.js`** owns the loop. It runs update at a locked 60hz regardless of monitor refresh rate, then calls draw every frame. `TIMESTEP_NORM` is always `1.0` so speed values are human-readable at 60hz with no manual scaling needed.

**`Controller.js`** is infrastructure only — owns audio and HUD, holds the active Scene. It exposes `update(dt)` and `draw()` which the loop calls each frame.

**`Scene.js`** owns everything visual and temporal — stars, ships, crawl, and spawn timing. A different scene defines a completely different visual experience while following the same contract.

Each system follows the same contract:
- `update(dt)` — advances state, called at fixed 60hz timestep
- `draw()` — renders current state, called every frame

---

## Systems

### StarField
Three modes driven by `starModes` config at the top of `StarField.js`:
- **Calm** — stars twinkle in place
- **Drift** — stars fall downward and wrap
- **Warp** — stars radiate outward from centre

All magic numbers are consts at the top of the file. Speed is normalised against `STAR_BASE_H = 900` so behaviour is consistent across screen sizes.

### Scene / Ship / ShipRenderer / ShipConfig
`Scene` owns everything visual — stars, crawl, and ship lifecycle. A `Timer` drives ship spawn intervals, switching between narrow and wide screen timings based on viewport width. All ship tuning values live in `ShipConfig.js`.

`ShipRenderer` handles all canvas drawing in local ship coordinate space. All coordinates and colours are consts at the top of the file. `Scene` handles the world transform (position, scale, rotation, alpha) before calling the renderer each frame.

Ship position is stored as `%` of screen dimensions so layout is resolution independent. Speed is normalised against `SHIP_BASE_H = 900` for consistent feel across screen sizes.

### Crawl
Parses plain text from `crawl-text.js` into DOM elements and scrolls them using a CSS 3D perspective transform. Supports titles (`#`), paragraph breaks, and spacers (`---`). Speed normalised against `CRAWL_BASE_H = 900`.

### Timer
General purpose countdown/countup timer driven by `dt`. Used by `Scene` to control ship spawn intervals. Supports loop mode and `setAndStart()` for reuse without creating a new instance.

### SpaceAudio
Procedural audio built on the Web Audio API — no audio files required. Generates a filtered noise drone on startup and a short noise burst for UI clicks. All audio constants at the top of the file.

### HUD
Wires up speed and star mode button groups. Auto-hides after `HUD_HIDE_DELAY` ms of inactivity, reappears on mouse or touch. Callbacks injected from `Controller` so HUD has no direct references to other systems.

---

## Configuration

### Crawl text
Edit `data/crawl-text.js`. Syntax:

| Syntax | Result |
|---|---|
| `#MY TITLE` | Large centred gold title |
| `---` | Tall spacer gap |
| Blank line | Paragraph break |

### Ship tuning
All ship behaviour controlled by constants at the top of `ShipConfig.js`:

| Key | Description |
|---|---|
| `spawnX` | Spawn position as % of screen width |
| `spawnY` | Spawn position as % of screen height |
| `speed` | Movement speed per tick |
| `driftX` | Horizontal drift per tick |
| `size` | Ship scale as % of screen width |
| `flattenY` | Vertical squash for belly-view perspective |
| `rotation` | Angle in multiples of π |
| `fadeOutZone` | % from top where fade begins (set to -999 to disable) |

### Ship intervals
Spawn timing controlled in `ShipConfig.js`:

| Key | Description |
|---|---|
| `narrow` | Ms between ships on screens below breakpoint |
| `wide` | Ms between ships on screens above breakpoint |
| `breakpoint` | Screen width in px that switches between narrow and wide |

### Star modes
Edit the `starModes` object at the top of `StarField.js`:

| Key | Description |
|---|---|
| `speed` | Movement speed |
| `stretch` | Warp streak length |
| `count` | Number of stars |

### Crawl appearance
CSS custom properties at the top of `style.css` control the crawl geometry:

| Variable | Description |
|---|---|
| `--crawl-perspective` | 3D perspective depth |
| `--crawl-pitch` | Forward tilt angle |
| `--crawl-width` | Text column width |
| `--crawl-vanish-x/y` | Vanishing point position |

### HUD behaviour
Constants at the top of `Hud.js`:

| Constant | Description |
|---|---|
| `HUD_HIDE_DELAY` | Ms of inactivity before HUD hides |
| `HUD_TRANSITION` | CSS transition string for show/hide animation |

---

## Key Conventions
- Ship coordinates are in local space (-250 to 250 x, -110 to 110 y)
- Scene handles world transform before calling ShipRenderer.draw(ctx)
- All magic numbers are consts at the top of each file
- All colours in ShipRenderer.js are consts at the top of the file
- All crawl/scene CSS values are custom properties in :root in style.css
- TIMESTEP_NORM = 1.0 always — speeds are tuned at 60hz, no dt scaling needed
- Speed normalised against BASE_H = 900 so behaviour is consistent across screen sizes
- Position stored as % of screen so layout is resolution independent
- Scripts loaded in dependency order in index.html — no modules, no imports

---

## Planned Next Steps
1. **StateMachine** — BOOT, SCENE, SETTINGS, TRANSITION states
2. **Settings page** — replace HUD with a full screen settings state
3. **Transition system** — fade between states
4. **EventBus + ScrollClock** — cue-based ship spawning at dramatic crawl moments
5. **Second scene** — FlyoverScene or similar, same update/draw contract
6. **PlanetRenderer** — slow rotating planet owned by Scene
7. **Second ship type** — new ShipRenderer, random or cue-driven selection

---

## Adding a New Ship Type
1. Create `ShipRendererB.js` following the same pattern as `ShipRenderer.js`
2. Add a script tag in `index.html` before `Scene.js`
3. In `Scene._spawnShip()` choose which renderer to instantiate

## Adding a New Scene
1. Create `SceneB.js` with the same `update(dt)` / `draw()` contract
2. In `Controller` swap `this.scene = new SceneB(this.audio)`

---

## Browser Support
No build step, no dependencies, no bundler. Runs directly in any modern browser that supports:
- Canvas 2D
- Web Audio API
- CSS 3D transforms
- `requestAnimationFrame`