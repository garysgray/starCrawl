// ── StarField ─────────────────────────────────────────────────

// ---- Star modes -------------------------------------------------------------
const starModes =
{
  calm:  { speed: 0.05, stretch: 1,  count: 250 },
  drift: { speed: 0.3,  stretch: 2,  count: 350 },
  warp:  { speed: 4.0,  stretch: 18, count: 500 },
};

// ---- Star config ------------------------------------------------------------
const STAR_BASE_H         = 900;    
const STAR_SIZE_MIN       = 0.2;    
const STAR_SIZE_RANGE     = 1.8;    
const STAR_SPEED_MIN      = 0.5;    
const STAR_SPEED_RANGE    = 0.5;    

// ---- Twinkle config ---------------------------------------------------------
const TWINKLE_CALM_RATE   = 0.015;  
const TWINKLE_DRIFT_RATE  = 0.02;   

// ---- Opacity config ---------------------------------------------------------
const WARP_OPACITY_MIN    = 0.4;    
const WARP_OPACITY_RANGE  = 0.6;    
const DRIFT_OPACITY_BASE  = 0.5;  // Brightness compensation from rounding shift  
const DRIFT_OPACITY_AMP   = 0.3;    
const CALM_OPACITY_BASE   = 0.4;  // Brightness compensation from rounding shift  
const CALM_OPACITY_AMP    = 0.35;   

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

  _initStars()
  {
    this.stars = [];
    const count = starModes[this.mode].count;
    for (let i = 0; i < count; i++) this.stars.push(this._makeStar());
  }

  _makeStar(fromCenter = false)
  {
    return {
      x:       fromCenter ? this.cx : Math.random() * this.canvas.width,
      y:       fromCenter ? this.cy : Math.random() * this.canvas.height,
      z:       Math.random(),                                        
      size:    STAR_SIZE_MIN  + (Math.random() * STAR_SIZE_RANGE),
      twinkle: Math.random() * Math.PI * 2,                         
      speed:   STAR_SPEED_MIN + (Math.random() * STAR_SPEED_RANGE), 
    };
  }

  // ---- Public ---------------------------------------------------------------
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
        s.y += cfg.speed * s.speed * dt * scale;
        if (s.y > h) { s.y = 0; s.x = Math.random() * w; }
        s.twinkle += TWINKLE_DRIFT_RATE * dt;
      }
      else
      {
        s.twinkle += TWINKLE_CALM_RATE * dt;
      }
    }
  }

  // FIX: Accepts the alpha timing parameter to smooth motion frames
  draw(alpha)
  {
    const cfg = starModes[this.mode];
    const w   = this.canvas.width;
    const h   = this.canvas.height;
    const ctx = this.ctx;
    const scale = STAR_BASE_H / window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    if (this.mode === 'warp')
    {
      const opacityBuckets = Array.from({ length: 11 }, () => []);

      for (let i = 0; i < this.stars.length; i++)
      {
        const s = this.stars[i];
        const alphaVal = WARP_OPACITY_MIN + s.z * WARP_OPACITY_RANGE;
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
          const dx = s.x - this.cx;
          const dy = s.y - this.cy;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const currentStretch = stretch * s.speed;

          // INTERPOLATE POSITION: Compute where the warp star line is between ticks
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
      const isDrift = this.mode === 'drift';
      const baseOp  = isDrift ? DRIFT_OPACITY_BASE : CALM_OPACITY_BASE;
      const ampOp   = isDrift ? DRIFT_OPACITY_AMP  : CALM_OPACITY_AMP;
      
      const alphaBuckets = Array.from({ length: 11 }, () => []);

      for (let i = 0; i < this.stars.length; i++)
      {
        const s = this.stars[i];
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
          
          // INTERPOLATE POSITION: Slide drifting stars downward smoothly between ticks
          const interpolatedY = isDrift ? s.y + (cfg.speed * s.speed * (alpha || 0) * scale) : s.y;

          ctx.moveTo(s.x + r, interpolatedY);
          ctx.arc(s.x, interpolatedY, r, 0, Math.PI * 2);
        }
        ctx.fill(); 
      }
    }
  }
}
