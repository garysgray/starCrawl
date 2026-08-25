// ──────────────────────────────────────────────────────────────
// ── UIMANAGER ─────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Description: Central controller for all UI components and their interactions
// Core Role:   Manages component registration, event handling, and state broadcasts
// Dependencies: UIComponent, CONFIG, StorageUtil
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

  get registeredListeners() { return this.#registeredListeners; }
  set registeredListeners(val) { this.#registeredListeners = val; }

  // ── COMPONENT REGISTRATION ─────────────────────────────────
  registerComponent(name, instance)
  {
    // Validate the component contract immediately.
    if (!instance || typeof instance.getEventMaps !== 'function')
    {
      throw new TypeError(`UIManager: Component "${name}" must implement getEventMaps().`);
    }

    if (typeof instance.updateVisualState !== 'function')
    {
      throw new TypeError(`UIManager: Component "${name}" must implement updateVisualState().`);
    }

    // Register the component
    this.#components.set(name, instance);

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

      const handler = (event) =>
      {
        if (this.#engines.audio && typeof this.#engines.audio.playClick === 'function')
        {
          this.#engines.audio.playClick();
        }

        const finalValue = (element.type === 'range')
          ? parseFloat(element.value)
          : actionValue;

        this.#handleComponentAction(actionType, finalValue);
      };

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
      case CONFIG.UIActions.SET_SPEED:
        if (this.#engines.visuals && this.#engines.visuals.crawl)
        {
          this.#engines.visuals.crawl.setSpeed(value);
        }
        if (this.#engines.environment && typeof this.#engines.environment.changeSimulationMode === 'function')
        {
          this.#engines.environment.changeSimulationMode(value);
        }
        StorageUtil.set(CONFIG.StorageKeys.CRAWL_SPEED, value);
        break;

      case CONFIG.UIActions.SET_STARS:
        if (this.#engines.visuals && this.#engines.visuals.stars)
        {
          this.#engines.visuals.stars.setMode(value);
        }
        StorageUtil.set(CONFIG.StorageKeys.STAR_MODE, value);
        break;

      case CONFIG.UIActions.OPEN_EDITOR:
        if (this.#engines.visuals && this.#engines.visuals.crawl)
        {
          if (value === 'open')
          {
            this.#engines.visuals.crawl._openEditor();
          }
        }
        break;
    }

    this.#components.forEach((component) =>
    {
      component.updateVisualState(actionType, broadcastValue);
    });
  }

  // ── INITIAL UI STATE ───────────────────────────────────────
  // Receives a data-driven list of initial states from Engine.
  initLayoutStates(initialStates)
  {
    if (!Array.isArray(initialStates)) return;

    this.#components.forEach((component) =>
    {
      initialStates.forEach(({ actionType, value }) =>
      {
        component.updateVisualState(actionType, value);
      });
    });
  }

  // ── CLEANUP ────────────────────────────────────────────────
  // Cleans up the UI controller to prevent lingering event listeners.
  destroy()
  {
    this.#registeredListeners.forEach(({ element, eventType, handler }) =>
    {
      if (element)
      {
        element.removeEventListener(eventType, handler);
      }
    });

    this.#registeredListeners = [];
    console.log("UIManager: Event listeners scrubbed cleanly.");
  }
}
