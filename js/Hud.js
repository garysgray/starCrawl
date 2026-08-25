// ──────────────────────────────────────────────────────────────
// ── HUD COMPONENT ─────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: User interface HUD bar for simulation controls
// Core Role:   Binds buttons to UIManager actions and manages auto-hide timer
// Dependencies: UIComponent, CONFIG
//

class HUD extends UIComponent
{
  // ── PRIVATE PROPERTIES ───────────────────────────────────────
  #el;
  #config;
  #hideTimer = null;
  #boundShow;

  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor(config = {})
  {
    super();
    this.#el        = document.querySelector('.HUD');
    this.#config    = config;
    this.#hideTimer = null;
    this.#boundShow = this.#show.bind(this);
    this.#initAutoHide();
  }

  // ── PUBLIC GETTERS & SETTERS ────────────────────────────────
  get el() { return this.#el; }
  get config() { return this.#config; }
  set config(val) { this.#config = val; }
  get hideTimer() { return this.#hideTimer; }

  // ── MAP ELEMENT IDS TO DATA CORRIDORS ──────────────────────
  getEventMaps()
  {
    return [
      { elementId: 'speed-slow', eventType: 'click', actionType: CONFIG.UIActions.SET_SPEED, actionValue: 'slow' },
      { elementId: 'speed-med',  eventType: 'click', actionType: CONFIG.UIActions.SET_SPEED, actionValue: 'med' },
      { elementId: 'speed-fast', eventType: 'click', actionType: CONFIG.UIActions.SET_SPEED, actionValue: 'fast' },
      
      { elementId: 'stars-calm',  eventType: 'click', actionType: CONFIG.UIActions.SET_STARS, actionValue: 'calm' },
      { elementId: 'stars-drift', eventType: 'click', actionType: CONFIG.UIActions.SET_STARS, actionValue: 'drift' },
      { elementId: 'stars-warp',  eventType: 'click', actionType: CONFIG.UIActions.SET_STARS, actionValue: 'warp' },
      
      { elementId: 'edit-text',   eventType: 'click', actionType: CONFIG.UIActions.OPEN_EDITOR, actionValue: 'open' }
    ];
  }

  // ── UPDATE ACTIVE DISPLAY BUTTON STYLES ────────────────────
  updateVisualState(actionType, value)
  {
    if (actionType === CONFIG.UIActions.SET_SPEED)
    {
      ['slow', 'med', 'fast'].forEach(b => {
        const btn = document.getElementById(`speed-${b}`);
        if (btn) btn.className = (b === value) ? 'active-speed' : '';
      });
    }

    if (actionType === CONFIG.UIActions.SET_STARS)
    {
      ['calm', 'drift', 'warp'].forEach(b => {
        const btn = document.getElementById(`stars-${b}`);
        if (btn) btn.className = (b === value) ? 'active-speed' : '';
      });
    }
  }

  // ── Auto-Hide Behavior ─────────────────────────────────────
  #initAutoHide()
  {
    if (!this.#el) return;
    this.#el.style.transition = this.#config.transitionCss || CONFIG.hud?.transitionCss || 'opacity 0.6s ease, transform 0.6s ease';
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.#show();
        this.addListener(document, 'mousemove',  this.#boundShow);
        this.addListener(document, 'touchstart', this.#boundShow);
        this.addListener(document, 'touchmove',  this.#boundShow);
      });
    });
  }

  #show()
  {
    if (!this.#el) return;
    this.#el.style.opacity       = '1';
    this.#el.style.pointerEvents = 'auto';
    this.#el.style.transform     = 'translateX(-50%) translateY(0)';
    document.body.style.cursor  = 'crosshair';
    clearTimeout(this.#hideTimer);
    const autoHideMs = this.#config.autoHideMs || CONFIG.hud?.autoHideMs || 3000;
    this.#hideTimer = setTimeout(() => this.#hide(), autoHideMs);
  }

  #hide()
  {
    if (!this.#el) return;
    this.#el.style.opacity       = '0';
    this.#el.style.pointerEvents = 'none';
    document.body.style.cursor  = 'none';
  }

  show()
  {
    this.#show();
  }

  hide()
  {
    this.#hide();
  }

  destroy()
  {
    super.destroy();
    clearTimeout(this.#hideTimer);
    document.body.style.cursor = 'default';
  }
}
