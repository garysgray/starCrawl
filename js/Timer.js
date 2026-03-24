// ============================================================================
// TIMER CLASS (Cleaned)
// ============================================================================

class Timer
{
    #name;
    #duration;     // seconds for one cycle
    #timeLeft;     // countdown mode
    #elapsedTime;  // countup mode
    #active;
    #mode;         // timerModes.COUNTDOWN | COUNTUP
    #loop;         // for cadence-based timers (weapons, AI, spawners)

    constructor(name, durationSeconds = 0, mode = timerModes.COUNTDOWN, loop = false) 
    {
        this.#name = name;
        this.#duration = durationSeconds;
        this.#mode = mode;
        this.#loop = loop;

        this.#timeLeft = durationSeconds;
        this.#elapsedTime = 0;
        this.#active = false;
    }

    // ---------------------------------------------------
    // Getters
    // ---------------------------------------------------
    get name() { return this.#name; }
    get mode() { return this.#mode; }
    get active() { return this.#active; }
    get timeLeft() { return Math.max(0, this.#timeLeft); }
    get elapsedTime() { return this.#elapsedTime; }
    get finished() { return !this.#active && this.#timeLeft <= 0;}

    get progress()
    {
        if (this.#mode === timerModes.COUNTDOWN)
        {
            return 1 - (this.#timeLeft / (this.#duration || 1));
        }
        return this.#duration
            ? Math.min(1, this.#elapsedTime / this.#duration)
            : 0;
    }

    // ---------------------------------------------------
    // Control
    // ---------------------------------------------------
    start()
    {
        if (this.#mode === timerModes.COUNTDOWN)
        {
            this.#timeLeft = this.#duration;
        }
        else
        {
            this.#elapsedTime = 0;
        }
        this.#active = true;
    }

    stop()
    {
        this.#active = false;
    }

    setAndStart(durationSeconds = this.#duration, mode = this.#mode, loop = this.#loop)
    {
        this.#duration = durationSeconds;
        this.#mode = mode;
        this.#loop = loop;
        this.start();
    }

    // ---------------------------------------------------
    // Update
    // ---------------------------------------------------
    // Returns true on finish / tick
    update(delta)
    {
        if (!this.#active) return false;

        return this.#mode === timerModes.COUNTDOWN
            ? this.#updateCountdown(delta)
            : this.#updateCountup(delta);
    }

    #updateCountdown(delta)
    {
        this.#timeLeft -= delta;

        if (this.#timeLeft > 0) return false;

        if (this.#loop)
        {
            this.#timeLeft += this.#duration;
        }
        else
        {
            this.#active = false;
        }

        return true;
    }

    #updateCountup(delta)
    {
        this.#elapsedTime += delta;

        if (!this.#loop || this.#duration <= 0) return false;
        if (this.#elapsedTime < this.#duration) return false;

        this.#elapsedTime -= this.#duration;
        return true;
    }

    // ---------------------------------------------------
    // Formatting
    // ---------------------------------------------------
    get formatted()
    {
        const total = Math.floor(this.#timeLeft);
        const minutes = Math.floor(total / 60);
        const seconds = total % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    // ---------------------------------------------------
    // Static helpers
    // ---------------------------------------------------
    static loadTimers(timerHolder, timerTypes)
    {
        Object.values(timerTypes).forEach(def =>
        {
            const timer = new Timer(
                def.name,
                def.duration,
                def.timerMode,
                false
            );
            timerHolder.addObject(timer);
        });
    }
}
