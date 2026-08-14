// ── StarField ─────────────────────────────────────────────────

// ---- Star modes -------------------------------------------------------------
const starModes =
{
  calm:  { speed: 0.05, stretch: 1,  count: 250 },
  drift: { speed: 0.3,  stretch: 2,  count: 350 },
  warp:  { speed: 4.0,  stretch: 18, count: 500 },
};

// ---- Star config ------------------------------------------------------------
const STAR_BASE_H         = 900;    // screen height speeds are normalised against
const STAR_SIZE_MIN       = 0.2;    // minimum star size
const STAR_SIZE_RANGE     = 1.8;    // star size range above minimum
const STAR_SPEED_MIN      = 0.5;    // minimum per-star speed multiplier
const STAR_SPEED_RANGE    = 0.5;    // per-star speed range above minimum

// ---- Twinkle config ---------------------------------------------------------
const TWINKLE_CALM_RATE   = 0.015;  // twinkle phase increment per tick — calm mode
const TWINKLE_DRIFT_RATE  = 0.02;   // twinkle phase increment per tick — drift mode

// ---- Opacity config ---------------------------------------------------------
const WARP_OPACITY_MIN    = 0.4;    // minimum warp star opacity
const WARP_OPACITY_RANGE  = 0.6;    // warp opacity range above minimum
const DRIFT_OPACITY_BASE  = 0.6;    // base drift star opacity
const DRIFT_OPACITY_AMP   = 0.5;    // twinkle amplitude for drift
const CALM_OPACITY_BASE   = 0.3;    // base calm star opacity
const CALM_OPACITY_AMP    = 0.35;   // twinkle amplitude for calm

class StarField
{
  constructor()
  {
    this.canvas = document.getElementById('stars');
    this.ctx    = this.canvas.getContext('2d');
    this.mode   = 'calm';
    this.stars  = [];

    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._initStars();
  }

  // ---- Setup ----------------------------------------------------------------
  _resize()
  {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.cx = this.canvas.width  / 2;
    this.cy = this.canvas.height / 2;
  }

  // Populates the star array up to the current mode's count
  _initStars()
  {
    this.stars = [];
    const count = starModes[this.mode].count;
    for (let i = 0; i < count; i++) this.stars.push(this._makeStar());
  }

  // Spawns a star at a random screen position, or at center for warp spawn-in
  _makeStar(fromCenter = false)
  {
    return {
      x:       fromCenter ? this.cx : Math.random() * this.canvas.width,
      y:       fromCenter ? this.cy : Math.random() * this.canvas.height,
      z:       Math.random(),                                        // depth — affects size and opacity
      size:    STAR_SIZE_MIN  + (Math.random() * STAR_SIZE_RANGE),
      twinkle: Math.random() * Math.PI * 2,                         // phase offset for twinkle cycle
      speed:   STAR_SPEED_MIN + (Math.random() * STAR_SPEED_RANGE), // per-star speed multiplier
    };
  }

  // ---- Public ---------------------------------------------------------------
  // Adjusts star count to match the new mode without a full reinit
  setMode(mode)
  {
    this.mode = mode;
    const target = starModes[mode].count;
    while (this.stars.length < target) this.stars.push(this._makeStar());
    while (this.stars.length > target) this.stars.pop();
  }

  // ---- Loop -----------------------------------------------------------------
  update(dt)
  {
    const scale = STAR_BASE_H / window.innerHeight;
    const cfg   = starModes[this.mode];
    const w     = this.canvas.width;
    const h     = this.canvas.height;

    for (let i = 0; i < this.stars.length; i++)
    {
      const s = this.stars[i];

      if (this.mode === 'warp')
      {
        // Radiate outward from centre — reset to centre when offscreen
        const dx  = s.x - this.cx;
        const dy  = s.y - this.cy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        s.x += (dx / len) * cfg.speed * s.speed * dt * scale;
        s.y += (dy / len) * cfg.speed * s.speed * dt * scale;
        if (s.x < 0 || s.x > w || s.y < 0 || s.y > h)
          Object.assign(s, this._makeStar(true));
      }
      else if (this.mode === 'drift')
      {
        // Fall downward — wrap back to top when offscreen
        s.y += cfg.speed * s.speed * dt * scale;
        if (s.y > h) { s.y = 0; s.x = Math.random() * w; }
        s.twinkle += TWINKLE_DRIFT_RATE * dt;
      }
      else
      {
        // Calm — stars stay fixed, just twinkle in place
        s.twinkle += TWINKLE_CALM_RATE * dt;
      }
    }
  }

    draw()
  {
    const cfg = starModes[this.mode];
    const w   = this.canvas.width;
    const h   = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    if (this.mode === 'warp')
    {
      // 1. Group warp lines by opacity to minimize stroke state changes
      // Since alpha depends on z (0 to 1), we bucket them into 10 steps
      const opacityBuckets = Array.from({ length: 11 }, () => []);

      for (let i = 0; i < this.stars.length; i++)
      {
        const s = this.stars[i];
        const alpha = WARP_OPACITY_MIN + s.z * WARP_OPACITY_RANGE;
        const bucketIndex = Math.min(10, Math.floor(alpha * 10));
        opacityBuckets[bucketIndex].push(s);
      }

      // 2. Batch-draw each opacity bucket
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
          const dx = s.x - this.cx;
          const dy = s.y - this.cy;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const currentStretch = stretch * s.speed;

          // Set up line width (can vary within a batch without closing the path)
          ctx.lineWidth = s.size * s.z;
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - (dx / len) * currentStretch, s.y - (dy / len) * currentStretch);
        }
        ctx.stroke(); // Paints the entire bucket in one instruction
      }
    }
    else
    {
      // 3. For Calm and Drift modes, bucket stars by their target opacity
      const isDrift = this.mode === 'drift';
      const baseOp  = isDrift ? DRIFT_OPACITY_BASE : CALM_OPACITY_BASE;
      const ampOp   = isDrift ? DRIFT_OPACITY_AMP  : CALM_OPACITY_AMP;
      
      const alphaBuckets = Array.from({ length: 11 }, () => []);

      for (let i = 0; i < this.stars.length; i++)
      {
        const s = this.stars[i];
        const alpha = baseOp + Math.sin(s.twinkle) * ampOp;
        // Pin index between 0 and 10
        const bucketIndex = Math.min(10, Math.max(0, Math.floor(alpha * 10)));
        alphaBuckets[bucketIndex].push(s);
      }

      // 4. Batch-fill the circles
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
          // Move context drawing pin cleanly to avoid continuous sub-paths leaking
          ctx.moveTo(s.x + r, s.y);
          ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        }
        ctx.fill(); // Single graphics layer submittal for this whole visibility tier
      }
    }
  }

}