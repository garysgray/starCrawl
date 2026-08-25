// ──────────────────────────────────────────────────────────────
// ── AUDIOMANAGER ──────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Core audio system handling all procedural sound synthesis and playback
// Core Role:   Manages Web Audio nodes with static pooling for performance
// Dependencies: CONFIG, SoundRecipes
//

class AudioManager
{
  // ── PRIVATE PROPERTIES ──────────────────────────────────────
  #ctx;
  #muted = false;
  #masterVolume;
  #masterGain;
  #loops = {};
  #oneShotPool = [];
  #maxPoolSize = 12;

  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor(initialVolume = 1)
  {
    // Initialize Web Audio context
    this.#ctx = new AudioContext();
    
    // Volume state tracking
    this.#masterVolume = initialVolume;

    // ── SAFARI/iOS/CHROME AUTO-WAKE TRIGGER GUARD ───────────────
    if (this.#ctx.state === 'suspended') 
    {
      this.#ctx.onstatechange = () => 
      {
        if (this.#ctx.state === 'running') 
        {
          console.log("AudioManager: Audio pipeline unlocked by user gesture.");
        }
      };
    }

    // ── AUDIO GRAPH SETUP ─────────────────────────────────────
    // Create master gain node (final output stage)
    this.#masterGain = this.#ctx.createGain();
    this.#masterGain.gain.value = initialVolume;
    this.#masterGain.connect(this.#ctx.destination);

    // Initialize pre-connected node pools
    this.#initNodePools();

    // Start background ambient drone loop
    this.#startAmbientDrone();
  }

  // ── PUBLIC ACCESSORS ────────────────────────────────────────
  get ctx() { return this.#ctx; }
  get muted() { return this.#muted; }
  set muted(value) { this.#muted = value; }
  get masterVolume() { return this.#masterVolume; }
  get masterGain() { return this.#masterGain; }

  // ── PROCEDURAL SOUND RECIPE TRIGGER ─────────────────────────
  play(assetKey, params = {}, customStartTime = null) 
  {
    const recipe = (typeof SoundRecipes !== 'undefined') ? SoundRecipes[assetKey] : null;
    if (!recipe) 
    {
      console.error(`AudioManager: Unknown sound asset: "${assetKey}"`);
      return;
    }

    const resolveValue = (val, ...args) => typeof val === 'function' ? val(...args) : val;

    const bufferSecs = resolveValue(recipe.bufferSecs, params) || 0.1;
    const buffer = AudioManager.createNoiseBuffer(this.#ctx, bufferSecs);

    let filterConfigs = resolveValue(recipe.filters, params);
    if (filterConfigs) 
    {
      filterConfigs = (Array.isArray(filterConfigs) ? filterConfigs : [filterConfigs]).map(f => (
      {
        type: f.type,
        frequency: resolveValue(f.frequency, params),
        Q: resolveValue(f.Q, params),
        gain: resolveValue(f.gain, params)
      }));
    }

    const rawEnv = resolveValue(recipe.envelope, params) || {};
    const envelope = 
    {
      peak: resolveValue(rawEnv.peak, params) ?? 0.8,
      attack: resolveValue(rawEnv.attack, params) ?? 0,
      holdAt: resolveValue(rawEnv.holdAt, params),
      endTime: resolveValue(rawEnv.endTime, params) ?? 0.04,
      startTime: customStartTime || this.#ctx.currentTime
    };

    this.playOneShot(buffer, filterConfigs, envelope);
  }

  // Convenience helper for UI button clicks
  playClick()
  {
    this.play('ui_click');
  }

  // ── STATIC NODE POOL INITIALIZATION ─────────────────────────
  #initNodePools()
  {
    for (let i = 0; i < this.#maxPoolSize; i++)
    {
      const gainNode = this.#ctx.createGain();
      gainNode.gain.setValueAtTime(0, this.#ctx.currentTime);

      const filter1 = this.#ctx.createBiquadFilter();
      const filter2 = this.#ctx.createBiquadFilter();

      // Fixed chain: Filter 1 -> Filter 2 -> Gain -> Master
      filter1.connect(filter2);
      filter2.connect(gainNode);
      gainNode.connect(this.#masterGain);

      this.#oneShotPool.push({
        gain: gainNode,
        filters: [filter1, filter2],
        source: null,
        inUse: false
      }); 
    }
  }

  // ── ONE-SHOT EXECUTION VIA POOLED CHANNELS ───────────────────
  playOneShot(buffer, filter, envelope = {})
  {
    const startTime = envelope.startTime ?? this.#ctx.currentTime;

    const channel = this.#oneShotPool.find(ch => !ch.inUse || this.#ctx.currentTime > ch.endTime);
    if (!channel) return;

    channel.inUse = true;
    channel.endTime = startTime + (envelope.endTime ?? 0.5);

    const filterConfigs = filter ? (Array.isArray(filter) ? filter : [filter]) : [];
    this.#configureFilter(channel.filters[0], filterConfigs[0]);
    this.#configureFilter(channel.filters[1], filterConfigs[1]);

    const source = this.#ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(channel.filters[0]);

    this.#applyEnvelope(channel.gain.gain, envelope, startTime);
    source.start(startTime);
    
    channel.source = source;

    source.onended = () => 
    {
      channel.inUse = false;
      channel.source = null;
    };
  }

  // ── AMBIENT SPACE DRONE SYNTHESIS ───────────────────────────
  #startAmbientDrone()
  {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.audio) ? CONFIG.audio : {
      droneBufSecs:     4,
      droneFilter1Freq: 80,
      droneFilter1Q:    0.8,
      droneFilter2Freq: 320,
      droneFilter2Q:    2,
      droneGainTarget:  0.18,
      droneFadeDelay:   1,
      droneFadeTime:    3,
      droneLfoFreq:     0.08,
      droneLfoDepth:    0.04
    };

    const buf = AudioManager.createNoiseBuffer(this.#ctx, cfg.droneBufSecs);
    const src = this.#ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter1 = this.#ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.value = cfg.droneFilter1Freq;
    filter1.Q.value = cfg.droneFilter1Q;

    const filter2 = this.#ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.value = cfg.droneFilter2Freq;
    filter2.Q.value = cfg.droneFilter2Q;

    const gain = this.#ctx.createGain();
    gain.gain.value = 0;

    const lfo = this.#ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = cfg.droneLfoFreq;

    const lfoGain = this.#ctx.createGain();
    lfoGain.gain.value = cfg.droneLfoDepth;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    src.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gain);
    gain.connect(this.#masterGain);

    src.start();
    lfo.start();

    gain.gain.setTargetAtTime(
      cfg.droneGainTarget,
      this.#ctx.currentTime + cfg.droneFadeDelay,
      cfg.droneFadeTime
    );

    this.#loops['ambient_drone'] = { source: src, gain, filters: [filter1, filter2], lfo, lfoGain };
    this.#loops['ambient_track'] = this.#loops['ambient_drone']; // Alias for SpaceDirector
  }

  // ── BUFFER NOISE GENERATOR ──────────────────────────────────
  static createNoiseBuffer(ctx, durationSecs)
  {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * durationSecs));
    const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++)
    {
      data[i] = Math.random() * 2 - 1;
    }

    const taper = Math.min(300, Math.floor(bufferSize / 2));
    for (let i = 0; i < taper; i++) 
    {
      data[i] *= (i / taper);
      data[bufferSize - 1 - i] *= (i / taper);
    }
    return buffer;
  }

  // ── NODE CONFIGURATION HELPERS ──────────────────────────────
  #configureFilter(filterNode, config)
  {
    if (!config) {
      filterNode.type = 'allpass';
      return;
    }
    filterNode.type = config.type || 'allpass';
    if (config.frequency !== undefined) filterNode.frequency.setValueAtTime(config.frequency, this.#ctx.currentTime);
    if (config.Q !== undefined)         filterNode.Q.setValueAtTime(config.Q, this.#ctx.currentTime);
    if (config.gain !== undefined)      filterNode.gain.setValueAtTime(config.gain, this.#ctx.currentTime);
  }

  #applyEnvelope(gainParam, envelope, startTime)
  {
    const peak    = envelope.peak ?? 1;
    const attack  = envelope.attack ?? 0;
    const holdAt  = envelope.holdAt;
    const endTime = envelope.endTime ?? (attack + 0.1);

    gainParam.setValueAtTime(0, startTime);

    const safeAttack = Math.max(0.005, attack);
    gainParam.linearRampToValueAtTime(peak, startTime + safeAttack);

    if (holdAt !== undefined && holdAt > safeAttack)
    {
      gainParam.setValueAtTime(peak, startTime + holdAt);
    }

    gainParam.exponentialRampToValueAtTime(0.001, startTime + endTime);
    gainParam.setValueAtTime(0, startTime + endTime + 0.005);
  }

  // ── LOOP MANAGEMENT ─────────────────────────────────────────
  startLoopingNoise(name, buffer, filter)
  {
    if (this.#loops[name]) this.stopLoop(name);

    const source = this.#ctx.createBufferSource();
    source.buffer = buffer;
    source.loop   = true;

    const gain = this.#ctx.createGain();
    gain.gain.setValueAtTime(0, this.#ctx.currentTime);

    const filterNode = this.#ctx.createBiquadFilter();
    this.#configureFilter(filterNode, filter);

    source.connect(filterNode);
    filterNode.connect(gain);
    gain.connect(this.#masterGain);
    source.start();

    this.#loops[name] = { source, gain, filterNode };
    return gain;
  }

  stopLoop(name)
  {
    const loop = this.#loops[name];
    if (!loop) return;

    try { loop.source.stop(); } catch (_) {}
    if (loop.lfo) {
      try { loop.lfo.stop(); } catch (_) {}
    }
    delete this.#loops[name];
  }

  setLoopGain(name, value, timeConstant = 0)
  {
    const loop = this.#loops[name];
    if (!loop) return;

    const now = this.#ctx.currentTime;
    const safeValue = isFinite(value) ? value : 0;

    if (timeConstant > 0) {
      loop.gain.gain.setTargetAtTime(safeValue, now, timeConstant);
    } else {
      loop.gain.gain.setValueAtTime(safeValue, now);
    }
  }

  setPlaybackRate(name, rate, timeConstant = 0)
  {
    const loop = this.#loops[name];
    if (!loop || !loop.source) return;

    const now = this.#ctx.currentTime;
    const safeRate = isFinite(rate) ? rate : 1.0;

    if (timeConstant > 0) {
      loop.source.playbackRate.setTargetAtTime(safeRate, now, timeConstant);
    } else {
      loop.source.playbackRate.setValueAtTime(safeRate, now);
    }
  }

  // ── MASTER VOLUME AND MUTE CONTROLS ─────────────────────────
  setMasterVolume(value)
  {
    this.#masterVolume = value;
    if (!this.#muted && this.#masterGain)
    {
      this.#masterGain.gain.setValueAtTime(value, this.#ctx.currentTime);
    }
  }
  
  setMute(value)
  {
    this.#muted = value;
    const targetVolume = this.#muted ? 0 : this.#masterVolume;
    if (this.#masterGain)
    {
      this.#masterGain.gain.setValueAtTime(targetVolume, this.#ctx.currentTime);
    }
  }

  toggleMute()
  {
    this.#muted = !this.#muted;
    const targetVolume = this.#muted ? 0 : this.#masterVolume;
    if (this.#masterGain) 
    {
      this.#masterGain.gain.setValueAtTime(targetVolume, this.#ctx.currentTime);
    }
    return this.#muted;
  }

  resume()
  {
    if (this.#ctx && typeof this.#ctx.resume === 'function') 
    {
      return this.#ctx.resume().then(() => {
        const targetVolume = this.#muted ? 0 : this.#masterVolume;
        if (this.#masterGain) 
        {
          this.#masterGain.gain.setValueAtTime(targetVolume, this.#ctx.currentTime);
        }
      });
    }
    return Promise.resolve();
  }

  // ── MASTER TEARDOWN PIPELINE ────────────────────────────────
  stopAll()
  {
    console.log("AudioManager: Disposing active synthesizers and looping nodes...");
    
    Object.keys(this.#loops).forEach(name => this.stopLoop(name));

    this.#oneShotPool.forEach(channel => 
    {
      if (channel.source) 
      {
        try { channel.source.stop(); } catch (_) {}
      }
      channel.inUse = false;
    });

    if (this.#ctx && typeof this.#ctx.close === 'function')
    {
      this.#ctx.close().then(() => 
      {
        console.log("AudioManager: AudioContext closed cleanly.");
      });
    }
  }
}
