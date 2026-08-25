// ── Main ──────────────────────────────────────────────────────
// Entry point — owns the fixed-timestep game loop

// ---- Globals ----------------------------------------------------------------
let myEngine;
let lastTime    = performance.now();
let accumulator = 0;

// ---- Init -------------------------------------------------------------------
window.addEventListener('load', () =>
{
  try
  {
    myEngine = new Engine();
    safeStartGame();
  }
  catch (e)
  {
    console.error('Initialization failed:', e);
  }
});

// ---- Startup ----------------------------------------------------------------
// Polls until canvases have real dimensions before starting the loop
function safeStartGame()
{
  if (!readyToStart())
  {
    setTimeout(safeStartGame, CONFIG.System.SAFE_START_MS);
    return;
  }

  window.requestIdleCallback
    ? requestIdleCallback(startLoop, { timeout: CONFIG.System.IDLE_TIMEOUT })
    : setTimeout(startLoop, CONFIG.System.IDLE_TIMEOUT);
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
  const frameTime = Math.min((now - lastTime) / 1000, CONFIG.System.MAX_FRAME_TIME);
  lastTime        = now;
  accumulator    += frameTime;

  let steps = 0;
  const fixedTimestep = CONFIG.System.FIXED_TIMESTEP;
  const timestepNorm  = fixedTimestep * 60; // always 1.0 at 60hz

  while (accumulator >= fixedTimestep && steps < CONFIG.System.MAX_STEPS)
  {
    myEngine.update(timestepNorm);
    accumulator -= fixedTimestep;
    steps++;
  }

  // Hit step cap — discard leftover to prevent runaway accumulator
  if (steps >= CONFIG.System.MAX_STEPS) accumulator = 0;

  // Calculate interpolation fraction (where we are between physics ticks)
  const alpha = accumulator / fixedTimestep;

  // Pass alpha to the draw pipeline
  myEngine.draw(alpha);

  requestAnimationFrame(gameLoop);
}
