// ── SpaceAudio ────────────────────────────────────────────────
class SpaceAudio
{
  constructor()
  {
    this.ctx = new AudioContext();
    this._buildDrone();
  }

  // ---- Drone ----------------------------------------------------------------
  // Builds a looping filtered noise drone with a slow LFO volume swell
  _buildDrone()
  {
    // 4 seconds of white noise as the source material
    const bufSize = this.ctx.sampleRate * 4;
    const buf     = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data    = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src    = this.ctx.createBufferSource();
    src.buffer   = buf;
    src.loop     = true;

    // Two bandpass filters to sculpt the noise into a low rumble + mid presence
    const filter           = this.ctx.createBiquadFilter();
    filter.type            = 'bandpass';
    filter.frequency.value = 80;
    filter.Q.value         = 0.8;

    const filter2           = this.ctx.createBiquadFilter();
    filter2.type            = 'bandpass';
    filter2.frequency.value = 320;
    filter2.Q.value         = 2;

    // Master gain for the drone — starts silent, fades in over ~3s
    const gain      = this.ctx.createGain();
    gain.gain.value = 0;

    // Slow LFO gently modulates the volume for a breathing effect
    const lfo           = this.ctx.createOscillator();
    lfo.type            = 'sine';
    lfo.frequency.value = 0.08;

    const lfoGain      = this.ctx.createGain();
    lfoGain.gain.value = 0.04;

    // Signal chain: noise → filter → filter2 → gain → output
    //               lfo → lfoGain → gain.gain (modulation)
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    src.connect(filter);
    filter.connect(filter2);
    filter2.connect(gain);
    gain.connect(this.ctx.destination);

    src.start();
    lfo.start();

    // Fade drone in smoothly after 1s
    gain.gain.setTargetAtTime(0.18, this.ctx.currentTime + 1, 3);

    this.droneGain = gain;
  }

  // ---- SFX ------------------------------------------------------------------
  // Short filtered noise burst — sounds like a soft console click
  playClick()
  {
    const now  = this.ctx.currentTime;

    // 40ms of white noise
    const buf  = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.04, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src    = this.ctx.createBufferSource();
    src.buffer   = buf;

    // Highpass keeps only the crisp top-end of the noise
    const filter           = this.ctx.createBiquadFilter();
    filter.type            = 'highpass';
    filter.frequency.value = 1800;

    // Quick exponential decay so it punches then vanishes
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
  }

  // ---- Public ---------------------------------------------------------------
  // Must be called from a user gesture — browsers suspend AudioContext by default
  resume()
  {
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
}