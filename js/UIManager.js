// ──────────────────────────────────────────────────────────────
// ── UIMANAGER ─────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Central controller for all UI components and their interactions
// Core Role:   Manages component registration, event handling, and state broadcasts
// Dependencies: UIComponent
//
// Design Notes:
// - UIManager acts as the mediator between UI components and engine systems.
// - Action routing remains explicit so each action is sent only to the
//   subsystem responsible for handling it.
// - UI configuration is supplied by Engine/CONFIG rather than hardcoded here.
// - Initial UI state is data-driven through initLayoutStates().
// - UIManager owns listeners generated from component event maps.
// - Individual UI components own their own internal behavior and listeners.

class UIManager
{
      // ── PRIVATE PROPERTIES ──────────────────────────────────────
    #engines;
    #components;
    #registeredListeners;

    // ── CONSTRUCTOR ────────────────────────────────────────────
    constructor(audio, visuals, environment)
    {
        // Reference core engine systems
        this.#engines = { audio, visuals, environment };

        // Component registry
        this.#components = new Map();

        // Track element listeners so we can unbind them during teardown
        this.#registeredListeners = [];
    }

    // ── PUBLIC GETTERS AND SETTERS ──────────────────────────────
    get engines() { return this.#engines; }
    set engines(val) { this.#engines = val; }

    get components() { return this.#components; }
    set components(val) { this.#components = val; }

    get _registeredListeners() { return this.#registeredListeners; }
    set _registeredListeners(val) { this.#registeredListeners = val; }


    // ── COMPONENT REGISTRATION ─────────────────────────────────
    registerComponent(name, instance)
    {
        // Validate the component contract immediately.
        // This produces a useful architectural error instead of allowing
        // a vague runtime failure later.
        if (!instance || typeof instance.getEventMaps !== 'function')
        {
            throw new TypeError(`UIManager: Component "${name}" must implement getEventMaps().`);
        }

        if (typeof instance.updateVisualState !== 'function')
        {
            throw new TypeError(`UIManager: Component "${name}" must implement updateVisualState().`);
        }

        // Register the component
        this.components.set(name, instance);

        // Retrieve the component's DOM event configuration
        const eventMaps = instance.getEventMaps();

        if (!Array.isArray(eventMaps))
        {
            throw new TypeError(`UIManager: Component "${name}" getEventMaps() must return an array.`);
        }

        eventMaps.forEach(({ elementId, eventType, actionType, actionValue }) =>
        {
            const element = document.getElementById(elementId);

            if (!element)
            {
                console.warn(`UIManager: Element "${elementId}" not found for component "${name}".`);
                return;
            }

            // Updated handler to intercept empty container clicks
            const handler = (event) =>
            {
                // If clicking the giant dynamic text container, ensure they hit the text itself, not empty space
                if (elementId === 'dynamic-scroll-text' && event.target === element)
                {
                    return; // Ignore background click completely
                }
                
                if (this.engines.audio && typeof this.engines.audio.playClick === 'function')
                {
                    this.engines.audio.playClick();
                }
                const finalValue = (element.type === 'range')
                    ? parseFloat(element.value)
                    : actionValue;

                this.#handleComponentAction(actionType, finalValue);
            };

            // Pass the event object to the handler
            element.addEventListener(eventType, handler);

            this.#registeredListeners.push({ element, eventType, handler });
        });
    }

    // ── ACTION ROUTING ─────────────────────────────────────────
        #handleComponentAction(actionType, value)
    {
        let broadcastValue = value;

        switch (actionType)
        {
            // FIX: Ensure this case target matches your config enum exactly
            case CONFIG.UIActions.SET_SPEED:
                if (this.engines.environment && this.engines.environment.crawl)
                {
                    this.engines.environment.crawl.setSpeed(value);
                }
                StorageUtil.set(CONFIG.StorageKeys.CRAWL_SPEED, value);
                break;

            // FIX: Ensure this case target matches your config enum exactly
            case CONFIG.UIActions.SET_STARS:
                if (this.engines.environment && this.engines.environment.stars)
                {
                    this.engines.environment.stars.setMode(value);
                }
                StorageUtil.set(CONFIG.StorageKeys.STAR_MODE, value);
                break;

            case CONFIG.UIActions.OPEN_EDITOR:
                if (this.engines.environment && this.engines.environment.crawl)
                {
                    if (value === 'open') {
                        this.engines.environment.crawl._openEditor();
                    }
                }
                break;
        }

        this.components.forEach((component) =>
        {
            component.updateVisualState(actionType, broadcastValue);
        });
    }


    // ── INITIAL UI STATE ───────────────────────────────────────
    // Receives a data-driven list of initial states from Engine.
    // UIManager does not need to know how many settings exist.
    // Engine simply supplies the initial state payload.
    initLayoutStates(initialStates)
    {
        if (!Array.isArray(initialStates))
        {
            return;
        }

        this.components.forEach((component) =>
        {
            initialStates.forEach(({ actionType, value }) =>
            {
                component.updateVisualState(actionType, value);
            });
        });
    }

    // SAVE TO LOCALSTORAGE ──────────────────────
    #saveSetting(key, value)
    {
        try 
        {
            const savedData = localStorage.getItem("siteSettings");
            const currentSettings = savedData ? JSON.parse(savedData) : {};
            
            // Set the dynamic property key (like colorTheme, masterVolume, etc.)
            currentSettings[key] = value;
            
            localStorage.setItem("siteSettings", JSON.stringify(currentSettings));
        } 
        catch (e) 
        {
            console.error(`UIManager: Failed to save setting "${key}"`, e);
        }
    }

    // ── CLEANUP ────────────────────────────────────────────────
    // Cleans up the UI controller to prevent lingering event listeners.
    destroy()
    {
        // Unbind all component button/slider listeners safely
        this._registeredListeners.forEach(({ element, eventType, handler }) =>
        {
            if (element)
            {
                element.removeEventListener(eventType, handler);
            }
        });

        this._registeredListeners = [];

        console.log("UIManager: Event listeners scrubbed cleanly.");
    }
}

