/* ------------------------------------------------------------------
   fx.js  -  shared by every page (index.html, password.html, main.html)
   • cinematic fade between pages
   • ambient "night" music + sound effects (generated live, no audio files)
   • one mute button, remembered between pages
   You normally never need to edit this file.
   To use your OWN ambient track instead, set ambientMusic in config.js.
   ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.FX) return;

  var doc = document, root = doc.documentElement;
  var KEY = 'moonSoundMuted';
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function load() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } }

  var muted = load() === '1';
  var ambientAllowed = root.getAttribute('data-fx-ambient') !== 'off';
  var leaving = false;
  var silent = root.hasAttribute('data-fx-silent');   // page set to silent: no sound, no sound button

  /* ---------- page transition curtain (pure CSS on <html>) ---------- */
  var style = doc.createElement('style');
  style.textContent =
    'html::before{content:"";position:fixed;inset:0;z-index:2147483000;pointer-events:none;background:#050816;' +
    'opacity:1;transition:opacity 1.1s cubic-bezier(.4,0,.2,1)}' +
    'html.fx-ready::before{opacity:0}' +
    'html.fx-leave::before{opacity:1;transition-duration:.6s}' +
    '@media (prefers-reduced-motion:reduce){html::before{transition-duration:.01s!important}}' +
    '#fx-sound{position:fixed;top:max(14px,env(safe-area-inset-top));right:max(14px,env(safe-area-inset-right));' +
    'z-index:60;width:44px;height:44px;display:grid;place-items:center;padding:0;border-radius:50%;' +
    'border:1px solid rgba(223,230,245,.38);background:rgba(8,14,34,.55);color:#fff;cursor:pointer;' +
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);' +
    'transition:background .2s,border-color .2s,transform .2s}' +
    '#fx-sound:hover{background:rgba(40,60,120,.55);border-color:rgba(223,230,245,.7)}' +
    '#fx-sound:active{transform:scale(.94)}' +
    '#fx-sound:focus-visible{outline:3px solid #ffe29a;outline-offset:3px}' +
    '#fx-sound svg{width:22px;height:22px;display:block}';
  (doc.head || root).appendChild(style);

  function ready() { requestAnimationFrame(function () { root.classList.add('fx-ready'); }); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', ready); else ready();
  setTimeout(function () { root.classList.add('fx-ready'); }, 2500);          // failsafe: never stay black

  window.addEventListener('pageshow', function (e) {                           // back button / bfcache
    if (e.persisted) { leaving = false; root.classList.remove('fx-leave'); root.classList.add('fx-ready'); }
  });

  /* ---------- audio engine ---------- */
  var ctx = null, master = null, wet = null;
  var ambientOn = false, musicEl = null, twinkleT = 0;
  var SCALE = [880, 987.77, 1174.66, 1318.51, 1567.98, 1760];                  // airy A-minor pentatonic-ish

  function ensure() {
    if (silent) return null;
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.9;
      var comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }
  function resume() {
    var c = ensure();
    if (c && c.state === 'suspended') { try { c.resume(); } catch (e) { /* ignore */ } }
    return c;
  }
  function applyMute() {
    if (ctx && master) {
      var t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(muted ? 0 : 0.9, t, 0.15);
    }
    if (musicEl) musicEl.muted = muted;
  }

  function tone(freq, type, dur, vol, delay, slideTo, toWet) {
    var c = ctx; if (!c || muted) return;
    var t0 = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    if (toWet && wet) g.connect(wet);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function whoosh(dur, f0, f1, vol) {
    var c = ctx; if (!c || muted) return;
    var len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var s = c.createBufferSource(); s.buffer = buf;
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.1;
    var t0 = c.currentTime;
    f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t0);
  }

  var SFX = {
    tap:    function () { tone(520, 'sine', 0.5, 0.12); tone(780, 'sine', 0.7, 0.06, 0.04); },
    ui:     function () { tone(640, 'sine', 0.14, 0.05); },
    key:    function () { tone(700 + Math.random() * 120, 'sine', 0.09, 0.05); },
    whoosh: function () { whoosh(1.2, 180, 2200, 0.09); },
    copy:   function () { tone(880, 'triangle', 0.18, 0.08); tone(1320, 'triangle', 0.26, 0.07, 0.09); },
    wrong:  function () { tone(190, 'sawtooth', 0.38, 0.05, 0, 95); },
    found:  function () { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) { tone(f, 'sine', 2.0, 0.08, i * 0.12, null, true); }); },
    unlock: function () { [392, 523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, 'triangle', 1.2, 0.07, i * 0.09, null, true); }); whoosh(1.0, 300, 3000, 0.05); }
  };
  function sfx(name) {
    if (muted) return;
    var c = resume(); if (!c) return;
    if (SFX[name]) { try { SFX[name](); } catch (e) { /* never break the page for a sound */ } }
  }

  function synthPad(c) {
    // a slow, dark-blue chord that breathes
    var out = c.createGain(); out.gain.value = 0.0001; out.connect(master);
    out.gain.linearRampToValueAtTime(0.17, c.currentTime + 7);
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.7; lp.connect(out);
    var lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 0.07; lg.gain.value = 220; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    [[110, -6], [164.81, 4], [220, -3], [261.63, 6], [329.63, -5]].forEach(function (n) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = n[0] < 200 ? 'sine' : 'triangle'; o.frequency.value = n[0]; o.detune.value = n[1];
      g.gain.value = n[0] < 200 ? 0.5 : 0.17;
      o.connect(g); g.connect(lp); o.start();
    });
    // faint "space air"
    var len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.5;
    var ng = c.createGain(); ng.gain.value = 0.012;
    src.connect(bp); bp.connect(ng); ng.connect(out); src.start();
    // echo bus for the twinkles
    wet = c.createGain(); wet.gain.value = 0.55;
    var dl = c.createDelay(1.5); dl.delayTime.value = 0.55;
    var fb = c.createGain(); fb.gain.value = 0.42;
    wet.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(master);
  }
  function scheduleTwinkle() {
    clearTimeout(twinkleT);
    twinkleT = setTimeout(function () {
      if (!muted && !doc.hidden && ctx) tone(SCALE[Math.floor(Math.random() * SCALE.length)], 'sine', 3.2, 0.04, 0, null, true);
      scheduleTwinkle();
    }, 2800 + Math.random() * 4200);
  }
  function startAmbient() {
    if (ambientOn || muted || !ambientAllowed) return;
    var c = resume(); if (!c) return;
    ambientOn = true;
    var file = window.CAPSULE && window.CAPSULE.ambientMusic;
    if (file) {
      try {
        musicEl = new Audio(file); musicEl.loop = true; musicEl.volume = 0.45; musicEl.muted = muted;
        musicEl.addEventListener('error', function () { musicEl = null; synthPad(c); scheduleTwinkle(); });
        var p = musicEl.play(); if (p && p.catch) p.catch(function () {});
        return;
      } catch (e) { musicEl = null; }
    }
    synthPad(c); scheduleTwinkle();
  }

  doc.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    try { if (doc.hidden) ctx.suspend(); else if (!muted) ctx.resume(); } catch (e) { /* ignore */ }
  });

  /* ---------- mute button ---------- */
  var btn = null;
  var ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.7 6a8.6 8.6 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  function paintButton() {
    if (!btn) return;
    btn.innerHTML = muted ? ICON_OFF : ICON_ON;
    btn.setAttribute('aria-pressed', muted ? 'false' : 'true');
    btn.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
    btn.title = muted ? 'Sound off' : 'Sound on';
  }
  function setMuted(v) {
    muted = !!v; save(muted ? '1' : '0');
    applyMute();
    if (!muted) { resume(); startAmbient(); sfx('ui'); }
    paintButton();
  }
  function makeButton() {
    if (silent || doc.getElementById('sound-toggle') || root.hasAttribute('data-fx-nobutton')) return;   // main.html has its own
    btn = doc.createElement('button');
    btn.type = 'button'; btn.id = 'fx-sound';
    btn.addEventListener('click', function () { setMuted(!muted); });
    doc.body.appendChild(btn);
    paintButton();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', makeButton); else makeButton();

  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'm' && e.key !== 'M') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target && e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA') return;
    if (btn) setMuted(!muted);
  });

  /* ---------- browsers only allow sound after a tap/click ---------- */
  var EVTS = ['pointerdown', 'keydown', 'touchend'];
  function onGesture(e) {
    if (e && e.target && e.target.closest && e.target.closest('#fx-sound')) return;     // the button handles itself
    EVTS.forEach(function (n) { window.removeEventListener(n, onGesture, true); });
    if (!muted) { resume(); startAmbient(); }
  }
  EVTS.forEach(function (n) { window.addEventListener(n, onGesture, true); });

  /* ---------- go to another page with a fade ---------- */
  function go(url) {
    if (leaving) return;
    leaving = true;
    if (ctx && master) { try { master.gain.setTargetAtTime(0, ctx.currentTime, 0.2); } catch (e) { /* ignore */ } }
    if (reduce) { location.href = url; return; }
    root.classList.add('fx-leave');
    setTimeout(function () { location.href = url; }, 650);
  }

  window.FX = {
    get muted() { return muted; },
    setMuted: setMuted,
    toggle: function () { setMuted(!muted); },
    sfx: sfx,
    start: function () { if (!muted) { resume(); startAmbient(); } },
    go: go
  };
})();
