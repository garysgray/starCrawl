// ── Controller ────────────────────────────────────────────────
class Controller
{
  constructor()
  {
    this.audio = new SpaceAudio();
    this.stars = new StarField();
    this.ships = new ShipLayer();
    this.crawl = new Crawl(this.audio);
    this.hud   = new HUD(
      (id) => this.crawl.setSpeed(id),
      (id) => this.stars.setMode(id),
      ()   => this.audio.playClick()
    );
    document.addEventListener('click', () => this.audio.resume(), { once: true });
  }

  update(dt)
  {
    this.stars.update(dt);
    this.ships.update(dt);
    this.crawl.update(dt);
  }

  draw()
  {
    this.stars.draw();
    this.ships.draw();
    this.crawl.draw();
  }

  start()
  {
    document.getElementById('speed-slow').className = 'active-speed';
    document.getElementById('stars-calm').className = 'active-speed';
  }
}