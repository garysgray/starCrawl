// ── HUD ───────────────────────────────────────────────────────

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

  _bindButtons()
  {
    ['slow', 'med', 'fast'].forEach(id =>
    {
      document.getElementById(`speed-${id}`).addEventListener('click', () =>
      {
        this.onClickSound();
        ['slow', 'med', 'fast'].forEach(b => document.getElementById(`speed-${b}`).className = '');
        document.getElementById(`speed-${id}`).className = 'active-speed';
        this.onSpeedChange(id);
      });
    });

    ['calm', 'drift', 'warp'].forEach(id =>
    {
      document.getElementById(`stars-${id}`).addEventListener('click', () =>
      {
        this.onClickSound();
        ['calm', 'drift', 'warp'].forEach(b => document.getElementById(`stars-${b}`).className = '');
        document.getElementById(`stars-${id}`).className = 'active-speed';
        this.onStarMode(id);
      });
    });
  }

  _initAutoHide()
  {
    this.el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
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

  _show()
  {
    this.el.style.opacity       = '1';
    this.el.style.pointerEvents = 'auto';
    this.el.style.transform     = 'translateX(-50%) translateY(0)';
    document.body.style.cursor  = 'crosshair';
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this._hide(), 3000);
  }

  _hide()
  {
    this.el.style.opacity       = '0';
    this.el.style.pointerEvents = 'none';
    document.body.style.cursor  = 'none';
  }
}
