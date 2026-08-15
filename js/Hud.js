// ── HUD COMPONENT ────────────────────────────────────────────────────────────
class HUD extends UIComponent
{
  constructor()
  {
    super();
    this.el        = document.querySelector('.HUD');
    this.hideTimer = null;
    this._boundShow = this._show.bind(this);
    this._initAutoHide();
  }

  // ── MAP ELEMENT IDS TO DATA CORRIDORS ──────────────────────────────────────
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


  // ── UPDATE ACTIVE DISPLAY BUTTON STYLES ────────────────────────────────────
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
        // FIX: Remove fake colors entirely. Apply your real golden styling class.
        if (btn) btn.className = (b === value) ? 'active-speed' : '';
      });
    }
  }



  // ---- Auto-hide ------------------------------------------------------------
  _initAutoHide()
  {
    this.el.style.transition = CONFIG.hud.transitionCss;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._show();
        this.addListener(document, 'mousemove',  this._boundShow);
        this.addListener(document, 'touchstart', this._boundShow);
        this.addListener(document, 'touchmove',  this._boundShow);
      });
    });
  }

  _show()
  {
    this.el.style.opacity       = '1';
    this.el.style.pointerEvents = 'auto';
    this.el.style.transform     = 'translateX(-50%) translateY(0)';
    document.body.style.cursor  = 'crosshair';
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this._hide(), CONFIG.hud.autoHideMs);
  }

  _hide()
  {
    this.el.style.opacity       = '0';
    this.el.style.pointerEvents = 'none';
    document.body.style.cursor  = 'none';
  }
}
