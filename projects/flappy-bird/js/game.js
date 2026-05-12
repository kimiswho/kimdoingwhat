'use strict';

/* ════════════════════════════════════════════════════════════════════════════
   CONFIG
════════════════════════════════════════════════════════════════════════════ */
const CFG = {
  gravity:        0.40,
  flapForce:     -9.2,
  pipeSpeed:      2.6,
  pipeGap:        210,
  pipeWidth:      72,
  spawnEvery:     90,   // recalculated dynamically on resize/start
  groundH:        82,
  birdX:          110,
  birdR:          22,
  maxFallSpeed:   11,
};

/* ════════════════════════════════════════════════════════════════════════════
   THEME COLORS
════════════════════════════════════════════════════════════════════════════ */
function isDark() {
  return document.documentElement.getAttribute('data-theme') !== 'light';
}

const COLORS = {
  dark: {
    skyTop:      '#0d0b1e',
    skyMid:      '#1a1040',
    skyBot:      '#2d1055',
    groundTop:   '#2d1b69',
    groundBot:   '#1a0f3a',
    groundLine:  'rgba(167,139,250,0.35)',
    pipeGrad:    ['#3b0764', '#7c3aed'],
    pipeCap:     '#5b21b6',
    pipeShine:   'rgba(167,139,250,0.18)',
    pipeShadow:  'rgba(124,58,237,0.5)',
    birdBody:    '#60a5fa',
    birdWing:    '#2563eb',
    birdBelly:   'rgba(255,255,255,0.18)',
    birdGlow:    '#93c5fd',
    birdEye:     '#ffffff',
    birdBeak:    '#fbbf24',
    cloud:       'rgba(255,255,255,0.055)',
    scoreText:   '#e2e8f0',
    scoreBg:     'rgba(10,8,18,0.45)',
    starBase:    0.75,
  },
  light: {
    skyTop:      '#bfdbfe',
    skyMid:      '#7dd3fc',
    skyBot:      '#38bdf8',
    groundTop:   '#4ade80',
    groundBot:   '#15803d',
    groundLine:  'rgba(0,0,0,0.10)',
    pipeGrad:    ['#15803d', '#22c55e'],
    pipeCap:     '#16a34a',
    pipeShine:   'rgba(255,255,255,0.22)',
    pipeShadow:  'rgba(22,163,74,0.4)',
    birdBody:    '#fbbf24',
    birdWing:    '#d97706',
    birdBelly:   'rgba(255,255,255,0.45)',
    birdGlow:    null,
    birdEye:     '#ffffff',
    birdBeak:    '#ef4444',
    cloud:       'rgba(255,255,255,0.82)',
    scoreText:   '#1e1b4b',
    scoreBg:     'rgba(255,255,255,0.55)',
    starBase:    0,
  },
};
function C() { return isDark() ? COLORS.dark : COLORS.light; }

/* ════════════════════════════════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════════════════════════════════ */
let canvas, ctx, W, H;
let state   = 'start';  // start | playing | paused | dead
let score   = 0;
let hiScore = 0;
let frame   = 0;
let lastTS  = 0;
let animId  = null;
let username = 'Guest';

let pipes         = [];
let particles     = [];
let clouds        = [];
let groundOff     = 0;
let lastGapCenter = null;   // used to clamp consecutive pipe positions
let spawnInterval = 90;     // recalculated based on screen width
let shakeX     = 0, shakeY = 0;
let shakeTTL   = 0;

const bird = {
  x: CFG.birdX, y: 300,
  vy: 0, rot: 0,
  wingPhase: 0,
  alive: true,
  deathRot: 0,
  deathAlpha: 1.0,
};

/* ════════════════════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════════════════════ */
function init() {
  canvas = document.getElementById('gameCanvas');
  ctx    = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);

  /* Input */
  window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); handleInput(); });

  /* Buttons */
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('restartBtn').addEventListener('click', startGame);
  document.getElementById('resumeBtn').addEventListener('click', resume);
  document.getElementById('pauseBtn').addEventListener('click', togglePause);
  document.getElementById('homeBtn').addEventListener('click', goHome);
  document.getElementById('goHomeBtn').addEventListener('click', goHome);
  document.getElementById('pauseHomeBtn').addEventListener('click', goHome);

  /* Load user */
  const session = JSON.parse(localStorage.getItem('flappy-session') || 'null');
  if (!session) { window.location.href = 'index.html'; return; }
  username = session.username;
  document.getElementById('hudUsername').textContent = username;
  hiScore = parseInt(localStorage.getItem('flappy-hs-' + username) || '0');
  syncHUD();

  /* Clouds */
  for (let i = 0; i < 9; i++) clouds.push(mkCloud(Math.random() * W));

  animId = requestAnimationFrame(loop);
}

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  bird.y = Math.min(bird.y, H * 0.65);
  // Keep ~320px between pipe left edges regardless of screen width
  spawnInterval = Math.max(80, Math.round(Math.min(W * 0.28, 380) / CFG.pipeSpeed));
}

/* ════════════════════════════════════════════════════════════════════════════
   GAME CONTROL
════════════════════════════════════════════════════════════════════════════ */
function startGame() {
  state  = 'playing';
  score  = 0;
  frame  = 0;
  pipes  = [];
  particles = [];
  bird.x = CFG.birdX;
  bird.y = H * 0.44;
  bird.vy = 0;
  bird.rot = 0;
  bird.alive = true;
  bird.deathAlpha = 1.0;
  bird.deathRot   = 0;
  groundOff     = 0;
  lastGapCenter = null;
  hide('startScreen');
  hide('gameOverScreen');
  hide('pauseScreen');
  syncHUD();
  flap();
}

function togglePause() {
  if (state === 'playing') {
    state = 'paused';
    show('pauseScreen');
    document.getElementById('pauseBtn').textContent = '▶';
  } else if (state === 'paused') {
    resume();
  }
}

function resume() {
  state = 'playing';
  hide('pauseScreen');
  document.getElementById('pauseBtn').textContent = '⏸';
  lastTS = performance.now();
}

function goHome() {
  window.location.href = 'index.html';
}

/* ════════════════════════════════════════════════════════════════════════════
   INPUT
════════════════════════════════════════════════════════════════════════════ */
function onKey(e) {
  const keys = ['Space', 'ArrowUp', 'KeyW'];
  if (keys.includes(e.code)) { e.preventDefault(); handleInput(); }
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
}

function handleInput() {
  if (state === 'start')   startGame();
  else if (state === 'playing') flap();
  else if (state === 'paused')  resume();
}

function flap() {
  bird.vy = CFG.flapForce;
  bird.wingPhase = 0;
  spawnFlapDust();
}

/* ════════════════════════════════════════════════════════════════════════════
   UPDATE
════════════════════════════════════════════════════════════════════════════ */
function update(dt) {
  frame++;

  /* Scroll ground */
  if (state === 'playing' || state === 'start') {
    const spd = state === 'playing' ? CFG.pipeSpeed : 1.5;
    groundOff = (groundOff + spd * dt) % 40;
  }

  /* Clouds always drift */
  clouds.forEach(c => {
    c.x -= c.spd * dt;
    if (c.x + c.w < 0) Object.assign(c, mkCloud(W + 20));
  });

  /* Screen shake decay */
  if (shakeTTL > 0) {
    shakeTTL -= dt;
    const mag = shakeTTL * 2.5;
    shakeX = (Math.random() - 0.5) * mag;
    shakeY = (Math.random() - 0.5) * mag;
  } else {
    shakeX = shakeY = 0;
  }

  /* Particle update always */
  updateParticles(dt);

  if (state === 'dead') {
    /* Continue bird fall after death */
    bird.vy = Math.min(bird.vy + CFG.gravity * dt, CFG.maxFallSpeed);
    bird.y += bird.vy * dt;
    bird.deathRot += 0.12 * dt;
    if (bird.y > H + 60) bird.deathAlpha = Math.max(0, bird.deathAlpha - 0.04 * dt);
    return;
  }

  if (state !== 'playing') {
    /* Idle float on start screen */
    if (state === 'start') {
      bird.y = H * 0.44 + Math.sin(frame * 0.04) * 12;
      bird.wingPhase += 0.16 * dt;
      bird.rot = Math.sin(frame * 0.04) * 0.12;
    }
    return;
  }

  /* ── Bird physics ── */
  bird.vy = Math.min(bird.vy + CFG.gravity * dt, CFG.maxFallSpeed);
  bird.y += bird.vy * dt;
  bird.wingPhase += 0.18 * dt;

  const targetRot = bird.vy > 0
    ? Math.min(bird.vy * 4.5, 85) * (Math.PI / 180)
    : Math.max(bird.vy * 3,  -25) * (Math.PI / 180);
  bird.rot += (targetRot - bird.rot) * 0.16;

  /* ── Pipes ── */
  if (frame % spawnInterval === 0) spawnPipe();
  pipes.forEach(p => { p.x -= CFG.pipeSpeed * dt; });
  pipes = pipes.filter(p => p.x + CFG.pipeWidth > -30);

  /* ── Score ── */
  pipes.forEach(p => {
    if (!p.scored && p.x + CFG.pipeWidth < bird.x) {
      p.scored = true;
      score++;
      syncHUD();
      spawnScoreBurst();
      popScore();
    }
  });

  /* ── Collision ── */
  if (hitTest()) killBird();
}

function hitTest() {
  if (bird.y - CFG.birdR < 0)                       return true;
  if (bird.y + CFG.birdR > H - CFG.groundH)         return true;
  for (const p of pipes) {
    const hr = CFG.birdR * 0.78;
    if (bird.x + hr > p.x + 5 && bird.x - hr < p.x + CFG.pipeWidth - 5) {
      if (bird.y - hr < p.topH || bird.y + hr > p.topH + CFG.pipeGap) return true;
    }
  }
  return false;
}

function killBird() {
  state = 'dead';
  bird.alive = false;
  shakeTTL = 8;
  spawnDeathBurst();

  /* Save high score */
  const users = JSON.parse(localStorage.getItem('flappy-users') || '{}');
  if (score > hiScore) {
    hiScore = score;
    localStorage.setItem('flappy-hs-' + username, hiScore);
    if (users[username]) {
      users[username].highScore = hiScore;
    }
    document.getElementById('newBest').classList.remove('hidden');
  } else {
    document.getElementById('newBest').classList.add('hidden');
  }
  if (users[username]) {
    users[username].gamesPlayed = (users[username].gamesPlayed || 0) + 1;
    localStorage.setItem('flappy-users', JSON.stringify(users));
  }

  document.getElementById('finalScore').textContent = score;
  document.getElementById('finalBest').textContent  = hiScore;
  setMedal(score);
  setTimeout(() => show('gameOverScreen'), 1100);
}

/* ════════════════════════════════════════════════════════════════════════════
   PIPES
════════════════════════════════════════════════════════════════════════════ */
function spawnPipe() {
  const playH    = H - CFG.groundH;
  const gapHalf  = CFG.pipeGap / 2;
  const margin   = 90;                        // min space above/below gap
  const cMin     = margin + gapHalf;          // minimum gap center y
  const cMax     = playH - margin - gapHalf;  // maximum gap center y

  let center;
  if (lastGapCenter === null) {
    // First pipe: land safely in the middle 40% of the screen
    const safeMin = playH * 0.30;
    const safeMax = playH * 0.68;
    center = safeMin + Math.random() * (safeMax - safeMin);
  } else {
    // Clamp movement so the gap never jumps more than 140px from the last one
    const maxDelta = 140;
    const lo = Math.max(cMin, lastGapCenter - maxDelta);
    const hi = Math.min(cMax, lastGapCenter + maxDelta);
    center = lo + Math.random() * Math.max(0, hi - lo);
  }

  lastGapCenter = center;
  pipes.push({ x: W + 20, topH: center - gapHalf, scored: false });
}

/* ════════════════════════════════════════════════════════════════════════════
   PARTICLES
════════════════════════════════════════════════════════════════════════════ */
function mkP(x, y, vx, vy, color, r, life) {
  return { x, y, vx, vy, color, r, life, maxLife: life };
}

function spawnFlapDust() {
  const cols = isDark()
    ? ['#818cf8','#a78bfa','#60a5fa','rgba(255,255,255,0.7)']
    : ['#fde68a','#fbbf24','#ffffff','#86efac'];
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * 0.5 + (Math.random() - 0.5) * 1.8;
    const s = 1.5 + Math.random() * 2.5;
    particles.push(mkP(
      bird.x - CFG.birdR * 0.6, bird.y + CFG.birdR * 0.4,
      Math.cos(a) * s, Math.sin(a) * s,
      cols[Math.floor(Math.random() * cols.length)],
      1.5 + Math.random() * 2.5, 18 + Math.random() * 14,
    ));
  }
}

function spawnScoreBurst() {
  const cols = isDark()
    ? ['#a78bfa','#60a5fa','#f472b6','#34d399','#fbbf24','#ffffff']
    : ['#fbbf24','#4ade80','#60a5fa','#f472b6','#f87171','#ffffff'];
  for (let i = 0; i < 22; i++) {
    const a = (Math.PI * 2 * i) / 22 + (Math.random() - 0.5) * 0.5;
    const s = 3 + Math.random() * 5;
    particles.push(mkP(
      bird.x, bird.y,
      Math.cos(a) * s, Math.sin(a) * s,
      cols[i % cols.length],
      2.5 + Math.random() * 3.5, 45 + Math.random() * 25,
    ));
  }
}

function spawnDeathBurst() {
  const cols = ['#ef4444','#f97316','#fbbf24','#ffffff','#dc2626','#fb923c'];
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 2.5 + Math.random() * 9;
    particles.push(mkP(
      bird.x, bird.y,
      Math.cos(a) * s, Math.sin(a) * s - 2,
      cols[Math.floor(Math.random() * cols.length)],
      3 + Math.random() * 5, 55 + Math.random() * 40,
    ));
  }
}

function updateParticles(dt) {
  particles.forEach(p => {
    p.x  += p.vx * dt;
    p.y  += p.vy * dt;
    p.vy += 0.18 * dt;
    p.vx *= 0.975;
    p.life -= dt;
  });
  particles = particles.filter(p => p.life > 0);
}

/* ════════════════════════════════════════════════════════════════════════════
   RENDER
════════════════════════════════════════════════════════════════════════════ */
function render() {
  ctx.save();
  if (shakeTTL > 0) ctx.translate(shakeX, shakeY);

  ctx.clearRect(-10, -10, W + 20, H + 20);
  drawSky();
  drawClouds();
  drawPipes();
  drawParticles();
  drawBird();
  drawGround();
  drawInGameScore();

  ctx.restore();
}

/* ── Sky ─────────────────────────────────────────────────────────────────── */
function drawSky() {
  const c = C();
  const g = ctx.createLinearGradient(0, 0, 0, H - CFG.groundH);
  g.addColorStop(0,    c.skyTop);
  g.addColorStop(0.55, c.skyMid);
  g.addColorStop(1,    c.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H - CFG.groundH);

  if (isDark()) drawStars();
}

function drawStars() {
  const positions = [
    [0.08,0.05],[0.22,0.11],[0.38,0.07],[0.55,0.14],[0.71,0.04],
    [0.88,0.09],[0.14,0.20],[0.46,0.28],[0.79,0.17],[0.33,0.33],
    [0.62,0.24],[0.04,0.38],[0.92,0.33],[0.18,0.43],[0.68,0.40],
    [0.43,0.48],[0.86,0.47],[0.10,0.52],[0.53,0.57],[0.29,0.62],
    [0.75,0.55],[0.01,0.68],[0.97,0.60],[0.48,0.68],[0.64,0.72],
  ];
  positions.forEach(([fx, fy], i) => {
    const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame * 0.025 + i * 1.3));
    ctx.globalAlpha = C().starBase * twinkle;
    const sz = 0.6 + (i % 3) * 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(fx * W, fy * (H - CFG.groundH), sz, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/* ── Clouds ──────────────────────────────────────────────────────────────── */
function mkCloud(startX) {
  return {
    x:   startX,
    y:   15 + Math.random() * (H * 0.42),
    w:   90 + Math.random() * 160,
    h:   32 + Math.random() * 48,
    spd: 0.25 + Math.random() * 0.65,
    al:  0.5 + Math.random() * 0.5,
    far: Math.random() < 0.45,
  };
}

function drawClouds() {
  const sorted = [...clouds].sort((a, b) => a.far - b.far);
  sorted.forEach(c => {
    ctx.globalAlpha = c.far ? c.al * 0.45 : c.al;
    ctx.fillStyle   = C().cloud;
    puffCloud(c.x, c.y, c.w, c.h);
  });
  ctx.globalAlpha = 1;
}

function puffCloud(x, y, w, h) {
  const r = h / 2;
  ctx.beginPath();
  ctx.arc(x + w * 0.22, y + r * 0.9, r * 0.75, Math.PI, 0);
  ctx.arc(x + w * 0.48, y + r * 0.45, r,        Math.PI, 0);
  ctx.arc(x + w * 0.72, y + r * 0.85, r * 0.72, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
}

/* ── Pipes ───────────────────────────────────────────────────────────────── */
function drawPipes() {
  const c = C();
  ctx.shadowColor = c.pipeShadow;
  ctx.shadowBlur  = 14;
  pipes.forEach(p => {
    drawPipeSeg(p.x, 0,           CFG.pipeWidth, p.topH,                       true);
    drawPipeSeg(p.x, p.topH + CFG.pipeGap, CFG.pipeWidth, H - CFG.groundH - p.topH - CFG.pipeGap, false);
  });
  ctx.shadowBlur = 0;
}

function drawPipeSeg(x, y, w, h, isTop) {
  const c  = C();
  const gx = ctx.createLinearGradient(x, 0, x + w, 0);
  gx.addColorStop(0,    c.pipeGrad[0]);
  gx.addColorStop(0.35, c.pipeGrad[1]);
  gx.addColorStop(0.65, c.pipeGrad[1]);
  gx.addColorStop(1,    c.pipeGrad[0]);

  /* Body */
  ctx.fillStyle = gx;
  rrect(x, y, w, h, isTop ? [0,0,5,5] : [5,5,0,0]);
  ctx.fill();

  /* Cap */
  const cW = w + 16, cX = x - 8, cH = 24;
  ctx.fillStyle = c.pipeCap;
  rrect(cX, isTop ? h - cH : y, cW, cH, isTop ? [0,0,6,6] : [6,6,0,0]);
  ctx.fill();

  /* Shine streak */
  ctx.fillStyle = c.pipeShine;
  ctx.fillRect(x + 9, y, 9, h);
}

/* ── Particles ───────────────────────────────────────────────────────────── */
function drawParticles() {
  particles.forEach(p => {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = a;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * a + 0.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/* ── Bird ────────────────────────────────────────────────────────────────── */
function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);

  if (!bird.alive) {
    ctx.rotate(bird.deathRot);
    ctx.globalAlpha = bird.deathAlpha;
  } else {
    ctx.rotate(bird.rot);
  }

  birdShape();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function birdShape() {
  const c = C();
  const r = CFG.birdR;

  /* Wing (behind body) */
  ctx.save();
  const wAngle = Math.sin(bird.wingPhase) * 0.55;
  ctx.rotate(wAngle - 0.25);
  ctx.fillStyle = c.birdWing;
  ctx.beginPath();
  ctx.ellipse(-r * 0.25, r * 0.12, r * 0.72, r * 0.38, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* Body glow (dark mode) */
  if (c.birdGlow) {
    ctx.shadowColor = c.birdGlow;
    ctx.shadowBlur  = 20;
  }

  /* Body */
  ctx.fillStyle = c.birdBody;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  /* Belly */
  ctx.fillStyle = c.birdBelly;
  ctx.beginPath();
  ctx.ellipse(r * 0.08, r * 0.22, r * 0.52, r * 0.46, 0.3, 0, Math.PI * 2);
  ctx.fill();

  /* Eye white */
  ctx.fillStyle = c.birdEye;
  ctx.beginPath();
  ctx.arc(r * 0.36, -r * 0.18, r * 0.37, 0, Math.PI * 2);
  ctx.fill();

  /* Pupil */
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(r * 0.46, -r * 0.18, r * 0.19, 0, Math.PI * 2);
  ctx.fill();

  /* Shine */
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(r * 0.52, -r * 0.26, r * 0.08, 0, Math.PI * 2);
  ctx.fill();

  /* Beak */
  ctx.fillStyle = c.birdBeak;
  ctx.beginPath();
  ctx.moveTo(r * 0.68, -r * 0.10);
  ctx.lineTo(r * 1.30, -r * 0.04);
  ctx.lineTo(r * 0.72,  r * 0.24);
  ctx.closePath();
  ctx.fill();

  /* Beak line */
  ctx.strokeStyle = isDark() ? '#92400e' : '#b45309';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(r * 0.68, r * 0.05);
  ctx.lineTo(r * 1.26, r * 0.05);
  ctx.stroke();
}

/* ── Ground ──────────────────────────────────────────────────────────────── */
function drawGround() {
  const c = C(), y = H - CFG.groundH;
  const g = ctx.createLinearGradient(0, y, 0, H);
  g.addColorStop(0, c.groundTop);
  g.addColorStop(1, c.groundBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, y, W, CFG.groundH);

  /* Stripes */
  ctx.strokeStyle = c.groundLine;
  ctx.lineWidth   = 1;
  const sw = 40;
  for (let i = 0; i < W + sw; i += sw) {
    const ox = ((i - groundOff % sw) + sw) % (W + sw) - sw;
    ctx.beginPath();
    ctx.moveTo(ox, y);
    ctx.lineTo(ox - 18, H);
    ctx.stroke();
  }

  /* Top highlight */
  ctx.fillStyle = isDark()
    ? 'rgba(139,92,246,0.45)'
    : 'rgba(255,255,255,0.45)';
  ctx.fillRect(0, y, W, 4);
}

/* ── In-game score (canvas) ─────────────────────────────────────────────── */
function drawInGameScore() {
  if (state !== 'playing' && state !== 'dead') return;
  const c  = C();
  const cx = W / 2;
  const pill = { x: cx - 55, y: 18, w: 110, h: 52 };

  ctx.fillStyle = c.scoreBg;
  rrect(pill.x, pill.y, pill.w, pill.h, 26);
  ctx.fill();

  ctx.font          = 'bold 34px Inter, sans-serif';
  ctx.textAlign     = 'center';
  ctx.textBaseline  = 'middle';
  ctx.fillStyle     = c.scoreText;
  if (isDark()) {
    ctx.shadowColor = '#a78bfa';
    ctx.shadowBlur  = 14;
  }
  ctx.fillText(score, cx, pill.y + pill.h / 2 + 1);
  ctx.shadowBlur = 0;
}

/* ════════════════════════════════════════════════════════════════════════════
   SCORE POPUP
════════════════════════════════════════════════════════════════════════════ */
function popScore() {
  const el = document.getElementById('scorePopup');
  el.style.left = (bird.x + 32) + 'px';
  el.style.top  = (bird.y - 30) + 'px';
  el.classList.remove('hidden');
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = 'scoreFloat 0.65s ease forwards';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 700);
}

/* ════════════════════════════════════════════════════════════════════════════
   MEDAL
════════════════════════════════════════════════════════════════════════════ */
function setMedal(s) {
  const el = document.getElementById('medalDisplay');
  if      (s >= 40) el.innerHTML = '<span class="medal gold">🥇 Legend</span>';
  else if (s >= 20) el.innerHTML = '<span class="medal silver">🥈 Expert</span>';
  else if (s >= 10) el.innerHTML = '<span class="medal bronze">🥉 Pro</span>';
  else if (s >=  5) el.innerHTML = '<span class="medal">🏅 Amateur</span>';
  else              el.innerHTML = '<span class="medal">🐣 Fledgling</span>';
}

/* ════════════════════════════════════════════════════════════════════════════
   HUD
════════════════════════════════════════════════════════════════════════════ */
function syncHUD() {
  document.getElementById('hudScore').textContent     = score;
  document.getElementById('hudHighScore').textContent = hiScore;
}

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════════════════════ */
function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

function rrect(x, y, w, h, radii) {
  const [tl, tr, br, bl] = Array.isArray(radii) ? radii : [radii,radii,radii,radii];
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

/* ════════════════════════════════════════════════════════════════════════════
   LOOP
════════════════════════════════════════════════════════════════════════════ */
function loop(ts) {
  const dt = lastTS ? Math.min((ts - lastTS) / 16.667, 3.5) : 1;
  lastTS = ts;
  update(dt);
  render();
  animId = requestAnimationFrame(loop);
}

/* ════════════════════════════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', init);
