// ── Main ──────────────────────────────────────────────────────
// Entry point — owns the fixed-timestep game loop

// ---- Config -----------------------------------------------------------------
const FIXED_TIMESTEP = 1 / 60;        // seconds per logic step — locked at 60hz
const TIMESTEP_NORM  = FIXED_TIMESTEP * 60; // normalised dt — always 1.0 at 60hz
const MAX_FRAME_TIME = 0.25;           // caps spiral-of-death if tab loses focus
const MAX_STEPS      = 5;             // max logic steps per frame before bail
const SAFE_START_MS  = 100;           // poll interval waiting for canvas to size
const IDLE_TIMEOUT   = 200;           // ms delay before kicking off the loop

// ---- Globals ----------------------------------------------------------------
let myController;
let lastTime    = performance.now();
let accumulator = 0;

// ---- Init -------------------------------------------------------------------
window.addEventListener('load', () =>
{
  try
  {
    myController = new Controller();
    myController.start();
    safeStartGame();
  }
  catch (e) { console.error('Initialization failed:', e); }
});

// ---- Startup ----------------------------------------------------------------
// Polls until canvases have real dimensions before starting the loop
function safeStartGame()
{
  if (!readyToStart()) { setTimeout(safeStartGame, SAFE_START_MS); return; }
  window.requestIdleCallback
    ? requestIdleCallback(startLoop, { timeout: IDLE_TIMEOUT })
    : setTimeout(startLoop, IDLE_TIMEOUT);
}

// Confirms canvases exist and have been sized by the browser
function readyToStart()
{
  const stars = document.getElementById('stars');
  const ships = document.getElementById('ships');
  return stars && ships && stars.width > 0 && ships.width > 0;
}

// Skips the first rAF so lastTime is fresh when the loop begins
function startLoop()
{
  lastTime = performance.now();
  requestAnimationFrame(() => requestAnimationFrame(gameLoop));
}

// ---- Game Loop --------------------------------------------------------------
// Fixed timestep accumulator — update runs at locked 60hz, draw runs every frame
function gameLoop()
{
  const now       = performance.now();
  const frameTime = Math.min((now - lastTime) / 1000, MAX_FRAME_TIME);
  lastTime        = now;
  accumulator    += frameTime;

  let steps = 0;
  while (accumulator >= FIXED_TIMESTEP && steps < MAX_STEPS)
  {
    myController.update(TIMESTEP_NORM); // always 1.0 — speeds tuned at 60hz
    accumulator -= FIXED_TIMESTEP;      // drain real elapsed seconds
    steps++;
  }

  // Hit step cap — discard leftover to prevent runaway accumulator
  if (steps >= MAX_STEPS) accumulator = 0;

  myController.draw();
  requestAnimationFrame(gameLoop);
}