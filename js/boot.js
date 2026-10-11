'use strict';
/* Runs after game.js: hotkeys, sound hooks, extra UI. */
(() => {
  // Space = end turn. Ignored while typing, during world events, in modal sheets, or after game over.
  const busy = () => over || PL < 0 || EV.cur || document.querySelector('.sheet.on,.sheet.open,.sheet[style*="block"]');
  addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target, typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
    if (typing) return;
    if (e.code === 'Space') { e.preventDefault(); if (t && t.blur) t.blur(); if (!busy()) nextTurn(); }
    else if (e.code === 'KeyM') Snd.toggle();
  });
  // Sound: first gesture unlocks audio; every button click gets a blip; turns get a chime (not during fast-forward).
  const unlock = () => { Snd.start(); removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock); };
  addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);
  document.addEventListener('click', e => { if (e.target.closest('button')) Snd.sfx('click'); }, true);
  const _next = nextTurn;
  nextTurn = function () { const t = turn; _next(); if (turn !== t && !FFW) Snd.sfx('turn'); };
  const _load = loadFrom; loadFrom = function (s) { _load(s); if (PL >= 0) Menu.hide(); };
  const b = document.getElementById('snd'); if (b) { b.onclick = Snd.toggle; Snd.icon(); }
})();
