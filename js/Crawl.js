// ──────────────────────────────────────────────────────────────
// ── CRAWL ─────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Perspective text crawl engine with editor overlay
// Core Role:   Parses crawl text, normalizes scroll speed across screens, interpolates draw
// Dependencies: CONFIG, CRAWL_TEXT, AudioManager
//

class Crawl
{
  // ── PRIVATE PROPERTIES ───────────────────────────────────────
  #audio;
  #content;
  #editor;
  #overlay;
  #defaultText;
  #speed = 'med';
  #scrollSpeed = 0;
  #yPos = 0;
  #startDelay = 1.0;
  #running = true;
  #ready = false;
  #logFrameCount = 0;
  #speeds = {};
  #layout = {};

  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor(audio)
  {
    // Force manual scroll restoration so refreshes never retain mid-crawl scroll state
    if (typeof window !== 'undefined' && window.history && 'scrollRestoration' in window.history)
    {
      try {
        window.history.scrollRestoration = 'manual';
      } catch (_) {}
    }
    if (typeof window !== 'undefined')
    {
      window.scrollTo(0, 0);
    }

    this.#audio       = audio;
    this.#content     = document.getElementById('crawl-content');
    this.#editor      = document.getElementById('crawl-editor');
    this.#overlay     = document.getElementById('editor-overlay');
    this.#defaultText = (typeof CRAWL_TEXT !== 'undefined') ? CRAWL_TEXT : '';
    this.#speed       = 'med';
    this.#yPos        = 0;
    this.#startDelay  = (typeof CONFIG !== 'undefined' && CONFIG.DIRECTOR && typeof CONFIG.DIRECTOR.CRAWL_START_DELAY_SEC === 'number')
      ? CONFIG.DIRECTOR.CRAWL_START_DELAY_SEC
      : 1.0;
    this.#running     = true;
    this.#ready       = false; // gates update until DOM is measured
    this.#logFrameCount = 0;

    this.#initConstants();
    this.#buildContent(this.#defaultText);
    this.#bindEditor();
  }

  // ── PUBLIC GETTERS & SETTERS ────────────────────────────────
  get audio() { return this.#audio; }
  set audio(val) { this.#audio = val; }

  get content() { return this.#content; }
  get editor() { return this.#editor; }
  get overlay() { return this.#overlay; }

  get speed() { return this.#speed; }
  set speed(val) { this.setSpeed(val); }

  get duration() { return this.#getDuration(); }
  get pxPerSec() { return this.#getPxPerSec(); }
  get totalDistance() { return this.#getTotalDistance(); }
  get startDelay() { return this.#startDelay; }

  get scrollSpeed() { return this.#scrollSpeed; }
  set scrollSpeed(val) { this.#scrollSpeed = val; }

  get yPos() { return this.#yPos; }
  set yPos(val) { this.#yPos = val; }

  get running() { return this.#running; }
  set running(val) { this.#running = val; }

  get ready() { return this.#ready; }

  get speeds() { return this.#speeds; }
  get layout() { return this.#layout; }

  #initConstants()
  {
    this.#layout = (typeof CONFIG !== 'undefined' && CONFIG.crawlLayout) ? CONFIG.crawlLayout : {
      baseH:     900,
      resetMult: 2,
      spacerH:   600
    };
  }

  // ── Universal Physical Velocity & Duration Calculators ────────
  #getPxPerSec()
  {
    const dir = (typeof CONFIG !== 'undefined' && CONFIG.DIRECTOR) ? CONFIG.DIRECTOR : null;
    const baseCrawlSec = (dir && typeof dir.CRAWL_SCROLL_DURATION_SEC === 'number') ? dir.CRAWL_SCROLL_DURATION_SEC : 95.0;
    const refDist = (dir && typeof dir.CRAWL_REF_DISTANCE_PX === 'number') ? dir.CRAWL_REF_DISTANCE_PX : 24300;
    const basePxPerSec = refDist / baseCrawlSec; // Constant reference velocity (e.g. ~255 px/s)

    const mults = (dir && dir.SPEED_MULTIPLIERS) ? dir.SPEED_MULTIPLIERS : null;
    const modeMult = (mults && mults[this.#speed] && typeof mults[this.#speed].speedMultiplier === 'number')
      ? mults[this.#speed].speedMultiplier
      : 1.0;

    return basePxPerSec * modeMult;
  }

  #getDuration()
  {
    const pxPerSec = this.#getPxPerSec();
    const dist = this.#getTotalDistance();
    return (pxPerSec > 0) ? (dist / pxPerSec) : 95.0;
  }

  // Reads CSS variable so pitch can be tweaked from the stylesheet
  #getPitch()
  {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--crawl-pitch').trim() || '25deg';
  }

  // ── Content Parsing ────────────────────────────────────────
  #buildContent(text)
  {
    if (!this.#content) return;

    while (this.#content.firstChild)
    {
      this.#content.removeChild(this.#content.firstChild);
    }

    text.trim().split(/\n\s*\n/).forEach((para) =>
    {
      if (para.trim() === '---')
      {
        const spacer        = document.createElement('div');
        spacer.style.height = `${this.#layout.spacerH}px`;
        this.#content.appendChild(spacer);
        return;
      }
      const p = document.createElement('p');
      if (para.startsWith('#'))
      {
        p.className   = 'crawl-title';
        p.textContent = para.slice(1).trim();
      }
      else
      {
        p.textContent = para.trim();
      }
      this.#content.appendChild(p);
    });
  }

  // ── Responsive Bounds ──────────────────────────────────────
  recalculateBounds()
  {
    if (this.#content && this.#content.scrollHeight > 0)
    {
      this.#ready = true;
    }
  }

  // ── Dynamic Distance & Position Helpers ───────────────────
  #getStartPos()
  {
    const h = (this.#content && this.#content.scrollHeight > 0) ? this.#content.scrollHeight : 1200;
    return h + 40; // Top of text (Episode I) positioned cleanly just below bottom viewport edge
  }

  #getExitPos()
  {
    const vh = (typeof window !== 'undefined' ? window.innerHeight : 800);
    return -(vh + 150); // Bottom of last paragraph scrolled completely past vanishing point
  }

  #getTotalDistance()
  {
    return this.#getStartPos() - this.#getExitPos();
  }

  // ── Loop Core ──────────────────────────────────────────────
  update(dt)
  {
    if (!this.#content) return;

    if (!this.#ready)
    {
      const h = this.#content.scrollHeight;
      if (h > 0)
      {
        this.#yPos  = this.#getStartPos();
        this.#ready = true;
        this.#content.style.opacity = '1';
        const stage = document.querySelector('.crawl-stage');
        if (stage) stage.classList.add('active');
      }
      return;
    }

    if (!this.#running) return;

    const dtSeconds = (dt || 1) * (typeof CONFIG !== 'undefined' && CONFIG.System ? CONFIG.System.FIXED_TIMESTEP : (1 / 60));

    // Respect Director Start Delay before starting upward motion
    if (this.#startDelay > 0)
    {
      this.#startDelay -= dtSeconds;
      this.#yPos = this.#getStartPos();
      return;
    }

    // Normalized scroll speed across entire crawl passage
    const pxPerSec = this.#getPxPerSec();

    this.#yPos -= pxPerSec * dtSeconds;
    this.#logFrameCount++;

    if (this.#yPos <= this.#getExitPos())
    {
      this.#yPos = this.#getStartPos();
    }
  }

  draw(alpha)
  {
    if (!this.#content || !this.#ready || !this.#running) return;

    const pxPerSec = this.#getPxPerSec();
    const fixedTimestep = (typeof CONFIG !== 'undefined' && CONFIG.System) ? CONFIG.System.FIXED_TIMESTEP : (1 / 60);
    const pitch = this.#getPitch();
    
    const interpolatedY = this.#yPos - (pxPerSec * (alpha || 0) * fixedTimestep);

    this.#content.style.transform =
      `translateX(-50%) rotateX(${pitch}) translateY(${interpolatedY}px)`;
  }

  // ── Public API ─────────────────────────────────────────────
  setSpeed(speed)
  {
    this.#speed = speed;
  }

  openEditor()
  {
    this.#openEditor();
  }

  _openEditor()
  {
    this.#openEditor();
  }

  closeEditor()
  {
    this.#closeEditor();
  }

  _closeEditor()
  {
    this.#closeEditor();
  }

  // ── Editor Dialog ──────────────────────────────────────────
  #openEditor()
  {
    if (!this.#editor || !this.#overlay) return;
    this.#editor.value = this.#getPlainText();
    this.#overlay.classList.add('open');
  }

  #closeEditor()
  {
    if (!this.#overlay) return;
    this.#overlay.classList.remove('open');
  }

  #applyText()
  {
    if (!this.#editor || !this.#content) return;
    this.#buildContent(this.#editor.value);
    this.#yPos = this.#getStartPos();
    this.#closeEditor();
  }

  #resetText()
  {
    if (!this.#editor) return;
    this.#editor.value = this.#defaultText;
  }

  #getPlainText()
  {
    if (!this.#content) return '';
    return Array.from(this.#content.querySelectorAll('p'))
      .map(p => p.textContent)
      .join('\n\n');
  }

  #bindEditor()
  {
    const helpBtn = document.getElementById('editor-help-btn');
    if (helpBtn)
    {
      helpBtn.addEventListener('click', () => {
        const help = document.getElementById('editor-help');
        if (help) help.classList.toggle('open');
      });
    }

    const editBtn = document.getElementById('edit-text');
    if (editBtn)
    {
      editBtn.addEventListener('click', () => {
        if (this.#audio && typeof this.#audio.playClick === 'function') this.#audio.playClick();
        this.#openEditor();
      });
    }

    const closeBtn = document.getElementById('editor-close');
    if (closeBtn)
    {
      closeBtn.addEventListener('click', () => {
        if (this.#audio && typeof this.#audio.playClick === 'function') this.#audio.playClick();
        this.#closeEditor();
      });
    }

    const applyBtn = document.getElementById('editor-apply');
    if (applyBtn)
    {
      applyBtn.addEventListener('click', () => {
        if (this.#audio && typeof this.#audio.playClick === 'function') this.#audio.playClick();
        this.#applyText();
      });
    }

    const resetBtn = document.getElementById('editor-reset');
    if (resetBtn)
    {
      resetBtn.addEventListener('click', () => {
        if (this.#audio && typeof this.#audio.playClick === 'function') this.#audio.playClick();
        this.#resetText();
      });
    }

    if (this.#overlay)
    {
      this.#overlay.addEventListener('click', (e) => {
        if (e.target === this.#overlay)
        {
          if (this.#audio && typeof this.#audio.playClick === 'function') this.#audio.playClick();
          this.#closeEditor();
        }
      });
    }
  }
}
