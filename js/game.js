

/* ------------------------------------------------------------------
   MEGAWAYS SLOT
   Wilds • Scatters / Free-Spins • Cascades • Turbo / Auto / Low-FX
------------------------------------------------------------------ */


/* ╔══════════════════════════════════════════════════════════════╗
   ║  1. CONFIGURATION & SYMBOL POOL                              ║
   ╚══════════════════════════════════════════════════════════════╝ */


/* 10 regular symbols  →  /img/1.png … /img/10.png                */
const COMMON = Array.from({ length: 10 }, (_, i) => ({
  name: `sym${i + 1}`,
  src : `img/${i + 1}.png`,
}));


/* specials */
const WILD    = { name: 'wild',    src: 'img/wild.png',    isWild: true    };
const SCATTER = { name: 'scatter', src: 'img/scatter.png', isScatter: true };


/* Weighted random   (97 % common | 2 % wild | 1 % scatter)       */
/* Weighted random  (98 % common | 1 % wild | 1 % scatter) */
function pickRandomSymbol () {
  const r = Math.random();


  if (r < 0.98)      return COMMON[Math.floor(Math.random() * COMMON.length)]; // 98 %
  else if (r < 0.99)  return WILD;                                              // 1 %
  else                return SCATTER;                                           // 1 %
}




/* ╔══════════════════════════════════════════════════════════════╗
   ║  2. GLOBAL STATE                                             ║
   ╚══════════════════════════════════════════════════════════════╝ */


let isSpinning        = false;
let totalSpins        = 0;
let currentReelConfig = [];     // visible rows per reel (index 0-5)
let freeSpins         = 0;


/* HUD flags */
let turbo     = false;
let autoCount = 0;              // remaining auto-spins (10 by default)


let teaseReel2   = false;   // set when reels 0 & 1 both show a scatter
let reel0Scatter = false;   // temp flags while spinning
let reel1Scatter = false;




/* ╔══════════════════════════════════════════════════════════════╗
   ║  3. DOM REFERENCES                                           ║
   ╚══════════════════════════════════════════════════════════════╝ */


const spinBtn  = document.getElementById('spinBtn');
const turboBtn = document.getElementById('turboBtn');
const autoBtn  = document.getElementById('autoBtn');
const fxBtn    = document.getElementById('fxBtn');
const banner   = document.getElementById('fsBanner');
const reelBox  = document.getElementById('reelsContainer');
const gameArea = document.querySelector('.game-area');


/* ╔══════════════════════════════════════════════════════════════╗
   ║  4. INITIALISATION                                           ║
   ╚══════════════════════════════════════════════════════════════╝ */


spinBtn.addEventListener('click', spin);
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !isSpinning) { e.preventDefault(); spin(); }
});


turboBtn.onclick = () => {
  turbo = !turbo;
  turboBtn.textContent = `Turbo: ${turbo ? 'On' : 'Off'}`;
};
autoBtn.onclick  = () => {
  if (isSpinning) return;
  autoCount = 10;
  autoBtn.textContent = 'Auto 10';
  spin();
};
fxBtn.onclick    = () => {
  document.body.classList.toggle('lowfx');
  fxBtn.textContent = `Low FX: ${document.body.classList.contains('lowfx') ? 'On' : 'Off'}`;
};


initGame();


/* ╔══════════════════════════════════════════════════════════════╗
   ║  5. GAME SETUP                                               ║
   ╚══════════════════════════════════════════════════════════════╝ */


function initGame () {
  reelBox.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const reel   = Object.assign(document.createElement('div'), { className:'reel', id:`reel-${i}` });
    const inside = Object.assign(document.createElement('div'), { className:'reel-content', id:`reel-content-${i}` });
    reel.appendChild(inside);
    reelBox.appendChild(reel);
    generateInitialReelSymbols(i);
  }
  updateWaysToWin();
  updateFreeSpinsUI();
}


/* ╔══════════════════════════════════════════════════════════════╗
   ║  6. SYMBOL FACTORY & REEL HELPERS                            ║
   ╚══════════════════════════════════════════════════════════════╝ */


function createSymbol () {
  const s = pickRandomSymbol();
  const el = document.createElement('div');
  el.className = 'symbol';
  el.dataset.symbol = s.name;
  if (s.isWild)    el.dataset.wild    = '1';
  if (s.isScatter) el.dataset.scatter = '1';


  const img = document.createElement('img');
  img.src = s.src; img.alt = s.name;
  el.appendChild(img);
  return el;
}


function generateInitialReelSymbols (idx) {
  const rows = Math.floor(Math.random() * 6) + 2;    // 2-7 rows
  currentReelConfig[idx] = rows;
  const reel = document.getElementById(`reel-content-${idx}`);
  const h    = 450 / rows;


  reel.innerHTML = '';
  for (let j = 0; j < 10 + rows; j++) {
    const sym = createSymbol();
    sym.style.height = `${h}px`;
    reel.appendChild(sym);
  }
  reel.style.transform = `translateY(-${h * 10}px)`;
}


/* ╔══════════════════════════════════════════════════════════════╗
   ║  7. INFO-PANEL UPDATES                                       ║
   ╚══════════════════════════════════════════════════════════════╝ */


function calculateWaysToWin () {
  return currentReelConfig.reduce((a, b) => a * b, 1);
}
function updateWaysToWin () {
  document.getElementById('waysToWin').textContent =
    `Ways to Win: ${calculateWaysToWin().toLocaleString()}`;
}
function updateFreeSpinsUI () {
  document.getElementById('freeSpins').textContent = freeSpins;
}


/* ╔══════════════════════════════════════════════════════════════╗
   ║  8. SPIN & REEL START                                        ║
   ╚══════════════════════════════════════════════════════════════╝ */


function spin () {
  if (isSpinning) return;


  /* consume a free spin if any */
  if (freeSpins > 0) { freeSpins--; updateFreeSpinsUI(); }


  isSpinning = true;
  totalSpins++;
  document.getElementById('totalSpins').textContent = totalSpins;
  spinBtn.disabled = true;


  /* new reel configs */
  const newCfg = Array.from({ length: 6 }, () => Math.floor(Math.random() * 6) + 2);
  for (let i = 0; i < 6; i++) {
    currentReelConfig[i] = newCfg[i];
    startReelSpin(i, newCfg[i]);
  }
}


function startReelSpin(idx, rows) {
  const reelBox = document.getElementById(`reel-${idx}`);        // wrapper div
  const reel    = document.getElementById(`reel-content-${idx}`);
  const h       = 450 / rows;


  /* ───── duration & tease logic ───── */
  let dur = (turbo ? 0.25 : 0.5) + idx * (turbo ? 0.15 : 0.4);


  const isTease = (idx === 2 && teaseReel2);       // reel-2 only
  if (isTease) { dur += 0.8; teaseReel2 = false; }


  /* add zoom-glow while reel 2 spins */
  if (isTease && !document.body.classList.contains('lowfx')) {
    reelBox.classList.add('tease');
  }


  /* ───── build symbol stack ───── */
  reel.innerHTML = '';


  const spinSyms  = Array.from({ length: 10 }, () => createSymbol());
  const finalSyms = Array.from({ length: rows }, () => createSymbol());


  /* force a scatter into visible area for tease spin */
  if (isTease) {
    const row = Math.floor(Math.random() * rows);
    const forced = document.createElement('div');
    forced.className      = 'symbol scatter-drop';
    forced.dataset.symbol = 'scatter';
    forced.dataset.scatter= '1';
    const img = document.createElement('img');
    img.src = SCATTER.src; img.alt = 'scatter';
    forced.appendChild(img);
    finalSyms[row] = forced;
  }


  [...spinSyms, ...finalSyms].forEach(s => {
    s.style.height = `${h}px`;
    reel.appendChild(s);
  });


  /* ───── scroll animation ───── */
  reel.style.transition = 'none';
  reel.style.transform  = `translateY(-${h * spinSyms.length}px)`;
  reel.offsetHeight;
  setTimeout(() => {
    reel.style.transition = `transform ${dur}s ease-out`;
    reel.style.transform  = 'translateY(0)';
  }, 10);


  /* anticipation wiggle on last two reels */
  if (!document.body.classList.contains('lowfx') && idx >= 4) {
    setTimeout(() => reelBox.classList.add('wiggle'), dur * 1000 - 220);
    setTimeout(() => reelBox.classList.remove('wiggle'), dur * 1000 + 100);
  }


  /* ───── when this reel stops ───── */
  setTimeout(() => {


    /* remove tease glow (if any) */
    reelBox.classList.remove('tease');


    currentReelConfig[idx] = rows;


    /* record visible scatter on reels 0 & 1 */
    const vp = reelBox.getBoundingClientRect();
    const hasVisScatter = [...reel.children].some(el => {
      if (!el.dataset.scatter) return false;
      const r = el.getBoundingClientRect();
      return r.bottom > vp.top && r.top < vp.bottom;
    });
    if (idx === 0) reel0Scatter = hasVisScatter;
    if (idx === 1) reel1Scatter = hasVisScatter;


    /* set tease flag for next spin of reel-2 */
    if (idx === 1 && reel0Scatter && reel1Scatter) teaseReel2 = true;


    /* after last reel, release machine and start cascade */
    if (idx === 5) {
      setTimeout(() => {
        isSpinning = false;
        spinBtn.disabled = !!freeSpins || autoCount > 0;
        cascade();
      }, 200);
    }
    updateWaysToWin();
  }, dur * 1000 + 100);
}






/* ╔══════════════════════════════════════════════════════════════╗
   ║  9. WIN DETECTION (Wild-aware)                               ║
   ╚══════════════════════════════════════════════════════════════╝ */


function highlightMatchingSymbols () {
  document.querySelectorAll('.symbol.marked').forEach(e => e.classList.remove('marked'));


  /* gather visible symbols per reel */
  const reelsVis = Array.from({ length: 6 }, (_, i) => {
    const vp = document.getElementById(`reel-${i}`).getBoundingClientRect();
    return Array.from(document.querySelectorAll(`#reel-content-${i} .symbol`))
      .filter(el => { const r = el.getBoundingClientRect(); return r.bottom>vp.top && r.top<vp.bottom; });
  });


  const MIN = 3; let win = false;


  COMMON.forEach(({ name })=>{
    if (!reelsVis[0].some(el=> el.dataset.symbol===name || el.dataset.wild)) return;


    let chain=0;
    for (let i=0;i<6;i++){
      const ok = reelsVis[i].some(el=> el.dataset.symbol===name || el.dataset.wild);
      if (ok) chain++; else break;
    }
    if (chain>=MIN){
      win=true;
      for (let i = 0; i < chain; i++) {
    reelsVis[i]
        .filter(el => el.dataset.symbol === name || el.dataset.wild) // include wilds again
        .forEach(el => {
        el.classList.remove('marked'); // reset if already marked (prevents stuck animation)
        void el.offsetWidth;           // force reflow to restart animation
        el.classList.add('marked');    // add class back so it plays once
        });
    }
    }
  });
  return win;
}


/* ╔══════════════════════════════════════════════════════════════╗
   ║ 10. SCATTER CHECK + BANNER                                   ║
   ╚══════════════════════════════════════════════════════════════╝ */


/* ------------------------------------------------------------------
   SCATTERS  →  FREE-SPIN AWARD
   (reels 0, 1 and 2 must ALL show a scatter)
------------------------------------------------------------------ */
/* ------------------------------------------------------------------
   SCATTER CHECK + CRAZY CELEBRATION (reels 0-1-2 must each show one)
------------------------------------------------------------------ */
function grantFreeSpinsIfScatter () {
  /* visible scatters per reel 0,1,2 */
  const reelsVis = Array.from({ length: 3 }, (_, i) => {
    const vp = document.getElementById(`reel-${i}`).getBoundingClientRect();
    return Array.from(
      document.querySelectorAll(`#reel-content-${i} .symbol[data-scatter="1"]`)
    ).filter(el => { const r = el.getBoundingClientRect();
                     return r.bottom > vp.top && r.top < vp.bottom; });
  });


  if (!(reelsVis[0].length && reelsVis[1].length && reelsVis[2].length)) return;


  /* 1️⃣  award spins */
  const totalScat = reelsVis.flat().length;
  freeSpins += totalScat;
  updateFreeSpinsUI();
  showFreeSpinBanner(totalScat);


  /* stop if Low-FX mode */
  if (document.body.classList.contains('lowfx')) return;


  /* 2️⃣  scatter pulse */
  reelsVis.flat().forEach(el => el.classList.add('scatter-land'));
  setTimeout(()=> reelsVis.flat().forEach(el=> el.classList.remove('scatter-land')), 800);


  /* 3️⃣  flash wipe */
  const flash = document.createElement('div');
  flash.className = 'flash-overlay animate';
  gameArea.appendChild(flash);
  flash.addEventListener('animationend',()=> flash.remove());


  /* 4️⃣  confetti burst */
  shootConfetti(40);


  /* 5️⃣  camera zoom-shake */
  document.querySelector('.slot-machine').classList.add('scatter-celebration');
  setTimeout(()=> document.querySelector('.slot-machine')
               .classList.remove('scatter-celebration'), 500);
}


/* helper – spawns n coloured squares that fall */
function shootConfetti(n){
  const colors=['#ffd700','#ff69b4','#32cd32','#1e90ff','#c74fff'];
  for(let i=0;i<n;i++){
    const c = document.createElement('div');
    c.className='confetti';
    c.style.left = (Math.random()*100)+'%';
    c.style.setProperty('--col', colors[Math.floor(Math.random()*colors.length)]);
    c.style.animationDuration = 1.5 + Math.random()*1 + 's';
    c.style.animationDelay    = (Math.random()*0.2)+'s';
    document.body.appendChild(c);
    c.addEventListener('animationend', ()=> c.remove());
  }
}


function showFreeSpinBanner(n){
  banner.textContent = `✨  ${n}  FREE SPIN${n>1?'S':''}! ✨`;
  banner.classList.remove('hidden');
  requestAnimationFrame(()=> banner.classList.add('show'));
  setTimeout(()=>{ banner.classList.remove('show');
                   setTimeout(()=> banner.classList.add('hidden'),600); },2000);
}


/* ╔══════════════════════════════════════════════════════════════╗
   ║ 11. CASCADE DRIVER                                           ║
   ╚══════════════════════════════════════════════════════════════╝ */


function cascade () {
  if (!highlightMatchingSymbols()){
    grantFreeSpinsIfScatter();


    /* Big-win camera shake (≥15 marked tiles) */
    if (!document.body.classList.contains('lowfx') &&
        document.querySelectorAll('.symbol.marked').length >= 15){
      document.querySelector('.slot-machine').classList.add('big-win');
      setTimeout(()=> document.querySelector('.slot-machine').classList.remove('big-win'),500);
    }


    if (freeSpins)         spin();
    else if (autoCount>0){ autoCount--; autoBtn.textContent=`Auto ${autoCount}`; spin(); }
    else                   spinBtn.disabled = false;
    return;
  }
  setTimeout(()=> dropMarkedSymbols(cascade), 500);
}


/* ╔══════════════════════════════════════════════════════════════╗
   ║ 12. DROP  (FLIP + bounce + board shake)                      ║
   ╚══════════════════════════════════════════════════════════════╝ */


function dropMarkedSymbols (done) {
  const FADE   = 250;
  const FALL   = 520;
  const RUMBLE = 450;
  let reelsLeft = 6;


  /* board rumble */
  gameArea.classList.add('shake');
  setTimeout(() => gameArea.classList.remove('shake'), RUMBLE);


  for (let r = 0; r < 6; r++) {
    const reel = document.getElementById(`reel-content-${r}`);
    /* ① winners but **not** wilds */
    const wins = [...reel.querySelectorAll('.symbol.marked:not([data-wild])')];
    const rows = currentReelConfig[r];
    const h    = 450 / rows;


    /* FIRST positions */
    const first = new Map();
    [...reel.children].forEach(el => first.set(el, el.getBoundingClientRect().top));


    /* fade out winners */
    wins.forEach(el => { el.classList.remove('marked'); el.classList.add('vanish'); });


    setTimeout(() => {
      /* ② remove winners, prepend fresh symbols */
      wins.forEach(el => el.remove());
      const fresh = [];
      for (let i = 0; i < wins.length; i++) {
        const s = createSymbol();
        s.style.height = `${h}px`;
        reel.prepend(s);
        fresh.push(s);
      }


      /* ③ clamp wilds so none drift below the viewport */
      keepWildsVisible(reel, rows);


      /* LAST positions */
      const last = new Map();
      [...reel.children].forEach(el => last.set(el, el.getBoundingClientRect().top));
      fresh.forEach((el, i) =>
        first.set(el, last.get(el) - h * (wins.length - i))
      );


      /* FLIP + bounce animation */
      let moving = 0;
      first.forEach((start, el) => {
        const end = last.get(el);
        const dy  = start - end;
        if (!dy) return;
        moving++;
        el.animate(
          [
            { transform: `translateY(${dy}px) scale(.95)`, offset: 0   },
            { transform: 'translateY(0) scale(1.07)',      offset: 0.8 },
          ],
          { duration: FALL, easing: 'cubic-bezier(.33,1,.68,1)' }
        ).onfinish = () => {
          el.style.transform = '';
          if (--moving === 0 && --reelsLeft === 0) done();
        };
      });


      /* If nothing moved (all dy = 0), finish immediately */
      if (moving === 0 && --reelsLeft === 0) done();
    }, FADE);
  }
}


// 1) anticipation wiggle (flexible amplitude & duration)
function wiggle(el, duration = 0.3, distance = 3){
  gsap.fromTo(el, {x:-distance}, {
    x: distance,
    duration: duration,
    ease: "sine.inOut",
    yoyo: true,
    repeat: 3
  });
}


// 2) slow-drop scatter with squash & glow
function slowDropScatter(tile){
  gsap.fromTo(tile, {y:"-140%", scale:0.8, opacity:0}, {
    y:0, scale:1,
    duration:0.9,
    ease:"power2.out",
    opacity:1,
    onStart: ()=> tile.style.filter = "drop-shadow(0 0 8px #c74fff)",
    onComplete: ()=> tile.style.filter = ""
  });
}


// 3) confetti burst using GSAP's stagger
function confettiBurst(count=40){
  const colors = ["#ffd700","#ff69b4","#32cd32","#1e90ff","#c74fff"];
  const frags = Array.from({length:count}, ()=>{
    const d=document.createElement("div");
    d.className="confetti";
    d.style.background=colors[Math.random()*colors.length|0];
    d.style.left = Math.random()*100 + "%";
    document.body.appendChild(d);
    return d;
  });


  gsap.to(frags, {
    y: "120vh",
    rotation: "360",
    duration:()=> 1.5 + Math.random(),
    ease:"linear",
    stagger: 0.01,
    onComplete: ()=> frags.forEach(f=>f.remove())
  });
}




/* keep all wilds inside the first <rows> children of a reel */
function keepWildsVisible (reel, rows) {
  [...reel.querySelectorAll('.symbol[data-wild]')].forEach(wild => {
    const idx = [...reel.children].indexOf(wild);
    if (idx >= rows) {
      // move the wild just before the first off-screen slot
      reel.insertBefore(wild, reel.children[rows]);
    }
  });
}


