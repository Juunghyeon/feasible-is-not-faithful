// "Inspect in 3D": an in-browser replay of an exported scene (project_site/prep/export_scene.py). Every pose is a logged joint
// configuration; forward kinematics through the URDF chain here. Two arms side by side, one shared camera and time line.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const COL = { NP: '#d55e00', IPCR: '#0072b2', UY: '#009e73', ref: '#8a8f96' };
const NAME = { NP: 'Nearest point · true normal', IPCR: 'IPCR (ours) · joint sensing only', UY: 'IPCR · yaw free' };
let meshes = null;

async function loadMeshes(root, names) {
  if (meshes) return meshes;
  const L = new GLTFLoader(); meshes = {};
  await Promise.all(names.map(n => new Promise((res, rej) => L.load(`${root}mesh/${n.replace('.STL', '.glb')}`, g => {
    let geo = null; g.scene.traverse(o => { if (o.isMesh && !geo) geo = o.geometry; }); geo.computeVertexNormals(); meshes[n] = geo; res();
  }, undefined, rej))));
  return meshes;
}
const setT = (o, T) => { o.position.set(T[0], T[1], T[2]); o.quaternion.set(T[3], T[4], T[5], T[6]); };
const mat = {
  clay: new THREE.MeshStandardMaterial({ color: 0xc8ccd2, roughness: .55, metalness: .05 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: .5 }),
  pen: new THREE.MeshStandardMaterial({ color: 0x28282a, roughness: .4 }),
  board: new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: .95 }),
};

function buildArm(S, M) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b4aa, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(.6, -.5, 1.5); scene.add(key);
  const grid = new THREE.GridHelper(2, 40, 0xd8d8d4, 0xe8e8e4); grid.rotation.x = Math.PI / 2; grid.position.set(0, .4, .045); scene.add(grid);
  const rots = [scene];
  for (const j of S.joints) { const f = new THREE.Object3D(); setT(f, j.T); const r = new THREE.Object3D(); f.add(r); rots[j.parent].add(f); rots.push(r); }
  for (const g of S.geoms) {
    if (!g.mesh || !M[g.mesh]) continue;
    const m = new THREE.Mesh(M[g.mesh], /Link6|bracket/.test(g.mesh) ? mat.dark : mat.clay); setT(m, g.T); m.scale.set(...g.scale); rots[g.joint].add(m);
  }
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(.004, .004, 1, 16).rotateX(Math.PI / 2).translate(0, 0, .5), mat.pen); scene.add(pen);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.0035, 16, 12), mat.pen); scene.add(tip);
  // board: measured plane, cropped around the figure
  const p = new THREE.Vector3(...S.board.p), n = new THREE.Vector3(...S.board.n_out).normalize();
  const u = new THREE.Vector3(0, 0, 1).cross(n).normalize(), v = n.clone().cross(u);
  const ref = Object.values(S.runs)[0].ref, c = new THREE.Vector3(); ref.forEach(r => c.add(new THREE.Vector3(...r))); c.multiplyScalar(1 / ref.length);
  const ey = new THREE.Vector3(0, 1, 0), onB = (x, along, lift) => { const q = new THREE.Vector3(...x); const d = q.clone().sub(p).dot(n); const a = along || n; return q.sub(a.clone().multiplyScalar(d / a.dot(n))).add(n.clone().multiplyScalar(lift)); };
  const cB = onB([c.x, c.y, c.z], ey, 0);
  const b = new THREE.Mesh(new THREE.BoxGeometry(.30, .24, .012), mat.board);
  b.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(u, v, n)); b.position.copy(cB).add(n.clone().multiplyScalar(-.006)); scene.add(b);
  return { scene, rots, pen, tip, onB, ey };
}

function trail(points, on, color, width, dashed) {
  const pos = [], cum = new Int32Array(points.length); let k = 0;
  for (let i = 1; i < points.length; i++) { if (on[i] && on[i - 1]) { pos.push(...points[i - 1], ...points[i]); k++; } cum[i] = k; }
  const g = new LineSegmentsGeometry(); g.setPositions(pos.length ? pos : [0, 0, 0, 0, 0, 0]);
  const m = new LineMaterial({ color, linewidth: width, dashed: !!dashed, dashSize: .004, gapSize: .003 });
  const o = new LineSegments2(g, m); o.computeLineDistances(); g.instanceCount = 0;
  return { o, m, set(i) { g.instanceCount = pos.length ? cum[i] : 0; } };
}

export async function openViewer(url, root = 'assets/') {
  const S = await fetch(url).then(r => r.json());
  const ORDER = ['NP', 'IPCR', 'UY']; const arms = Object.keys(S.runs).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  const M = await loadMeshes(root, [...new Set(S.geoms.filter(g => g.mesh).map(g => g.mesh))]);
  const wrap = document.createElement('div'); wrap.className = 'v3d';
  wrap.innerHTML = `<div class="v3d-box"><div class="v3d-head"><b>Inspect in 3D</b><span>${S.model.replace(/_/g, ' ')} · logged joint angles · drag to orbit, scroll to zoom</span><button class="v3d-x" aria-label="close">✕</button></div>
    <div class="v3d-stage"><canvas></canvas><div class="v3d-panels">${arms.map(a => `<div class="v3d-p" data-a="${a}"><span style="color:${COL[a]}">${NAME[a] || a}</span></div>`).join('')}</div></div>
    <div class="v3d-bar"><button class="v3d-play">Pause</button><input type="range" class="v3d-t"><span class="v3d-clock"></span>
    <button data-s="5">5×</button><button data-s="10" class="on">10×</button><button data-s="20">20×</button></div></div>`;
  document.body.append(wrap);
  const cv = wrap.querySelector('canvas'), R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); R.setPixelRatio(Math.min(devicePixelRatio, 2));
  const cam = new THREE.PerspectiveCamera(30, 1, .01, 10); cam.up.set(0, 0, 1); cam.position.set(.62, .18, .74);
  const ctl = new OrbitControls(cam, wrap.querySelector('.v3d-stage')); ctl.target.set(-.17, .7, .44); ctl.enableDamping = true; ctl.update();
  const V = arms.map(a => {
    const r = S.runs[a], A = buildArm(S, M);
    const ink = trail(r.tip.map(x => A.onB(x, null, .0007).toArray()), r.ink, COL[a] || '#333', 3.2); A.scene.add(ink.o);
    const ref = r.ref.map(x => A.onB(x, A.ey, .0009).toArray()), on = r.t.map((t, i) => r.t_log[i] >= r.Eb[3] && r.t_log[i] < r.Eb[6]);
    const rf = trail(ref, on, COL.ref, 1.4, true); rf.set(ref.length - 1); A.scene.add(rf.o);
    return { a, r, A, ink, mats: [ink.m, rf.m], panel: wrap.querySelector(`.v3d-p[data-a="${a}"]`) };
  });
  const r0 = V[0].r, t0 = r0.t_log[0], t1 = r0.t_log[r0.t_log.length - 1];
  let t = Math.max(t0, r0.Eb[3] - 2), speed = 10, play = true, last = performance.now(), live = true;
  const sl = wrap.querySelector('.v3d-t'); sl.min = t0; sl.max = t1; sl.step = .05; sl.oninput = () => { t = +sl.value; };
  wrap.querySelector('.v3d-play').onclick = e => { play = !play; e.target.textContent = play ? 'Pause' : 'Play'; };
  wrap.querySelectorAll('[data-s]').forEach(bn => bn.onclick = () => { speed = +bn.dataset.s; wrap.querySelectorAll('[data-s]').forEach(x => x.classList.toggle('on', x === bn)); });
  const close = () => { live = false; R.dispose(); wrap.remove(); };
  wrap.querySelector('.v3d-x').onclick = close; wrap.onclick = e => { if (e.target === wrap) close(); };
  const z = new THREE.Vector3();
  function frame(now) {
    if (!live) return;
    const dt = Math.min(.1, (now - last) / 1000); last = now; if (play) { t += dt * speed; if (t > t1) t = Math.max(t0, r0.Eb[3] - 2); }
    sl.value = t; wrap.querySelector('.v3d-clock').textContent = `t = ${(t - r0.Eb[3]).toFixed(1)} s`;
    const W = cv.clientWidth, H = cv.clientHeight; if (cv.width !== Math.floor(W * R.getPixelRatio())) R.setSize(W, H, false);
    R.setScissorTest(false); R.clear(); R.setScissorTest(true); const cr = cv.getBoundingClientRect(); ctl.update();
    for (const v of V) {
      let i = v.r.t_log.findIndex(x => x >= t); if (i < 0) i = v.r.t_log.length - 1;
      for (let j = 0; j < 6; j++) v.A.rots[j + 1].rotation.z = v.r.q[i][j];
      v.A.scene.updateMatrixWorld(true); z.setFromMatrixColumn(v.A.rots[6].matrixWorld, 2).normalize();
      const tp = new THREE.Vector3(...v.r.tip[i]); v.A.tip.position.copy(tp);
      v.A.pen.position.copy(tp.clone().sub(z.clone().multiplyScalar(.105))); v.A.pen.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), z); v.A.pen.scale.set(1, 1, .105);
      v.ink.set(i);
      const pr = v.panel.getBoundingClientRect(), x = pr.left - cr.left, y = cr.bottom - pr.bottom;
      for (const m of v.mats) m.resolution.set(pr.width, pr.height);
      cam.aspect = pr.width / pr.height; cam.updateProjectionMatrix(); R.setViewport(x, y, pr.width, pr.height); R.setScissor(x, y, pr.width, pr.height); R.render(v.A.scene, cam);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
