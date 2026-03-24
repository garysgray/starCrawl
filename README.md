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
    ├── StarField.js
    ├── ShipConfig.js
    ├── Ship.js
    ├── ShipRenderer.js
    ├── ShipLayer.js
    ├── SpaceAudio.js
    ├── Crawl.js
    └── Hud.js
```

---

## Architecture

The project uses a fixed-timestep game loop pattern adapted from traditional game development.

**`Main.js`** owns the loop. It runs update at a locked 60hz regardless of monitor refresh rate, then calls draw every frame. This means a 144hz monitor won't scroll faster than a 60hz one.

**`Controller.js`** is the top-level manager. It constructs all systems and exposes `update(dt)` and `draw()` which the loop calls each frame.

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

### ShipLayer / Ship / ShipRenderer / ShipConfig
Ships spawn on a randomised timer, travel across the screen, and are removed when offscreen. All tuning values live in `ShipConfig.js`.

`ShipRenderer` handles all canvas drawing. Coordinates are in local ship space — `ShipLayer` handles the world transform (position, scale, rotation, alpha) before calling the renderer.

### Crawl
Parses plain text from `crawl-text.js` into DOM elements and scrolls them using a CSS 3D perspective transform. Supports titles (`#`), paragraph breaks, and spacers (`---`).

### SpaceAudio
Procedural audio built on the Web Audio API — no audio files required. Generates a filtered noise drone on startup and a short noise burst for UI clicks.

### HUD
Wires up the speed, stars, and editor buttons. Callbacks are passed in from `Controller` so the HUD has no direct references to other systems.

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
All ship behaviour is controlled by constants at the top of `ShipConfig.js`:

| Key | Description |
|---|---|
| `spawnX` | Spawn position as % of screen width |
| `spawnY` | Spawn position as % of screen height |
| `speed` | Movement speed per frame |
| `driftX` | Horizontal drift per frame |
| `size` | Ship scale as % of screen width |
| `flattenY` | Vertical squash for belly-view perspective |
| `rotation` | Angle in multiples of π |
| `fadeOutZone` | % from top where fade begins (set to -999 to disable) |

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

---

## Adding a New Ship Type

1. Create a new renderer e.g. `ShipRendererB.js` following the same pattern as `ShipRenderer.js`
2. Add a script tag for it in `index.html` before `ShipLayer.js`
3. In `ShipLayer._spawnShip()`, choose which renderer to pass to the new `Ship`

---

## Browser Support

No build step, no dependencies, no bundler. Runs directly in any modern browser that supports:
- Canvas 2D
- Web Audio API
- CSS 3D transforms
- `requestAnimationFrame`