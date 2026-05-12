/* ═══════════════════════════════════════
   kim.dev — Main Script
   Animated card-stack music player
═══════════════════════════════════════ */

var TRACKS = [
  { name: "Starfall", artist: "Intentions", file: "music/starfall - intentions (Clean - Lyrics).mp3" },
  { name: "Bleed",    artist: "fuckfenix",  file: "music/bleed - fenix - SoundLoadMate.com.mp3" }
];
var BIRTHDAY = new Date(2006, 7, 14);
var audio = null, currentIdx = 0, isPlaying = false;
var shaderInstance = null;

/* ── Theme ── */
function isDarkMode() { return document.documentElement.getAttribute("data-theme") === "dark"; }
function toggleTheme() {
  var next = isDarkMode() ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("kim-theme", next); } catch(e) {}
  if (shaderInstance && shaderInstance.setDark) shaderInstance.setDark(next === "dark");
}
(function(){ try { if (localStorage.getItem("kim-theme") === "dark") document.documentElement.setAttribute("data-theme", "dark"); } catch(e) {} })();

/* ── Age ── */
function getAge() {
  var t = new Date(), a = t.getFullYear() - BIRTHDAY.getFullYear(), m = t.getMonth() - BIRTHDAY.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < BIRTHDAY.getDate())) a--;
  return a;
}

/* ── Welcome ── */
function enterSite() {
  var w = document.getElementById("welcome"), s = document.getElementById("site");
  w.classList.add("leaving");
  setTimeout(function() {
    w.style.display = "none";
    if (shaderInstance) { shaderInstance.destroy(); shaderInstance = null; }
    s.classList.add("active");
    initReveal(); initCardStack();
    var el = document.getElementById("ageValue"); if (el) el.textContent = getAge() + " years";
  }, 700);
}

document.addEventListener("DOMContentLoaded", function() {
  var canvas = document.getElementById("shaderCanvas");
  if (canvas && window._initShader) shaderInstance = window._initShader(canvas, isDarkMode());
});

/* ═══════════════════════════════════════
   ANIMATED CARD STACK PLAYER
═══════════════════════════════════════ */
var stackOrder = [];
var cardEls = [];
var isAnimating = false;

function initCardStack() {
  var container = document.getElementById("cardStack");
  if (!container) return;
  container.innerHTML = "";
  stackOrder = [];
  cardEls = [];

  TRACKS.forEach(function(t, i) {
    var card = document.createElement("div");
    card.className = "stack-card";
    card.innerHTML =
      '<div class="stack-card-inner">' +
        '<div class="stack-card-vis">' +
          '<div class="stack-vis-bars">' +
            '<span class="stack-bar"></span><span class="stack-bar"></span><span class="stack-bar"></span>' +
            '<span class="stack-bar"></span><span class="stack-bar"></span><span class="stack-bar"></span>' +
            '<span class="stack-bar"></span><span class="stack-bar"></span><span class="stack-bar"></span>' +
          '</div>' +
        '</div>' +
        '<div class="stack-card-info">' +
          '<div class="stack-card-text">' +
            '<span class="stack-card-name">' + t.name + '</span>' +
            '<span class="stack-card-artist">' + t.artist + '</span>' +
          '</div>' +
          '<div class="stack-card-badge">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
          '</div>' +
        '</div>' +
      '</div>';
    container.appendChild(card);
    cardEls.push(card);
    stackOrder.push(i);
  });

  positionCards(false);
  selectTrackByStack(stackOrder[0]);
}

function positionCards(animate) {
  var positions = [
    { y: 0, scale: 1, opacity: 1 },
    { y: -28, scale: 0.94, opacity: 0.7 },
    { y: -52, scale: 0.88, opacity: 0.4 }
  ];

  stackOrder.forEach(function(trackIdx, stackPos) {
    var card = cardEls[trackIdx];
    var pos = positions[Math.min(stackPos, positions.length - 1)];
    var z = 10 - stackPos;
    var dur = animate ? '0.5s' : '0s';

    card.style.transition = animate ? 'transform ' + dur + ' cubic-bezier(0.34, 1.56, 0.64, 1), opacity ' + dur + ' ease' : 'none';
    card.style.transform = 'translateX(-50%) translateY(' + pos.y + 'px) scale(' + pos.scale + ')';
    card.style.opacity = pos.opacity;
    card.style.zIndex = z;

    // Show playing state on top card
    if (stackPos === 0) {
      card.classList.add('stack-card--top');
    } else {
      card.classList.remove('stack-card--top');
    }
  });
}

function nextCard() {
  if (isAnimating || stackOrder.length < 2) return;
  isAnimating = true;

  var topTrackIdx = stackOrder[0];
  var topCard = cardEls[topTrackIdx];

  // Animate top card flying down
  topCard.style.transition = 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s ease';
  topCard.style.transform = 'translateX(-50%) translateY(320px) scale(1)';
  topCard.style.opacity = '0';
  topCard.style.zIndex = '0';

  setTimeout(function() {
    // Move top to back
    stackOrder.push(stackOrder.shift());

    // Reset the card that flew out
    topCard.style.transition = 'none';
    topCard.style.transform = 'translateX(-50%) translateY(-60px) scale(0.85)';
    topCard.style.opacity = '0';

    // Force reflow
    void topCard.offsetHeight;

    // Animate all cards to new positions
    positionCards(true);
    selectTrackByStack(stackOrder[0]);

    setTimeout(function() { isAnimating = false; }, 500);
  }, 400);
}

function prevCard() {
  if (isAnimating || stackOrder.length < 2) return;
  isAnimating = true;

  var lastTrackIdx = stackOrder[stackOrder.length - 1];
  var lastCard = cardEls[lastTrackIdx];

  // Prep: put it above
  lastCard.style.transition = 'none';
  lastCard.style.transform = 'translateX(-50%) translateY(-80px) scale(0.85)';
  lastCard.style.opacity = '0';
  lastCard.style.zIndex = '15';
  void lastCard.offsetHeight;

  // Move last to front
  stackOrder.unshift(stackOrder.pop());

  positionCards(true);
  selectTrackByStack(stackOrder[0]);

  setTimeout(function() { isAnimating = false; }, 500);
}

function selectTrackByStack(idx) {
  currentIdx = idx;
  if (audio) { audio.pause(); audio.removeEventListener("timeupdate", updateProgress); }
  audio = new Audio(TRACKS[idx].file);
  audio.volume = document.getElementById("volSlider").value / 100;
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("loadedmetadata", function() { document.getElementById("durTime").textContent = fmt(audio.duration); });
  audio.addEventListener("ended", function() { nextCard(); setTimeout(function(){ playAudio(); }, 600); });
  document.getElementById("npTrack").textContent = TRACKS[idx].name + " \u2014 " + TRACKS[idx].artist;
  document.getElementById("progressFill").style.width = "0%";
  document.getElementById("curTime").textContent = "0:00";
  document.getElementById("durTime").textContent = "0:00";

  // Update playing state
  cardEls.forEach(function(c) { c.classList.remove('stack-card--playing'); });

  if (isPlaying) playAudio();
}

/* ── Playback ── */
function togglePlay() { if (!audio) return; isPlaying ? pauseAudio() : playAudio(); }
function playAudio() {
  if (!audio) return; audio.play(); isPlaying = true;
  document.getElementById("playIcon").style.display = "none";
  document.getElementById("pauseIcon").style.display = "block";
  cardEls[currentIdx].classList.add('stack-card--playing');
}
function pauseAudio() {
  if (!audio) return; audio.pause(); isPlaying = false;
  document.getElementById("playIcon").style.display = "block";
  document.getElementById("pauseIcon").style.display = "none";
  cardEls[currentIdx].classList.remove('stack-card--playing');
}
function updateProgress() {
  if (!audio || !audio.duration) return;
  document.getElementById("progressFill").style.width = (audio.currentTime / audio.duration) * 100 + "%";
  document.getElementById("curTime").textContent = fmt(audio.currentTime);
}
function seekMusic(e) {
  if (!audio) return; var bar = document.getElementById("progressBar"), rect = bar.getBoundingClientRect();
  audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
}
function setVolume(v) { if (audio) audio.volume = v / 100; document.getElementById("volVal").textContent = v; }
function fmt(s) { if (isNaN(s)) return "0:00"; return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0"); }

/* ── Tilt Card ── */
(function() {
  document.addEventListener("DOMContentLoaded", function() {
    var card = document.getElementById("tiltCard"), shine = document.getElementById("tiltShine");
    if (!card || !shine) return;
    card.addEventListener("mousemove", function(e) {
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = "rotateY(" + (x * 18) + "deg) rotateX(" + (-y * 18) + "deg)";
      shine.style.background = "radial-gradient(circle at " + ((x + .5) * 100) + "% " + ((y + .5) * 100) + "%, rgba(255,255,255,0.3), transparent 60%)";
    });
    card.addEventListener("mouseleave", function() { card.style.transform = "rotateY(0) rotateX(0)"; shine.style.opacity = "0"; });
    card.addEventListener("mouseenter", function() { shine.style.opacity = "1"; });
  });
})();

/* ── Scroll Reveal ── */
function initReveal() {
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) { if (entry.isIntersecting) { entry.target.classList.add("visible"); obs.unobserve(entry.target); } });
  }, { threshold: .15, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach(function(el) { obs.observe(el); });
}
