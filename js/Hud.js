// ── HUD ───────────────────────────────────────────────────────

// ---- Config -----------------------------------------------------------------
const HUD_HIDE_DELAY    = 3000;   // ms of inactivity before HUD hides
const HUD_TRANSITION    = 'opacity 0.6s ease, transform 0.6s ease';
const HUD_CURSOR_ACTIVE = 'crosshair';
const HUD_CURSOR_HIDDEN = 'none';

// ---- Button groups ----------------------------------------------------------
const SPEED_IDS = ['slow', 'med',  'fast'];
const STAR_IDS  = ['calm', 'drift', 'warp'];

class HUD
{
  constructor(onSpeedChange, onStarMode, onClickSound)
  {
    this.el            = document.querySelector('.HUD');
    this.hideTimer     = null;
    this.onSpeedChange = onSpeedChange;
    this.onStarMode    = onStarMode;
    this.onClickSound  = onClickSound;

    this._bindButtons();
    this._initAutoHide();
  }

  // ---- Setup ----------------------------------------------------------------
  // Wires up speed and star mode button groups
  _bindButtons()
  {
    this._bindGroup('speed', SPEED_IDS, this.onSpeedChange);
    this._bindGroup('stars', STAR_IDS,  this.onStarMode);
  }

  // Binds a group of buttons — clicking one activates it and deactivates the rest
  _bindGroup(prefix, ids, callback)
  {
    ids.forEach(id =>
    {
      document.getElementById(`${prefix}-${id}`).addEventListener('click', () =>
      {
        this.onClickSound();
        ids.forEach(b => document.getElementById(`${prefix}-${b}`).className = '');
        document.getElementById(`${prefix}-${id}`).className = 'active-speed';
        callback(id);
      });
    });
  }

  // ---- Auto-hide ------------------------------------------------------------
  // HUD fades in on load then hides after inactivity — reappears on mouse/touch
  _initAutoHide()
  {
    this.el.style.transition = HUD_TRANSITION;

    // Double rAF ensures transition is registered before first show
    requestAnimationFrame(() =>
    {
      requestAnimationFrame(() =>
      {
        this._show();
        document.addEventListener('mousemove',  () => this._show());
        document.addEventListener('touchstart', () => this._show());
        document.addEventListener('touchmove',  () => this._show());
      });
    });
  }

  // Shows the HUD and resets the hide timer
  _show()
  {
    this.el.style.opacity       = '1';
    this.el.style.pointerEvents = 'auto';
    this.el.style.transform     = 'translateX(-50%) translateY(0)';
    document.body.style.cursor  = HUD_CURSOR_ACTIVE;
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this._hide(), HUD_HIDE_DELAY);
  }

  // Hides the HUD and cursor after inactivity
  _hide()
  {
    this.el.style.opacity       = '0';
    this.el.style.pointerEvents = 'none';
    document.body.style.cursor  = HUD_CURSOR_HIDDEN;
  }
}