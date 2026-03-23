// ── Main ──────────────────────────────────────────────────────
// Entry point — owns the fixed-timestep game loop

// ---- Globals ----------------------------------------------------------------
let myController;
let lastTime         = performance.now();
let accumulator      = 0;

const FIXED_TIMESTEP = 1 / 60;   // Logic runs at a locked 60hz regardless of framerate
const MAX_FRAME_TIME = 0.25;      // Caps spiral-of-death if tab loses focus
const MAX_STEPS      = 5;         // Max logic steps per frame before we bail
const SAFE_START_MS  = 100;       // Poll interval while waiting for canvas to be ready
const IDLE_TIMEOUT   = 200;       // Delay before kicking off the loop

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
// Polls until the canvases have real dimensions before starting the loop
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

// Skips the first frame so lastTime is fresh when the loop begins
function startLoop()
{
  lastTime = performance.now();
  requestAnimationFrame(() => requestAnimationFrame(gameLoop));
}

// ---- Game Loop --------------------------------------------------------------
// Fixed timestep accumulator loop — update runs at 60hz, draw runs every frame
function gameLoop()
{
  const now       = performance.now();
  const frameTime = Math.min((now - lastTime) / 1000, MAX_FRAME_TIME);
  lastTime        = now;
  accumulator    += frameTime;

  let steps = 0;
  while (accumulator >= FIXED_TIMESTEP && steps < MAX_STEPS)
  {
    myController.update(FIXED_TIMESTEP);
    accumulator -= FIXED_TIMESTEP;
    steps++;
  }

  // If we hit the step cap, discard leftover time to avoid a runaway accumulator
  if (steps >= MAX_STEPS) accumulator = 0;

  myController.draw();
  requestAnimationFrame(gameLoop);
}