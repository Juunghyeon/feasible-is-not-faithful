// Feasible Is Not Faithful. Every measured number comes from assets/data/manifest.js (project_site/prep/build_manifest_u41m.py).
(function () {
  'use strict';
  const M = window.MANIFEST; if (!M) { console.error('manifest missing'); return; }
  const NS = 'http://www.w3.org/2000/svg', $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const tx = (p, x, y, s, cls, a = {}) => { const t = el('text', Object.assign({ x, y, class: cls || 'f-m', 'font-size': 13 }, a), p); t.textContent = s; return t; };
  const minus = s => String(s).replace('-', '\u2212'), num = (v, d) => minus(Number(v).toFixed(d));
  const range = (r, d, rev) => { const [a, b] = rev ? [r[1], r[0]] : r, A = num(a, d), B = num(b, d); return A === B ? A : (a < 0 || b < 0 ? `${A} to ${B}` : `${A}\u2013${B}`); };
  const at = p => p.split('.').reduce((o, k) => o[k], M);
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $$('[data-n]').forEach(e => { e.textContent = num(at(e.dataset.n), +e.dataset.d); });
  $$('[data-r]').forEach(e => { e.textContent = range(at(e.dataset.r), +e.dataset.d, e.dataset.rev); });
  $$('[data-speed]').forEach(e => { e.textContent = `played \u00d7${M.media[e.dataset.speed].speed}`; });

  // ---------- hero and the rendered film
  const hero = $('#hero-video'), hb = $('.hero-pause'), showHero = () => { hb.textContent = hero.paused ? 'Play' : 'Pause'; hb.setAttribute('aria-pressed', String(hero.paused)); };
  if (hero && hb && M.media.hero.video) { hero.src = M.media.hero.video; hb.onclick = () => hero.paused ? hero.play() : hero.pause(); hero.onplay = hero.onpause = showHero; if (!calm) hero.play().catch(showHero); hero.ontimeupdate = () => hero.parentElement.classList.toggle("early", hero.currentTime > 0 && hero.currentTime < .42 * hero.duration); showHero(); } else if (hb) hb.hidden = true;
  const mech = $('#mech'), mm = M.media.concept || M.media.mechanism;
  if (mm && mm.video) { mech.poster = mm.poster; mech.src = mm.video; const mb = $('.film .vbtn'); let mu = false; const ms = () => { mb.textContent = mech.paused ? 'Play' : 'Pause'; mb.setAttribute('aria-pressed', String(mech.paused)); }; mech.onplay = mech.onpause = ms; ms(); const mt = () => { if (mech.paused) { mu = false; mech.play().catch(() => {}); } else { mu = true; mech.pause(); } }; mb.onclick = mt; mech.onclick = mt; if (!calm && 'IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { if (!mu) mech.play().catch(() => {}); } else mech.pause(); }), { threshold: .4 }).observe(mech); } else mech.closest('figure').hidden = true;

  // ---------- two videos, one clock
  function pair(root) {
    const [a, b] = $$('video', root), btn = $('.play', root), bar = $('input', root), spd = $('.spd', root); let want = false, raf = 0, user = false, vis = false;
    const paint = () => { btn.textContent = want ? 'Pause' : 'Play both'; };
    function tick() { raf = 0; if (!want) return; if (a.duration) { bar.value = a.currentTime / a.duration; if (!b.seeking && Math.abs(a.currentTime - b.currentTime) > .08) b.currentTime = Math.min(a.currentTime, (b.duration || 1e9) - .02); } raf = requestAnimationFrame(tick); }
    const ready = v => v.readyState >= 3 ? Promise.resolve() : new Promise(r => { v.addEventListener('canplay', r, { once: true }); if (v.preload === 'none') { v.preload = 'auto'; v.load(); } });
    async function play() { want = true; paint(); await Promise.all([ready(a), ready(b)]); if (!want) return; if (a.ended) a.currentTime = 0; b.currentTime = a.currentTime; await Promise.all([a.play(), b.play()]).catch(() => { want = false; paint(); }); if (!raf) tick(); }
    function pause() { want = false; a.pause(); b.pause(); paint(); }
    btn.onclick = () => { if (want) { user = true; pause(); } else { user = false; play(); } };
    if (!calm && 'IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { vis = e.isIntersecting; if (vis && !user && !btn.disabled) play(); else if (!vis && want) pause(); }), { threshold: .45 }).observe(root);   // play when in view, as a pair
    a.onended = () => { if (want) { a.currentTime = b.currentTime = 0; a.play(); b.play(); } };
    bar.oninput = async () => { await Promise.all([ready(a), ready(b)]); a.currentTime = b.currentTime = bar.value * a.duration; };
    $$('.frame', root).forEach(f => f.addEventListener('click', () => btn.click()));
    return { set(ka, kb) { pause(); bar.value = 0; [[a, ka], [b, kb]].forEach(([v, k]) => { const m = M.media[k]; v.preload = 'none'; v.poster = m.poster; if (m.video) v.src = m.video; else v.removeAttribute('src'); }); const m = M.media[ka]; spd.textContent = `\u00d7${m.speed}`; btn.disabled = !(m.video && M.media[kb].video); if (vis && !user && !calm && !btn.disabled) play(); }, pause };
  }
  function tabs(root, key, fn) {
    const bs = $$('button', root), sel = root.getAttribute('role') === 'tablist' ? 'aria-selected' : 'aria-checked';
    const go = b => { bs.forEach(x => { x.setAttribute(sel, String(x === b)); x.tabIndex = x === b ? 0 : -1; }); fn(b.dataset[key]); };
    bs.forEach((b, i) => { b.onclick = () => go(b); b.onkeydown = e => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { const n = bs[(i + d + bs.length) % bs.length]; n.focus(); go(n); } }; }); go(bs[0]);
  }
  const secs = (a, b) => `recording ${a.start}\u2013${a.end} s and ${b.start}\u2013${b.end} s`, runId = r => r.replace(/^HW_/, '').replace(/_I_d\d+_\d{8}_/, ' at ');

  // ---------- glyphs and key numbers
  const path = (P, f) => 'M' + P.map(p => f(p).map(v => v.toFixed(2)).join(' ')).join('L');
  $$('.key[data-fig]').forEach(k => {
    const F = M.pen[k.dataset.fig], g = $('svg', k), f = p => [25 + p[0] * .72, 32 - p[1] * .72]; el('path', { d: path(F.trace.ipcr, f) + 'Z', class: 's-i' }, g); el('path', { d: path(F.trace.np, f) + 'Z', class: 's-n' }, g);
    $('.i', k).textContent = `${range(F.ipcr_range, 2)} mm`; $('.n', k).textContent = `${range(F.np_range, 1)} mm`;
  });

  // ---------- drawing
  function trace(F) {
    const s = $('#trace'); s.innerHTML = ''; const W = 420, H = 360; s.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const all = [...F.trace.ref, ...F.trace.ipcr, ...F.trace.np], xs = all.map(p => p[0]), ys = all.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = Math.min((W - 40) / (x1 - x0), (H - 74) / (y1 - y0)), f = p => [W / 2 + (p[0] - (x0 + x1) / 2) * k, 22 + (H - 74) / 2 - (p[1] - (y0 + y1) / 2) * k];
    el('path', { d: path(F.trace.np, f), fill: 'none', class: 's-n', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, s); el('path', { d: path(F.trace.ipcr, f), fill: 'none', class: 's-i', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, s); el('path', { d: path(F.trace.ref, f), fill: 'none', class: 's-k', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, s);
    el('path', { d: `M20 ${H - 14}h${10 * k}`, class: 's-k', 'stroke-width': 2 }, s); tx(s, 20 + 10 * k + 8, H - 10, '10 mm');
    let x = W - 262; for (const [c, t, d] of [['s-k', 'planned', '5 5'], ['s-i', 'IPCR', ''], ['s-n', 'nearest point', '']]) { el('path', { d: `M${x} ${H - 14}h16`, class: c, 'stroke-width': 2.4, 'stroke-dasharray': d }, s); tx(s, x + 21, H - 10, t, 'f-m', { 'font-size': 12 }); x += 21 + t.length * 6.6 + 12; }
    $('#trace-cap').textContent = `Front view, the coordinates the task keeps. Last run of each set: ${runId(F.trace.ipcr_run)}, ${runId(F.trace.np_run)}.`;
  }
  function dots(F) {
    const s = $('#dots'); s.innerHTML = ''; const W = 560, H = 264, l = 108, r = W - 18, X = v => l + v / 18 * (r - l); s.setAttribute('viewBox', `0 0 ${W} ${H}`);
    for (let v = 0; v <= 18; v += 3) { el('path', { d: `M${X(v)} 18V${H - 46}`, class: 's-g' }, s); tx(s, X(v), H - 26, v, 'f-m', { 'text-anchor': 'middle' }); } tx(s, (l + r) / 2, H - 6, 'shift from the planned place (mm)', 'f-m', { 'text-anchor': 'middle' });
    const row = (y, R, c, tc, lab, sub, rg, d) => { tx(s, 0, y - 1, lab, tc, { 'font-weight': 700, 'font-size': 14 }); tx(s, 0, y + 15, sub, 'f-m', { 'font-size': 11.5 }); R.forEach((o, i) => { const yy = y + (i - (R.length - 1) / 2) * 17; const e = el('circle', { cx: X(o.shift), cy: yy, r: 4.8, class: c }, s); el('title', {}, e).textContent = `${runId(o.run)}: ${o.shift.toFixed(2)} mm` + (o.pred ? `, predicted ${o.pred.toFixed(2)} mm` : ''); if (o.pred) el('path', { d: `M${X(o.pred)} ${yy - 11}v22`, class: 's-r', 'stroke-width': 2.4 }, s); });
      const hi = Math.max(...R.map(o => o.shift)), lo = Math.min(...R.map(o => o.shift)); d > 0 ? tx(s, X(hi) + 14, y + 5, rg, tc, { 'font-weight': 700, 'font-size': 14 }) : tx(s, X(lo) - 16, y + 5, rg, tc, { 'font-weight': 700, 'font-size': 14, 'text-anchor': 'end' }); };
    row(70, F.ipcr, 'f-i', 'tx-i', 'IPCR', `${F.ipcr.length} runs`, `${range(F.ipcr_range, 2)} mm`, 1); row(164, F.np, 'f-n', 'tx-n', 'nearest point', `${F.np.length} runs`, `${range(F.np_range, 1)} mm, ${range(F.ratio_range, 2)} of predicted`, -1);
  }
  // ---------- registered simulation: shift per structure, one dot per board (cell mean), predictions as ticks
  function simdots() {
    const s = $('#simdots'); if (!s || !M.sim) return; s.innerHTML = '';
    const rows = [['H', 'fixed-axis hybrid', 'a-h'], ['I', 'IPCR', 'a-i'], ['Q1', 'soft, α = 1/3', 'a-q1'], ['Q2', 'soft, α = 2/3', 'a-q2'], ['M', 'motion-stiff', 'a-m'], ['S', 'isotropic', 'a-s'], ['F', 'force direction', 'a-f'], ['N', 'nearest point', 'a-n']];
    const W = 760, rh = 30, top = 14, H = top + rows.length * rh + 40, l = 150, r = W - 92, lo = Math.log10(0.01), hi = Math.log10(20), X = v => l + (Math.log10(Math.max(v, 0.011)) - lo) / (hi - lo) * (r - l);
    s.setAttribute('viewBox', `0 0 ${W} ${H}`);
    [0.01, 0.1, 1, 10].forEach(v => { el('path', { d: `M${X(v)} ${top - 4}V${H - 34}`, class: 's-g' }, s); tx(s, X(v), H - 16, v < 1 ? String(v) : String(v), 'f-m', { 'text-anchor': 'middle', 'font-size': 12 }); });
    tx(s, (l + r) / 2, H - 1, 'shift of the figure (mm)', 'f-m', { 'text-anchor': 'middle', 'font-size': 12 });
    const MK = ['circle', 'square', 'diamond', 'triangle'];
    const mark = (k, x, y, cls) => { const z = 5; const d = { circle: null, square: `M${x - z} ${y - z}h${2 * z}v${2 * z}h${-2 * z}z`, diamond: `M${x} ${y - z - 1}l${z + 1} ${z + 1}l${-z - 1} ${z + 1}l${-z - 1} ${-z - 1}z`, triangle: `M${x} ${y - z - 1}l${z + 1} ${2 * z}h${-2 * z - 2}z` }[k];
      return d ? el('path', { d, class: cls }, s) : el('circle', { cx: x, cy: y, r: z, class: cls }, s); };
    rows.forEach(([k, lab, cls], i) => {
      const y = top + i * rh + rh / 2, C = M.sim.arms[k]; if (!C) return;
      tx(s, l - 14, y + 4, lab, 'tx ' + cls, { 'text-anchor': 'end', 'font-weight': k === 'I' || k === 'N' ? 700 : 600, 'font-size': 13.5 });
      C.forEach((c, j) => { if (c.pred > 0) el('path', { d: `M${X(c.pred)} ${y - 9}v18`, class: 's-r', 'stroke-width': 2 }, s); });
      C.forEach((c, j) => { const b = M.sim.boards.indexOf(c.label); const e = mark(MK[b], X(c.shift), y + (k === 'H' ? (c.variant === 'C' ? -5 : 5) : 0), 'dot ' + cls); el('title', {}, e).textContent = `${lab}, ${c.label}${c.variant ? ' (' + (c.variant === 'C' ? 'PD' : 'switch') + ')' : ''}: ${c.shift.toFixed(2)} mm` + (c.pred > 0 ? `, predicted ${c.pred.toFixed(2)} mm` : ''); });
      const v = C.map(c => c.shift), a = Math.min(...v), b = Math.max(...v); tx(s, r + 12, y + 4, `${num(a, a < 1 ? 2 : 1)}–${num(b, b < 1 ? 2 : 1)}`, 'tx ' + cls, { 'font-size': 12.5, 'font-weight': 600 });
    });
    const key = $('#simkey'); if (key) key.innerHTML = M.sim.boards.map((bd, i) => `<span><svg viewBox="-7 -7 14 14" aria-hidden="true">${{ circle: '<circle r="5"/>', square: '<path d="M-5-5h10v10h-10z"/>', diamond: '<path d="M0-6l6 6-6 6-6-6z"/>', triangle: '<path d="M0-6l6 10h-12z"/>' }[MK[i]]}</svg>${bd}</span>`).join('') + '<span><svg viewBox="-7 -7 14 14" aria-hidden="true"><path d="M0-6v12" class="s-r" stroke-width="2"/></svg>predicted</span>';
  }
  simdots();
  const pen = pair($('#pen-pair'));
  tabs($('#fig-tabs'), 'fig', k => { const F = M.pen[k], m = M.media[k + '_ipcr']; pen.set(k + '_ipcr', k + '_np'); trace(F); dots(F);
    $('#pen-cap').textContent = `Real robot, one camera position, played \u00d7${m.speed} (${secs(m, M.media[k + '_np'])}, cropped, last frame held). The two are aligned where the stroke starts to move, to about half a second. Runs ${runId(m.run)} and ${runId(M.media[k + '_np'].run)}.`; });

  // ---------- widget
  (function () {
    const root = $('#w-target'), svg = $('svg', root), [sT, sE] = $$('input', root), o = $$('output', root), out = $('.wout', root), deg = Math.PI / 180, W = 440, H = 300; sT.value = M.summary.tilt_deg; sE.value = M.summary.implied_depth_mm;
    const defs = el('defs', {}, svg); for (const c of ['i', 'n']) { const m = el('marker', { id: 'ah' + c, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, defs); el('path', { d: 'M0 0L10 5L0 10z', class: 'f-' + c }, m); }
    const g = el('g', {}, svg);
    function draw() {
      const th = +sT.value * deg, h = +sE.value; g.innerHTML = ''; o[0].textContent = (+sT.value).toFixed(1) + '\u00b0'; o[1].textContent = h + ' mm';
      const k = Math.min(2.2, 150 / (h / Math.cos(th))), ox = W / 2 - 30, oy = 208, P = (u, w) => [ox + u * k, oy - w * k], n = [Math.sin(th), -Math.cos(th)], t = [Math.cos(th), Math.sin(th)];   // u: frontal, w: depth (up = into the board); n points to the robot
      const L = 190 / k, a = P(-t[0] * L, -t[1] * L), b = P(t[0] * L * 1.2, t[1] * L * 1.2); el('polygon', { points: `${a} ${b} ${b[0]},0 ${a[0]},0`, class: 'f-body' }, g); el('path', { d: `M${a}L${b}`, class: 's-k', 'stroke-width': 3 }, g);
      const r = [0, h / Math.cos(th)], e = [r[0] + n[0] * h, r[1] + n[1] * h], R = P(...r), D = P(0, 0), E = P(...e), sh = (p, q, d) => { const m = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [q[0] - (q[0] - p[0]) / m * d, q[1] - (q[1] - p[1]) / m * d]; };
      el('path', { d: `M${R}L${sh(R, D, 8)}`, class: 's-i', 'stroke-width': 2.6, 'marker-end': 'url(#ahi)' }, g); el('path', { d: `M${R}L${sh(R, E, 8)}`, class: 's-n', 'stroke-width': 2.6, 'marker-end': 'url(#ahn)' }, g);
      const yb = Math.max(D[1], E[1]) + 34; for (const x of [D[0], E[0]]) el('path', { d: `M${x} ${yb - 24}v30`, class: 's-r' }, g); el('path', { d: `M${D[0]} ${yb}H${E[0]}`, class: 's-n', 'stroke-width': 3 }, g);
      el('circle', { cx: R[0], cy: R[1], r: 6, class: 's-k f-bg', 'stroke-width': 2.2 }, g); tx(g, R[0] - 12, R[1] + 4, 'planned', 'f-k', { 'text-anchor': 'end', 'font-weight': 600 }); el('circle', { cx: D[0], cy: D[1], r: 6, class: 'f-i' }, g); tx(g, D[0] - 12, D[1] + 20, 'IPCR', 'tx-i', { 'text-anchor': 'end', 'font-weight': 700 }); el('rect', { x: E[0] - 5.5, y: E[1] - 5.5, width: 11, height: 11, class: 'f-n' }, g); tx(g, E[0] + 13, E[1] + 20, 'nearest point', 'tx-n', { 'font-weight': 700 });
      tx(g, 10, H - 8, 'robot side'); tx(g, 10, 18, 'depth, where the task may yield'); tx(g, W - 8, b[1] + (b[1] < 34 ? 26 : -10), 'board', 'f-k', { 'text-anchor': 'end', 'font-weight': 600 });
      out.innerHTML = `The nearest point moves the figure by <b class="c-n">${(h * Math.sin(th)).toFixed(1)} mm</b> sideways. IPCR moves it by <b class="c-i">0 mm</b>.`;
    }
    sT.oninput = sE.oninput = draw; draw();
  })();

  // ---------- execution-level widget and the drawing table
  (function () {
    const root = $('#w-exec'), svg = $('svg', root), [sA, sR] = $$('input', root), o = $$('output', root), out = $('.wout', root), W = 440, th = M.summary.tilt_deg * Math.PI / 180, k = 5.2;
    const defs = el('defs', {}, svg); for (const c of ['i', 'n']) { const m = el('marker', { id: 'ex' + c, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, defs); el('path', { d: 'M0 0L10 5L0 10z', class: 'f-' + c }, m); }
    const g = el('g', {}, svg), n = [-Math.sin(th), Math.cos(th)], t = [Math.cos(th), Math.sin(th)], P = (u, w) => [W / 2 + u * k, 200 - w * k];
    function draw() {
      const al = +sA.value, rho = +sR.value; g.innerHTML = ''; o[0].textContent = al < .005 ? 'd' : al > .995 ? 'n' : al.toFixed(2); o[1].textContent = rho + ' mm';
      const N = [al * n[0], (1 - al) + al * n[1]], s = rho / (n[0] * N[0] + n[1] * N[1]), e = [N[0] * s, N[1] * s], D = P(0, 0), E = P(...e), on = al < .005, c = on ? 'i' : 'n', seg = q => `M${P(q[0] - t[0] * 38, q[1] - t[1] * 38)}L${P(q[0] + t[0] * 38, q[1] + t[1] * 38)}`;
      el('path', { d: `M${P(0, 34)}L${P(0, -11)}`, class: 's-i', 'stroke-dasharray': '3 4' }, g); el('path', { d: seg([0, 0]), class: 's-r', 'stroke-width': 1.8, 'stroke-dasharray': '7 5', fill: 'none' }, g); el('path', { d: seg([n[0] * rho, n[1] * rho]), class: 's-k', 'stroke-width': 3, fill: 'none' }, g);
      const b = P(t[0] * 38, t[1] * 38), q = P(n[0] * rho + t[0] * 38, n[1] * rho + t[1] * 38); const bl = P(-t[0] * 38, -t[1] * 38); tx(g, bl[0], bl[1] + 20, 'believed surface', 'f-m'); tx(g, q[0], q[1] - 10, 'true surface', 'f-k', { 'text-anchor': 'end', 'font-weight': 600 });
      if (rho > 1) { const m = Math.hypot(E[0] - D[0], E[1] - D[1]); el('path', { d: `M${D}L${E[0] - (E[0] - D[0]) / m * 8} ${E[1] - (E[1] - D[1]) / m * 8}`, class: 's-' + c, 'stroke-width': 2.6, 'marker-end': `url(#ex${c})` }, g); }
      el('circle', { cx: D[0], cy: D[1], r: 6, class: 's-i f-bg', 'stroke-width': 2.2 }, g); tx(g, D[0] + 12, D[1] + 22, 'target', 'tx-i', { 'font-weight': 700 }); el('circle', { cx: E[0], cy: E[1], r: 6, class: 'f-' + c }, g); tx(g, E[0] - 13, E[1] - 8, 'executed', 'tx-' + c, { 'text-anchor': 'end', 'font-weight': 700 });
      if (Math.abs(E[0] - D[0]) > 1) { el('path', { d: `M${E[0]} ${E[1] + 8}V268`, class: 's-r', 'stroke-dasharray': '2 3' }, g); el('path', { d: `M${D[0]} 262H${E[0]}`, class: 's-n', 'stroke-width': 3 }, g); }
      tx(g, 10, 292, 'frontal position, kept by the task');
      out.innerHTML = `The figure moves by <b class="c-${c}">${Math.abs(e[0]).toFixed(2)} mm</b>. ` + (on ? 'Absorbing along the yield direction, no residual can move it.' : 'Only absorption along the yield direction is immune to every residual.');
    }
    sA.oninput = sR.oninput = draw; draw();
  })();
  (function () {
    const tb = $('#pen-table'), F = ['circle', 'square', 'star'].map(k => M.pen[k]), rr = (R, k) => range([Math.min(...R.map(o => o[k])), Math.max(...R.map(o => o[k]))], 2);
    const row = (lab, f, c) => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${lab}</td>` + F.map(x => `<td${c ? ` class="${c}"` : ''}>${f(x)}</td>`).join(''); tb.append(tr); };
    row('Runs, IPCR / nearest point', x => `${x.ipcr.length} / ${x.np.length}`); row('IPCR shift (mm)', x => `<b>${range(x.ipcr_range, 2)}</b>`, 'c-i'); row('Nearest-point shift (mm)', x => `<b>${range(x.np_range, 1)}</b>`, 'c-n'); row('Nearest point / predicted', x => range(x.ratio_range, 2)); row('IPCR shape error (mm)', x => rr(x.ipcr, 'rms')); row('Nearest-point shape error (mm)', x => rr(x.np, 'rms'));
  })();

  // ---------- carrying
  const box = pair($('#box-pair')), st = $('#box-pair'), soon = $('#post-soon'), seg = $('#task-seg');
  tabs(seg, 'mode', m => { st.dataset.mode = m; });
  tabs($('#wall-tabs'), 'wall', w => {
    const post = w === 'post', ok = !post || (M.media.post_uf && M.media.post_uy); st.hidden = !ok; soon.hidden = ok; seg.style.visibility = ok ? '' : 'hidden'; if (!ok) { box.pause(); $('#box-cap').textContent = ''; return; }
    const m = M.media[w + '_uf']; box.set(w + '_uf', w + '_uy'); $('#box-cap').textContent = `Real robot seen from above, same camera, played \u00d7${m.speed} (${secs(m, M.media[w + '_uy'])}, last frame held), aligned where the carry starts, to about half a second. Runs ${runId(m.run)} and ${runId(M.media[w + '_uy'].run)}.`;
  });
  (function () {
    const s = $('#yaw'), W = 640, H = 300, l = 46, r = W - 100, t = 14, b = H - 46, X = v => l + (v + 360) / 660 * (r - l), Y = v => t + (1 - v) / 7 * (b - t); s.setAttribute('viewBox', `0 0 ${W} ${H}`);
    for (let v = 1; v >= -6; v--) { el('path', { d: `M${l} ${Y(v)}H${r}`, class: 's-g' }, s); if (v % 2 === 0) tx(s, l - 8, Y(v) + 4, minus(v) + '\u00b0', 'f-m', { 'text-anchor': 'end' }); }
    for (const v of [-300, -200, -100, 0, 100, 200, 300]) tx(s, X(v), b + 19, minus(v), 'f-m', { 'text-anchor': 'middle' }); tx(s, (l + r) / 2, H - 6, 'position along the path (mm)', 'f-m', { 'text-anchor': 'middle' });
    el('path', { d: `M${X(M.box.contact_x_mm)} ${t}V${b}`, class: 's-r', 'stroke-dasharray': '3 4' }, s);
    for (const [k, c] of [['uy', 's-y'], ['uf', 's-i']]) for (const o of M.box[k]) el('path', { d: path(o.trace, p => [X(p[0]), Y(p[1])]), fill: 'none', class: c, 'stroke-width': 1.6, 'stroke-opacity': .8 }, s);
    tx(s, r + 8, Y(0) + 4, 'keep yaw', 'tx-i', { 'font-weight': 700 }); tx(s, r + 8, Y(M.box.summary.uy_mean[0]) + 4, 'yaw free', 'tx-y', { 'font-weight': 700 });
  })();
})();
