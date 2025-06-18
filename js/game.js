/* ------------------------------------------------------------------
   MEGAWAYS SLOT
   Wilds • Scatters / Free-Spins • Cascades • Turbo / Auto / Low-FX
   + BETTING & WINNING SYSTEM
------------------------------------------------------------------ */


/* ╔══════════════════════════════════════════════════════════════╗
   ║  1. CONFIGURATION & SYMBOL POOL                              ║
   ╚══════════════════════════════════════════════════════════════╝ */

/* 10 regular symbols with individual payouts */
const COMMON = Array.from({ length: 10 }, (_, i) => ({
  name: `sym${i + 1}`,
  src : `img/${i + 1}.png`,
  payout: [0.041, 0.081, 0.122, 0.203, 0.325, 0.488, 0.813, 1.423, 2.439, 4.065][i] // payouts for different symbols
}));

/* specials */
const WILD    = { name: 'wild',    src: 'img/wild.png',    isWild: true };
const SCATTER = { name: 'scatter', src: 'img/scatter.png', isScatter: true };

/* Weighted random (98% common | 1% wild | 1% scatter) */
function pickRandomSymbol() {
  const r = Math.random();
  if (r < 0.995) return COMMON[Math.floor(Math.random() * COMMON.length)];
  else if (r < 0.996) return WILD;     // 0.1% = 0.001
  else                return SCATTER;  // 0.4% = 0.004
}


/* ╔══════════════════════════════════════════════════════════════╗
   ║  2. BETTING & BALANCE SYSTEM                                 ║
   ╚══════════════════════════════════════════════════════════════╝ */

let balance = 1000.00;      // Starting balance
let currentBet = 1.00;      // Current bet amount
let totalWagered = 0;       // Total amount wagered
let totalWon = 0;           // Total amount won
let currentWinAmount = 0;   // Current spin's win amount

const BET_LEVELS = [0.10, 0.25, 0.50, 1.00, 2.00, 5.00, 10.00, 25.00, 50.00, 100.00];
let currentBetIndex = 3;    // Start at $1.00

/* Paytable multipliers for different chain lengths */
const CHAIN_MULTIPLIERS = {
  3: 1,    // 3 symbols = 1x symbol payout
  4: 2,    // 4 symbols = 2x symbol payout  
  5: 5,    // 5 symbols = 5x symbol payout
  6: 10    // 6 symbols = 10x symbol payout
};

/* ╔══════════════════════════════════════════════════════════════╗
   ║  3. GLOBAL STATE                                             ║
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
   ║  4. DOM REFERENCES                                           ║
   ╚══════════════════════════════════════════════════════════════╝ */

const spinBtn  = document.getElementById('spinBtn');
const turboBtn = document.getElementById('turboBtn');
const autoBtn  = document.getElementById('autoBtn');
const fxBtn    = document.getElementById('fxBtn');
const banner   = document.getElementById('fsBanner');
const reelBox  = document.getElementById('reelsContainer');
const gameArea = document.querySelector('.game-area');

/* ╔══════════════════════════════════════════════════════════════╗
   ║  5. BETTING SYSTEM FUNCTIONS                                 ║
   ╚══════════════════════════════════════════════════════════════╝ */

function updateBettingDisplay() {
  const betSpan = document.getElementById('betAmount');
  if (betSpan) betSpan.textContent = currentBet.toFixed(2);

  const balanceSpan = document.getElementById('balanceAmount');
  if (balanceSpan) balanceSpan.textContent = balance.toFixed(2);

  const lastWinEl = document.getElementById('lastWinAmount');
if (lastWinEl) lastWinEl.textContent = `$${currentWinAmount.toFixed(2)}`;

}


function placeBet() {
  if (balance < currentBet) {
    showMessage("Insufficient funds!", "#ff4444");
    return false;
  }
  balance -= currentBet;
  totalWagered += currentBet;
  currentWinAmount = 0;
  updateBettingDisplay();
  return true;
}

function awardWin(amount) {
  if (amount <= 0) return;
  
  balance += amount;
  totalWon += amount;
  currentWinAmount += amount;
  updateBettingDisplay();
  
  // Show win animation
  showWinMessage(`${amount.toFixed(2)}`, "#ffd700");
}

function showMessage(text, color = "#ffd700") {
  const msg = document.createElement('div');
  msg.textContent = text;
  msg.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    font-weight: bold;
    color: ${color};
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    z-index: 2000;
    pointer-events: none;
    animation: fadeInOut 2s ease-out forwards;
    background: rgba(0, 0, 0, 0);
    padding: 20px;
    border-radius: 10px;
  `;
  
  // Add CSS animation if not exists
  if (!document.getElementById('winAnimations')) {
    const style = document.createElement('style');
    style.id = 'winAnimations';
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(5.1); }
        60% { opacity: 1; transform: translate(-50%, -50%) scale(0.9); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(-10; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 2000);
}

function showWinMessage(text, color) {
  showMessage(text, color);
}

/* ╔══════════════════════════════════════════════════════════════╗
   ║  6. INITIALISATION                                           ║
   ╚══════════════════════════════════════════════════════════════╝ */

spinBtn.addEventListener('click', spin);
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !isSpinning) { e.preventDefault(); spin(); }
});

turboBtn.onclick = () => {
  turbo = !turbo;
  turboBtn.textContent = `Turbo: ${turbo ? 'On' : 'Off'}`;
};

autoBtn.onclick = () => {
  if (isSpinning) return;
  autoCount = 10;
  autoBtn.textContent = 'Auto 10';
  spin();
};

initGame();

/* ╔══════════════════════════════════════════════════════════════╗
   ║  7. GAME SETUP                                               ║
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
  updateBettingDisplay();
  document.getElementById('betUp').onclick = () => {
  if (currentBetIndex < BET_LEVELS.length - 1) {
    currentBetIndex++;
    currentBet = BET_LEVELS[currentBetIndex];
    updateBettingDisplay();
  }
};

document.getElementById('betDown').onclick = () => {
  if (currentBetIndex > 0) {
    currentBetIndex--;
    currentBet = BET_LEVELS[currentBetIndex];
    updateBettingDisplay();
  }
};

document.getElementById('maxBet').onclick = () => {
  currentBetIndex = BET_LEVELS.length - 1;
  currentBet = BET_LEVELS[currentBetIndex];
  updateBettingDisplay();
};

}

/* ╔══════════════════════════════════════════════════════════════╗
   ║  8. SYMBOL FACTORY & REEL HELPERS                            ║
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
  const h    = 850 / rows;

  reel.innerHTML = '';
  for (let j = 0; j < 10 + rows; j++) {
    const sym = createSymbol();
    sym.style.height = `${h}px`;
    reel.appendChild(sym);
  }
  reel.style.transform = `translateY(-${h * 10}px)`;
}

/* ╔══════════════════════════════════════════════════════════════╗
   ║  9. INFO-PANEL UPDATES                                       ║
   ╚══════════════════════════════════════════════════════════════╝ */

function calculateWaysToWin () {
  return currentReelConfig.reduce((a, b) => a * b, 1);
}

function updateWaysToWin () {
  const element = document.getElementById('waysToWin');
  if (element) {
    element.textContent = `Ways to Win: ${calculateWaysToWin().toLocaleString()}`;
  }
}

function updateFreeSpinsUI () {
  const element = document.getElementById('freeSpins');
  if (element) {
    element.textContent = freeSpins;
  }
}

/* ╔══════════════════════════════════════════════════════════════╗
   ║ 10. SPIN & REEL START                                        ║
   ╚══════════════════════════════════════════════════════════════╝ */

function spin () {
  if (isSpinning) return;

  // Check if we can afford the bet (unless it's a free spin)
  if (freeSpins === 0 && !placeBet()) {
    return;
  }

  /* consume a free spin if any */
  if (freeSpins > 0) { freeSpins--; updateFreeSpinsUI(); }

  isSpinning = true;
  totalSpins++;
  const totalSpinsEl = document.getElementById('totalSpins');
  if (totalSpinsEl) totalSpinsEl.textContent = totalSpins;
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
  const h       = 850 / rows; // height VERY FUCKING IMPORTANT FOR EVRYTHING.

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
   ║ 11. WIN DETECTION (Wild-aware + Payout Calculation)          ║
   ╚══════════════════════════════════════════════════════════════╝ */

function highlightMatchingSymbols () {
  // Clear previous markings
  document.querySelectorAll('.symbol.marked').forEach(e => e.classList.remove('marked'));

  // Get visible symbols per reel
  const reelsVis = Array.from({ length: 6 }, (_, i) => {
    const reelContent = document.getElementById(`reel-content-${i}`);
    return Array.from(reelContent.children).slice(0, currentReelConfig[i]);
  });

  const MIN = 3; 
  let win = false;
  let totalWinAmount = 0;
  const matchedEls = [];

  COMMON.forEach(({ name, payout }) => {
    if (!reelsVis[0].some(el => el.dataset.symbol === name || el.dataset.wild)) return;

    let chain = 0;
    for (let i = 0; i < 6; i++) {
      const ok = reelsVis[i].some(el => el.dataset.symbol === name || el.dataset.wild);
      if (ok) chain++; else break;
    }

    if (chain >= MIN) {
      win = true;

      // Calculate win amount
      const symbolPayout = payout * currentBet;
      const chainMultiplier = CHAIN_MULTIPLIERS[chain] || CHAIN_MULTIPLIERS[6];
      const winAmount = symbolPayout * chainMultiplier;
      totalWinAmount += winAmount;

      // Mark and collect matched elements
      for (let i = 0; i < chain; i++) {
        const matched = reelsVis[i].filter(el => el.dataset.symbol === name || el.dataset.wild);
        matched.forEach(el => {
          el.classList.remove('marked'); // reset if already marked
          void el.offsetWidth;           // reflow
          el.classList.add('marked');    // trigger animation
        });
        matchedEls.push(...matched);
      }
    }
  });

  // Trigger FX
  if (matchedEls.length && window.PhaserEffects) {
    PhaserEffects.burstAtElements(matchedEls);
  }

  // Award total win
  if (totalWinAmount > 0) {
    awardWin(totalWinAmount);
  }

  return win;
}


/* ╔══════════════════════════════════════════════════════════════╗
   ║ 12. SCATTER CHECK + BANNER                                   ║
   ╚══════════════════════════════════════════════════════════════╝ */

function grantFreeSpinsIfScatter () {
  /* visible scatters per reel 0,1,2 */
  const reelsVis = Array.from({ length: 3 }, (_, i) => {
    const reelContent = document.getElementById(`reel-content-${i}`);
    return Array.from(reelContent.children)
      .slice(0, currentReelConfig[i])
      .filter(el => el.dataset.scatter === "1");

  });

  if (!(reelsVis[0].length && reelsVis[1].length && reelsVis[2].length)) return;

  /* 1️⃣  award spins */
  const totalScat = reelsVis.flat().length;
  freeSpins += totalScat;
  updateFreeSpinsUI();
  showFreeSpinBanner(totalScat);
  
  // Scatter bonus payout
  const scatterBonus = totalScat * currentBet * 2; // 2x bet per scatter
  if (scatterBonus > 0) {
    awardWin(scatterBonus);
  }

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
  shootConfetti(4000);

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
   ║ 13. CASCADE DRIVER                                           ║
   ╚══════════════════════════════════════════════════════════════╝ */

function cascade () {

  /* --------------------------------------------------------------
     1. Did we find a win chain this pass?
  -------------------------------------------------------------- */
  const foundWin = highlightMatchingSymbols();

  if (!foundWin) {
    /* ── no more wins → end of cascade ── */
    grantFreeSpinsIfScatter();

    /* big-win CSS + stronger shake */
    const bigWinTiles = document.querySelectorAll('.symbol.marked').length;
    if (!document.body.classList.contains('lowfx') && bigWinTiles >= 15) {
      document.querySelector('.slot-machine').classList.add('big-win');
      if (window.PhaserEffects) PhaserEffects.shake(0.015, 450);
      setTimeout(() =>
        document.querySelector('.slot-machine').classList.remove('big-win'),
      500);
    }

    /* spin control flow */
    if (freeSpins) {
      spin();
    } else if (autoCount > 0) {
      autoCount--;
      autoBtn.textContent = `Auto ${autoCount}`;
      spin();
    } else {
      spinBtn.disabled = false;
    }
    return;                            // ← finished cascade
  }

  /* --------------------------------------------------------------
     2. We DID find wins → trigger camera shake, then drop symbols
  -------------------------------------------------------------- */
  if (window.PhaserEffects) {
    PhaserEffects.shake(0.007, 280);   // mild shake for each drop step
  }

  /* schedule the actual drop animation */
  setTimeout(() => dropMarkedSymbols(cascade), 500);
}


/* ╔══════════════════════════════════════════════════════════════╗
   ║ 14. DROP  (FLIP + bounce + board shake)                      ║
   ╚══════════════════════════════════════════════════════════════╝ */
function dropMarkedSymbols(done) {
  const OUT_FADE  = 5;      // how fast winners vanish
  const DROP_TIME = 900;     // full drop-bounce cycle
  const REEL_GAP  = 10;      // stagger between columns
  let   reelsLeft = 6;

  for (let c = 0; c < 6; c++) {
    const reel     = document.getElementById(`reel-content-${c}`);
    const winners  = [...reel.querySelectorAll('.symbol.marked:not([data-wild])')];
    const rows     = currentReelConfig[c];
    const tileH    = 850 / rows;
    const colDelay = c * REEL_GAP;

    /* ①   fade current winners */
    winners.forEach(el => { el.classList.remove('marked'); el.classList.add('vanish'); });

    setTimeout(() => {

      /* ②   remove winners, prepend fresh symbols */
      winners.forEach(el => el.remove());

      const fresh = [];
      for (let i = 0; i < winners.length; i++) {
        const s = createSymbol();
        s.style.height = `${tileH}px`;
        reel.prepend(s);
        fresh.push(s);
      }
      keepWildsVisible(reel, rows);

      if (winners.length === 0) {
        if (--reelsLeft === 0) done();
        return;                        // ⟵ skip animation section
      }

      /* ③   animate each fresh tile */
      let active = 0;
      fresh.forEach((el, idx) => {

        const startY = -tileH * (winners.length - idx);   // above viewport
        const delay  = idx * 24;                          // ripple inside column

        /* random direction per TILE  --------------------------------*/
        const tilt   = (Math.random() < 0.5 ? -1 : 1) * 6;  // ±6°

        /* pivot on the corresponding bottom corner */
        el.style.transformOrigin = tilt > 0 ? 'bottom right' : 'bottom left';

        active++;
        el.animate(
          [
            /* drop from top */
            { transform: `translateY(${startY}px) rotate(0deg)`,      offset: 0   },

            /* slam past baseline */
            { transform: `translateY(39px) rotate(0deg)`,            offset: .55 },

            /* rebound with individual tilt */
            { transform: `translateY(-20px) rotate(${tilt * 0.25}deg)`,      offset: .73 },

            /* settle */
            { transform: `translateY(0px)  rotate(${tilt * 0.25}deg)`,offset: .92 },
            { transform: `translateY(0px)  rotate(0deg)`,             offset: 1   }
          ],
          {
            duration: DROP_TIME,
            easing  : 'cubic-bezier(.22,1.05,.32,1)',
            delay
          }
        ).onfinish = () => {
          /* clear transform + pivot so next cascades start clean */
          el.style.transform = '';
          el.style.transformOrigin = '';
          if (--active === 0 && --reelsLeft === 0) done();
        };

        /* glow on first impact */
        el.animate(
          [
            { boxShadow:'0 0 0 0 rgba(255,215,0,0)',          offset:.1 },
            { boxShadow:'0 0 26px 9px rgba(101, 109, 102, 0.26)',    offset:.3 },
            { boxShadow:'0 0 0 0 rgba(255,215,0,0)',          offset:.4  }
          ],
          { duration: DROP_TIME, delay, easing:'linear' }
        );
      });

      

      /* progressive camera shake per column */
      if (window.PhaserEffects) {
        const strength = 0.03 - c * 0.004;
        PhaserEffects.shake(Math.max(strength, 0.009), 380);
      }

    }, OUT_FADE + colDelay);
  }
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

// Animation helpers (compatible with or without GSAP)
function wiggle(el, duration = 0.3, distance = 3){
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(el, {x:-distance}, {
      x: distance,
      duration: duration,
      ease: "sine.inOut",
      yoyo: true,
      repeat: 3
    });
  }
}

function slowDropScatter(tile){
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(tile, {y:"-140%", scale:0.8, opacity:0}, {
      y:0, scale:1,
      duration:0.9,
      ease:"power2.out",
      opacity:1,
      onStart: ()=> tile.style.filter = "drop-shadow(0 0 8px #c74fff)",
      onComplete: ()=> tile.style.filter = ""
    });
  }
}

