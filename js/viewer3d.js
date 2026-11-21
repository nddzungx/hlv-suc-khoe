// ===== MÔ HÌNH NGƯỜI 3D: chuyển động theo khung hình, xoay 360°, tô sáng nhóm cơ =====
import * as THREE from './lib/three.module.min.js';

const D2R = Math.PI / 180;
const COL = { body: 0xdfe5ec, muscle: 0xc3ccd6, prim: 0xe5484d, sec: 0xf5a524, joint: 0xcfd6de, dark: 0x334155 };
let V = null; // một renderer dùng chung cho cả app (tránh vượt giới hạn WebGL trên iPhone)

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
}

function mat(color, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.02, ...extra }); }
function capsule(r, len, m) { const g = new THREE.CapsuleGeometry(r, len, 6, 14); return new THREE.Mesh(g, m); }
function ell(sx, sy, sz, m) { const me = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), m); me.scale.set(sx, sy, sz); return me; }
function grp(parent, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
function eff(parent, x, y, z) { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; }

function buildModel() {
  const body = mat(COL.body), joint = mat(COL.joint);
  const M = {}; const muscles = {}; const mm = {};
  const mmat = id => mm[id] || (mm[id] = mat(COL.muscle));
  const addM = (id, parent, mesh) => { mesh.material = mmat(id); mesh.userData.muscle = id; parent.add(mesh); (muscles[id] = muscles[id] || []).push(mesh); return mesh; };
  const root = new THREE.Group(); M.root = root;
  root.add(ell(0.165, 0.11, 0.115, body));
  M.spine = grp(root, 0, 0.06, 0);
  const abd = capsule(0.12, 0.12, body); abd.position.y = 0.11; abd.scale.z = 0.78; M.spine.add(abd);
  M.chest = grp(M.spine, 0, 0.24, 0);
  const ch = ell(0.185, 0.17, 0.12, body); ch.position.y = 0.12; M.chest.add(ch);
  M.neck = grp(M.chest, 0, 0.27, 0);
  const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.055, 0.1, 12), body); nk.position.y = 0.04; M.neck.add(nk);
  const head = ell(0.1, 0.12, 0.11, body); head.position.y = 0.16; M.neck.add(head);
  const eyeM = mat(COL.dark);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), eyeM); e.position.set(0.035 * s, 0.18, 0.095); M.neck.add(e); }
  const hair = ell(0.105, 0.075, 0.115, mat(0x3b3f46)); hair.position.set(0, 0.215, -0.012); M.neck.add(hair);
  M.fx = {};
  const E = {}; // điểm tiếp đất
  E.headTop = eff(M.neck, 0, 0.29, 0); E.headBack = eff(M.neck, 0, 0.17, -0.11); E.face = eff(M.neck, 0, 0.16, 0.11);
  E.chestBack = eff(M.chest, 0, 0.12, -0.12); E.chestBack2 = eff(M.chest, 0, 0.22, -0.1); E.pelvisBack = eff(root, 0, -0.03, -0.12); E.pelvisLow = eff(root, 0, -0.1, -0.06);
  // cơ thân
  for (const s of [-1, 1]) {
    addM('chest', M.chest, ell(0.085, 0.06, 0.035)).position.set(0.075 * s, 0.17, 0.095);
    addM('lats', M.chest, ell(0.06, 0.13, 0.03)).position.set(0.105 * s, 0.07, -0.075);
    addM('obliques', M.spine, ell(0.03, 0.095, 0.065)).position.set(0.112 * s, 0.11, 0.015);
    addM('glutes', root, ell(0.078, 0.085, 0.055)).position.set(0.075 * s, -0.035, -0.085);
  }
  addM('abs', M.spine, ell(0.075, 0.13, 0.03)).position.set(0, 0.11, 0.083);
  addM('pelvic', root, ell(0.085, 0.035, 0.075)).position.set(0, -0.092, -0.005);
  addM('lowerback', M.spine, ell(0.075, 0.1, 0.028)).position.set(0, 0.1, -0.083);
  addM('traps', M.chest, ell(0.12, 0.065, 0.045)).position.set(0, 0.235, -0.05);
  // tay chân
  for (const [sd, s] of [['l', 1], ['r', -1]]) {
    const sh = grp(M.chest, 0.205 * s, 0.215, 0); M[sd + 'sh'] = sh;
    addM('delts', sh, ell(0.062, 0.07, 0.065)).position.set(0.012 * s, -0.02, 0);
    const ua = capsule(0.045, 0.2, body); ua.position.y = -0.145; sh.add(ua);
    addM('biceps', sh, ell(0.035, 0.09, 0.03)).position.set(0, -0.14, 0.033);
    addM('triceps', sh, ell(0.037, 0.1, 0.032)).position.set(0, -0.13, -0.033);
    const el = grp(sh, 0, -0.29, 0); M[sd + 'el'] = el;
    el.add(new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), joint));
    addM('forearms', el, capsule(0.041, 0.17, null)).position.y = -0.12;
    const hand = ell(0.04, 0.055, 0.025, body); hand.position.y = -0.27; el.add(hand);
    E[sd + 'hand'] = eff(el, 0, -0.31, 0); E[sd + 'elbow'] = eff(el, 0, 0, -0.04); E[sd + 'elbow2'] = eff(el, 0, -0.04, 0);
    const db = grp(el, 0, -0.27, 0); M[sd + 'db'] = db; db.visible = false;
    const dbm = mat(0x374151);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.16, 8), dbm); bar.rotation.z = Math.PI / 2; db.add(bar);
    for (const k of [-1, 1]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 14), mat(0x111827)); pl.rotation.z = Math.PI / 2; pl.position.x = 0.07 * k; db.add(pl); }
    E[sd + 'shoulder'] = eff(sh, 0.05 * s, 0, 0);
    if (sd === 'r') {
      const rk = grp(el, 0, -0.29, 0); M.racket = rk; rk.visible = false;
      const rm = mat(0x1f2937), hm = mat(0x0f8a5f);
      const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.3, 8), hm); hd.position.y = -0.15; rk.add(hd);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.009, 8, 28), rm); ring.position.y = -0.4; ring.scale.y = 1.25; rk.add(ring);
      const net = new THREE.Mesh(new THREE.CircleGeometry(0.095, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); net.position.y = -0.4; net.scale.y = 1.25; rk.add(net);
    }
    // chân
    const hip = grp(root, 0.092 * s, -0.05, 0); M[sd + 'hip'] = hip;
    const th = capsule(0.072, 0.29, body); th.position.y = -0.215; hip.add(th);
    addM('quads', hip, ell(0.06, 0.16, 0.042)).position.set(0, -0.21, 0.042);
    addM('hamstrings', hip, ell(0.058, 0.15, 0.04)).position.set(0, -0.22, -0.042);
    const kn = grp(hip, 0, -0.43, 0); M[sd + 'kn'] = kn;
    kn.add(new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), joint));
    const sn = capsule(0.054, 0.31, body); sn.position.y = -0.215; kn.add(sn);
    addM('calves', kn, ell(0.047, 0.11, 0.038)).position.set(0, -0.13, -0.038);
    E[sd + 'knee'] = eff(kn, 0, 0, 0.055); E[sd + 'knee2'] = eff(kn, 0, -0.03, 0.04);
    const an = grp(kn, 0, -0.43, 0); M[sd + 'an'] = an;
    const ft = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.06, 0.23), body); ft.position.set(0, -0.035, 0.055); an.add(ft);
    E[sd + 'heel'] = eff(an, 0, -0.065, -0.055); E[sd + 'toe'] = eff(an, 0, -0.065, 0.165); E[sd + 'toeTip'] = eff(an, 0, -0.01, 0.17);
    E[sd + 'footOut'] = eff(an, 0.045 * s, -0.04, 0.05); E[sd + 'ankle'] = eff(an, 0, 0, 0);
  }
  M.E = E; M.muscles = muscles; M.mm = mm;
  return M;
}

function makeProps(scene) {
  const P = {};
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4, 48), new THREE.MeshStandardMaterial({ color: 0xe9eef3, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor); P.floor = floor;
  const grid = new THREE.GridHelper(8, 16, 0xcfd8e2, 0xdbe2ea); grid.position.y = 0.001; scene.add(grid); P.grid = grid;
  // bóng mềm
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,0.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.003; scene.add(sh); P.shadow = sh;
  P.mat = new THREE.Mesh(new THREE.BoxGeometry(1, 0.012, 1), mat(0x2f9e73)); P.mat.position.y = 0.006; scene.add(P.mat);
  P.wall = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 0.06), mat(0xf3e9dc)); scene.add(P.wall);
  const chair = new THREE.Group(), wood = mat(0x9a6b45);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.4), wood); seat.position.y = -0.02; chair.add(seat);
  for (const x of [-0.18, 0.18]) for (const z of [-0.17, 0.17]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1, 0.035), wood); l.position.set(x, -0.5, z); chair.add(l); }
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.03), wood); back.position.set(0, 0.23, -0.19); chair.add(back);
  chair.userData.legs = chair.children.slice(1, 5); scene.add(chair); P.chair = chair;
  // xà đơn
  const bar = new THREE.Group(), steel = mat(0x9ca3af, { metalness: 0.6, roughness: 0.35 });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.3, 12), steel); rod.rotation.z = Math.PI / 2; bar.add(rod);
  for (const x of [-0.65, 0.65]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1, 0.06), mat(0x6b7280)); post.position.set(x, -0.5, 0); bar.add(post); }
  bar.userData.posts = bar.children.slice(1); scene.add(bar); P.bar = bar;
  // mặt nước
  const water = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ color: 0x3aa7e0, transparent: true, opacity: 0.42, depthWrite: false, roughness: 0.7, metalness: 0 }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.6; scene.add(water); P.water = water;
  // dây kháng lực (2 đoạn) + điểm móc
  P.bands = [0, 1].map(() => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 1, 8), mat(0xf43f5e)); scene.add(b); return b; });
  P.door = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), mat(0x374151)); scene.add(P.door);
  return P;
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa7b4, 1.6));
  const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(2, 4, 3); scene.add(dl);
  const dl2 = new THREE.DirectionalLight(0xdfe8ff, 0.6); dl2.position.set(-3, 2, -2); scene.add(dl2);
  const M = buildModel(); scene.add(M.root);
  const P = makeProps(scene);
  V = { renderer, scene, camera, M, P, theta: 0.55, phi: 0.18, dist: 3.4, target: new THREE.Vector3(0, 0.9, 0), playing: true, speed: 1, t: 0, frames: null, container: null, raf: 0, last: 0, onPick: null, pickMode: false };
  const el = renderer.domElement; el.style.touchAction = 'none'; el.style.display = 'block'; el.style.width = '100%'; el.style.height = '100%';
  // điều khiển: kéo để xoay, chụm/cuộn để phóng
  const pts = new Map(); let down = null, pinch0 = 0, dist0 = 0;
  el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); dist0 = V.dist; } });
  el.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); V.dist = THREE.MathUtils.clamp(dist0 * pinch0 / d, 1.4, 7); }
    else { const dx = e.clientX - prev[0], dy = e.clientY - prev[1]; V.theta -= dx * 0.01; V.phi = THREE.MathUtils.clamp(V.phi + dy * 0.008, -0.2, 1.35); if (down) down.moved += Math.abs(dx) + Math.abs(dy); }
  });
  const up = e => {
    pts.delete(e.pointerId);
    if (down && down.moved < 6 && performance.now() - down.t < 400 && V.onPick) pick(e);
    down = null;
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', e => { pts.delete(e.pointerId); down = null; });
  el.addEventListener('wheel', e => { e.preventDefault(); V.dist = THREE.MathUtils.clamp(V.dist * (1 + Math.sign(e.deltaY) * 0.08), 1.4, 7); }, { passive: false });
  V.ro = new ResizeObserver(() => resize());
  document.addEventListener('visibilitychange', () => { if (!document.hidden && V.container) loop(); });
}
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(e) {
  const r = V.renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, V.camera);
  const all = Object.values(V.M.muscles).flat();
  const hit = ray.intersectObjects(all, false)[0];
  if (hit) V.onPick(hit.object.userData.muscle);
}
function resize() {
  if (!V || !V.container) return;
  const w = V.container.clientWidth || 300, h = V.container.clientHeight || 300;
  V.renderer.setSize(w, h, false); V.camera.aspect = w / h; V.camera.updateProjectionMatrix();
}

// ---------- tư thế ----------
const SIDES = ['l', 'r'];
function resolve(frames, flatDefault) {
  return frames.map(f => {
    const p = { P: 0, R: 0, Y: 0, sp: 0, nf: 0, tw: 0, ...f.p };
    for (const s of SIDES) {
      for (const k of ['hf', 'ha', 'kf', 'sf', 'sa', 'sy', 'ef']) p[s + k] = p[s + k] || 0;
      if (p[s + 'af'] == null) p[s + 'af'] = flatDefault ? -(p.P - p[s + 'hf'] + p[s + 'kf']) : 0;
    }
    return { p, d: f.d != null ? f.d : 0, h: f.h || 0 };
  });
}
function applyPose(p) {
  const M = V.M;
  M.root.rotation.set(p.P * D2R, p.Y * D2R, p.R * D2R);
  M.spine.rotation.set(p.sp * D2R, p.tw * D2R, 0); M.neck.rotation.x = p.nf * D2R;
  M.lhip.rotation.set(-p.lhf * D2R, 0, p.lha * D2R); M.rhip.rotation.set(-p.rhf * D2R, 0, -p.rha * D2R);
  M.lkn.rotation.x = p.lkf * D2R; M.rkn.rotation.x = p.rkf * D2R;
  M.lan.rotation.x = p.laf * D2R; M.ran.rotation.x = p.raf * D2R;
  M.lsh.rotation.set(-p.lsf * D2R, -p.lsy * D2R, p.lsa * D2R); M.rsh.rotation.set(-p.rsf * D2R, p.rsy * D2R, -p.rsa * D2R);
  M.lel.rotation.x = -p.lef * D2R; M.rel.rotation.x = -p.ref * D2R;
}
const tv = new THREE.Vector3(), tv2 = new THREE.Vector3();
function anchorPoint(kind) {
  const E = V.M.E;
  if (kind === 'feet') { E.lankle.getWorldPosition(tv); E.rankle.getWorldPosition(tv2); return tv.add(tv2).multiplyScalar(0.5).clone(); }
  if (kind === 'lfoot') return E.lankle.getWorldPosition(new THREE.Vector3());
  if (kind === 'hands') { E.lhand.getWorldPosition(tv); E.rhand.getWorldPosition(tv2); return tv.add(tv2).multiplyScalar(0.5).clone(); }
  return null;
}
function ground(anchor, ref) {
  const root = V.M.root; root.position.set(0, 0, 0); root.updateMatrixWorld(true);
  if (anchor === 'float') { root.position.set(0, 0.52, 0); root.updateMatrixWorld(true); return null; }
  if (anchor === 'bar') { const h = anchorPoint('hands'); if (ref) root.position.set(ref.x - h.x, ref.y - h.y, ref.z - h.z); root.updateMatrixWorld(true); return h; }
  let minY = Infinity; for (const o of Object.values(V.M.E)) { o.getWorldPosition(tv); if (tv.y < minY) minY = tv.y; }
  const a = anchorPoint(anchor);
  root.position.set(a && ref ? ref.x - a.x : 0, -minY, a && ref ? ref.z - a.z : 0);
  root.updateMatrixWorld(true);
  return a;
}
const ease = t => 0.5 - 0.5 * Math.cos(Math.PI * t);
function poseAt(t) {
  const F = V.frames; const total = V.total;
  t = ((t % total) + total) % total;
  let acc = 0;
  for (let i = 0; i < F.length; i++) {
    const f = F[i], prev = F[(i - 1 + F.length) % F.length];
    if (t < acc + f.d) return lerp(prev.p, f.p, ease((t - acc) / f.d));
    acc += f.d;
    if (t < acc + f.h) return f.p;
    acc += f.h;
  }
  return F[F.length - 1].p;
}
function lerp(a, b, k) { const o = {}; for (const key in a) o[key] = a[key] + (b[key] - a[key]) * k; return o; }

function bbox() {
  const b = new THREE.Box3(); for (const o of Object.values(V.M.E)) { o.getWorldPosition(tv); b.expandByPoint(tv); } return b;
}

// ---------- API ----------
export const viewer = {
  mount(container, opts = {}) {
    if (!webglOK()) { container.innerHTML = '<div class="v3d-fallback">Thiết bị không hỗ trợ 3D (WebGL). Hãy làm theo hướng dẫn chi tiết bên dưới.</div>'; return false; }
    if (!V) init();
    if (V.container && V.container !== container) V.ro.unobserve(V.container);
    V.container = container; container.prepend(V.renderer.domElement); V.ro.observe(container); resize();
    V.onPick = opts.onPick || null;
    this.set(opts.exercise || null, opts);
    loop();
    return true;
  },
  set(ex, opts = {}) {
    if (!V) return;
    const same = opts.keepView && V.ex === ex; const cam = same && { theta: V.theta, phi: V.phi, dist: V.dist };
    V.ex = ex; V.t = 0; V.playing = opts.autoplay !== false;
    const flat = !ex || ex.flat !== false;
    V.frames = resolve(ex ? ex.frames : [{ p: { lsa: 10, rsa: 10 }, h: 1 }], flat);
    V.total = V.frames.reduce((s, f) => s + f.d + f.h, 0) || 1;
    V.anchor = ex ? (ex.anchor || 'feet') : 'none';
    const M = V.M, P = V.P, props = (ex && ex.props) || [];
    // điểm neo chuẩn ở khung hình đầu
    applyPose(V.frames[0].p); M.root.position.set(0, 0, 0); M.root.updateMatrixWorld(true);
    if (V.anchor === 'bar') { let minY = Infinity; for (const o of Object.values(M.E)) { o.getWorldPosition(tv); minY = Math.min(minY, tv.y); } V.ref = anchorPoint('hands'); V.ref.y = V.ref.y - minY + 0.12; }
    else { V.ref = anchorPoint(V.anchor); if (V.ref) V.ref.y = 0; }
    ground(V.anchor, V.ref);
    // khung nhìn: hộp bao của mọi khung hình
    const box = new THREE.Box3();
    for (const f of V.frames) { applyPose(f.p); ground(V.anchor, V.ref); box.union(bbox()); }
    applyPose(V.frames[0].p); ground(V.anchor, V.ref);
    const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    V.target.copy(c); V.target.y = Math.max(0.35, c.y);
    V.fitDist = THREE.MathUtils.clamp(Math.max(sz.y * 1.55, sz.z * 1.35, sz.x * 1.35) + 0.8, 2.0, 5.0); V.dist = V.fitDist;
    if (opts.view) this.view(opts.view); else {
      const bent = V.frames.some(f => Math.abs(f.p.P) > 20);
      V.theta = props.includes('wall') || props.includes('wallBack') ? Math.PI / 2 : sz.x > sz.z * 1.3 && sz.x > 1 ? 0.25 : (props.includes('mat') || sz.z > 1.1 || bent) ? 1.15 : 0.5; V.phi = 0.2;
    }
    // đạo cụ
    M.ldb.visible = M.rdb.visible = props.includes('db');
    P.mat.visible = props.includes('mat');
    if (P.mat.visible) { P.mat.scale.set(Math.max(0.7, sz.x + 0.3), 1, Math.max(0.7, sz.z + 0.35)); P.mat.position.set(c.x, 0.006, c.z); }
    P.wall.visible = props.includes('wall') || props.includes('wallBack');
    const E = M.E;
    if (props.includes('wall')) { E.lhand.getWorldPosition(tv); P.wall.position.set(c.x, 1.2, tv.z + 0.075); }
    if (props.includes('wallBack')) { let mz = Infinity; for (const k of ['chestBack', 'chestBack2', 'pelvisBack', 'headBack']) { E[k].getWorldPosition(tv); mz = Math.min(mz, tv.z); } P.wall.position.set(c.x, 1.2, mz - 0.035); }
    M.racket.visible = props.includes('racket');
    P.water.visible = props.includes('water'); P.grid.visible = !P.water.visible; P.shadow.visible = !P.water.visible && V.anchor !== 'bar';
    if (P.water.visible && !opts.view && !cam) V.phi = 0.5;
    P.bar.visible = props.includes('bar');
    if (P.bar.visible) { P.bar.position.set(V.ref.x, V.ref.y + 0.01, V.ref.z); for (const q of P.bar.userData.posts) { q.scale.y = V.ref.y; q.position.y = -V.ref.y / 2; } }
    V.band = props.includes('band') ? (ex.band || 'hands') : null;
    for (const b of P.bands) b.visible = !!V.band; P.door.visible = V.band === 'anchor';
    if (V.band === 'anchor') { const h = anchorPoint('hands'); V.bandAnchor = new THREE.Vector3(h.x, h.y, h.z + 0.9); P.door.position.copy(V.bandAnchor); }
    P.chair.visible = props.includes('chair');
    if (P.chair.visible) {
      const fi = Math.min(1, V.frames.length - 1); applyPose(V.frames[fi].p); ground(V.anchor, V.ref);
      E.pelvisLow.getWorldPosition(tv); const seatY = tv.y - 0.005; M.root.getWorldPosition(tv2);
      P.chair.position.set(tv2.x, seatY, tv2.z - 0.04);
      for (const l of P.chair.userData.legs) { l.scale.y = seatY; l.position.y = -seatY / 2; }
      applyPose(V.frames[0].p); ground(V.anchor, V.ref);
    }
    if (cam) Object.assign(V, cam);
    if (opts.highlight) this.highlight(opts.highlight[0], opts.highlight[1]); else this.highlight(ex ? ex.primary : [], ex ? ex.secondary : []);
  },
  highlight(prim = [], sec = []) {
    if (!V) return;
    for (const [id, m] of Object.entries(V.M.mm)) {
      const c = prim.includes(id) ? COL.prim : sec.includes(id) ? COL.sec : COL.muscle;
      m.color.setHex(c); m.emissive.setHex(prim.includes(id) ? 0x3a0808 : 0x000000);
    }
  },
  view(name) {
    if (!V) return;
    V.theta = { front: 0, side: Math.PI / 2, back: Math.PI, three: 0.6 }[name] ?? 0.6; V.phi = 0.12; V.dist = V.fitDist || 3.4;
  },
  play(on) { if (V) V.playing = on == null ? !V.playing : on; return V && V.playing; },
  setSpeed(s) { if (V) V.speed = s; },
  seekFrame(i) { if (!V) return; let acc = 0; for (let k = 0; k <= i && k < V.frames.length; k++) acc += V.frames[k].d + (k < i ? V.frames[k].h : 0); V.t = acc + 0.001; },
  unmount() { if (!V) return; cancelAnimationFrame(V.raf); if (V.container) V.ro.unobserve(V.container); V.renderer.domElement.remove(); V.container = null; },
  _dbg() { const o = {}; for (const k of ['lhand', 'rhand', 'lshoulder', 'rshoulder']) { const v = V.M.E[k].getWorldPosition(new THREE.Vector3()); o[k] = [v.x, v.y, v.z].map(x => +x.toFixed(2)); } o.t = V.t; o.ref = V.frames.map(f => f.p.ref); return o; },
  get playing() { return V && V.playing; },
};
function renderOnce() {
  applyPose(poseAt(V.t)); ground(V.anchor, V.ref);
  const rp = V.M.root.position; V.P.shadow.position.set(rp.x, 0.003, rp.z); V.P.shadow.scale.set(0.9, 1.2, 1);
  if (V.band) {
    const E = V.M.E, pairs = V.band === 'hands' ? [['lhand', 'rhand']] : V.band === 'knees' ? [['lknee2', 'rknee2']] : [['lhand', null], ['rhand', null]];
    V.P.bands[1].visible = pairs.length > 1;
    pairs.forEach(([a, b], i) => { const A = E[a].getWorldPosition(new THREE.Vector3()), B = b ? E[b].getWorldPosition(new THREE.Vector3()) : V.bandAnchor.clone(); const m = V.P.bands[i]; const d = B.clone().sub(A); m.position.copy(A).add(B).multiplyScalar(0.5); m.scale.set(1, Math.max(0.01, d.length()), 1); m.quaternion.setFromUnitVectors(UP, d.normalize()); });
  }
  const cp = Math.cos(V.phi);
  V.camera.position.set(V.target.x + V.dist * Math.sin(V.theta) * cp, V.target.y + V.dist * Math.sin(V.phi), V.target.z + V.dist * Math.cos(V.theta) * cp);
  V.camera.lookAt(V.target);
  V.renderer.render(V.scene, V.camera);
}
const UP = new THREE.Vector3(0, 1, 0);
const snapCache = new Map();
export function snapshot(ex, fi = 1, w = 200, h = 200) {
  const key = ex.id + ':' + fi; if (snapCache.has(key)) return snapCache.get(key);
  if (!webglOK()) return null;
  if (!V) init();
  if (V.container) return null; // đang hiển thị 3D ở nơi khác
  V.renderer.setSize(w, h, false); V.camera.aspect = w / h; V.camera.updateProjectionMatrix();
  viewer.set(ex, { autoplay: false }); viewer.seekFrame(Math.min(fi, ex.frames.length - 1)); V.dist *= 0.92;
  const gv = V.P.grid.visible; V.P.grid.visible = false; renderOnce(); V.P.grid.visible = gv;
  const url = V.renderer.domElement.toDataURL('image/png'); snapCache.set(key, url); return url;
}
function loop() {
  if (!V) return; cancelAnimationFrame(V.raf);
  V.last = performance.now();
  const tick = now => {
    if (!V.container || !V.container.isConnected) { V.container = null; return; }
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - V.last) / 1000); V.last = now;
    if (V.playing) V.t += dt * V.speed;
    renderOnce();
    V.raf = requestAnimationFrame(tick);
  };
  V.raf = requestAnimationFrame(tick);
}
