// ── Crawl ─────────────────────────────────────────────────────

// Scroll speeds in pixels per tick at base screen height
const crawlSpeed =
{
  slow: 0.4,
  med:  0.9,
  fast: 2.0
};

// Screen height everything is normalised against — speeds feel
// consistent on any screen size relative to this value
const CRAWL_BASE_H     = 900;

// How far past the top before the crawl resets to the bottom
const CRAWL_RESET_MULT = 2;

// Height of a '---' spacer block in px
const CRAWL_SPACER_H   = 600;

class Crawl
{
  constructor(audio)
  {
    this.audio       = audio;
    this.content     = document.getElementById('crawl-content');
    this.editor      = document.getElementById('crawl-editor');
    this.overlay     = document.getElementById('editor-overlay');
    this.defaultText = CRAWL_TEXT;
    this.speed       = 'slow';
    this.yPos        = 0;
    this.running     = true;
    this._ready      = false;   // gates update until DOM is measured

    // Internal frame tracker to prevent console flooding
    this._logFrameCount = 0;

    this._buildContent(this.defaultText);
    this._bindEditor();
  }

  // ---- Getters --------------------------------------------------------------
  _getSpeed()
  {
    return crawlSpeed[this.speed];
  }

  // Reads CSS variable so pitch can be tweaked from the stylesheet
  _getPitch()
  {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--crawl-pitch').trim();
  }

  // ---- Content ──────────────────────────────────────────────────────────────
  // Parses plain text into crawl paragraphs and spacers
  _buildContent(text)
  {
    // Clear out old text safely without using innerHTML
    while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild);
    }

    text.trim().split(/\n\s*\n/).forEach((para) =>
    {
      if (para.trim() === '---')
      {
        const spacer        = document.createElement('div');
        spacer.style.height = `${CRAWL_SPACER_H}px`;
        this.content.appendChild(spacer);
        return;
      }
      const p = document.createElement('p');
      if (para.startsWith('#'))
      {
        p.className   = 'crawl-title';
        p.textContent = para.slice(1).trim(); // Pure text - 100% secure
      }
      else
      {
        p.textContent = para.trim(); // Pure text - 100% secure
      }
      this.content.appendChild(p);
    });
  }

  // ---- Responsive Lifecycle Realignment ------------------------------------
  // Called by the central Scene orchestrator whenever the browser frame changes shape.
  // Instantly locks text scroll boundaries to the active window boundaries!
  recalculateBounds()
  {
    if (this.content && this.content.scrollHeight > 0) {
      this._ready = true;
    }

    // PROOF METRIC LOG: Verifies that your text bounds update cleanly live
    // console.log(`📊 RESPONSIVE RESIZE ACTION (Crawl):`);
    // console.log(`   -> Window Bounds Shifted: Height=${window.innerHeight}px`);
    // console.log(`   -> Text Content Dimensions: Container Scroll Height=${this.content.scrollHeight}px`);
    // console.log(`   -> Horizon Reset Target: Left bounds pass limit cleanly at -${this.content.scrollHeight}px`);
  }

  // ---- Loop -----------------------------------------------------------------
  // Advances scroll position — called by the main game loop each frame (60Hz)
  update(dt)
  {
    if (!this._ready)
    {
      const h = this.content.scrollHeight;
      if (h > 0)
      {
        this.yPos   = h;
        this._ready = true;
        this.content.style.opacity = '1';
        document.querySelector('.crawl-stage').classList.add('active');
      }
      return;
    }

    if (!this.running) return;

    // Normalise to base screen height so scroll speed is consistent across screens
    const scale = CRAWL_BASE_H / window.innerHeight;
    
    // Strictly modifies raw numbers now — DOM styling calculations removed from 60Hz loop
    this.yPos  -= this._getSpeed() * dt * scale;

    // Increment your logging tick index securely
    this._logFrameCount++;

    // LIVE UPDATE DEBUGGER: Prints out tracking matrix details once every 120 frames (~2 seconds)
    if (this._logFrameCount % 120 === 0)
    {
      const targetHorizonLimit = -this.content.scrollHeight;
      const distanceRemaining  = (this.yPos - targetHorizonLimit).toFixed(0);
      
      // console.log(`📐 CRAWL FRAME TICK PROOF:`);
      // console.log(`   -> Current Base Position: Y=${this.yPos.toFixed(1)}px`);
      // console.log(`   -> Bounding Box Metrics: Scroll Height=${this.content.scrollHeight}px | Loop Limit=${targetHorizonLimit}px`);
      // console.log(`   -> Pixels Left Before Loop Reset: ${distanceRemaining}px`);
    }

    /* 
      FIXED LOOP RESET SYSTEM:
      Instead of calculating boundaries using fluid window dimensions, we monitor the 
      literal scale profile container height. The text loops smoothly to the bottom 
      the exact frame it clears the view!
    */
    if (this.yPos < -this.content.scrollHeight)
    {
      this.yPos = window.innerHeight;
      
      //console.log(`🔄 CRAWL LOOP RESET: Position reset to bottom fold (${window.innerHeight}px) | Text Height=${this.content.scrollHeight}px`);
    }
  }

  // FIX: Added 'alpha' to smoothly interpolate text rendering positions between ticks
  draw(alpha) 
  {
    if (!this._ready || !this.running) return;

    const scale = CRAWL_BASE_H / window.innerHeight;
    const pitch = this._getPitch();
    
    // Estimate sub-frame positioning to completely match the monitor refresh rate
    const interpolatedY = this.yPos - (this._getSpeed() * (alpha || 0) * scale);

    this.content.style.transform =
      `translateX(-50%) rotateX(${pitch}) translateY(${interpolatedY}px)`;
  }

  // ---- Public ---------------------------------------------------------------
  setSpeed(speed)
  {
    this.speed = speed;
  }

  // ---- Editor ---------------------------------------------------------------
  _openEditor()
  {
    this.editor.value = this._getPlainText();
    this.overlay.classList.add('open');
  }

  _closeEditor()
  {
    this.overlay.classList.remove('open');
  }

  // Rebuilds crawl content from editor text and resets scroll to bottom
  _applyText()
  {
    this._buildContent(this.editor.value);
    this.yPos = this.content.scrollHeight;
    this._closeEditor();
  }

  _resetText()
  {
    this.editor.value = this.defaultText;
  }

  // Extracts current crawl back to plain text for editing
  _getPlainText()
  {
    return Array.from(this.content.querySelectorAll('p'))
      .map(p => p.textContent)
      .join('\n\n');
  }

  _bindEditor()
  {
    document.getElementById('editor-help-btn').addEventListener('click', () =>
    {
      document.getElementById('editor-help').classList.toggle('open');
    });

    document.getElementById('edit-text').addEventListener('click',
      () => { this.audio.playClick(); this._openEditor(); });

    document.getElementById('editor-close').addEventListener('click',
      () => { this.audio.playClick(); this._closeEditor(); });

    document.getElementById('editor-apply').addEventListener('click',
      () => { this.audio.playClick(); this._applyText(); });

    document.getElementById('editor-reset').addEventListener('click',
      () => { this.audio.playClick(); this._resetText(); });

    // Click outside editor box to close
    this.overlay.addEventListener('click', (e) =>
    {
      if (e.target === this.overlay) { this.audio.playClick(); this._closeEditor(); }
    });
  }
}
