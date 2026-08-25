// ──────────────────────────────────────────────────────────────
// ── STARFIELD ─────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Multi-mode starfield renderer with calm, drift, and warp mechanics
// Core Role:   Manages star particles, velocities, twinkling, and warp streak lines
// Dependencies: CONFIG
//

class StarField
{
  // ── PRIVATE PROPERTIES ───────────────────────────────────────
  #canvas;
  #ctx;
  #mode = 'calm';
  #stars = [];
  #modes = {};
  #vis = {};
  #cx = 0;
  #cy = 0;
  #boundResize;

  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor()
  {
    this.#canvas = document.getElementById('stars');
    this.#ctx    = this.#canvas ? this.#canvas.getContext('2d') : null;
    this.#mode   = 'calm';
    this.#stars  = [];

    this.#initConstants();
    this.#resize();
    this.#boundResize = () => this.#resize();
    window.addEventListener('resize', this.#boundResize);
    this.#initStars();
  }

  // ── PUBLIC GETTERS & SETTERS ────────────────────────────────
  get mode() { return this.#mode; }
  set mode(val) { this.setMode(val); }

  get canvas() { return this.#canvas; }
  get ctx() { return this.#ctx; }
  get stars() { return this.#stars; }
  get modes() { return this.#modes; }
  get vis() { return this.#vis; }
  get cx() { return this.#cx; }
  get cy() { return this.#cy; }

  #initConstants()
  {
    this.#modes = (typeof CONFIG !== 'undefined' && CONFIG.starModes) ? CONFIG.starModes : {
      calm:  { speed: 0.05, stretch: 1,  count: 250 },
      drift: { speed: 0.3,  stretch: 2,  count: 350 },
      warp:  { speed: 4.0,  stretch: 18, count: 500 }
    };

    this.#vis = (typeof CONFIG !== 'undefined' && CONFIG.starVisuals) ? CONFIG.starVisuals : {
      baseH:            900,
      sizeMin:          0.2,
      sizeRange:        1.8,
      speedMin:         0.5,
      speedRange:       0.5,
      twinkleCalmRate:  0.015,
      twinkleDriftRate: 0.02,
      warpOpacityMin:   0.4,
      warpOpacityRange: 0.6,
      driftOpacityBase: 0.5,
      driftOpacityAmp:  0.3,
      calmOpacityBase:  0.4,
      calmOpacityAmp:   0.35
    };
  }

  // ── Setup ──────────────────────────────────────────────────
  #resize()
  {
    if (!this.#canvas) return;
    this.#canvas.width  = window.innerWidth;
    this.#canvas.height = window.innerHeight;
    this.#cx = this.#canvas.width  / 2;
    this.#cy = this.#canvas.height / 2;
  }

  #initStars()
  {
    this.#stars = [];
    const count = this.#modes[this.#mode]?.count || 250;
    for (let i = 0; i < count; i++)
    {
      this.#stars.push(this.#makeStar());
    }
  }

  #makeStar(fromCenter = false)
  {
    const canvasW = this.#canvas ? this.#canvas.width : window.innerWidth;
    const canvasH = this.#canvas ? this.#canvas.height : window.innerHeight;

    return {
      x:       fromCenter ? this.#cx : Math.random() * canvasW,
      y:       fromCenter ? this.#cy : Math.random() * canvasH,
      z:       Math.random(),
      size:    this.#vis.sizeMin  + (Math.random() * this.#vis.sizeRange),
      twinkle: Math.random() * Math.PI * 2,
      speed:   this.#vis.speedMin + (Math.random() * this.#vis.speedRange)
    };
  }

  // ── Public ─────────────────────────────────────────────────
  setMode(mode)
  {
    this.#mode = mode;
    const target = this.#modes[mode]?.count || 250;
    while (this.#stars.length < target) this.#stars.push(this.#makeStar());
    while (this.#stars.length > target) this.#stars.pop();
  }

  // ── Loop ───────────────────────────────────────────────────
  update(dt)
  {
    if (!this.#canvas) return;
    const scale = this.#vis.baseH / window.innerHeight;
    const cfg   = this.#modes[this.#mode] || this.#modes.calm;
    const w     = this.#canvas.width;
    const h     = this.#canvas.height;

    for (let i = 0; i < this.#stars.length; i++)
    {
      const s = this.#stars[i];

      if (this.#mode === 'warp')
      {
        const dx  = s.x - this.#cx;
        const dy  = s.y - this.#cy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        s.x += (dx / len) * cfg.speed * s.speed * dt * scale;
        s.y += (dy / len) * cfg.speed * s.speed * dt * scale;
        if (s.x < 0 || s.x > w || s.y < 0 || s.y > h)
        {
          Object.assign(s, this.#makeStar(true));
        }
      }
      else if (this.#mode === 'drift')
      {
        s.y += cfg.speed * s.speed * dt * scale;
        if (s.y > h)
        {
          s.y = 0;
          s.x = Math.random() * w;
        }
        s.twinkle += this.#vis.twinkleDriftRate * dt;
      }
      else
      {
        s.twinkle += this.#vis.twinkleCalmRate * dt;
      }
    }
  }

  draw(alpha)
  {
    if (!this.#canvas || !this.#ctx) return;
    const cfg = this.#modes[this.#mode] || this.#modes.calm;
    const w   = this.#canvas.width;
    const h   = this.#canvas.height;
    const ctx = this.#ctx;
    const scale = this.#vis.baseH / window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    if (this.#mode === 'warp')
    {
      const opacityBuckets = Array.from({ length: 11 }, () => []);

      for (let i = 0; i < this.#stars.length; i++)
      {
        const s = this.#stars[i];
        const alphaVal = this.#vis.warpOpacityMin + s.z * this.#vis.warpOpacityRange;
        const bucketIndex = Math.min(10, Math.floor(alphaVal * 10));
        opacityBuckets[bucketIndex].push(s);
      }

      const stretch = cfg.stretch;
      for (let b = 0; b <= 10; b++)
      {
        const bucket = opacityBuckets[b];
        if (bucket.length === 0) continue;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,255,255,${b / 10})`;

        for (let i = 0; i < bucket.length; i++)
        {
          const s = bucket[i];
          const dx = s.x - this.#cx;
          const dy = s.y - this.#cy;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const currentStretch = stretch * s.speed;

          const stepMove = (cfg.speed * s.speed * (alpha || 0) * scale);
          const interpolatedX = s.x + (dx / len) * stepMove;
          const interpolatedY = s.y + (dy / len) * stepMove;

          ctx.lineWidth = s.size * s.z;
          ctx.moveTo(interpolatedX, interpolatedY);
          ctx.lineTo(interpolatedX - (dx / len) * currentStretch, interpolatedY - (dy / len) * currentStretch);
        }
        ctx.stroke();
      }
    }
    else
    {
      const isDrift = this.#mode === 'drift';
      const baseOp  = isDrift ? this.#vis.driftOpacityBase : this.#vis.calmOpacityBase;
      const ampOp   = isDrift ? this.#vis.driftOpacityAmp  : this.#vis.calmOpacityAmp;

      const alphaBuckets = Array.from({ length: 11 }, () => []);

      for (let i = 0; i < this.#stars.length; i++)
      {
        const s = this.#stars[i];
        const alphaVal = baseOp + Math.sin(s.twinkle) * ampOp;
        const bucketIndex = Math.min(10, Math.max(0, Math.floor(alphaVal * 10)));
        alphaBuckets[bucketIndex].push(s);
      }

      for (let b = 0; b <= 10; b++)
      {
        const bucket = alphaBuckets[b];
        if (bucket.length === 0) continue;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${b / 10})`;

        for (let i = 0; i < bucket.length; i++)
        {
          const s = bucket[i];
          const r = s.size * s.z;

          const interpolatedY = isDrift ? s.y + (cfg.speed * s.speed * (alpha || 0) * scale) : s.y;

          ctx.moveTo(s.x + r, interpolatedY);
          ctx.arc(s.x, interpolatedY, r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }
  }

  destroy()
  {
    if (this.#boundResize)
    {
      window.removeEventListener('resize', this.#boundResize);
    }
    this.#stars = [];
  }
}
