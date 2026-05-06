/* ═══════════════════════════════════════
   kim.dev — Main Script
═══════════════════════════════════════ */

var TRACKS = [
  { name: "Starfall", artist: "Intentions", file: "music/starfall - intentions (Clean - Lyrics).mp3" },
  { name: "Bleed",    artist: "fuckfenix",  file: "music/bleed - fenix - SoundLoadMate.com.mp3" }
];
var BIRTHDAY = new Date(2006, 7, 14);
var audio = null, currentIdx = 0, isPlaying = false;
var shaderInstance = null;

/* ── Theme ── */
function isDarkMode() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function toggleTheme() {
  var html = document.documentElement;
  var next = isDarkMode() ? "light" : "dark";
  html.setAttribute("data-theme", next);
  try { localStorage.setItem("kim-theme", next); } catch(e) {}
  // Sync shader colors
  if (shaderInstance && shaderInstance.setDark) {
    shaderInstance.setDark(next === "dark");
  }
}
(function() {
  try { if (localStorage.getItem("kim-theme") === "dark") document.documentElement.setAttribute("data-theme", "dark"); } catch(e) {}
})();

/* ── Age ── */
function getAge() {
  var t = new Date(), a = t.getFullYear() - BIRTHDAY.getFullYear();
  var m = t.getMonth() - BIRTHDAY.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < BIRTHDAY.getDate())) a--;
  return a;
}

/* ── Welcome ── */
function enterSite() {
  var w = document.getElementById("welcome");
  var s = document.getElementById("site");
  w.classList.add("leaving");
  setTimeout(function() {
    w.style.display = "none";
    if (shaderInstance) { shaderInstance.destroy(); shaderInstance = null; }
    s.classList.add("active");
    initReveal();
    loadTracks();
    selectTrack(0);
    var el = document.getElementById("ageValue");
    if (el) el.textContent = getAge() + " years";
  }, 700);
}

/* ── Init shader on load ── */
document.addEventListener("DOMContentLoaded", function() {
  var canvas = document.getElementById("shaderCanvas");
  if (canvas && window._initShader) {
    shaderInstance = window._initShader(canvas, isDarkMode());
  }
});

/* ── Tracks ── */
function loadTracks() {
  var list = document.getElementById("trackList");
  if (!list) return;
  TRACKS.forEach(function(t, i) {
    var el = document.createElement("div");
    el.className = "track-item"; el.setAttribute("role","button"); el.setAttribute("tabindex","0");
    el.innerHTML =
      '<div class="track-num"><span class="track-num-text">'+String(i+1).padStart(2,"0")+'</span>'+
      '<div class="track-eq"><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span></div></div>'+
      '<div class="track-info"><div class="track-name">'+t.name+'</div><div class="track-artist">'+t.artist+'</div></div>';
    el.onclick = function(){ selectTrack(i); };
    el.onkeydown = function(e){ if(e.key==="Enter") selectTrack(i); };
    list.appendChild(el);
  });
}

function selectTrack(idx) {
  currentIdx = idx;
  var wasPlaying = isPlaying;
  if (audio) { audio.pause(); audio.removeEventListener("timeupdate", updateProgress); }
  audio = new Audio(TRACKS[idx].file);
  audio.volume = document.getElementById("volSlider").value / 100;
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("loadedmetadata", function() { document.getElementById("durTime").textContent = fmt(audio.duration); });
  audio.addEventListener("ended", nextTrack);
  document.getElementById("npTrack").textContent = TRACKS[idx].name + " \u2014 " + TRACKS[idx].artist;
  document.querySelectorAll(".track-item").forEach(function(el,i){ el.classList.toggle("active",i===idx); el.classList.remove("playing"); });
  document.getElementById("progressFill").style.width = "0%";
  document.getElementById("curTime").textContent = "0:00";
  if (wasPlaying) playAudio();
}

function togglePlay(){if(!audio)return;isPlaying?pauseAudio():playAudio()}
function playAudio(){
  if(!audio)return;audio.play();isPlaying=true;
  document.getElementById("playIcon").style.display="none";
  document.getElementById("pauseIcon").style.display="block";
  var items=document.querySelectorAll(".track-item");if(items[currentIdx])items[currentIdx].classList.add("playing");
}
function pauseAudio(){
  if(!audio)return;audio.pause();isPlaying=false;
  document.getElementById("playIcon").style.display="block";
  document.getElementById("pauseIcon").style.display="none";
  var items=document.querySelectorAll(".track-item");if(items[currentIdx])items[currentIdx].classList.remove("playing");
}
function nextTrack(){selectTrack((currentIdx+1)%TRACKS.length)}
function prevTrack(){selectTrack((currentIdx-1+TRACKS.length)%TRACKS.length)}
function updateProgress(){
  if(!audio||!audio.duration)return;
  document.getElementById("progressFill").style.width=(audio.currentTime/audio.duration)*100+"%";
  document.getElementById("curTime").textContent=fmt(audio.currentTime);
}
function seekMusic(e){
  if(!audio)return;var bar=document.getElementById("progressBar"),rect=bar.getBoundingClientRect();
  audio.currentTime=((e.clientX-rect.left)/rect.width)*audio.duration;
}
function setVolume(v){if(audio)audio.volume=v/100;document.getElementById("volVal").textContent=v}
function fmt(s){if(isNaN(s))return"0:00";return Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0")}

/* ── Tilt Card ── */
(function(){
  document.addEventListener("DOMContentLoaded",function(){
    var card=document.getElementById("tiltCard"),shine=document.getElementById("tiltShine");
    if(!card||!shine)return;
    card.addEventListener("mousemove",function(e){
      var r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      card.style.transform="rotateY("+(x*18)+"deg) rotateX("+(-y*18)+"deg)";
      shine.style.background="radial-gradient(circle at "+((x+.5)*100)+"% "+((y+.5)*100)+"%, rgba(255,255,255,0.3), transparent 60%)";
    });
    card.addEventListener("mouseleave",function(){card.style.transform="rotateY(0) rotateX(0)";shine.style.opacity="0"});
    card.addEventListener("mouseenter",function(){shine.style.opacity="1"});
  });
})();

/* ── Scroll Reveal ── */
function initReveal(){
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add("visible");obs.unobserve(entry.target)}});
  },{threshold:.15,rootMargin:"0px 0px -40px 0px"});
  document.querySelectorAll(".reveal").forEach(function(el){obs.observe(el)});
}
