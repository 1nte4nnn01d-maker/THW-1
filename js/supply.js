'use strict';
/* Supply lines + army upkeep/healing. Pure helpers take P (provinces); armyTurn() uses game globals at call time. */
var SUPF = new Uint8Array(0), FARMS = [];
const Supply = (() => {
  const CFG = { ATTRITION: .10,   // share of max strength lost per turn when cut off
                HEAL_BASE: .05,   // base heal per turn (share of max strength)
                HEAL_FARM: .02,   // + per farm in the province (max 5 counted)
                HEAL_NATION: .02, // + per farm per province over the whole country (max 2 counted)
                HEAL_CAP: .30,    // hard ceiling per turn
                LIM_BASE: 30, LIM_POP: .012, LIM_CAMP: 15, LIM_CAPITAL: 60,  // supply limit of a province (thousand troops)
                LIM_HOME: 2,      // national (original) provinces have a x2 limit
                ATTR_MIN: .05, ATTR_MAX: .10,     // attrition per turn: overstack 5..10%, pocket 10%
                ENGAGE_TURNS: 3 };  // a province counts as "in combat" for this many turns after a battle

  /** supplied[i]=1 if province i belongs to the country's main body: the biggest block of connected own provinces
      (neighbours + sea lanes between overseas parts), or the capital's block if it is at least half as big. Rest = pockets (котёл). */
  function compute(P, cap, lanes) {
    lanes = lanes || (typeof WORLD !== 'undefined' ? WORLD.S : []);
    const ex = P.map(() => []); for (const [a, b] of lanes) { ex[a].push(b); ex[b].push(a); }
    const n = P.length, comp = new Int32Array(n).fill(-1), size = [], owner = [];
    for (let s = 0; s < n; s++) {
      if (comp[s] >= 0) continue;
      const id = size.length, o = P[s].o, st = [s];
      comp[s] = id; let c = 0;
      while (st.length) { const i = st.pop(); c++; for (const j of P[i].n) if (comp[j] < 0 && P[j].o === o) { comp[j] = id; st.push(j); } for (const j of ex[i]) if (comp[j] < 0 && P[j].o === o) { comp[j] = id; st.push(j); } }
      size.push(c); owner.push(o);
    }
    const main = new Map();
    for (let id = 0; id < size.length; id++) { const o = owner[id]; if (!main.has(o) || size[id] > size[main.get(o)]) main.set(o, id); }
    cap.forEach((ci, k) => { if (P[ci] && P[ci].o === k && size[comp[ci]] >= .5 * size[main.get(k)]) main.set(k, comp[ci]); });
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) out[i] = comp[i] === main.get(P[i].o) ? 1 : 0;
    return out;
  }
  const stat = (P, f, o) => { let all = 0, cut = 0; for (const p of P) if (p.o === o && p.a > .05) { all++; if (pocket(p, f)) cut++; } return { all, cut }; };
  const farms = (P, N) => { const r = new Array(N).fill(0); for (const p of P) r[p.o] += p.b[0]; return r; };
  /** Home (national) province: still owned by the country it belonged to at the start of the game. */
  const isHome = p => PD[p.i][0] === p.o;
  /** The province touches a country the owner is at war with. */
  const bordersEnemy = p => { for (const j of p.n) { const q = P[j].o; if (q !== p.o && atWar(p.o, q)) return true; } return false; };
  /** Supply limit (thousand troops): own land gets double. */
  const limit = p => (CFG.LIM_BASE + CFG.LIM_POP * p.pop + CFG.LIM_CAMP * p.b[2] + (typeof cap !== 'undefined' && cap[p.o] === p.i ? CFG.LIM_CAPITAL : 0)) * (isHome(p) ? CFG.LIM_HOME : 1);
  /** Logistics are "on" only where there is a war: occupied foreign land, provinces touching an enemy, and provinces that
      fought during the last ENGAGE_TURNS turns. Home land in peace (or in the rear) consumes no supply: no stack limit, no attrition. */
  const engaged = p => !isHome(p) || bordersEnemy(p) || (typeof turn !== 'undefined' && p.fl != null && turn - p.fl <= CFG.ENGAGE_TURNS);
  /** Over the supply limit while logistics are on. */
  const overstack = p => engaged(p) && p.a > limit(p);
  /** Cut off from the main body while logistics are on (a real encirclement, not a quiet rear). */
  const pocket = (p, sup) => !sup[p.i] && engaged(p);
  /** attr[i]=1 when the army suffers attrition: pocket or overstack. */
  const attr = (P, sup) => { const r = new Uint8Array(P.length); for (const p of P) if (p.a > .05 && (pocket(p, sup) || overstack(p))) r[p.i] = 1; return r; };
  return { ...CFG, compute, stat, farms, limit, attr, overstack, pocket, engaged, isHome, bordersEnemy };
})();

/** One turn of army upkeep for country o: attrition (cut off / over the supply limit) or healing from farms. */
function armyTurn(o, cp) {
  const fN = FARMS[o] / Math.max(1, cp.length); let cut = 0, over = 0;
  for (const p of cp) {
    if (p.a <= 0) continue;
    const lim = Supply.limit(p), cutOff = Supply.pocket(p, SUPF), stack = Supply.overstack(p);
    if (cutOff || stack) {                              // "Истощение": no recovery, -50% combat efficiency (see attack())
      if (cutOff) { p.a = Math.max(0, p.a - p.m * Supply.ATTR_MAX); cut++; }
      else { p.a -= p.a * Math.min(Supply.ATTR_MAX, Supply.ATTR_MIN + Supply.ATTR_MIN * (p.a - lim) / lim); over++; }
      if (p.a < .001) { p.a = 0; p.m = 0; }
      continue;
    }
    const miss = p.m - p.a; if (miss <= 0) continue;
    const rate = Math.min(Supply.HEAL_CAP, (Supply.HEAL_BASE + Supply.HEAL_FARM * Math.min(p.b[0], 5) + Supply.HEAL_NATION * Math.min(fN, 2)) * (1 + MODS[o].heal));
    // never back to 100% in one turn: at most 60% of the missing strength (top-off only for the last 2%)
    const h = Math.min(p.m * rate, miss <= p.m * .02 ? miss : miss * .6, RC[o]);
    if (h > 0) { p.a += h; RC[o] -= h; }
  }
  if (o === PL && !FFW) {
    if (cut) msg('Окружение: ' + cut + ' арм. без снабжения теряют ' + Math.round(Supply.ATTR_MAX * 100) + '% силы за ход.');
    if (over) msg('Истощение: ' + over + ' стек(ов) выше лимита снабжения теряют 5–10% в ход.');
  }
}

let DISB = -1, DISBT = 0;
/** Disband the army in province i (two taps to confirm). 30% of the soldiers return to the recruit pool. */
function disband(i) {
  const p = P[i]; if (!p || p.o !== PL || p.a <= .05) return;
  if (DISB !== i || Date.now() - DISBT > 4000) { DISB = i; DISBT = Date.now(); msg('Нажми ещё раз, чтобы распустить дивизию.'); return; }
  DISB = -1; RC[PL] += p.a * .3; p.a = 0; p.m = 0;
  msg('Дивизия распущена: содержание снято.'); draw(); hud(); showCard();
}
if (typeof module !== 'undefined') module.exports = Supply;
