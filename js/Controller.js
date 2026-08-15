// // ── Controller ────────────────────────────────────────────────
// // Infrastructure only — owns audio, hud, and the active scene.

// class Controller
// {
//   constructor()
//   {
//     this.audio = new SpaceAudio();
//     this.scene = new Scene(this.audio);
//     this.hud   = new HUD(
//       (id) => this.scene.crawl.setSpeed(id),
//       (id) => this.scene.stars.setMode(id),
//       ()   => this.audio.playClick()
//     );
//     document.addEventListener('click', () => this.audio.resume(), { once: true });
    
//   }

//   update(dt)
//   {
//     this.updateScene(dt)
//   }

//   updateScene(dt)
//   {
//     this.scene.update(dt);
//   }

//   drawScene(alpha)
//   {
//     this.scene.draw(alpha);
//   }

//   start()
//   {
//     document.getElementById('speed-fast').className  = 'active-speed';
//     document.getElementById('stars-drift').className = 'active-speed';
//     this.scene.crawl.setSpeed('fast');
//     this.scene.stars.setMode('drift');

//   }
// }
// ── Controller.js ───────────────────────────────────────────────────────────
// Central system router controlling core states and loading modules cleanly

class Controller
{
  constructor()
  {
    this.audio = new SpaceAudio();
    this.scene = new Scene(this.audio);
    
    // 1. Initialize our central decoupled UI Mediator
    this.uiManager = new UIManager(this.audio, null, this.scene);
    
    // 2. Register our upgraded HUD child component
    this.uiManager.registerComponent('hud', new HUD());

    document.addEventListener('click', () => this.audio.resume(), { once: true });
  }

  update(dt)
  {
    this.updateScene(dt);
  }

  updateScene(dt)
  {
    this.scene.update(dt);
  }

  drawScene(alpha)
  {
    this.scene.draw(alpha);
  }

      start()
  {
    // 1. Pull the raw stored settings strings or default configurations directly from storage
    const initialSpeed = StorageUtil.get(CONFIG.StorageKeys.CRAWL_SPEED, 'fast');
    const initialStars = StorageUtil.get(CONFIG.StorageKeys.STAR_MODE, 'drift');

    // 2. Explicitly force-update the underlying physics engines on launch
    this.scene.crawl.setSpeed(initialSpeed);
    this.scene.stars.setMode(initialStars);

    // 3. Dispatch the uniform data payload down to the visual manager
    const startingStates = [
      { actionType: CONFIG.UIActions.SET_SPEED, value: initialSpeed },
      { actionType: CONFIG.UIActions.SET_STARS, value: initialStars }
    ];

    this.uiManager.initLayoutStates(startingStates);
  }


}
