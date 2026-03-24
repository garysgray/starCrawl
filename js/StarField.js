// ── StarField ─────────────────────────────────────────────────
const starModes =
{
  calm:  { speed: 0.05, stretch: 1,  count: 250 },
  drift: { speed: 0.3,  stretch: 2,  count: 350 },
  warp:  { speed: 4.0,  stretch: 18, count: 500 },
};

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
      z:       Math.random(),                    // depth — affects size and opacity
      size:    Math.random() * 1.8 + 0.2,
      twinkle: Math.random() * Math.PI * 2,      // phase offset for twinkle cycle
      speed:   Math.random() * 0.5 + 0.5,        // per-star speed multiplier
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
    const BASE_H = 900;
    const scale  = BASE_H / window.innerHeight;
    const cfg    = starModes[this.mode];
    const w      = this.canvas.width;
    const h      = this.canvas.height;

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
        s.twinkle += 0.02 * dt;
      }
      else
      {
        s.twinkle += 0.015 * dt;
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

    for (let i = 0; i < this.stars.length; i++)
    {
      const s = this.stars[i];

      if (this.mode === 'warp')
      {
        // Draw as a stretched line in the direction of travel
        const dx      = s.x - this.cx;
        const dy      = s.y - this.cy;
        const len     = Math.sqrt(dx * dx + dy * dy) || 1;
        const stretch = cfg.stretch * s.speed;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - (dx / len) * stretch, s.y - (dy / len) * stretch);
        ctx.strokeStyle = `rgba(255,255,255,${0.4 + s.z * 0.6})`;
        ctx.lineWidth   = s.size * s.z;
        ctx.stroke();
      }
      else if (this.mode === 'drift')
      {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.z, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.sin(s.twinkle) * 0.3})`;
        ctx.fill();
      }
      else
      {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.z, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(s.twinkle) * 0.35})`;
        ctx.fill();
      }
    }
  }
}