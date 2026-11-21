// Feasible Is Not Faithful: page logic. Every number comes from assets/data/manifest.json (built by project_site/prep/build_manifest.py).
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const C = { ipcr: '#0072b2', np: '#d55e00', uy: '#009e73', ref: '#8a8f96', ink: '#13161b', grid: '#e4e6ea', mute: '#5d6672' };
  const el = (t, a = {}, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const tx = (p, x, y, s, a = {}) => { const t = el('text', Object.assign({ x, y, 'font-size': 12.5, fill: '#333', 'font-family': 'Inter, sans-serif' }, a), p); t.textContent = s; return t; };
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  const f = (v, d = 2) => (v === null || v === undefined || Number.isNaN(v)) ? '—' : Number(v).toFixed(d);

  // ---------- problem widget: nearest point vs IPCR target for a reference e mm inside a board tilted by theta
  function targetWidget(root) {
    if (!root) return;
    const svg = root.querySelector('svg'), sT = root.querySelector('[name=theta]'), sE = root.querySelector('[name=depth]');
    const outs = root.querySelectorAll('output'), out = root.querySelector('.wout'); const W = 420, H = 290, deg = Math.PI / 180;
    const defs = el('defs', {}, svg);
    for (const [k, c] of [['b', C.ipcr], ['o', C.np]]) { const m = el('marker', { id: 'a' + k, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs); el('path', { d: 'M0,0 L10,5 L0,10 z', fill: c }, m); }
    const g = el('g', {}, svg);
    function draw() {
      const th = +sT.value * deg, e = +sE.value; g.innerHTML = ''; outs[0].textContent = (+sT.value).toFixed(1) + '°'; outs[1].textContent = e + ' mm';
      const s = 2.3, ox = W / 2 + 25, oy = 135, P = (u, w) => [ox + u * s, oy - w * s];
      const n = [-Math.sin(th), Math.cos(th)], t = [Math.cos(th), Math.sin(th)];
      const a = P(-t[0] * 80, -t[1] * 80), b = P(t[0] * 80, t[1] * 80);
      el('polygon', { points: `${a} ${b} ${P(t[0] * 80, -70)} ${P(-t[0] * 80, -70)}`, fill: '#eee9df' }, g);
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: C.ink, 'stroke-width': 3 }, g);
      tx(g, b[0] - 4, b[1] - 9, 'board (unknown tilt)', { 'text-anchor': 'end' });
      const r = [0, -e / Math.cos(th)], xe = [r[0] + n[0] * e, r[1] + n[1] * e], R = P(...r), D = P(0, 0), E = P(...xe);
      const top = P(0, 50); el('line', { x1: top[0], y1: top[1], x2: R[0], y2: R[1] + 22, stroke: C.ipcr, 'stroke-dasharray': '3 3', opacity: .55 }, g);
      el('line', { x1: R[0], y1: R[1], x2: D[0], y2: D[1] + 7, stroke: C.ipcr, 'stroke-width': 2.4, 'marker-end': 'url(#ab)' }, g);
      el('line', { x1: R[0], y1: R[1], x2: E[0] + (R[0] - E[0]) * .08, y2: E[1] + (R[1] - E[1]) * .08, stroke: C.np, 'stroke-width': 2.4, 'stroke-dasharray': '6 4', 'marker-end': 'url(#ao)' }, g);
      el('circle', { cx: R[0], cy: R[1], r: 5.5, fill: '#fff', stroke: C.ink, 'stroke-width': 2 }, g); tx(g, R[0] + 9, R[1] + 5, 'reference (infeasible)');
      el('circle', { cx: D[0], cy: D[1], r: 6, fill: C.ipcr }, g); tx(g, D[0] + 10, D[1] + 18, 'IPCR', { fill: C.ipcr, 'font-weight': 700 });
      el('rect', { x: E[0] - 5.5, y: E[1] - 5.5, width: 11, height: 11, fill: C.np }, g); tx(g, E[0] - 10, E[1] - 10, 'nearest point', { fill: C.np, 'font-weight': 700, 'text-anchor': 'end' });
      tx(g, 8, H - 8, 'frontal position (kept by the task) →', { fill: '#8b939e', 'font-size': 11.5 }); tx(g, 8, 14, '↑ depth (the task may yield here)', { fill: '#8b939e', 'font-size': 11.5 });
      out.innerHTML = `Nearest point moves the figure by <b style="color:${C.np}">${(e * Math.sin(th)).toFixed(1)} mm</b> (e·sin θ). IPCR moves it by <b style="color:${C.ipcr}">0 mm</b>: it corrects only in depth.`;
    }
    sT.oninput = sE.oninput = draw; draw();
  }

  // ---------- results
  function bignums(M) {
    const hw = M.pen.filter(c => c.source === 'hardware');
    const rat = hw.map(c => c.np.shift_mm.mean / c.ipcr.shift_mm.mean), pr = hw.map(c => c.np.shift_mm.mean / c.np.pred_mm.mean);
    const set = (k, v) => { const e = document.querySelector(`[data-m=${k}]`); if (e) e.textContent = v; };
    set('big-ratio', `${Math.min(...rat).toFixed(0)}–${Math.max(...rat).toFixed(0)}×`);
    set('big-pred', `${Math.min(...pr).toFixed(2)}–${Math.max(...pr).toFixed(2)}×`);
    if (M.absorption) set('big-leak', `${f(M.absorption.normal_leak_mm, 2)} mm`);
  }

  function toc() {
    const links = [...document.querySelectorAll('.toc a')], secs = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => io.observe(s));
  }

  function strip(M) {
    const c = M.pen.find(x => x.shape === 'circle' && x.board === 'B16r4' && x.source === 'hardware'); if (!c) return;
    document.querySelector('[data-m=strip-np]').textContent = `moved ${f(c.np.shift_mm.mean, 1)} mm`;
    document.querySelector('[data-m=strip-ipcr]').textContent = `moved ${f(c.ipcr.shift_mm.mean, 2)} mm`;
  }

  function penGallery(M) {
    const root = document.getElementById('pen-gallery'); if (!root) return;
    const shapes = [...new Set(M.pen.map(c => c.shape))], boards = [...new Set(M.pen.map(c => c.board))].sort((a, b) => M.pen.find(c => c.board === a).tilt - M.pen.find(c => c.board === b).tilt);
    let shape = 'circle', board = 'B16r4';
    const rowS = h('div', 'chips'), rowB = h('div', 'chips'), body = h('div', 'card cell');
    root.append(rowS, rowB, body);
    function chips() {
      rowS.innerHTML = '<span class="k">shape</span>'; rowB.innerHTML = '<span class="k">board</span>';
      for (const s of shapes) { const b = h('button', 'chip' + (s === shape ? ' on' : ''), s); b.onclick = () => { shape = s; render(); }; rowS.append(b); }
      for (const bd of boards) {
        const c = M.pen.find(x => x.shape === shape && x.board === bd), t = M.pen.find(x => x.board === bd).tilt;
        const b = h('button', 'chip' + (bd === board ? ' on' : ''), `${t.toFixed(1)}°<span class="src">${c ? (c.source === 'hardware' ? 'robot' : 'sim') : '—'}</span>`);
        b.onclick = () => { board = bd; render(); }; rowB.append(b);
      }
    }
    function render() {
      chips(); const c = M.pen.find(x => x.shape === shape && x.board === board);
      body.innerHTML = '';
      const left = h('div'), right = h('div', 'nums'); body.append(left, right);
      if (!c) { left.append(h('div', 'media pending', '<div><b>not run</b>this shape on this board</div>')); return; }
      if (c.video) left.append(h('div', 'media', `<video controls muted playsinline preload="metadata" poster="${c.poster || ''}" src="${c.video}"></video>`));
      else left.append(h('div', 'media pending', `<div><b>${c.shape} · ${c.tilt.toFixed(1)}° · ${c.source === 'hardware' ? 'real robot' : 'simulation'}</b>film after the final runs</div>`));
      left.append(h('p', 'cap', (c.scene ? `<button class="b3d" data-scene="${c.scene}">Inspect in 3D</button> ` : '') + `${c.board_label}, tilt ${c.tilt.toFixed(2)}° · <span class="badge ${c.source === 'hardware' ? 'hw' : ''}">${c.source === 'hardware' ? 'real robot' : 'simulation'}</span> · n = ${c.ipcr.shift_mm.n} + ${c.np.shift_mm.n} · <span class="mute">${c.status}</span>`));
      const ratio = c.np.pred_mm ? c.np.shift_mm.mean / c.np.pred_mm.mean : (c.np.pred_ratio ? c.np.pred_ratio.reduce((a, b) => a + b, 0) / c.np.pred_ratio.length : null);
      right.append(h('div', 'num ipcr', `<div class="d">IPCR (joint sensing only)</div><div class="v">${f(c.ipcr.shift_mm.mean, 2)} <small>mm</small></div><div class="d">figure shift, runs ${f(c.ipcr.shift_mm.min, 2)}–${f(c.ipcr.shift_mm.max, 2)}</div>`));
      right.append(h('div', 'num np', `<div class="d">nearest point (true normal)</div><div class="v">${f(c.np.shift_mm.mean, 1)} <small>mm</small></div><div class="d">figure shift${ratio ? `, ${ratio.toFixed(2)} of the prediction` : ''}</div>`));
      right.append(h('div', 'num plain', `<div class="d">ratio</div><div class="v">${(c.np.shift_mm.mean / c.ipcr.shift_mm.mean).toFixed(0)}×</div><div class="d">nearest point / IPCR</div>`));
    }
    render();
  }

  function absorption(M) {
    const a = M.absorption, root = document.getElementById('absorption'); if (!root || !a) return;
    root.append(h('div', 'num np', `<div class="d">task-aware target, absorb along the normal</div><div class="v">${f(a.normal_leak_mm, 2)} <small>mm</small></div><div class="d">leak under a 10 mm surface offset, ${f(a.ratio, 2)} of the prediction ${f(a.normal_pred_mm, 2)} mm, ${f(a.angle_deg, 1)}° off</div>`));
    root.append(h('div', 'num ipcr', `<div class="d">IPCR, absorb along \\(\\mathcal{D}\\)</div><div class="v">${f(a.ipcr_leak_mm, 3)} <small>mm</small></div><div class="d">same offset, same board</div>`));
    root.append(h('div', 'num plain', `<div class="d">real robot, board ${a.tilt.toFixed(1)}°</div><div class="v" style="font-size:1.05rem;line-height:1.4">the structure of prior drawing systems leaks exactly as predicted</div><div class="d">3 rounds of 4 cells, all valid</div>`));
  }

  function boxGallery(M) {
    const root = document.getElementById('box-gallery'); if (!root) return;
    const lab = { S: '200 × 150 × 100 mm', M: '250 × 200 × 150 mm', L: '300 × 250 × 200 mm' };
    for (const c of M.box) {
      const d = h('div', 'boxcell'); d.innerHTML = `<b>box ${c.box}</b> <span class="mute small">${lab[c.box] || ''}</span><div class="small mute">${c.obstacle}</div>
        <div class="t"><span style="background:var(--ipcr-soft);color:var(--ipcr)">U-fixed</span><span style="background:var(--uy-soft);color:var(--uy)">U-yaw</span><span style="background:var(--np-soft);color:var(--np)">nearest</span></div>
        <div class="small" style="margin-top:8px;color:var(--faint)">${c.status}</div>`;
      root.append(d);
    }
  }

  function hwTable(M) {
    const tb = document.querySelector('#hw-table tbody'); if (!tb) return;
    for (const c of M.pen.filter(x => x.source === 'hardware').sort((a, b) => a.tilt - b.tilt)) {
      const tr = h('tr'); tr.innerHTML = `<td>${c.board_label}</td><td class="n">${c.tilt.toFixed(2)}°</td><td class="n" style="color:var(--ipcr);font-weight:700">${f(c.ipcr.shift_mm.mean, 2)} mm</td>
        <td class="n" style="color:var(--np);font-weight:700">${f(c.np.shift_mm.mean, 1)} mm</td><td class="n">${f(c.np.shift_mm.mean / c.np.pred_mm.mean, 2)}</td>`;
      tb.append(tr);
    }
  }

  function predChart(M) {
    const root = document.getElementById('pred-chart'); if (!root) return;
    const pts = M.pen.filter(c => c.source === 'hardware' && c.np.pred_mm);
    const W = 640, H = 250, l = 56, r = W - 20, t = 18, b = H - 44, max = 30, X = v => l + v / max * (r - l), Y = v => b - v / max * (b - t);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}` }, root);
    for (const v of [0, 5, 10, 15, 20, 25, 30]) { el('line', { x1: X(v), y1: t, x2: X(v), y2: b, stroke: C.grid }, svg); el('line', { x1: l, y1: Y(v), x2: r, y2: Y(v), stroke: C.grid }, svg); tx(svg, X(v), b + 18, v, { 'text-anchor': 'middle', fill: '#8b939e', 'font-size': 11 }); tx(svg, l - 8, Y(v) + 4, v, { 'text-anchor': 'end', fill: '#8b939e', 'font-size': 11 }); }
    el('line', { x1: X(0), y1: Y(0), x2: X(max), y2: Y(max), stroke: C.ref, 'stroke-dasharray': '5 4' }, svg);
    tx(svg, (l + r) / 2, H - 6, 'predicted shift (mm)', { 'text-anchor': 'middle', fill: C.mute, 'font-size': 12 });
    tx(svg, 14, (t + b) / 2, 'measured shift (mm)', { 'text-anchor': 'middle', fill: C.mute, 'font-size': 12, transform: `rotate(-90 14 ${(t + b) / 2})` });
    for (const c of pts) {
      el('rect', { x: X(c.np.pred_mm.mean) - 6, y: Y(c.np.shift_mm.mean) - 6, width: 12, height: 12, fill: C.np, rx: 2 }, svg);
      tx(svg, X(c.np.pred_mm.mean) + 10, Y(c.np.shift_mm.mean) + 4, `${c.tilt.toFixed(1)}°`, { fill: C.np, 'font-size': 11.5, 'font-weight': 600 });
      el('circle', { cx: X(0), cy: Y(c.ipcr.shift_mm.mean), r: 6, fill: C.ipcr, opacity: .85 }, svg);
    }
    tx(svg, X(0) + 10, Y(0.4) - 8, 'IPCR (predicted 0)', { fill: C.ipcr, 'font-size': 11.5, 'font-weight': 600 });
  }

  targetWidget(document.getElementById('w-target')); toc();
  fetch('assets/data/manifest.json').then(r => r.json()).then(M => {
    bignums(M); strip(M); penGallery(M); absorption(M); boxGallery(M); hwTable(M); predChart(M);
    if (window.renderMathInElement) renderMathInElement(document.getElementById('absorption'), { delimiters: [{ left: '\\(', right: '\\)', display: false }] });
  }).catch(e => console.error('manifest', e));
})();
