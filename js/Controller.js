// ── Controller ────────────────────────────────────────────────
// Infrastructure only — owns audio, hud, and the active scene.

class Controller
{
  constructor()
  {
    this.audio = new SpaceAudio();
    this.scene = new Scene(this.audio);
    this.hud   = new HUD(
      (id) => this.scene.crawl.setSpeed(id),
      (id) => this.scene.stars.setMode(id),
      ()   => this.audio.playClick()
    );
    document.addEventListener('click', () => this.audio.resume(), { once: true });
  }

  update(dt)
  {
    this.scene.update(dt);
  }

  draw()
  {
    this.scene.draw();
  }

  start()
  {
    document.getElementById('speed-fast').className  = 'active-speed';
    document.getElementById('stars-drift').className = 'active-speed';
    this.scene.crawl.setSpeed('fast');
    this.scene.stars.setMode('drift');

    setTimeout(() =>
    {
      document.querySelector('.crawl-stage').style.opacity = '1';
    }, 500);
  }
}