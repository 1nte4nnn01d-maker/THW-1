'use strict';
/* Loader: data/*.json (fetch) -> TopoJSON arcs -> Douglas-Peucker -> province id raster -> game scripts. */
const Loader = (() => {
  const MIN_PTS = 10; // arcs shorter than this are kept intact (tiny provinces must not collapse)

  const getJSON = async url => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + ': HTTP ' + r.status);
    return r.json();
  };

  /** TopoJSON arcs are delta-encoded and quantized: decode into flat Float32Array [x0,y0,x1,y1,...]. */
  function decodeArcs(topo) {
    const [sx, sy] = topo.transform ? topo.transform.scale : [1, 1];
    const [tx, ty] = topo.transform ? topo.transform.translate : [0, 0];
    return topo.arcs.map(a => {
      const out = new Float32Array(a.length * 2);
      let x = 0, y = 0;
      for (let i = 0; i < a.length; i++) {
        x += a[i][0]; y += a[i][1];
        out[2 * i] = x * sx + tx; out[2 * i + 1] = y * sy + ty;
      }
      return out;
    });
  }

  /** Douglas-Peucker (iterative, squared distances). Arcs are shared, so every border is simplified exactly once. */
  function douglasPeucker(a, tol) {
    const n = a.length >> 1;
    if (n < MIN_PTS || tol <= 0) return a;
    const keep = new Uint8Array(n), t2 = tol * tol, stack = [0, n - 1];
    keep[0] = keep[n - 1] = 1;
    while (stack.length) {
      const j = stack.pop(), i = stack.pop();
      const ax = a[2 * i], ay = a[2 * i + 1], dx = a[2 * j] - ax, dy = a[2 * j + 1] - ay, l2 = dx * dx + dy * dy;
      let dmax = 0, k = -1;
      for (let m = i + 1; m < j; m++) {
        const px = a[2 * m] - ax, py = a[2 * m + 1] - ay;
        const c = px * dy - py * dx, d = l2 ? c * c / l2 : px * px + py * py;
        if (d > dmax) { dmax = d; k = m; }
      }
      if (dmax > t2) { keep[k] = 1; stack.push(i, k, k, j); }
    }
    const out = [];
    for (let i = 0; i < n; i++) if (keep[i]) out.push(a[2 * i], a[2 * i + 1]);
    return Float32Array.from(out);
  }

  /** Arc references: r >= 0 forward, r < 0 means reversed arc ~r. Returns flat ring coordinates. */
  function ringPoints(refs, arcs) {
    const out = [];
    for (const r of refs) {
      const a = arcs[r < 0 ? ~r : r], n = a.length >> 1, skip = out.length ? 1 : 0;
      if (r < 0) for (let i = n - 1 - skip; i >= 0; i--) out.push(a[2 * i], a[2 * i + 1]);
      else for (let i = skip; i < n; i++) out.push(a[2 * i], a[2 * i + 1]);
    }
    return out;
  }

  /** Even-odd scanline fill of every province into an Int16 id grid (pixel centers, no antialiasing -> exact ids). */
  function rasterize(topo, arcs, W, H) {
    const pid = new Int16Array(W * H).fill(-1);
    for (const g of topo.objects.provinces.geometries) {
      const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs, rows = new Array(H);
      for (const poly of polys) for (const ring of poly) {
        const p = ringPoints(ring, arcs), n = p.length >> 1;
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n, ya = p[2 * i + 1], yb = p[2 * j + 1];
          if (ya === yb) continue;
          const xa = p[2 * i], xb = p[2 * j], lo = Math.min(ya, yb), hi = Math.max(ya, yb);
          const y0 = Math.max(0, Math.ceil(lo - .5)), y1 = Math.min(H - 1, Math.ceil(hi - .5) - 1);
          for (let y = y0; y <= y1; y++) (rows[y] || (rows[y] = [])).push(xa + (y + .5 - ya) * (xb - xa) / (yb - ya));
        }
      }
      for (let y = 0; y < H; y++) {
        const xs = rows[y];
        if (!xs) continue;
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          const x0 = Math.max(0, Math.ceil(xs[k] - .5)), x1 = Math.min(W - 1, Math.ceil(xs[k + 1] - .5) - 1);
          for (let x = x0; x <= x1; x++) pid[y * W + x] = g.id;
        }
      }
    }
    return pid;
  }

  async function loadWorld(opts = {}) {
    const t0 = performance.now(), tol = opts.tolerance ?? .75;
    const [game, topo] = await Promise.all([getJSON('data/game.json'), getJSON('data/provinces.topo.json')]);
    const arcs = decodeArcs(topo), before = arcs.reduce((s, a) => s + a.length / 2, 0);
    const simple = arcs.map(a => douglasPeucker(a, tol)), after = simple.reduce((s, a) => s + a.length / 2, 0);
    const pid = rasterize(topo, simple, game.MW, game.MH);
    console.info(`[map] arcs ${arcs.length}, points ${before}→${after} (tol ${tol}px), ${Math.round(performance.now() - t0)} ms`);
    return { ...game, pid, arcs: simple };
  }

  const loadScript = url => new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = url; s.async = false; s.onload = ok; s.onerror = () => fail(new Error('script: ' + url));
    document.head.appendChild(s);
  });

  /** Entry point: load the world, expose it as WORLD, then execute the game scripts in order. */
  async function start(scripts, opts) {
    const box = document.getElementById('ldr');
    try {
      window.WORLD = await loadWorld(opts);
      for (const u of scripts) await loadScript(u);
      box.remove();
    } catch (e) {
      console.error(e);
      box.innerHTML = 'Не удалось загрузить карту.<br><small>' + e.message + '<br>Открывайте игру через сервер, а не двойным кликом: <b>python3 -m http.server</b></small>';
    }
  }

  return { start, loadWorld, decodeArcs, douglasPeucker, rasterize };
})();
if (typeof module !== 'undefined') module.exports = Loader;
