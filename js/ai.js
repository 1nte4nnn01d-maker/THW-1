'use strict';
/* AI army logic: scan borders -> priority fronts -> pull reserves from the rear -> recruit at the front -> limited offensives. */
const AICFG = { THREAT_MIN: 8, THREAT_RATIO: .8, MAX_FRONTS: 3, DEPTH: 8, SAFE: .9, TARGET: 1.3 };
const hostile = (o, x) => atWar(o, x) || (x === PL && REL[o] < 35) || J[o + '>' + x] !== undefined;

/** Enemy strength next to each border province: [{p, t}] sorted by threat. */
function aiThreats(o, bord) {
  const out = [];
  for (const p of bord) { let t = 0; for (const j of p.n) { const q = P[j]; if (q.o !== o && hostile(o, q.o)) t += q.a; } if (t > 0) out.push({ p, t }); }
  return out.sort((a, b) => b.t - a.t);
}

function aiArmy(o, cp, e, bord, foes, at) {
  const thr = aiThreats(o, bord), tm = new Map(thr.map(x => [x.p.i, x.t]));
  const fronts = thr.filter(x => x.t >= AICFG.THREAT_MIN && x.t > x.p.a * AICFG.THREAT_RATIO).slice(0, AICFG.MAX_FRONTS);
  const prio = new Set(fronts.map(x => x.p.i));
  const cost = .5 * CS * Math.max(.3, 1 + MODS[o].dc) * infl(o);
  let capLeft = Math.max(0, e.pp * MANP - e.ar);
  const recruit = (p, want) => {
    const n = Math.min(want, p.pop * .02, RC[o], M[o] / cost, capLeft);
    if (n > .05) { p.pop -= n; p.a += n * (1 + .25 * AFS[o][1]); p.m = Math.max(p.m, p.a); RC[o] -= n; M[o] -= n * cost; capLeft -= n; }
  };
  // 1) priority fronts: pull reserves (nearest first, BFS through own land), then recruit on the spot
  for (const { p, t } of fronts) {
    let need = Math.min(t * AICFG.TARGET, Supply.limit(p) * AICFG.SAFE) - p.a;
    const seen = new Set([p.i]); let layer = [p.i];
    for (let d = 0; d < AICFG.DEPTH && need > .05 && layer.length; d++) {
      const next = [];
      for (const i of layer) for (const j of P[i].n) {
        if (seen.has(j) || P[j].o !== o) continue;
        seen.add(j); next.push(j);
        const q = P[j]; if (prio.has(j) || q.a <= 1) continue;
        const keep = tm.has(j) ? tm.get(j) * 1.3 : 0, take = Math.min(Math.max(0, q.a * .85 - keep), need);
        if (take > .05) { q.a -= take; p.a += take; p.m = Math.max(p.m, p.a); need -= take; }
      }
      layer = next;
    }
    if (need > .05) recruit(p, need);
  }
  // 2) rear: no random 3-division sprinkling; new troops go to the biggest interior province (a reserve hub)
  if (at.length || fronts.length) {
    const inner = cp.filter(p => !bord.includes(p)), hub = (inner.length ? inner : cp).reduce((a, b) => (b.pop > a.pop ? b : a));
    if (hub && hub.a < Supply.limit(hub) * .6) recruit(hub, Math.min(hub.pop * .01, 6));
  }
  // 3) doom-stack hygiene: spill the excess over the supply limit into the emptiest own neighbour
  for (const p of cp) {
    const lim = Supply.limit(p);
    if (Supply.overstack(p)) {
      const nb = [...p.n].map(j => P[j]).filter(q => q.o === o).sort((a, b) => a.a - b.a)[0];
      if (nb) { const x = p.a - lim * .95; p.a -= x; nb.a += x; nb.m = Math.max(nb.m, nb.a); }
    }
  }
  // 4) offensives only where there is local superiority, never from a province that has to hold the line
  if (at.length) push(o, 1.5, 3 + Math.floor(cp.length / 12), prio);
}
