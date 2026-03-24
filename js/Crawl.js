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

  // ---- Content --------------------------------------------------------------
  // Parses plain text into crawl paragraphs and spacers
  _buildContent(text)
  {
    this.content.innerHTML = '';
    text.trim().split(/\n\s*\n/).forEach((para) =>
    {
      // '---' becomes a tall spacer gap between segments
      if (para.trim() === '---')
      {
        const spacer        = document.createElement('div');
        spacer.style.height = `${CRAWL_SPACER_H}px`;
        this.content.appendChild(spacer);
        return;
      }
      const p = document.createElement('p');
      // Lines starting with '#' become large centered titles
      if (para.startsWith('#'))
      {
        p.className   = 'crawl-title';
        p.textContent = para.slice(1).trim();
      }
      else
      {
        p.textContent = para.trim();
      }
      this.content.appendChild(p);
    });
  }

  // ---- Loop -----------------------------------------------------------------
  // Advances scroll position — called by the main game loop each frame
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
      }
      return;
    }

    if (!this.running) return;

    // Normalise to base screen height so scroll speed is consistent across screens
    const scale = CRAWL_BASE_H / window.innerHeight;
    this.yPos  -= this._getSpeed() * dt * scale;

    // Reset to bottom once all content has scrolled off the top
    if (this.yPos < -(window.innerHeight * CRAWL_RESET_MULT))
      this.yPos = this.content.scrollHeight;

    const pitch = this._getPitch();
    this.content.style.transform =
      `translateX(-50%) rotateX(${pitch}) translateY(${this.yPos}px)`;
  }

  // CSS handles all crawl rendering — nothing to paint here
  draw() {}

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