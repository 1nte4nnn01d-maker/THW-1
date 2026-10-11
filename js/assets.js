'use strict';
/* Flags: real SVG files (flag-icons, MIT) from assets/flags/{iso}.svg; if a file is missing, the emoji K[o][4] is shown. */
const ASSETS = (() => {
  const cfg = { flags: 'assets/flags/{iso}.svg', audio: {} };
  const emoji = o => K[o][4] || K[o][1].replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
  function flag(o) {
    const e = emoji(o), src = cfg.flags && cfg.flags.replace('{iso}', K[o][1].toLowerCase());
    const txt = `<span class="flag flag-emoji">${e}</span>`;
    return src ? `<img class="flag" alt="${e}" src="${src}" loading="lazy" onerror="this.outerHTML=this.dataset.e" data-e='${txt}'>` : txt;
  }
  const ready = fetch('assets/manifest.json').then(r => r.ok ? r.json() : {}).then(m => Object.assign(cfg, m)).catch(() => {});
  return { flag, emoji, cfg, ready };
})();
