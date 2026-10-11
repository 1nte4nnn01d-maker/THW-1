'use strict';
/* Sound: ambient loop + click/turn SFX. Uses files from assets/audio/ if present (ogg/mp3, open licences), else synthesises them. */
const Snd = (() => {
  let ctx, master, amb, bufs = {}, on = true, started = false;
  try { on = localStorage.getItem('snd') !== '0'; } catch (e) {}
  const files = n => (ASSETS.cfg.audio[n] || ['assets/audio/' + n + '.mp3', 'assets/audio/' + n + '.ogg']);
  async function load(n) {
    for (const u of files(n)) { try { const r = await fetch(u); if (r.ok) return await ctx.decodeAudioData(await r.arrayBuffer()); } catch (e) {} }
    return null;
  }
  function synthAmbient() {                               // low drone + slow filtered wind, ~-30 dB
    const g = ctx.createGain(); g.gain.value = .5; g.connect(amb);
    [[55, 'triangle'], [82.4, 'sine'], [110.6, 'sine']].forEach(([f, t], i) => {
      const o = ctx.createOscillator(), og = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
      o.type = t; o.frequency.value = f; og.gain.value = .22 / (i + 1);
      l.frequency.value = .04 + i * .03; lg.gain.value = .08; l.connect(lg); lg.connect(og.gain);
      o.connect(og); og.connect(g); o.start(); l.start();
    });
    const nb = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), ng = ctx.createGain(), l2 = ctx.createOscillator(), l2g = ctx.createGain();
    ns.buffer = nb; ns.loop = true; bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = .7; ng.gain.value = .05;
    l2.frequency.value = .07; l2g.gain.value = .035; l2.connect(l2g); l2g.connect(ng.gain);
    ns.connect(bp); bp.connect(ng); ng.connect(g); ns.start(); l2.start();
  }
  function blip(freqs, dur, vol, type) {
    const t = ctx.currentTime;
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * dur * .6;
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, s);
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(vol, s + .008); g.gain.exponentialRampToValueAtTime(.0001, s + dur);
      o.connect(g); g.connect(master); o.start(s); o.stop(s + dur + .02);
    });
  }
  function sfx(n) {
    if (!on || !ctx) return;
    if (bufs[n]) { const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = bufs[n]; g.gain.value = .6; s.connect(g); g.connect(master); s.start(); return; }
    if (n === 'click') blip([760], .07, .16, 'triangle'); else if (n === 'turn') blip([330, 495, 660], .22, .2, 'sine');
  }
  async function start() {                                // browsers need a user gesture first
    if (started) return; started = true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = on ? .5 : 0; master.connect(ctx.destination);
    amb = ctx.createGain(); amb.gain.value = .22; amb.connect(master);
    await ASSETS.ready;
    for (const n of ['click', 'turn']) load(n).then(b => { if (b) bufs[n] = b; });
    const ab = await load('ambient');
    if (ab) { const s = ctx.createBufferSource(); s.buffer = ab; s.loop = true; s.connect(amb); s.start(); } else synthAmbient();
  }
  function toggle() {
    on = !on; try { localStorage.setItem('snd', on ? '1' : '0'); } catch (e) {}
    if (master) master.gain.setTargetAtTime(on ? .5 : 0, ctx.currentTime, .05);
    icon(); if (on) start();
  }
  const icon = () => { const b = document.getElementById('snd'); if (b) b.innerHTML = I(on ? 'sound' : 'mute'); };
  return { start, sfx, toggle, icon };
})();
