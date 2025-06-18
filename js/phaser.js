// phaser.js – Phaser 3.90  ✧ jungle sparkle + exact-fit marks ✧
window.addEventListener('DOMContentLoaded', () => {

  const layer = document.getElementById('phaserLayer');
  const rect  = layer.getBoundingClientRect();

  new Phaser.Game({
    type       : Phaser.AUTO,
    width      : rect.width,
    height     : rect.height,
    transparent: true,
    parent     : 'phaserLayer',
    scene      : { preload, create }
  });

  /* ───── preload ───── */
  function preload () {
    this.load.image('sparkle', 'img/sparkle.png');       // transparent jungle starburst
  }

  /* ───── create ───── */
  function create () {
    const scene   = this;
    const camera  = scene.cameras.main;
    const canvasB = scene.game.canvas.getBoundingClientRect();

    /* 1️⃣  reusable centre burst (big-win flash) */
    const centre = scene.add.particles(
      rect.width  * .1,
      rect.height * .1,
      'sparkle',
      {
        speed     : { min:-150, max:150 },
        lifespan  : 600,
        scale     : { start:.7, end:0 },
        quantity  : 6,
        blendMode : 'ADD',
        emitting  : false
      }
    );

    /* 2️⃣  mark-sprite pool (exact-fit glows) */
    const markPool   = scene.add.group();
    const activeByEl = new Map();          // DOM-element ➟ sprite

    function obtainMark () {
      let s = markPool.getFirstDead();
      if (!s) {
        s = scene.add.image(0, 0, 'sparkle')
                    .setBlendMode(Phaser.BlendModes.ADD)
                    .setOrigin(.5);
        markPool.add(s);
      }
      return s.setActive(true).setVisible(true).setAlpha(1);
    }

    function clearMarks () {
      activeByEl.forEach(sprite => sprite.setActive(false).setVisible(false));
      activeByEl.clear();
    }

    function pulse (sprite) {
      scene.tweens.add({
        targets : sprite,
        scale   : { from:.2, to:1 },
        alpha   : { from:0,  to:1 },
        yoyo    : true,
        ease    : 'expo.out',
        duration: 420
      });
    }

    /* 3️⃣  global helpers for game.js */
    window.PhaserEffects = {

      playWinEffect () { centre.explode(60); },

      /** Called each time you’ve finished applying the `.marked`
       *  class to the current winning tiles.         */
      burstAtElements (elements) {
        clearMarks();                        // start fresh every cascade step

        elements.forEach(el => {
          /* skip duplicates – 1 sprite per DOM node */
          if (activeByEl.has(el)) return;

          const r  = el.getBoundingClientRect();
          const cx = Math.round(r.left - canvasB.left + r.width  / 2);
          const cy = Math.round(r.top  - canvasB.top  + r.height / 2);

          /* 3-a  small sparkle burst (disappears) */
          const factor = Math.min(r.width, r.height) / 90;
          scene.add.particles(cx, cy, 'sparkle', {
            speed     : { min:-160*factor, max:160*factor },
            angle     : { min:0, max:360 },
            lifespan  : 320 + factor*120,
            scale     : { start:.35*factor, end:0 },
            quantity  : 5 + Math.round(factor*4),
            blendMode : 'ADD',
            emitting  : false
          }).explode(5 + Math.round(factor*2));

          /* 3-b  persistent glow that exactly matches tile size */
          const m = obtainMark();
          m.setPosition(cx, cy);
          m.setDisplaySize(r.width, r.height);   // ← perfect fit
          pulse(m);

          activeByEl.set(el, m);                 // remember mapping
        });
      },

      clearMarks,                                // call when you remove .marked
      shake (i=.007, d=280){ camera.shake(d, i); }
    };
  }
});
