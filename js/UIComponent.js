// ──────────────────────────────────────────────────────────────
// ── UICOMPONENT ────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Abstract base blueprint for all user interface modules.
//
// Core Role:   Defines the common contract and shared lifecycle
//              functionality for all UI components.
//
// Dependencies: None
//
// Why this exists:
// The UIComponent class acts as the universal template for all UI
// modules. It requires child classes to implement standard inbound
// and outbound corridors, allowing UIManager to work with components
// without knowing their individual implementation details.
//
// Shared Functionality:
// - Common internal listener registration
// - Automatic listener cleanup
// - Base component destruction lifecycle

class UIComponent
{
  // ── PRIVATE PROPERTIES ──────────────────────────────────────
  #listeners = [];

  // ── CONSTRUCTOR ────────────────────────────────────────────
  constructor()
  {
      // Defensive Check: Prevent direct instantiation of this abstract class
      if (this.constructor === UIComponent)
      {
          throw new TypeError("Cannot instantiate abstract class UIComponent directly.");
      }
  }

  // ── PUBLIC GETTERS AND SETTERS ──────────────────────────────
  get listeners() { return this.#listeners; }
  set listeners(val) { this.#listeners = val; }

  // ── EVENT MAP CONTRACT ─────────────────────────────────────
  // Returns the configuration checklist of element mappings.
  // UIManager uses this to connect DOM elements to UI actions.
  getEventMaps()
  {
      throw new Error("Method 'getEventMaps()' must be implemented by subclass.");
  }

  // ── VISUAL STATE CONTRACT ─────────────────────────────────
  // Handles receiving unified incoming state broadcasts from UIManager.
  updateVisualState(actionType, value)
  {
      throw new Error("Method 'updateVisualState()' must be implemented by subclass.");
  }

  // ── COMMON EVENT REGISTRATION ──────────────────────────────
  // Registers an event owned internally by this component.
  //
  // UIManager does NOT use this method for its event maps.
  // This is for listeners created directly by the component itself.
  addListener(element, eventType, handler)
  {
      if (!element)
      {
          return;
      }

      element.addEventListener(eventType, handler);

      this.#listeners.push({ element, eventType, handler });
  }

  // ── COMMON EVENT CLEANUP ───────────────────────────────────
  // Removes every listener registered through addListener().
  removeAllListeners()
  {
      this.#listeners.forEach(({ element, eventType, handler }) =>
      {
          element.removeEventListener(eventType, handler);
      });

      this.#listeners = [];
  }

  // ── BASE LIFECYCLE TEARDOWN ────────────────────────────────
  // Child classes can override this method, but should call
  // super.destroy() so shared listeners are always removed.
  destroy()
  {
      this.removeAllListeners();
  }
}

