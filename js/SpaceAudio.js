// ── SpaceAudio ────────────────────────────────────────────────

// ---- Drone config -----------------------------------------------------------
const DRONE_BUF_SECS      = 4;      // seconds of white noise buffer
const DRONE_FILTER1_FREQ  = 80;     // first bandpass centre frequency — low rumble
const DRONE_FILTER1_Q     = 0.8;    // first bandpass Q
const DRONE_FILTER2_FREQ  = 320;    // second bandpass centre frequency — mid presence
const DRONE_FILTER2_Q     = 2;      // second bandpass Q
const DRONE_GAIN_TARGET   = 0.18;   // target volume after fade in
const DRONE_FADE_DELAY    = 1;      // seconds before fade in starts
const DRONE_FADE_TIME     = 3;      // fade in time constant in seconds
const DRONE_LFO_FREQ      = 0.08;   // LFO frequency — breathing rate in hz
const DRONE_LFO_DEPTH     = 0.04;   // LFO gain depth — how much it modulates volume

// ---- Click SFX config -------------------------------------------------------
const CLICK_BUF_SECS      = 0.04;   // length of click noise buffer in seconds
const CLICK_FILTER_FREQ   = 1800;   // highpass cutoff — keeps crisp top end only
const CLICK_GAIN_START    = 0.8;    // initial click volume
const CLICK_GAIN_END      = 0.001;  // end volume after decay
const CLICK_DECAY_TIME    = 0.04;   // decay duration in seconds

// ---- Noise generation -------------------------------------------------------
const NOISE_MIN           = -1;     // white noise min value
const NOISE_RANGE         = 2;      // white noise range (max - min)

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
    // White noise buffer as source material
    const bufSize = this.ctx.sampleRate * DRONE_BUF_SECS;
    const buf     = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data    = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++)
      data[i] = NOISE_MIN + (Math.random() * NOISE_RANGE);

    const src  = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop   = true;

    // Two bandpass filters sculpt the noise into low rumble + mid presence
    const filter           = this.ctx.createBiquadFilter();
    filter.type            = 'bandpass';
    filter.frequency.value = DRONE_FILTER1_FREQ;
    filter.Q.value         = DRONE_FILTER1_Q;

    const filter2           = this.ctx.createBiquadFilter();
    filter2.type            = 'bandpass';
    filter2.frequency.value = DRONE_FILTER2_FREQ;
    filter2.Q.value         = DRONE_FILTER2_Q;

    // Master gain — starts silent, fades in after delay
    const gain      = this.ctx.createGain();
    gain.gain.value = 0;

    // Slow LFO modulates volume for a breathing effect
    const lfo           = this.ctx.createOscillator();
    lfo.type            = 'sine';
    lfo.frequency.value = DRONE_LFO_FREQ;

    const lfoGain      = this.ctx.createGain();
    lfoGain.gain.value = DRONE_LFO_DEPTH;

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

    // Fade drone in smoothly after delay
    gain.gain.setTargetAtTime(
      DRONE_GAIN_TARGET,
      this.ctx.currentTime + DRONE_FADE_DELAY,
      DRONE_FADE_TIME
    );

    this.droneGain = gain;
  }

  // ---- SFX ------------------------------------------------------------------
  // Short filtered noise burst — sounds like a soft console click
  playClick()
  {
    const now = this.ctx.currentTime;

    // Short white noise buffer
    const buf  = this.ctx.createBuffer(1, this.ctx.sampleRate * CLICK_BUF_SECS, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = NOISE_MIN + (Math.random() * NOISE_RANGE);

    const src  = this.ctx.createBufferSource();
    src.buffer = buf;

    // Highpass keeps only the crisp top end of the noise
    const filter           = this.ctx.createBiquadFilter();
    filter.type            = 'highpass';
    filter.frequency.value = CLICK_FILTER_FREQ;

    // Quick exponential decay — punches then vanishes
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(CLICK_GAIN_START, now);
    gain.gain.exponentialRampToValueAtTime(CLICK_GAIN_END, now + CLICK_DECAY_TIME);

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