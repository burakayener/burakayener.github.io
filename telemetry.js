/* Lightweight field diagnostics (classic script, runs even if the app bundle fails).
   Sends a few small JSON events to /api/log: capabilities on load, JS errors, start click,
   and UI/tracker snapshots. Never sends camera images. Disable with ?nolog=1. */
(function () {
  try {
    if (/[?&]nolog=1/.test(location.search) || /localhost|127\.0\.0\.1/.test(location.hostname)) return;
    var EP = /workers\.dev$|pages\.dev$/.test(location.hostname) ? '/api/log' : 'https://saat-dene.bakinyener.workers.dev/api/log';
    var sid = Math.random().toString(36).slice(2, 10), sent = 0, t0 = Date.now();
    function send(ev, data) {
      if (sent++ > 25) return;
      var body = JSON.stringify({ sid: sid, ev: ev, ms: Date.now() - t0, data: data });
      try {
        if (navigator.sendBeacon && navigator.sendBeacon(EP, new Blob([body], { type: 'text/plain' }))) return;
      } catch (e) {}
      try { fetch(EP, { method: 'POST', body: body, keepalive: true }); } catch (e) {}
    }
    function txt() {
      try { return (document.body && document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 400); } catch (e) { return ''; }
    }
    function simd() {
      try { return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11])); } catch (e) { return false; }
    }
    function gl2() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } }
    function state() {
      try {
        var a = window.__tryon; if (!a) return null; var s = a.state || {};
        return { ready: a.ready, delegate: s.delegate, frames: s.frames, processed: s.processed, detections: s.detections,
                 found: s.found, tracking: s.tracking, watch: s.watch, file: s.modelFile, src: s.src, placeholder: s.placeholder };
      } catch (e) { return { err: String(e) }; }
    }
    window.addEventListener('error', function (e) {
      send('error', { msg: String(e.message || (e.target && (e.target.src || e.target.href)) || 'error'), src: e.filename, line: e.lineno });
    }, true);
    window.addEventListener('unhandledrejection', function (e) {
      var r = e.reason; send('rejection', { msg: String(r && (r.stack || r.message) || r).slice(0, 600) });
    });
    var ce = console.error;
    console.error = function () {
      try { var m0 = String(arguments[0]); if (!/^(INFO|W\d|I\d)/.test(m0)) send('console.error', { msg: Array.prototype.map.call(arguments, function (x) { return String(x && (x.stack || x.message) || x); }).join(' ').slice(0, 600) }); } catch (e) {}
      return ce.apply(console, arguments);
    };
    window.addEventListener('load', function () {
      var c = navigator.connection || {};
      send('load', {
        ua: navigator.userAgent, lang: navigator.language, ref: document.referrer.slice(0, 120),
        scr: [screen.width, screen.height, devicePixelRatio], gum: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        secure: window.isSecureContext, webgl2: gl2(), simd: simd(), net: c.effectiveType, saveData: c.saveData,
        standalone: navigator.standalone === true
      });
      setTimeout(function () { send('idle15', { text: txt(), state: state() }); }, 15000);
    });
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest && e.target.closest('#btn-start');
      if (!b) return;
      send('start', { text: txt() });
      [6000, 20000, 45000].forEach(function (d) { setTimeout(function () { send('snap' + d / 1000, { text: txt(), state: state() }); }, d); });
    }, true);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') send('hidden', { text: txt(), state: state() });
    });
  } catch (e) {}
})();
