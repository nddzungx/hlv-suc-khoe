// ===== HLV SỨC KHỎE – giao diện =====
import { EX, EXERCISES, MUSCLES, HABITS, FOODS, FOOD, LESSONS, TIPS, CATS, EQUIP } from './data.js';
import * as E from './engine.js';
import { viewer, snapshot, webglOK } from './viewer3d.js';
import { toLunar, lunarLabel, isVegLunar, VEG_SETS } from './lunar.js';
import * as PHO from './photos.js';

export const VERSION = '1.1.1';
const APP_URL = 'https://nddzungx.github.io/hlv-suc-khoe/', REPO_URL = 'https://github.com/nddzungx/hlv-suc-khoe';
const AUTHOR = 'Nguyễn Đức Dũng', EMAIL = 'nddzungx@gmail.com', BANK = { name: 'NGUYEN DUC DUNG', bank: 'BIDV', acc: '3210256468' };
const KEY = 'hlvsk.v1';
let S = null;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { }
S = S || { profiles: [], active: null, settings: { voice: true, sound: true } };
S.settings = S.settings || { voice: true, sound: true };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Không lưu được dữ liệu – bộ nhớ trình duyệt có thể đã đầy.'); } };
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }

const PH = { pid: null, list: [], ok: true };
async function loadPhotos() { const p = P(); if (!p) return; try { PH.list = await PHO.listPhotos(p.id); PH.pid = p.id; PH.ok = true; } catch (e) { PH.ok = false; PH.list = []; } render(); }
const ui = { phPose: 'front', phMode: 'side', tab: 'today', day: E.today(), exSeg: 'lib', libCat: 'all', libMuscle: '', libMine: true, repKind: 'week', repOff: 0, menuShift: 0, vegToday: false, pages: [], sheet: null, muscleSel: 'abs', foodGroup: 'all' };
let ob = null, pl = null;
const P = () => S.profiles.find(p => p.id === S.active);
const LOG = (d = ui.day) => { const p = P(); p.logs = p.logs || {}; return (p.logs[d] = p.logs[d] || {}); };
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const n0 = x => x == null || isNaN(x) ? '–' : Math.round(x).toLocaleString('vi-VN');
const n1 = x => x == null || isNaN(x) ? '–' : (Math.round(x * 10) / 10).toLocaleString('vi-VN');
const fmtQ = (F, q) => { q = Math.round(q * 10) / 10; const qs = String(q).replace('.', ','); const u = q === 1 ? F.unit : F.unit.replace(/\s*\(.*\)/, ''); return /^1 /.test(u) ? `${qs} ${u.slice(2)}` : `${qs} × ${u}`; };
const fmtT = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const GOALS = {
  lose: { icon: '🔥', name: 'Giảm mỡ, giảm cân', d: 'Giảm cân an toàn, giữ cơ, vòng eo nhỏ lại' },
  muscle: { icon: '💪', name: 'Tăng cơ, săn chắc', d: 'Cơ thể khỏe, rắn chắc, dáng đẹp hơn' },
  gain: { icon: '🍚', name: 'Tăng cân (người gầy)', d: 'Tăng cân lành mạnh bằng cơ, không phải mỡ' },
  health: { icon: '❤️', name: 'Khỏe mạnh, duy trì', d: 'Năng lượng tốt, ngủ ngon, phòng bệnh' },
  endurance: { icon: '🏃', name: 'Tăng sức bền', d: 'Đi bộ, chạy, leo cầu thang không hụt hơi' },
  mobility: { icon: '🧘', name: 'Dẻo dai, giảm đau lưng', d: 'Cho dân văn phòng, người hay đau mỏi' },
};
const HEALTH = { heart: 'Bệnh tim mạch / từng đau ngực khi gắng sức', bp: 'Tăng huyết áp', diabetes: 'Tiểu đường', knee: 'Đau khớp gối', back: 'Đau lưng', shoulder: 'Đau / chấn thương vai', asthma: 'Hen suyễn', dizzy: 'Hay chóng mặt, ngất', injury: 'Mới phẫu thuật / chấn thương gần đây', pregnant: 'Đang mang thai', postpartum: 'Sinh con trong vòng 1 năm' };
const ACTS = { sed: ['🪑', 'Ít vận động', 'Ngồi nhiều, gần như không tập'], light: ['🚶', 'Vận động nhẹ', 'Đi lại nhiều hoặc tập 1–2 buổi/tuần'], mod: ['🚴', 'Vận động vừa', 'Tập 3–5 buổi/tuần hoặc việc chân tay'], high: ['🏋️', 'Vận động nhiều', 'Tập 6–7 buổi/tuần hoặc lao động nặng'] };
const AVATARS = ['🙂', '😎', '👩', '👨', '👧', '👦', '👵', '👴', '🧑‍💻', '🦸', '🐯', '🌸'];

// ---------- tiện ích ----------
let toastT;
function toast(msg) { let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); } t.textContent = msg; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => t.style.display = 'none', 2600); }
const charts = [];
function chart(fn, h = 180) { const id = 'c' + Math.random().toString(36).slice(2, 8); charts.push([id, fn]); return `<canvas class="chart" id="${id}" style="height:${h}px"></canvas>`; }
function runCharts() { while (charts.length) { const [id, fn] = charts.shift(); const c = document.getElementById(id); if (!c) continue; const r = c.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); c.width = r.width * dpr; c.height = r.height * dpr; const g = c.getContext('2d'); g.scale(dpr, dpr); fn(g, r.width, r.height); } }
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
function drawBars(g, w, h, vals, labels, color = '#14b37d', goal = null, unit = '') {
  const pad = { l: 30, r: 6, t: 10, b: 22 }, max = Math.max(goal || 0, ...vals, 3) * 1.15;
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b, bw = iw / vals.length;
  g.font = '11px system-ui'; g.fillStyle = css('--muted'); g.strokeStyle = css('--line'); g.lineWidth = 1;
  for (let k = 0; k <= 3; k++) { const y = pad.t + ih - ih * k / 3; g.beginPath(); g.moveTo(pad.l, y); g.lineTo(w - pad.r, y); g.stroke(); g.fillText(Math.round(max * k / 3), 2, y + 4); }
  vals.forEach((v, i) => { const bh = ih * v / max; g.fillStyle = color; const x = pad.l + i * bw + bw * 0.15; g.beginPath(); g.roundRect ? g.roundRect(x, pad.t + ih - bh, bw * 0.7, bh, 3) : g.rect(x, pad.t + ih - bh, bw * 0.7, bh); g.fill(); });
  g.fillStyle = css('--muted'); const step = Math.ceil(labels.length / 12);
  labels.forEach((l, i) => { if (i % step) return; g.textAlign = 'center'; g.fillText(l, pad.l + i * bw + bw / 2, h - 6); });
  if (goal) { const y = pad.t + ih - ih * goal / max; g.setLineDash([4, 4]); g.strokeStyle = '#f59e0b'; g.beginPath(); g.moveTo(pad.l, y); g.lineTo(w - pad.r, y); g.stroke(); g.setLineDash([]); }
}
function drawLine(g, w, h, series, x0, x1, fmtX) {
  const pad = { l: 36, r: 20, t: 10, b: 22 }; const all = series.flatMap(s => s.pts.map(p => p[1]));
  if (!all.length) { g.fillStyle = css('--muted'); g.font = '13px system-ui'; g.textAlign = 'center'; g.fillText('Chưa có dữ liệu', w / 2, h / 2); return; }
  let lo = Math.min(...all), hi = Math.max(...all); if (hi - lo < 2) { lo -= 1; hi += 1; } const m = (hi - lo) * 0.1; lo -= m; hi += m;
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b, X = x => pad.l + iw * (x - x0) / Math.max(1, x1 - x0), Y = y => pad.t + ih - ih * (y - lo) / (hi - lo);
  g.font = '11px system-ui'; g.strokeStyle = css('--line'); g.fillStyle = css('--muted');
  for (let k = 0; k <= 3; k++) { const v = lo + (hi - lo) * k / 3, y = Y(v); g.beginPath(); g.moveTo(pad.l, y); g.lineTo(w - pad.r, y); g.stroke(); g.fillText(v.toFixed(1), 2, y + 4); }
  g.textAlign = 'center'; for (let k = 0; k <= 4; k++) { const x = x0 + (x1 - x0) * k / 4; g.fillText(fmtX(Math.round(x)), X(x), h - 6); }
  for (const s of series) {
    if (!s.pts.length) continue; g.strokeStyle = s.color; g.lineWidth = s.w || 2.5; g.setLineDash(s.dash || []); g.beginPath();
    s.pts.forEach(([x, y], i) => i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))); g.stroke(); g.setLineDash([]);
    if (s.dots) { g.fillStyle = s.color; s.pts.forEach(([x, y]) => { g.beginPath(); g.arc(X(x), Y(y), 3.2, 0, 7); g.fill(); }); }
  }
}

// ---------- âm thanh & giọng nói ----------
let actx = null;
function beep(f = 880, d = 0.12, v = 0.15) { if (!S.settings.sound) return; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), gn = actx.createGain(); o.frequency.value = f; gn.gain.value = v; o.connect(gn); gn.connect(actx.destination); o.start(); gn.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + d); o.stop(actx.currentTime + d + 0.02); } catch (e) { } }
function say(t) { if (!S.settings.voice || !window.speechSynthesis) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'vi-VN'; u.rate = 1.02; const v = speechSynthesis.getVoices().find(v => /^vi/i.test(v.lang)); if (v) u.voice = v; speechSynthesis.speak(u); } catch (e) { } }

// =====================================================================
// RENDER CHÍNH
// =====================================================================
function render() {
  const app = $('#app');
  if (ob) app.innerHTML = renderOb();
  else if (!P()) { startOb(); app.innerHTML = renderOb(); }
  else app.innerHTML = renderShell();
  renderLayer();
}
function renderLayer() {
  const L = $('#layer');
  const pg = ui.pages[ui.pages.length - 1];
  const old = $('.page', L); const st = old ? old.scrollTop : 0; const sameP = old && old.dataset.key === (pg && pg.key);
  L.innerHTML = (pg ? `<div class="page" data-key="${esc(pg.key)}"><div class="page-in">${renderPage(pg)}</div></div>` : '') + (ui.sheet ? renderSheet() : '') + (pl ? `<div class="player">${renderPlayer()}</div>` : '');
  if (sameP) $('.page', L).scrollTop = st;
  document.body.style.overflow = pg || pl || ui.sheet ? 'hidden' : '';
  runCharts(); mount3d();
}
let mounted = null;
function mount3d() {
  const host = (pl && $('.player [data-v3d]')) || (ui.pages.length && $('.page [data-v3d]')) || (!ui.pages.length && !pl && $('#app [data-v3d]'));
  if (!host) { if (mounted) { viewer.unmount(); mounted = null; } return; }
  const key = host.dataset.v3d, ex = EX[key] || null;
  const hl = key === 'atlas' ? [[ui.muscleSel], []] : null;
  viewer.mount(host, { exercise: ex, keepView: mounted === key, highlight: hl, onPick: key === 'atlas' ? id => { ui.muscleSel = id; render(); } : null, autoplay: !(pl && pl.paused) });
  if (key === 'atlas' && mounted !== key) viewer.view('front');
  mounted = key;
}
function push(type, arg) { ui.pages.push({ type, arg, key: type + ':' + (arg ?? '') }); try { history.pushState({ pg: ui.pages.length }, ''); } catch (e) { } renderLayer(); const pg = $('.page'); if (pg) pg.scrollTop = 0; }
function pop() { ui.pages.pop(); renderLayer(); }

// =====================================================================
// KHỞI TẠO HỒ SƠ (ONBOARDING)
// =====================================================================
function startOb(edit) {
  const base = { name: '', avatar: '🙂', sex: '', birthYear: '', height: '', weight: '', waist: '', health: [], activity: 'light', fitness: { self: 1 }, days: 3, minutes: 20, timeSlot: 'toi', sleepHours: 7, place: 'home', equip: [], likes: [], diet: 'man', eatStyle: 'nha', track: 'plate', vegDays: '2', badHabits: [], goal: '', targetWeight: '', targetWeeks: '', why: '' };
  ob = edit ? { step: 1, edit: edit.id, d: JSON.parse(JSON.stringify({ ...base, ...edit, logs: undefined })) } : { step: 0, d: base };
}
const OB_STEPS = 8;
function chips(k, opts, multi = false, cur) {
  cur = cur ?? getK(ob.d, k);
  return `<div class="chips">${Object.entries(opts).map(([v, l]) => `<span class="chip ${multi ? (cur || []).includes(v) ? 'on' : '' : String(cur) === v ? 'on' : ''}" data-a="${multi ? 'obtog' : 'obset'}" data-k="${k}" data-v="${v}">${l}</span>`).join('')}</div>`;
}
function getK(o, k) { return k.split('.').reduce((a, x) => a && a[x], o); }
function setK(o, k, v) { const ks = k.split('.'); let a = o; ks.slice(0, -1).forEach(x => a = a[x] = a[x] || {}); a[ks[ks.length - 1]] = v; }
function num(k, unit, ph = '', step = 'any') { const v = getK(ob.d, k); return `<div class="unit"><input class="in" type="number" inputmode="decimal" step="${step}" data-k="${k}" value="${v ?? ''}" placeholder="${ph}"><span>${unit}</span></div>`; }
function renderOb() {
  const d = ob.d, s = ob.step;
  let body = '';
  if (s === 0) body = `<div class="c" style="padding-top:3vh"><div style="font-size:72px">💪</div><h2>HLV Sức Khỏe</h2>
    <p class="muted">Huấn luyện viên cá nhân bỏ túi cho người Việt – từ thói quen nhỏ mỗi ngày đến cơ thể khỏe mạnh lâu dài.</p></div>
    <div class="card"><div class="check on" style="cursor:default"><span class="em">🌱</span><span>Bắt đầu nhỏ: 10 phút/ngày, 3 thói quen đơn giản</span></div>
    <div class="check on" style="cursor:default"><span class="em">🧍</span><span>Bài tập minh họa 3D, xoay 360°, tô sáng nhóm cơ</span></div>
    <div class="check on" style="cursor:default"><span class="em">🍚</span><span>Dinh dưỡng theo món ăn Việt: phở, cơm, bún…</span></div>
    <div class="check on" style="cursor:default"><span class="em">📊</span><span>Theo dõi tiến độ, báo cáo tuần – tháng – năm</span></div>
    <div class="check on" style="cursor:default"><span class="em">👨‍👩‍👧</span><span>Nhiều hồ sơ cho cả gia đình (từ 12 tuổi)</span></div></div>
    <div class="check ${ob.agree ? 'on' : ''}" data-a="obAgree" style="border:0"><span class="box">✓</span><span class="txt small" style="text-decoration:none;color:inherit">Tôi đã đọc và đồng ý với <a href="#" data-a="about" style="color:var(--primary)">thông tin miễn trừ trách nhiệm</a>: ứng dụng chỉ hướng dẫn chung, không thay thế bác sĩ. Dữ liệu chỉ lưu trên máy của tôi.</span></div>
    <button class="btn line block" data-a="guide" style="margin:6px 0">📖 Xem hướng dẫn sử dụng</button>
    ${S.profiles.length ? '' : `<button class="btn line block" data-a="import">📂 Khôi phục từ bản sao lưu</button>`}`;
  if (s === 1) body = `<h2>Thông tin cơ bản</h2><p class="muted">Để tính nhu cầu năng lượng và lộ trình phù hợp.</p>
    <label class="f">Tên gọi</label><input class="in" data-k="name" value="${esc(d.name)}" placeholder="Ví dụ: Minh">
    <label class="f">Biểu tượng</label><div class="chips">${AVATARS.map(a => `<span class="chip ${d.avatar === a ? 'on' : ''}" data-a="obset" data-k="avatar" data-v="${a}" style="font-size:20px;padding:4px 9px">${a}</span>`).join('')}</div>
    <label class="f">Giới tính</label>${chips('sex', { male: '👨 Nam', female: '👩 Nữ' })}
    <label class="f">Năm sinh</label>${num('birthYear', '', 'VD: 1990', 1)}
    <div class="inrow"><div><label class="f">Chiều cao</label>${num('height', 'cm', '165')}</div><div><label class="f">Cân nặng</label>${num('weight', 'kg', '60')}</div></div>
    <label class="f">Vòng eo <span class="muted small">(tùy chọn)</span></label>${num('waist', 'cm', 'Đo ngang rốn, thở ra nhẹ')}
    <p class="tiny muted">Mẹo: cân và đo buổi sáng, sau khi đi vệ sinh, trước khi ăn.</p>`;
  if (s === 2) body = `<h2>Sức khỏe & mức vận động</h2><p class="muted">Chọn tất cả tình trạng đang có (nếu có) để HLV loại bỏ bài không an toàn.</p>
    ${Object.entries(HEALTH).filter(([k]) => d.sex === 'female' || !['pregnant', 'postpartum'].includes(k)).map(([k, l]) => `<div class="check ${d.health.includes(k) ? 'on' : ''}" data-a="obtog" data-k="health" data-v="${k}"><span class="box">✓</span><span class="txt" style="text-decoration:none;color:inherit">${l}</span></div>`).join('')}
    ${d.health.some(h => ['heart', 'dizzy', 'injury', 'pregnant'].includes(h)) ? `<div class="note bad"><span class="ni">⚠️</span><span>Bạn nên hỏi ý kiến bác sĩ trước khi tập. Ứng dụng sẽ giữ cường độ nhẹ và tác động thấp.</span></div>` : ''}
    <label class="f">Mức vận động hiện tại</label>
    ${Object.entries(ACTS).map(([k, [i, t, ds]]) => `<button class="opt ${d.activity === k ? 'on' : ''}" data-a="obset" data-k="activity" data-v="${k}"><span class="ic">${i}</span><span><div class="t">${t}</div><div class="d">${ds}</div></span></button>`).join('')}`;
  if (s === 3) body = `<h2>Thể lực hiện tại</h2><p class="muted">Tự đánh giá, hoặc làm nhanh 3 bài kiểm tra (khoảng 3 phút) để lộ trình chính xác hơn. Có thể bỏ qua.</p>
    <label class="f">Bạn tự thấy thể lực của mình</label>
    ${[['1', '🌱', 'Mới bắt đầu', 'Leo 2–3 tầng đã hụt hơi'], ['2', '🌿', 'Trung bình', 'Thỉnh thoảng tập, đi bộ 30 phút thoải mái'], ['3', '🌳', 'Khá tốt', 'Tập đều, chạy được 15–20 phút']].map(([v, i, t, ds]) => `<button class="opt ${String(d.fitness.self) === v ? 'on' : ''}" data-a="obset" data-k="fitness.self" data-v="${v}" data-num="1"><span class="ic">${i}</span><span><div class="t">${t}</div><div class="d">${ds}</div></span></button>`).join('')}
    <div class="card"><h3>🧪 Kiểm tra nhanh <span class="r">tùy chọn</span></h3>
    <label class="f">1. Chống đẩy liên tục tối đa – kiểu</label>${chips('fitness.pushType', { wall: 'Chống tường', knee: 'Quỳ gối', full: 'Chống đẩy chuẩn' })}
    <div style="margin-top:8px">${num('fitness.push', 'lần', 'Số lần làm đúng kỹ thuật', 1)}</div>
    <label class="f">2. Ngồi xuống – đứng lên ghế trong 30 giây</label>${num('fitness.squat', 'lần', 'Tay khoanh trước ngực', 1)}
    <label class="f">3. Plank cẳng tay giữ được</label>${num('fitness.plank', 'giây', 'Giữ thân thẳng', 1)}
    <p class="tiny muted">Dừng ngay nếu đau hoặc chóng mặt. Kết quả chỉ dùng để chọn độ khó khởi điểm.</p></div>`;
  if (s === 4) body = `<h2>Quỹ thời gian</h2><p class="muted">Hãy chọn con số bạn <b>chắc chắn</b> làm được kể cả tuần bận rộn. Ta sẽ bắt đầu nhỏ hơn và tăng dần.</p>
    <label class="f">Số buổi tập mỗi tuần</label>${chips('days', Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map(x => [x, x + ' buổi'])))}
    <label class="f">Thời gian mỗi buổi</label>${chips('minutes', Object.fromEntries([10, 15, 20, 30, 45, 60, 90].map(x => [x, x + ' phút'])))}
    <label class="f">Khung giờ thuận tiện</label>${chips('timeSlot', { sang: '🌅 Sáng sớm', trua: '☀️ Trưa', chieu: '🌇 Chiều', toi: '🌙 Tối' })}
    <label class="f">Bạn thường ngủ mỗi đêm</label>${chips('sleepHours', { 5: '≤5 giờ', 6: '6 giờ', 7: '7 giờ', 8: '8 giờ', 9: '≥9 giờ' })}`;
  if (s === 5) body = `<h2>Cách tập & ăn uống phù hợp</h2>
    <label class="f">Nơi tập chính</label>${chips('place', { home: '🏠 Tại nhà', park: '🌳 Công viên / ngoài trời', gym: '🏋️ Phòng gym' })}
    <label class="f">Dụng cụ đang có</label>${chips('equip', { db: '🏋️ Tạ đơn / chai nước', chair: '🪑 Ghế chắc chắn', mat: '🟩 Thảm', band: '🎗️ Dây kháng lực', bar: '➖ Xà đơn' }, true)}
    <label class="f">Môn bạn thích</label>${chips('likes', { walk: 'Đi bộ', run: 'Chạy', bike: 'Đạp xe', swim: 'Bơi', yoga: 'Yoga', badminton: 'Cầu lông / bóng', dance: 'Nhảy / aerobic' }, true)}
    <label class="f">Chế độ ăn</label>${chips('diet', { man: '🍖 Ăn mặn', chay: '🥦 Ăn chay', chay_ky: '🌕 Chay mùng 1, rằm' })}
    ${d.diet === 'chay_ky' ? `<label class="f">Ngày ăn chay theo âm lịch</label>${chips('vegDays', VEG_SETS)}<p class="tiny muted" style="margin:4px 0 0">App tự nhận ngày âm lịch, nhắc trước 1 ngày và chuyển thực đơn sang món chay.</p>` : ''}
    <label class="f">Bữa ăn chủ yếu</label>${chips('eatStyle', { nha: '🍲 Nấu ở nhà', ngoai: '🏢 Ăn ngoài / cơm văn phòng', mix: '🔀 Kết hợp' })}
    <label class="f">Mức theo dõi ăn uống bạn làm được</label>
    ${[['habit', '✅', 'Chỉ thói quen', 'Đơn giản nhất – tích thói quen mỗi ngày'], ['plate', '🍽️', 'Theo đĩa ăn cân đối', 'Mỗi bữa tích "đúng đĩa": ½ rau, ¼ đạm, ¼ cơm'], ['detail', '📒', 'Ghi chi tiết món ăn', 'Chọn món Việt có sẵn, tự tính calo & đạm']].map(([v, i, t, ds]) => `<button class="opt ${d.track === v ? 'on' : ''}" data-a="obset" data-k="track" data-v="${v}"><span class="ic">${i}</span><span><div class="t">${t}</div><div class="d">${ds}</div></span></button>`).join('')}
    <label class="f">Thói quen muốn cải thiện</label>${chips('badHabits', { sugar: '🧋 Trà sữa / nước ngọt', alcohol: '🍺 Bia rượu', late: '🌙 Ăn khuya', skip_bf: '⏰ Bỏ bữa sáng', sit: '🪑 Ngồi nhiều' }, true)}`;
  if (s === 6) {
    const needW = ['lose', 'muscle', 'gain'].includes(d.goal);
    body = `<h2>Mục tiêu của bạn</h2>
    ${Object.entries(GOALS).map(([k, g]) => `<button class="opt ${d.goal === k ? 'on' : ''}" data-a="obset" data-k="goal" data-v="${k}"><span class="ic">${g.icon}</span><span><div class="t">${g.name}</div><div class="d">${g.d}</div></span></button>`).join('')}
    ${needW ? `<div class="inrow"><div><label class="f">Cân nặng mong muốn</label>${num('targetWeight', 'kg', '')}</div><div><label class="f">Trong khoảng</label>${num('targetWeeks', 'tuần', 'VD: 12', 1)}</div></div><p class="tiny muted">Có thể để trống – HLV sẽ đề xuất thời gian an toàn.</p>` : ''}
    <label class="f">Lý do sâu xa khiến bạn muốn thay đổi?</label><textarea class="in" rows="2" data-k="why" placeholder="VD: Đủ sức chơi với con, không còn đau lưng…">${esc(d.why)}</textarea>
    <p class="tiny muted">Lý do này sẽ được nhắc lại những ngày bạn thiếu động lực.</p>`;
  }
  if (s === 7) {
    const pr = draftProfile(); const f = E.feasibility(pr), m = f.m;
    body = `<h2>Kết quả đánh giá</h2><p class="muted">HLV đã phân tích thể trạng, thời gian và mục tiêu của ${esc(d.name)}.</p>
    <div class="card"><div class="grid3">
      <div class="stat"><div class="v">${m.bmi}</div><div class="l">BMI</div></div>
      <div class="stat"><div class="v">${n0(m.tdee)}</div><div class="l">kcal tiêu hao/ngày</div></div>
      <div class="stat"><div class="v">${n0(m.kcal)}</div><div class="l">kcal nên ăn</div></div></div>
      <div class="note ${m.cat.lv}"><span class="ni">${m.cat.lv === 'ok' ? '✅' : '⚠️'}</span><span>${m.cat.label}${m.waistRisk ? ' · Vòng eo vượt ngưỡng nguy cơ cho người châu Á' : ''}</span></div>
      <p class="small muted" style="margin:4px 0 0">${m.note} Đạm ${m.protein} g · Nước ${m.water} cốc/ngày.</p></div>
    <div class="card"><h3>${f.lv === 'ok' ? '✅ Kế hoạch khả thi' : f.lv === 'warn' ? '🟡 Khả thi, có lưu ý' : '🔴 Cần điều chỉnh'}</h3>
      ${f.items.map(i => `<div class="note ${i.lv}"><span class="ni">${i.lv === 'ok' ? '✔️' : i.lv === 'warn' ? '💡' : '⚠️'}</span><span>${md(i.t)}</span></div>`).join('') || '<p class="muted small">Mục tiêu và quỹ thời gian hợp lý.</p>'}
      ${f.sug.length ? `<p class="small b" style="margin:10px 0 4px">Gợi ý điều chỉnh (chạm để áp dụng):</p><div class="chips">${f.sug.map((x, i) => `<span class="chip" data-a="obsug" data-i="${i}">👉 ${esc(x.label)}</span>`).join('')}</div>` : ''}</div>
    <div class="card"><h3>🗺️ Lộ trình của bạn</h3>${stagesHtml(pr)}</div>`;
  }
  return `<div class="ob">${ob.step ? `<div class="prog">${Array.from({ length: OB_STEPS - 1 }, (_, i) => `<i class="${i < s ? 'on' : ''}"></i>`).join('')}</div>` : ''}${body}</div>
  <div class="ob-foot"><div class="in2">${s > 0 ? `<button class="btn line" data-a="obback">‹ Quay lại</button>` : (ob.cancel !== false && S.profiles.length ? `<button class="btn line" data-a="obcancel">Hủy</button>` : '')}
  <button class="btn sp" data-a="${s === OB_STEPS - 1 ? 'obfinish' : 'obnext'}">${s === 0 ? 'Bắt đầu' : s === OB_STEPS - 1 ? (ob.edit ? 'Lưu thay đổi' : '🚀 Bắt đầu hành trình') : 'Tiếp tục ›'}</button></div></div>`;
}
function draftProfile() {
  const d = ob.d, nm = x => x === '' || x == null ? null : +x;
  const f = { self: +d.fitness.self || 1 };
  if (d.fitness.pushType && nm(d.fitness.push) != null) { f.pushType = d.fitness.pushType; f.push = nm(d.fitness.push); }
  if (nm(d.fitness.squat) != null) f.squat = nm(d.fitness.squat);
  if (nm(d.fitness.plank) != null) f.plank = nm(d.fitness.plank);
  const old = ob.edit ? S.profiles.find(p => p.id === ob.edit) : null;
  return { ...(old || {}), ...d, fitness: f, birthYear: +d.birthYear, height: +d.height, weight: +d.weight, waist: nm(d.waist), days: +d.days, minutes: +d.minutes, sleepHours: +d.sleepHours,
    targetWeight: nm(d.targetWeight), targetWeeks: nm(d.targetWeeks), stage: old ? old.stage : 0, start: old ? old.start : E.today(), stageStart: old ? old.stageStart : E.today(), logs: old ? old.logs : {} };
}
function obValidate() {
  const d = ob.d, s = ob.step, y = new Date().getFullYear();
  if (s === 1) {
    if (!d.name.trim()) return 'Hãy nhập tên gọi.';
    if (!d.sex) return 'Hãy chọn giới tính.';
    const a = y - +d.birthYear; if (!(a >= 12 && a <= 100)) return 'Ứng dụng dành cho người từ 12 tuổi trở lên – kiểm tra lại năm sinh.';
    if (!(+d.height >= 120 && +d.height <= 230)) return 'Chiều cao cần trong khoảng 120–230 cm.';
    if (!(+d.weight >= 25 && +d.weight <= 250)) return 'Cân nặng cần trong khoảng 25–250 kg.';
    if (d.waist && !(+d.waist >= 40 && +d.waist <= 200)) return 'Vòng eo chưa hợp lệ.';
  }
  if (s === 6) {
    if (!d.goal) return 'Hãy chọn một mục tiêu.';
    if (d.targetWeight && !(+d.targetWeight >= 25 && +d.targetWeight <= 250)) return 'Cân nặng mong muốn chưa hợp lệ.';
    if (d.targetWeeks && !(+d.targetWeeks >= 1 && +d.targetWeeks <= 260)) return 'Số tuần cần từ 1 đến 260.';
  }
  return null;
}
function stagesHtml(p) {
  const cur = p.stage || 0;
  return `<div class="stages">${E.STAGES.map((s, i) => `<div class="stg ${i < cur ? 'done' : i === cur ? 'cur' : ''}"><span class="dot"></span>
    <div class="h">${s.icon} Giai đoạn ${i + 1}: ${s.name} <span class="muted small">${s.weeks ? `· ~${s.weeks} tuần` : '· lâu dài'}</span></div>
    <div class="small muted">${s.desc} Tối đa ${Math.min(p.days, s.dayCap)} buổi × ${Math.min(p.minutes, s.minCap)} phút.</div></div>`).join('')}</div>
    <p class="tiny muted" style="margin:0">Chỉ lên giai đoạn mới khi tuân thủ ≥80% trong tuần gần nhất – HLV sẽ tự nhắc bạn.</p>`;
}

// =====================================================================
// KHUNG CHÍNH
// =====================================================================
const TABS = [['today', '🏠', 'Hôm nay'], ['plan', '🗺️', 'Lộ trình'], ['train', '🏋️', 'Bài tập'], ['food', '🍚', 'Ăn uống'], ['report', '📊', 'Báo cáo']];
function renderShell() {
  const p = P(), st = E.stageInfo(p);
  const title = { today: 'Hôm nay', plan: 'Lộ trình', train: 'Bài tập & Kiến thức', food: 'Ăn uống', report: 'Báo cáo' }[ui.tab];
  const body = { today: tabToday, plan: tabPlan, train: tabTrain, food: tabFood, report: tabReport }[ui.tab]();
  return `<div class="top"><h1>${title}</h1><span class="tag no-print" style="background:var(--primary-soft);color:var(--primary)">${st.icon} GĐ ${st.idx + 1}</span><button class="avatar no-print" data-a="guide" aria-label="Hướng dẫn" style="font-size:17px;background:var(--card);border:1px solid var(--line)">❔</button><button class="avatar" data-a="profiles" aria-label="Hồ sơ">${esc(p.avatar || '🙂')}</button></div>
  <div class="main">${body}</div>
  <nav class="nav"><div class="nav-in">${TABS.map(([k, i, l]) => `<button class="${ui.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}"><span class="i">${i}</span>${l}</button>`).join('')}</div></nav>`;
}

// ---------- HÔM NAY ----------
function tabToday() {
  const p = P(), d = ui.day, L = LOG(d), m = E.metrics(p), st = E.stageInfo(p), isToday = d === E.today();
  const habits = L.habitPlan || E.habitsFor(p);
  const hDone = habits.filter(h => L.habits && L.habits[h]).length;
  let plan = E.planFor(p, d); const streak = E.streak(p);
  if (plan.rest && d === p.start) { const f = E.schedule(p).find(x => x.type !== 'R'); plan = { type: f.type, first: true, session: { ...E.buildSession(p, f.type, 0) } }; plan.session.name = 'Buổi khởi đầu – ' + plan.session.name; }
  const hr = new Date().getHours(), greet = hr < 11 ? 'Chào buổi sáng' : hr < 14 ? 'Chào buổi trưa' : hr < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const ev = E.evaluate(p);
  const snooze = p.evalSnooze && p.evalSnooze >= E.today();
  let h = `<div class="card hero"><div class="row"><div class="sp"><div class="b" style="font-size:18px">${greet}, ${esc(p.name)} 👋</div>
    <div class="muted small">${E.DOW_FULL[E.dowMon(d)]}, ${E.fmtDate(d)} · 🌙 ${lunarLabel(d)}<br>${st.icon} ${st.name}${st.weeks ? ` – tuần ${Math.min(st.week, st.weeks)}/${st.weeks}` : ''}</div></div>
    <div class="c"><div style="font-size:26px;line-height:1">🔥</div><div class="b">${streak}</div><div class="tiny muted">ngày</div></div></div>
    <div class="bar" style="margin-top:10px"><i style="width:${Math.round(hDone / Math.max(1, habits.length) * 100)}%"></i></div>
    <div class="row tiny" style="margin-top:6px"><span class="muted">Thói quen ${hDone}/${habits.length}</span><span class="sp"></span>
    <span class="no-print" style="display:flex;gap:6px"><button class="btn sm white" data-a="day" data-v="-1">‹</button>${isToday ? '' : `<button class="btn sm white" data-a="day" data-v="0">Hôm nay</button>`}<button class="btn sm white" data-a="day" data-v="1" ${isToday ? 'disabled' : ''}>›</button></span></div></div>`;
  if (!isToday) h += `<div class="note warn"><span class="ni">📅</span><span>Bạn đang ghi bù cho ngày ${E.fmtDate(d)}.</span></div>`;
  if (isToday && !snooze && ['up', 'down', 'harder', 'easier'].includes(ev.kind)) {
    const act = { up: ['stageUp', '🚀 Lên giai đoạn mới'], down: ['stageDown', '🌱 Làm nhẹ hơn'], harder: ['harder', '📈 Tăng độ khó'], easier: ['easier', '🧸 Giảm độ khó'] }[ev.kind];
    h += `<div class="card" style="border-color:var(--accent)"><h3>🧑‍🏫 HLV đánh giá tuần</h3><p class="small" style="margin:0 0 8px">${ev.t}</p>
      <div class="row"><button class="btn sm" data-a="${act[0]}">${act[1]}</button><button class="btn sm line" data-a="snooze">Để sau</button></div></div>`;
  }
  if (p.diet === 'chay_ky') {
    if (E.isVegDay(p, d)) h += `<div class="note ok"><span class="ni">🌕</span><span><b>Hôm nay ${lunarLabel(d)} – ngày ăn chay của bạn.</b> Thực đơn đã chuyển sang món chay. Nhớ đủ đạm: đậu phụ, sữa đậu nành, nấm, các loại đậu; hạn chế đồ chay chiên rán.</span></div>`;
    else if (E.isVegDay(p, E.addDays(d, 1))) h += `<div class="note warn"><span class="ni">🌙</span><span><b>Ngày mai (${lunarLabel(E.addDays(d, 1))}) là ngày ăn chay.</b> Chuẩn bị sẵn đậu phụ, rau, nấm nhé.</span></div>`;
  }
  if (isToday && PH.ok) {
    const mine = PH.pid === p.id ? PH.list : []; const last = mine.length ? mine[mine.length - 1].date : null; const every = p.photoEvery || 14;
    if (!last || E.diffDays(last, d) >= every) h += `<div class="card"><h3>📸 ${last ? 'Đến lúc chụp ảnh tiến độ' : 'Chụp ảnh "trước" làm mốc'}</h3><p class="small muted" style="margin:0 0 8px">${last ? `Lần chụp gần nhất: ${E.fmtDate(last)} (${E.diffDays(last, d)} ngày trước).` : 'Cân nặng không nói hết – ảnh chụp định kỳ cho thấy rõ cơ thể thay đổi. Ảnh chỉ lưu trên máy của bạn.'}</p><button class="btn sm ghost" data-a="photos">📷 Mở ảnh tiến độ</button></div>`;
  }
  // buổi tập
  const W = L.workout;
  if (W && W.done) h += `<div class="card"><h3>✅ Đã tập xong <span class="r">${W.minutes} phút · ~${W.kcal} kcal</span></h3><p class="small muted" style="margin:0">${esc(W.name || '')}${W.rpe ? ` · Độ khó cảm nhận ${W.rpe}/10` : ''}. Tuyệt vời! Nghỉ ngơi, uống nước và ăn đủ đạm nhé.</p>
    <div class="fab-row"><button class="btn sm line" data-a="undoWorkout">Hoàn tác</button><button class="btn sm ghost" data-a="startExtra">+ Tập thêm 10 phút</button></div></div>`;
  else if (plan.rest) h += `<div class="card"><h3>🌿 Ngày nghỉ chủ động</h3><p class="small muted" style="margin:0 0 8px">Cơ bắp phát triển khi nghỉ ngơi. Gợi ý: đi bộ nhẹ 15–20 phút, giãn cơ, ngủ sớm.</p>
    <div class="row wrap"><button class="btn sm ghost" data-a="startExtra">🧘 Giãn cơ & cơ lõi 10 phút</button><button class="btn sm line" data-a="markWalk">🚶 Tôi đã đi bộ</button></div></div>`;
  else {
    const se = plan.session;
    h += `<div class="card"><h3>${se.icon || E.TYPE_ICON[se.type]} ${se.name} <span class="r">${se.minutes} phút · ~${se.kcal} kcal</span></h3>
      <div class="small muted">${se.main.map(i => EX[i.ex].name).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}</div>
      ${plan.first ? '<p class="tiny muted" style="margin:6px 0 0">Ngày đầu tiên: làm quen một buổi ngắn để tạo đà – bắt đầu ngay hôm nay!</p>' : ''}<div class="fab-row"><button class="btn sp" data-a="start" data-v="${d}" ${plan.first ? `data-t="${plan.type}"` : ''}>▶ Bắt đầu tập</button>${plan.first ? '' : `<button class="btn line" data-a="session" data-v="${d}">Chi tiết</button>`}</div></div>`;
  }
  // thói quen
  h += `<div class="card"><h3>🌱 Thói quen nhỏ hôm nay <span class="r">${hDone}/${habits.length}</span></h3>
    ${habits.map(k => { const H = HABITS[k], on = L.habits && L.habits[k]; return `<div class="check ${on ? 'on' : ''}" data-a="habit" data-v="${k}"><span class="box">✓</span><span class="em">${H.icon}</span><span class="txt">${H.name}</span><button class="info-i" data-a="habitInfo" data-v="${k}">ⓘ</button></div>`; }).join('')}</div>`;
  // nước
  const wc = L.water || 0;
  h += `<div class="card"><h3>💧 Nước <span class="r">${wc}/${m.water} cốc (250 ml)</span></h3><div class="water">${Array.from({ length: Math.max(m.water, wc) }, (_, i) => `<button class="cup ${i < wc ? 'on' : ''}" data-a="water" data-v="${i + 1}" aria-label="cốc ${i + 1}"></button>`).join('')}</div>
    <div class="row"><button class="btn sm line" data-a="water" data-v="${Math.max(0, wc - 1)}">− 1 cốc</button><button class="btn sm ghost" data-a="water" data-v="${wc + 1}">+ 1 cốc</button></div></div>`;
  // ăn uống
  if (p.track === 'detail') {
    const it = E.intake(L) || { kcal: 0, p: 0 };
    h += `<div class="card"><h3>🍚 Ăn uống <span class="r">${n0(it.kcal)}/${n0(m.kcal)} kcal</span></h3><div class="bar"><i style="width:${Math.min(100, it.kcal / m.kcal * 100)}%;${it.kcal > m.kcal * 1.08 ? 'background:var(--bad)' : ''}"></i></div>
      <div class="small muted" style="margin:6px 0">Đạm ${n0(it.p)}/${m.protein} g</div><button class="btn sm ghost" data-a="tab" data-v="food">+ Ghi bữa ăn</button></div>`;
  } else if (p.track === 'plate') {
    h += `<div class="card"><h3>🍽️ Bữa ăn đúng đĩa cân đối</h3><p class="tiny muted" style="margin:0 0 4px">½ rau · ¼ đạm (cỡ lòng bàn tay) · ¼ cơm (cỡ nắm tay)</p>
      ${['sang', 'trua', 'toi'].map(k => `<div class="check ${L.plate && L.plate[k] ? 'on' : ''}" data-a="plate" data-v="${k}"><span class="box">✓</span><span class="txt">${E.MEAL_NAMES[k]}</span></div>`).join('')}</div>`;
  }
  // nhật ký
  h += `<div class="card"><h3>📝 Nhật ký cơ thể</h3>
    <div class="grid2"><div><label class="f" style="margin-top:0">Cân nặng</label><div class="unit"><input class="in" type="number" step="0.1" inputmode="decimal" data-log="w" value="${L.w ?? ''}" placeholder="${n1(E.latestWeight(p))}"><span>kg</span></div></div>
    <div><label class="f" style="margin-top:0">Vòng eo</label><div class="unit"><input class="in" type="number" step="0.5" inputmode="decimal" data-log="waist" value="${L.waist ?? ''}" placeholder="${p.waist || ''}"><span>cm</span></div></div>
    <div><label class="f">Giấc ngủ</label><div class="unit"><input class="in" type="number" step="0.5" inputmode="decimal" data-log="sleep" value="${L.sleep ?? ''}" placeholder="7"><span>giờ</span></div></div>
    <div><label class="f">Số bước</label><div class="unit"><input class="in" type="number" step="100" inputmode="numeric" data-log="steps" value="${L.steps ?? ''}" placeholder="5000"><span>bước</span></div></div></div>
    <label class="f">Tâm trạng & năng lượng</label><div class="mood">${['😫', '😕', '😐', '🙂', '😄'].map((e, i) => `<button class="${L.mood === i + 1 ? 'on' : ''}" data-a="mood" data-v="${i + 1}">${e}</button>`).join('')}</div>
    <label class="f">Ghi chú</label><input class="in" data-log="note" value="${esc(L.note || '')}" placeholder="Đau mỏi, cảm nhận, sự kiện…"></div>`;
  h += `<div class="card"><h3>💡 Mẹo của HLV</h3><p class="small" style="margin:0">${TIPS[(E.diffDays('2026-01-01', d) % TIPS.length + TIPS.length) % TIPS.length]}</p>
    ${p.why ? `<p class="small muted" style="margin:8px 0 0">🎯 Lý do của bạn: “${esc(p.why)}”</p>` : ''}</div>`;
  return h;
}

// ---------- LỘ TRÌNH ----------
function tabPlan() {
  const p = P(), m = E.metrics(p), f = E.feasibility({ ...p, weight: E.latestWeight(p) }), sc = E.schedule(p), td = E.dowMon(E.today());
  const g = GOALS[p.goal];
  let h = `<div class="card"><h3>${g.icon} Mục tiêu: ${g.name}</h3>
    ${p.targetWeight ? `<div class="row"><div class="kpi"><span class="v">${n1(E.latestWeight(p))}</span><span class="muted">kg</span></div><span class="muted">→</span><div class="kpi"><span class="v" style="color:var(--primary)">${p.targetWeight}</span><span class="muted">kg</span></div><span class="sp"></span><span class="small muted">${p.targetWeeks ? `đến ${E.fmtDate(E.addDays(p.start, p.targetWeeks * 7))}` : ''}</span></div>` : ''}
    ${p.targetWeight && p.targetWeeks ? chart((gc, w, hh) => { const pr = E.projection(p) || []; const x0 = 0, x1 = E.diffDays(p.start, pr[pr.length - 1][0]); const real = Object.keys(p.logs || {}).filter(k => p.logs[k].w).sort().map(k => [E.diffDays(p.start, k), +p.logs[k].w]); drawLine(gc, w, hh, [{ pts: pr.map(([d, v]) => [E.diffDays(p.start, d), v]), color: '#f59e0b', dash: [5, 5], w: 2 }, { pts: [[0, p.startWeight || p.weight], ...real], color: '#14b37d', dots: true }], x0, Math.max(x1, real.length ? real[real.length - 1][0] : 1), x => E.fmtDate(E.addDays(p.start, x))); }, 160) + `<p class="tiny muted c" style="margin:2px 0 0"><span style="color:#f59e0b">- - -</span> lộ trình dự kiến · <span style="color:#14b37d">●</span> thực tế</p>` : ''}
    <button class="btn sm line" data-a="editProfile" style="margin-top:8px">✏️ Sửa hồ sơ, thời gian & mục tiêu</button></div>`;
  h += `<div class="card"><h3>📐 Chỉ số của bạn</h3><div class="grid3">
    <div class="stat"><div class="v">${m.bmi}</div><div class="l">BMI</div></div><div class="stat"><div class="v">${n0(m.bmr)}</div><div class="l">BMR (kcal)</div></div><div class="stat"><div class="v">${n0(m.tdee)}</div><div class="l">TDEE (kcal)</div></div>
    <div class="stat"><div class="v">${n0(m.kcal)}</div><div class="l">kcal mục tiêu</div></div><div class="stat"><div class="v">${m.protein}g</div><div class="l">Đạm/ngày</div></div><div class="stat"><div class="v">${m.water}</div><div class="l">cốc nước</div></div></div>
    <div class="note ${m.cat.lv}"><span class="ni">⚖️</span><span>${m.cat.label}. Cân nặng khỏe mạnh (chuẩn châu Á): ${m.healthy[0]}–${m.healthy[1]} kg${m.teen ? ' (người trưởng thành; tuổi teen dùng BMI theo tuổi)' : ''}.</span></div>
    ${m.whtr ? `<div class="note ${m.whtr > 0.5 ? 'warn' : 'ok'}"><span class="ni">📏</span><span>Tỉ lệ eo/chiều cao ${m.whtr} ${m.whtr > 0.5 ? '– trên 0,5: nên giảm mỡ bụng' : '– tốt (dưới 0,5)'}.</span></div>` : ''}
    <button class="btn sm line" data-a="lesson" data-v="energy">Hiểu các chỉ số này</button></div>`;
  h += `<div class="card"><h3>${f.lv === 'ok' ? '✅' : f.lv === 'warn' ? '🟡' : '🔴'} Đánh giá khả thi</h3>
    ${f.items.map(i => `<div class="note ${i.lv}"><span class="ni">${i.lv === 'ok' ? '✔️' : i.lv === 'warn' ? '💡' : '⚠️'}</span><span>${md(i.t)}</span></div>`).join('') || '<p class="small muted">Kế hoạch hợp lý, cứ thế tiến lên!</p>'}
    ${f.sug.length ? `<div class="chips">${f.sug.map((x, i) => `<span class="chip" data-a="applySug" data-i="${i}">👉 ${esc(x.label)}</span>`).join('')}</div>` : ''}</div>`;
  const ev = E.evaluate(p);
  h += `<div class="card"><h3>🗺️ Giai đoạn</h3>${stagesHtml(p)}
    <div class="note ${ev.kind === 'down' || ev.kind === 'easier' ? 'warn' : 'ok'}"><span class="ni">🧑‍🏫</span><span>${ev.t}</span></div>
    <div class="row"><button class="btn sm line" data-a="stageDown" ${p.stage ? '' : 'disabled'}>‹ Giai đoạn trước</button><span class="sp"></span><button class="btn sm ghost" data-a="stageUp" ${p.stage >= 3 ? 'disabled' : ''}>Giai đoạn sau ›</button></div></div>`;
  const nd = E.effDays(p);
  h += `<div class="card"><h3>📅 Lịch tập tuần này <span class="r">${nd} buổi × ${E.effMinutes(p)} phút</span></h3>
    ${sc.map(x => { const d = E.addDays(E.today(), x.dow - td); const se = x.type !== 'R' ? E.buildSession(p, x.type, x.variant) : null; const done = p.logs && p.logs[d] && p.logs[d].workout && p.logs[d].workout.done;
      return `<div class="day ${x.dow === td ? 'today' : ''}" data-a="${se ? 'session' : 'noop'}" data-v="${d}"><span class="dn">${E.DOW[x.dow]}</span><span class="ty">${E.TYPE_ICON[x.type]}</span><span class="sp"><div class="b small">${E.TYPE_NAME[x.type]}</div><div class="tiny muted">${se ? `${se.minutes} phút · ${se.main.length} bài` : 'Đi bộ nhẹ, giãn cơ, ngủ đủ'}</div></span>${done ? '✅' : se ? '<span class="muted">›</span>' : ''}</div>`; }).join('')}
    <label class="f">Chọn ngày tập (${nd} ngày)</label><div class="chips">${E.DOW.map((l, i) => `<span class="chip ${(ui.pendDays ? ui.pendDays.includes(i) : sc[i].type !== 'R') ? 'on' : ''}" data-a="trainDay" data-v="${i}">${l}</span>`).join('')}</div>
    ${nd < p.days ? `<p class="tiny muted">Bạn đăng ký ${p.days} buổi/tuần – giai đoạn hiện tại giới hạn ${nd} buổi để tạo thói quen trước.</p>` : ''}</div>`;
  h += `<div class="card"><h3>🌱 Thói quen của giai đoạn</h3>${E.habitsFor(p).map(k => `<div class="check" style="cursor:default"><span class="em">${HABITS[k].icon}</span><span class="txt" style="text-decoration:none;color:inherit"><b class="small">${HABITS[k].name}</b><div class="tiny muted">${HABITS[k].why}</div></span></div>`).join('')}</div>`;
  return h;
}

// ---------- BÀI TẬP ----------
function tabTrain() {
  let h = `<div class="seg">${[['lib', 'Thư viện'], ['muscle', 'Nhóm cơ'], ['learn', 'Kiến thức']].map(([k, l]) => `<button class="${ui.exSeg === k ? 'on' : ''}" data-a="exSeg" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (ui.exSeg === 'lib') {
    const p = P();
    let list = EXERCISES.filter(e => (ui.libCat === 'all' || e.cat === ui.libCat) && (!ui.libMuscle || e.primary.includes(ui.libMuscle) || e.secondary.includes(ui.libMuscle)) && (!ui.libMine || E.allowed(p, e)));
    h += `<div class="chips" style="margin:8px 0">${Object.entries({ all: 'Tất cả', ...CATS }).map(([k, l]) => `<span class="chip ${ui.libCat === k ? 'on' : ''}" data-a="libCat" data-v="${k}">${l}</span>`).join('')}</div>
    <div class="row"><select class="in" data-a2="libMuscle" style="flex:1"><option value="">Mọi nhóm cơ</option>${Object.entries(MUSCLES).map(([k, m]) => `<option value="${k}" ${ui.libMuscle === k ? 'selected' : ''}>${m.name}</option>`).join('')}</select>
    <span class="chip ${ui.libMine ? 'on' : ''}" data-a="libMine">Phù hợp tôi</span></div>
    <div class="card">${list.map(e => exRow(e)).join('') || '<div class="empty">Không có bài phù hợp bộ lọc.</div>'}</div>`;
    setTimeout(fillThumbs, 30);
  } else if (ui.exSeg === 'muscle') {
    const M = MUSCLES[ui.muscleSel];
    const exs = EXERCISES.filter(e => e.primary.includes(ui.muscleSel)).concat(EXERCISES.filter(e => e.secondary.includes(ui.muscleSel)));
    h += `<div class="v3d" data-v3d="atlas" style="height:360px">${v3dCtl(false)}<div class="v3d-hint">Chạm vào cơ để xem</div></div>
    <div class="chips" style="margin:10px 0">${Object.entries(MUSCLES).map(([k, m]) => `<span class="chip ${ui.muscleSel === k ? 'on' : ''}" data-a="muscle" data-v="${k}">${m.name}</span>`).join('')}</div>
    <div class="card"><h3>${M.name} <span class="r">${M.en}</span></h3>
    <p class="small" style="margin:4px 0"><b>Chức năng:</b> ${M.fn}</p><p class="small" style="margin:4px 0"><b>Trong đời sống:</b> ${M.life}</p>
    <div class="note ok"><span class="ni">💡</span><span>${M.tip}</span></div>
    <h3 style="margin-top:12px">Bài tập liên quan</h3>${exs.map(e => exRow(e, e.primary.includes(ui.muscleSel) ? 'Cơ chính' : 'Cơ phụ')).join('')}</div>`;
    setTimeout(fillThumbs, 30);
  } else {
    h += `<div class="card">${LESSONS.map(l => `<div class="list-item" data-a="lesson" data-v="${l.id}"><span class="thumb">${l.icon}</span><span class="sp"><div class="b">${l.title}</div><div class="tiny muted">${l.min} phút đọc</div></span><span class="muted">›</span></div>`).join('')}</div>`;
  }
  return h;
}
function exRow(e, extra) {
  return `<div class="list-item" data-a="ex" data-v="${e.id}"><span class="thumb" data-thumb="${e.id}">🏃</span><span class="sp"><div class="b">${e.name}</div>
    <div>${e.primary.map(m => `<span class="tag p">${MUSCLES[m].name}</span>`).join('')}<span class="tag">${CATS[e.cat]}</span><span class="tag">Cấp ${e.level}</span>${extra ? `<span class="tag s">${extra}</span>` : ''}</div></span><span class="muted">›</span></div>`;
}
function fillThumbs() {
  const els = [...document.querySelectorAll('[data-thumb]')].filter(el => !el.dataset.done);
  let i = 0;
  const step = () => {
    if (i >= els.length || mounted) return; const el = els[i++]; if (!el.isConnected) return step();
    const ex = EX[el.dataset.thumb]; const url = snapshot(ex, ex.frames.length > 2 ? 1 : 0);
    if (url) { el.innerHTML = `<img src="${url}" alt="">`; el.dataset.done = 1; }
    setTimeout(step, 16);
  };
  if (!mounted) step();
}
function v3dCtl(anim = true) {
  return `<div class="v3d-legend" style="z-index:2"><i style="background:#e5484d"></i>Cơ chính<i style="background:#f5a524"></i>Cơ phụ</div>
  <div class="v3d-ctl" style="z-index:2">${anim ? `<button data-a="v3d" data-v="play">⏸</button><button data-a="v3d" data-v="slow">🐢 0.5×</button>` : ''}
  <button data-a="v3d" data-v="front">Trước</button><button data-a="v3d" data-v="side">Bên</button><button data-a="v3d" data-v="back">Sau</button><button data-a="v3d" data-v="three">3/4</button></div>`;
}

// ---------- ĂN UỐNG ----------
function tabFood() {
  const p = P(), m = E.metrics(p), d = ui.day, L = LOG(d);
  const autoVeg = E.isVegDay(p, d), veg = ui.vegToday || autoVeg;
  const mn = E.menuFor(p, d, ui.menuShift, veg);
  let h = `<div class="card"><h3>🎯 Mục tiêu mỗi ngày</h3><div class="kpi"><span class="v">${n0(m.kcal)}</span><span class="muted">kcal</span></div>
    <div class="grid3" style="margin-top:8px"><div class="stat"><div class="v">${m.protein}g</div><div class="l">Đạm</div></div><div class="stat"><div class="v">${m.carb}g</div><div class="l">Tinh bột</div></div><div class="stat"><div class="v">${m.fat}g</div><div class="l">Chất béo</div></div></div>
    <p class="small muted" style="margin:8px 0 0">${m.note} Tương đương khoảng <b>${n1(m.riceBowls)} chén cơm</b>/ngày, rau ≥ 400 g, ${m.water} cốc nước.</p></div>
  <div class="card"><h3>🍽️ Đĩa ăn Việt cân đối</h3><div class="plate">
    <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Đĩa ăn"><circle cx="60" cy="60" r="58" fill="#fff" stroke="#e3e8ee" stroke-width="2"/><path d="M60 60 L60 6 A54 54 0 0 0 60 114 Z" fill="#4caf7a"/><path d="M60 60 L60 6 A54 54 0 0 1 114 60 Z" fill="#e5484d"/><path d="M60 60 L114 60 A54 54 0 0 1 60 114 Z" fill="#f5c04a"/><text x="30" y="64" font-size="13" text-anchor="middle" fill="#fff" font-weight="700">Rau</text><text x="84" y="44" font-size="12" text-anchor="middle" fill="#fff" font-weight="700">Đạm</text><text x="84" y="86" font-size="12" text-anchor="middle" fill="#5b4300" font-weight="700">Cơm</text></svg>
    <div class="small"><div>🥬 <b>½ rau</b>: luộc, canh, rau sống</div><div>🐟 <b>¼ đạm</b>: cá, thịt nạc, trứng, đậu phụ – cỡ lòng bàn tay</div><div>🍚 <b>¼ tinh bột</b>: cơm, bún, khoai – cỡ nắm tay</div><div class="muted">Ăn rau trước, cơm sau. Chấm nhạt.</div></div></div></div>`;
  if (p.track === 'detail' || ui.forceDetail) {
    const it = E.intake(L) || { kcal: 0, p: 0, c: 0, f: 0 };
    h += `<div class="card"><h3>📒 Đã ăn ${d === E.today() ? 'hôm nay' : E.fmtDate(d)} <span class="r">${n0(it.kcal)}/${n0(m.kcal)} kcal</span></h3>
      <div class="bar"><i style="width:${Math.min(100, it.kcal / m.kcal * 100)}%;${it.kcal > m.kcal * 1.08 ? 'background:var(--bad)' : ''}"></i></div>
      <div class="tiny muted" style="margin:4px 0 6px">Đạm ${n0(it.p)}/${m.protein} g · Tinh bột ${n0(it.c)} g · Béo ${n0(it.f)} g</div>
      ${['sang', 'trua', 'toi', 'phu'].map(k => { const arr = (L.meals && L.meals[k]) || []; return `<div style="margin-top:8px"><div class="row"><b class="small">${E.MEAL_NAMES[k]}</b><span class="sp"></span><button class="btn sm ghost" data-a="addFood" data-v="${k}">+ Thêm</button></div>
        ${arr.map((x, i) => `<div class="row small" style="padding:4px 0"><span class="sp">${FOOD[x.f] ? FOOD[x.f].name : x.f} <span class="muted">${FOOD[x.f] ? fmtQ(FOOD[x.f], x.q) : x.q}</span></span><span class="muted">${n0(FOOD[x.f] ? FOOD[x.f].kcal * x.q : 0)} kcal</span><button class="info-i" data-a="rmFood" data-v="${k}" data-i="${i}">✕</button></div>`).join('')}</div>`; }).join('')}</div>`;
  } else h += `<div class="card"><p class="small muted" style="margin:0 0 8px">Bạn đang theo dõi ăn uống ở mức "${p.track === 'plate' ? 'đĩa ăn cân đối' : 'thói quen'}". Muốn biết chính xác calo? Thử ghi chi tiết.</p><button class="btn sm line" data-a="forceDetail">📒 Ghi chi tiết món ăn hôm nay</button></div>`;
  h += `<div class="card"><h3>🍱 Thực đơn gợi ý <span class="r">${mn.name}</span></h3>
    ${Object.entries(mn.meals).map(([k, arr]) => arr.length ? `<div style="margin:6px 0"><b class="small">${E.MEAL_NAMES[k]}</b> <span class="tiny muted">${n0(arr.reduce((s, [f, q]) => s + FOOD[f].kcal * q, 0))} kcal</span><div class="small">${arr.map(([f, q]) => `${FOOD[f].name} <span class="muted">(${fmtQ(FOOD[f], q)})</span>`).join(' · ')}</div></div>` : '').join('')}
    <div class="note ok"><span class="ni">📊</span><span>Tổng ~${n0(mn.tot.kcal)} kcal · đạm ${mn.tot.p} g (mục tiêu ${m.protein} g)${mn.tot.p < m.protein * 0.85 ? ' – thêm 1–2 quả trứng hoặc 1 hộp sữa để đủ đạm' : ''}.</span></div>
    <div class="row wrap"><button class="btn sm line" data-a="menuShift">🔄 Đổi thực đơn</button>${autoVeg ? `<span class="tag" style="background:var(--ok-soft);color:var(--ok)">🌕 ${p.diet === 'chay' ? 'Ăn chay' : lunarLabel(d) + ' – thực đơn chay'}</span>` : `<button class="btn sm ${ui.vegToday ? '' : 'line'}" data-a="vegToday">🥦 ${ui.vegToday ? 'Đang ăn chay' : 'Hôm nay ăn chay'}</button>`}<button class="btn sm ghost" data-a="copyMenu">📥 Chép vào nhật ký</button></div></div>`;
  h += `<div class="card"><h3>🇻🇳 Mẹo ăn uống kiểu Việt</h3><div class="small md"><ul>
    <li>Phở, bún buổi sáng: xin <b>ít bánh, thêm rau, thêm thịt</b>; không húp hết nước dùng (nhiều muối).</li>
    <li>Cơm văn phòng: chọn 1 món luộc/hấp + 1 món rau, <b>xin ít cơm</b>, tránh món chiên ngập dầu.</li>
    <li>Bánh mì: chọn trứng/thịt nạc, bớt pate, bơ.</li><li>Trà sữa: 30% đường, bỏ trân châu, size nhỏ – hoặc thay bằng trà đá, nước ép không đường.</li>
    <li>Đám cưới, tiệc: ăn nhẹ trước khi đi, ưu tiên món luộc, nộm, hải sản; uống xen kẽ nước lọc.</li>
    <li>Ngày rằm, mùng 1 ăn chay: chú ý đủ đạm từ đậu phụ, nấm, sữa đậu nành; tránh đồ chay chiên rán nhiều dầu.</li></ul></div>
    <div class="row wrap"><button class="btn sm line" data-a="foodTable">📖 Bảng calo món Việt</button><button class="btn sm line" data-a="lesson" data-v="plate">Đĩa ăn cân đối</button><button class="btn sm line" data-a="lesson" data-v="protein">Ăn đủ đạm</button></div></div>`;
  return h;
}

// ---------- BÁO CÁO ----------
function tabReport() {
  const p = P(), k = ui.repKind, r = E.report(p, k, ui.repOff), m = E.metrics(p);
  let h = `<div class="seg no-print">${[['week', 'Tuần'], ['month', 'Tháng'], ['year', 'Năm']].map(([x, l]) => `<button class="${k === x ? 'on' : ''}" data-a="repKind" data-v="${x}">${l}</button>`).join('')}</div>
  <div class="row" style="margin:6px 0"><button class="btn sm line no-print" data-a="repOff" data-v="-1">‹</button><b class="sp c">${r.label}</b><button class="btn sm line no-print" data-a="repOff" data-v="1" ${ui.repOff >= 0 ? 'disabled' : ''}>›</button></div>`;
  if (!r.nDays) return h + `<div class="card empty">Chưa có dữ liệu trong khoảng thời gian này.<br>Hành trình của ${esc(p.name)} bắt đầu từ ${E.fmtDate(p.start)}/${p.start.slice(0, 4)}.</div>`;
  h += `<div class="card"><div class="row"><div class="kpi"><span class="v" style="color:${r.adherence >= 80 ? 'var(--ok)' : r.adherence >= 50 ? 'var(--warn)' : 'var(--bad)'}">${r.adherence}%</span><span class="muted">tuân thủ</span></div><span class="sp"></span><span class="small muted">${r.activeDays}/${r.nDays} ngày có hoạt động</span></div>
    <div class="grid3" style="margin-top:10px">
    <div class="stat"><div class="v">${r.done}${r.planned ? '/' + r.planned : ''}</div><div class="l">Buổi tập</div></div><div class="stat"><div class="v">${n0(r.minutes)}</div><div class="l">Phút tập</div></div><div class="stat"><div class="v">${n0(r.kcalOut)}</div><div class="l">kcal đốt khi tập</div></div>
    <div class="stat"><div class="v">${r.hRate}%</div><div class="l">Thói quen</div></div><div class="stat"><div class="v">${r.wDelta == null ? '–' : (r.wDelta > 0 ? '+' : '') + n1(r.wDelta)}</div><div class="l">Cân nặng (kg)</div></div><div class="stat"><div class="v">${n1(r.sleep)}</div><div class="l">Ngủ TB (giờ)</div></div>
    <div class="stat"><div class="v">${n1(r.water)}</div><div class="l">Nước TB (cốc)</div></div><div class="stat"><div class="v">${n0(r.steps)}</div><div class="l">Bước TB</div></div><div class="stat"><div class="v">${n0(r.kcalIn)}</div><div class="l">kcal ăn TB</div></div></div></div>`;
  // phút tập
  let vals, labels;
  if (k === 'year') { vals = Array(12).fill(0); r.days.forEach(x => vals[+x.date.slice(5, 7) - 1] += x.minutes); labels = Array.from({ length: 12 }, (_, i) => 'T' + (i + 1)); }
  else { const R = E.periodRange(k, ui.repOff); vals = []; labels = []; for (let d = R.from; d <= R.to; d = E.addDays(d, 1)) { const x = r.days.find(y => y.date === d); vals.push(x ? x.minutes : 0); labels.push(k === 'week' ? E.DOW[E.dowMon(d)] : String(+d.slice(8))); } }
  h += `<div class="card"><h3>⏱️ Phút tập luyện</h3>${chart((g, w, hh) => drawBars(g, w, hh, vals, labels, '#14b37d', k === 'year' ? null : E.effMinutes(p)), 170)}</div>`;
  const R = E.periodRange(k, ui.repOff), x0 = 0, x1 = E.diffDays(R.from, R.to);
  const wpts = r.weights.map(([d, w]) => [E.diffDays(R.from, d), w]);
  const series = [{ pts: wpts, color: '#14b37d', dots: true }];
  if (p.targetWeight) series.push({ pts: [[x0, p.targetWeight], [x1, p.targetWeight]], color: '#f59e0b', dash: [5, 5], w: 1.5 });
  h += `<div class="card"><h3>⚖️ Cân nặng ${r.wDelta != null ? `<span class="r">${r.wDelta > 0 ? '+' : ''}${n1(r.wDelta)} kg</span>` : ''}</h3>${chart((g, w, hh) => drawLine(g, w, hh, wpts.length ? series : [{ pts: [] }], x0, x1, x => E.fmtDate(E.addDays(R.from, x))), 170)}
    ${p.targetWeight ? `<p class="tiny muted c" style="margin:0"><span style="color:#f59e0b">- - -</span> mục tiêu ${p.targetWeight} kg</p>` : ''}</div>`;
  // bản đồ nhiệt
  const lv = x => x ? Math.min(4, (x.done ? 2 : 0) + Math.round(x.habitDone / Math.max(1, x.habitTotal) * 2)) : 0;
  if (k === 'year') {
    const start = E.addDays(R.from, -E.dowMon(R.from)); const cells = [];
    for (let d = start; d <= R.to; d = E.addDays(d, 1)) { const x = r.days.find(y => y.date === d); cells.push(d < R.from ? '<i class="x"></i>' : `<i class="l${lv(x)}" title="${d}"></i>`); }
    h += `<div class="card"><h3>🗓️ Bản đồ chăm chỉ cả năm</h3><div class="heat" style="grid-template-rows:repeat(7,1fr);grid-auto-flow:column;grid-auto-columns:1fr;gap:2px">${cells.join('')}</div><p class="tiny muted" style="margin:6px 0 0">Đậm hơn = tập + hoàn thành nhiều thói quen hơn.</p></div>`;
  } else if (k === 'month') {
    const cells = Array.from({ length: E.dowMon(R.from) }, () => '<i class="x"></i>');
    for (let d = R.from; d <= R.to; d = E.addDays(d, 1)) { const x = r.days.find(y => y.date === d); cells.push(`<i class="l${lv(x)}" style="display:grid;place-items:center;font-size:10px;color:${lv(x) >= 3 ? '#fff' : 'var(--muted)'}">${+d.slice(8)}</i>`); }
    h += `<div class="card"><h3>🗓️ Lịch chăm chỉ</h3><div class="heat" style="grid-template-columns:repeat(7,1fr)">${E.DOW.map(x => `<span class="tiny muted c">${x}</span>`).join('')}${cells.join('')}</div></div>`;
  }
  h += `<div class="card"><h3>🧑‍🏫 Nhận xét của HLV</h3>${r.comments.map(c => `<div class="note ${c.lv}"><span class="ni">${c.lv === 'ok' ? '👏' : c.lv === 'warn' ? '💡' : '⚠️'}</span><span>${c.t}</span></div>`).join('')}
    ${k === 'week' && ui.repOff === 0 ? (() => { const ev = E.evaluate(p); return `<div class="note ok"><span class="ni">🧭</span><span>${ev.t}</span></div>`; })() : ''}</div>`;
  { const fr = PH.pid === p.id ? PH.list.filter(x => x.pose === 'front') : []; const a = fr[0], b = fr[fr.length - 1];
    h += `<div class="card"><h3>📸 Ảnh trước – sau <span class="r">${PH.pid === p.id ? PH.list.length : 0} ảnh</span></h3>${a && b && a !== b ? `<div class="grid2"><div><img src="${a.data}" style="width:100%;border-radius:10px;aspect-ratio:3/4;object-fit:cover"><div class="tiny muted c">${E.fmtDate(a.date)}</div></div><div><img src="${b.data}" style="width:100%;border-radius:10px;aspect-ratio:3/4;object-fit:cover"><div class="tiny muted c">${E.fmtDate(b.date)}</div></div></div>` : '<p class="small muted" style="margin:0">Chụp ảnh định kỳ 2–4 tuần/lần để so sánh trước – sau.</p>'}<button class="btn sm ghost" style="margin-top:8px" data-a="photos">Mở ảnh tiến độ ›</button></div>`; }
  h += `<div class="card"><h3>🏅 Huy hiệu</h3><div class="grid3">${E.badges(p).map(b => `<div class="badge ${b.got ? '' : 'off'}"><div class="e">${b.icon}</div><div class="n">${b.name}</div><div class="tiny muted">${b.d}</div></div>`).join('')}</div></div>
  <div class="row no-print"><button class="btn line sp" data-a="print">🖨️ In / lưu PDF</button><button class="btn line sp" data-a="export">💾 Sao lưu dữ liệu</button></div>`;
  return h;
}

// =====================================================================
// TRANG CON
// =====================================================================
function renderPage(pg) {
  const top = t => `<div class="page-top"><button class="back" data-a="back" aria-label="Quay lại">‹</button><h2>${t}</h2></div>`;
  const p = P();
  if (pg.type === 'ex') {
    const e = EX[pg.arg], ok = E.allowed(p, e);
    const dosage = e.type === 'time' ? 'Giữ / thực hiện theo thời gian' : 'Đếm số lần';
    return top(e.name) + `<div class="v3d" data-v3d="${e.id}">${v3dCtl()}<div class="v3d-hint" style="z-index:2">Kéo để xoay · chụm để phóng</div></div>
    <div class="card"><div>${e.primary.map(m => `<span class="tag p" data-a="muscleGo" data-v="${m}">${MUSCLES[m].name}</span>`).join('')}${e.secondary.map(m => `<span class="tag s" data-a="muscleGo" data-v="${m}">${MUSCLES[m].name}</span>`).join('')}</div>
      <div class="small muted" style="margin-top:6px">${e.en} · ${CATS[e.cat]} · Cấp ${e.level}/3 · ${dosage} · Dụng cụ: ${e.equip.length ? e.equip.map(x => EQUIP[x]).join(', ') : 'không cần'}</div>
      ${ok ? '' : `<div class="note bad"><span class="ni">⚠️</span><span>Bài này <b>không phù hợp</b> với tình trạng sức khỏe hoặc dụng cụ hiện tại của bạn. ${e.easier ? 'Hãy dùng bài dễ hơn bên dưới.' : ''}</span></div>`}</div>
    <div class="card"><h3>📋 Các bước thực hiện</h3><ol class="steps">${e.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="note ok"><span class="ni">🌬️</span><span><b>Hơi thở:</b> ${esc(e.breath)}</span></div></div>
    <div class="card"><h3>❌ Lỗi thường gặp → ✅ Cách sửa</h3>${e.mistakes.map(([x, v]) => `<div class="mist"><div class="x">❌ ${esc(x)}</div><div class="v">✅ ${esc(v)}</div></div>`).join('')}</div>
    <div class="card"><h3>🛡️ An toàn</h3>${e.safety.map(s => `<div class="note warn"><span class="ni">⚠️</span><span>${esc(s)}</span></div>`).join('')}
      <div class="note ok"><span class="ni">💡</span><span>${esc(e.tips)}</span></div></div>
    ${e.easier || e.harder ? `<div class="card"><h3>🔁 Biến thể</h3>${e.easier ? exRow(EX[e.easier], 'Dễ hơn') : ''}${e.harder ? exRow(EX[e.harder], 'Khó hơn') : ''}</div>` : ''}`;
  }
  if (pg.type === 'session') {
    const d = pg.arg, plan = E.planFor(p, d), se = plan.session || E.buildSession(p, 'M');
    const row = it => { const e = EX[it.ex]; return `<div class="list-item" data-a="ex" data-v="${e.id}"><span class="thumb" data-thumb="${e.id}">🏃</span><span class="sp"><div class="b small">${e.name}</div><div class="tiny muted">${it.sets > 1 ? it.sets + ' hiệp × ' : ''}${it.reps ? it.reps + ' lần' : it.secs + ' giây'}${E.PER_SIDE.includes(it.ex) ? ' mỗi bên' : ''}${it.rest ? ` · nghỉ ${it.rest}s` : ''}</div></span>
      ${['warm', 'cool'].includes(it._ph) ? '' : `<span class="row" style="gap:4px"><button class="btn sm line" data-a="adj" data-v="${e.pattern}" data-d="-1" title="Dễ hơn">−</button><button class="btn sm line" data-a="adj" data-v="${e.pattern}" data-d="1" title="Khó hơn">+</button></span>`}</div>`; };
    setTimeout(fillThumbs, 30);
    return top(`${E.DOW_FULL[E.dowMon(d)]} ${E.fmtDate(d)}`) + `<div class="card hero"><div class="b" style="font-size:18px">${se.icon || E.TYPE_ICON[se.type]} ${se.name}</div><div class="muted small">${se.minutes} phút · ~${se.kcal} kcal · ${se.circuit ? `tập vòng (circuit) ${se.main[0] ? se.main[0].sets : 1} vòng` : 'tập theo hiệp'}</div>
      <button class="btn white block" style="margin-top:10px" data-a="start" data-v="${d}">▶ Bắt đầu buổi tập</button></div>
    <div class="card"><h3>🔥 Khởi động</h3>${se.warm.map(i => row({ ...i, _ph: 'warm' })).join('')}</div>
    <div class="card"><h3>💪 Bài chính</h3><p class="tiny muted" style="margin:0">Nút − / + để đổi bài dễ hơn / khó hơn cho nhóm động tác đó (áp dụng cho các buổi sau).</p>${se.main.map(i => row(i)).join('')}</div>
    <div class="card"><h3>🧘 Thả lỏng</h3>${se.cool.map(i => row({ ...i, _ph: 'cool' })).join('')}</div>`;
  }
  if (pg.type === 'lesson') {
    const l = LESSONS.find(x => x.id === pg.arg);
    return top(l.title) + `<div class="card md"><div style="font-size:42px">${l.icon}</div><h3 style="font-size:19px">${l.title}</h3>${l.body.map(([t, c]) => t === 'p' ? `<p>${md(c)}</p>` : t === 'h' ? `<h4>${esc(c)}</h4>` : `<ul>${c.map(x => `<li>${md(x)}</li>`).join('')}</ul>`).join('')}</div>
      <p class="tiny muted c">Nội dung mang tính giáo dục sức khỏe chung, không thay thế chẩn đoán và điều trị của bác sĩ.</p>`;
  }
  if (pg.type === 'food') {
    const meal = pg.arg, groups = ['all', ...new Set(FOODS.map(f => f.group))];
    return top(`Thêm vào ${E.MEAL_NAMES[meal] || 'bữa ăn'}`) + `<input class="in" id="foodQ" placeholder="🔍 Tìm món: phở, cơm, trứng…" autocomplete="off">
      <div class="chips" style="margin:10px 0">${groups.map(g => `<span class="chip ${ui.foodGroup === g ? 'on' : ''}" data-a="foodGroup" data-v="${g}">${g === 'all' ? 'Tất cả' : g}</span>`).join('')}</div>
      <div class="card" id="foodList">${FOODS.filter(f => ui.foodGroup === 'all' || f.group === ui.foodGroup).map(f => `<div class="list-item" data-a="pickFood" data-v="${f.id}" data-name="${esc(f.name.toLowerCase())}"><span class="sp"><div class="b small">${f.name}</div><div class="tiny muted">${f.unit} · Đ ${f.p}g · TB ${f.c}g · B ${f.f}g</div></span><b class="small">${f.kcal}</b><span class="tiny muted">kcal</span></div>`).join('')}</div>`;
  }
  if (pg.type === 'foodTable') {
    return top('Bảng calo món Việt') + `<p class="small muted">Giá trị ước tính cho khẩu phần phổ biến; thực tế thay đổi theo cách nấu và lượng dầu mỡ.</p>
      ${[...new Set(FOODS.map(f => f.group))].map(g => `<div class="card"><h3>${g}</h3>${FOODS.filter(f => f.group === g).map(f => `<div class="row small" style="padding:5px 0;border-bottom:1px solid var(--line)"><span class="sp">${f.name} <span class="muted tiny">${f.unit}</span></span><b>${f.kcal}</b><span class="tiny muted" style="width:72px;text-align:right">Đạm ${f.p}g</span></div>`).join('')}</div>`).join('')}`;
  }
  if (pg.type === 'photos') return top('Ảnh tiến độ') + photosPage();
  if (pg.type === 'guide') return top('Hướng dẫn sử dụng') + guidePage();
  if (pg.type === 'about') return top('Giới thiệu & ủng hộ') + aboutPage();
  return top('') + '<div class="empty">Không tìm thấy trang.</div>';
}

// ---------- ẢNH TIẾN ĐỘ ----------
const POSES = { front: 'Chính diện', side: 'Nghiêng', back: 'Phía sau' };
function photosPage() {
  const p = P();
  if (!PH.ok) return `<div class="card empty">Trình duyệt không cho phép lưu ảnh (IndexedDB bị tắt hoặc đang ở chế độ ẩn danh).</div>`;
  const all = PH.pid === p.id ? PH.list : [], list = all.filter(x => x.pose === ui.phPose);
  const dates = [...new Set(list.map(x => x.date))];
  const A = list.find(x => x.date === (ui.cmpA || dates[0])) || list[0], B = list.find(x => x.date === (ui.cmpB || dates[dates.length - 1])) || list[list.length - 1];
  const wAt = d => { const k = Object.keys(p.logs || {}).filter(x => x <= d && p.logs[x].w).sort().pop(); return k ? +p.logs[k].w : null; };
  const zAt = d => { const k = Object.keys(p.logs || {}).filter(x => x <= d && p.logs[x].waist).sort().pop(); return k ? +p.logs[k].waist : null; };
  let h = `<div class="card"><h3>📷 Chụp ảnh mới</h3><div class="seg" style="margin-top:0">${Object.entries(POSES).map(([k, l]) => `<button class="${ui.phPose === k ? 'on' : ''}" data-a="phPose" data-v="${k}">${l}</button>`).join('')}</div>
    <div class="row" style="margin-top:8px"><button class="btn sp" data-a="addPhoto" data-v="cam">📸 Chụp ngay</button><button class="btn line sp" data-a="addPhoto" data-v="lib">🖼️ Chọn ảnh có sẵn</button></div>
    <p class="tiny muted" style="margin:8px 0 0">Ảnh được thu nhỏ và <b>chỉ lưu trên máy này</b>, không gửi đi đâu. Nhắc chụp: ${[14, 28].map(n => `<span class="chip ${(p.photoEvery || 14) === n ? 'on' : ''}" data-a="photoEvery" data-v="${n}" style="padding:3px 9px;font-size:12px">${n / 7} tuần/lần</span>`).join(' ')}</p></div>`;
  if (A && B && A !== B) {
    const dw = wAt(B.date) != null && wAt(A.date) != null ? Math.round((wAt(B.date) - wAt(A.date)) * 10) / 10 : null, dz = zAt(B.date) != null && zAt(A.date) != null ? Math.round((zAt(B.date) - zAt(A.date)) * 10) / 10 : null;
    h += `<div class="card"><h3>🔍 So sánh trước – sau <span class="r">${E.diffDays(A.date, B.date)} ngày</span></h3>
      <div class="inrow"><select class="in" data-a2="cmpA">${dates.map(d => `<option ${d === A.date ? 'selected' : ''}>${d}</option>`).join('')}</select><select class="in" data-a2="cmpB">${dates.map(d => `<option ${d === B.date ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
      <div class="seg">${[['side', 'Cạnh nhau'], ['slide', 'Trượt so sánh']].map(([k, l]) => `<button class="${ui.phMode === k ? 'on' : ''}" data-a="phMode" data-v="${k}">${l}</button>`).join('')}</div>
      ${ui.phMode === 'side' ? `<div class="grid2"><div><img src="${A.data}" style="width:100%;border-radius:12px;aspect-ratio:3/4;object-fit:cover"><div class="small c b">Trước · ${E.fmtDate(A.date)}</div></div><div><img src="${B.data}" style="width:100%;border-radius:12px;aspect-ratio:3/4;object-fit:cover"><div class="small c b">Sau · ${E.fmtDate(B.date)}</div></div></div>`
      : `<div style="position:relative;border-radius:12px;overflow:hidden;aspect-ratio:3/4;background:#000"><img src="${B.data}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"><img id="cmpTop" src="${A.data}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;clip-path:inset(0 50% 0 0)"><div id="cmpLine" style="position:absolute;top:0;bottom:0;left:50%;width:2px;background:#fff;box-shadow:0 0 4px #000"></div>
         <span class="tag" style="position:absolute;left:8px;top:8px;background:rgba(0,0,0,.6);color:#fff">Trước ${E.fmtDate(A.date)}</span><span class="tag" style="position:absolute;right:8px;top:8px;background:rgba(0,0,0,.6);color:#fff">Sau ${E.fmtDate(B.date)}</span></div>
         <input type="range" id="cmpRange" min="0" max="100" value="50" style="width:100%;margin-top:8px" aria-label="Trượt để so sánh">`}
      <div class="grid2" style="margin-top:8px"><div class="stat"><div class="v">${dw == null ? '–' : (dw > 0 ? '+' : '') + n1(dw) + ' kg'}</div><div class="l">Cân nặng thay đổi</div></div><div class="stat"><div class="v">${dz == null ? '–' : (dz > 0 ? '+' : '') + n1(dz) + ' cm'}</div><div class="l">Vòng eo thay đổi</div></div></div></div>`;
  } else h += `<div class="card"><p class="small muted" style="margin:0">Cần ít nhất 2 ngày chụp ảnh (cùng góc "${POSES[ui.phPose]}") để so sánh. Chụp ảnh đầu tiên hôm nay làm mốc "trước" nhé!</p></div>`;
  const byDate = {}; all.forEach(x => (byDate[x.date] = byDate[x.date] || []).push(x));
  h += `<div class="card"><h3>🗂️ Thư viện ảnh <span class="r">${all.length} ảnh</span></h3>${Object.keys(byDate).sort().reverse().map(d => `<div style="margin:8px 0"><div class="small b">${E.fmtDate(d)}/${d.slice(0, 4)} ${wAt(d) ? `<span class="muted">· ${n1(wAt(d))} kg</span>` : ''}</div><div class="row wrap" style="gap:6px;margin-top:4px">${byDate[d].map(x => `<img src="${x.data}" data-a="viewPhoto" data-v="${x.id}" style="width:72px;height:96px;object-fit:cover;border-radius:8px;cursor:pointer" alt="${POSES[x.pose]}">`).join('')}</div></div>`).join('') || '<div class="empty">Chưa có ảnh nào.</div>'}</div>
  <div class="card"><h3>💡 Chụp sao cho so sánh chính xác</h3><div class="small md"><ul>
    <li>Cùng <b>thời điểm</b> (sáng, sau khi đi vệ sinh, trước khi ăn), cùng <b>địa điểm, ánh sáng</b> và nền tường trơn.</li>
    <li>Cùng <b>trang phục</b> ôm sát (đồ tập), đứng thẳng thả lỏng, không gồng hay hóp bụng.</li>
    <li>Đặt điện thoại cố định ngang thắt lưng, cách 2–3 m (kê lên kệ, hẹn giờ 10 giây).</li>
    <li>Chụp đủ 3 góc: chính diện – nghiêng – phía sau.</li>
    <li>Thay đổi thường thấy rõ sau 4–8 tuần; đừng nản nếu 2 tuần đầu chưa thấy khác.</li></ul></div></div>`;
  return h;
}
function guidePage() {
  const sec = (icon, t, items) => `<div class="card md"><h3>${icon} ${t}</h3><ul>${items.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
  return `<div class="card hero"><div class="b" style="font-size:18px">Chào mừng đến với HLV Sức Khỏe 💪</div><div class="small muted" style="margin-top:4px">Huấn luyện viên bỏ túi giúp bạn thay đổi từ những thói quen nhỏ nhất. Đọc 3 phút để dùng hiệu quả nhất.</div></div>`
  + sec('🚀', '1. Bắt đầu', ['Mở ứng dụng → <b>Bắt đầu</b> → điền 7 bước: thông tin cơ bản, sức khỏe, thể lực, thời gian, cách tập & ăn, mục tiêu.', 'Bước <b>Thể lực</b>: có thể làm nhanh 3 bài kiểm tra (chống đẩy, ngồi–đứng ghế 30 giây, plank) để HLV chọn độ khó phù hợp – hoặc bỏ qua.', 'Ở bước <b>Kết quả đánh giá</b>: nếu mục tiêu quá nhanh/không an toàn, HLV hiện gợi ý; chạm 👉 để áp dụng ngay.', 'Có thể sửa hồ sơ bất kỳ lúc nào: chạm biểu tượng hồ sơ góc phải → <b>Sửa hồ sơ</b>.'])
  + sec('🏠', '2. Màn hình Hôm nay', ['Thẻ xanh: lời chào, ngày dương & âm lịch, giai đoạn, chuỗi ngày 🔥. Nút ‹ › để ghi bù ngày trước.', '<b>Buổi tập hôm nay</b>: chạm ▶ Bắt đầu tập. Ngày nghỉ có gợi ý giãn cơ 10 phút.', '<b>Thói quen nhỏ</b>: tích ✓ khi làm xong; chạm ⓘ để biết vì sao nên làm.', 'Ghi <b>nước</b> (chạm vào cốc), cân nặng, vòng eo, giấc ngủ, số bước, tâm trạng – tự lưu khi nhập xong.'])
  + sec('▶️', '3. Khi tập luyện', ['Màn hình tập có hình người 3D làm mẫu, đồng hồ đếm giờ, giọng đọc tiếng Việt và âm báo.', 'Bài đếm lần: làm xong bấm <b>Xong ✓</b>. Bài tính giờ: tự đếm ngược, có thể ⏸ Dừng.', 'Giữa các hiệp có thời gian nghỉ; bấm <b>+15 giây</b> nếu cần thở thêm.', 'Cuối buổi chấm <b>độ khó cảm nhận 1–10</b>. HLV dựa vào đó để tăng/giảm độ khó các buổi sau.', '⚠️ Dừng ngay nếu đau ngực, chóng mặt, khó thở bất thường hoặc đau nhói khớp.'])
  + sec('🗺️', '4. Lộ trình & lên giai đoạn', ['4 giai đoạn: Thói quen → Nền tảng → Phát triển → Tăng tốc. Giai đoạn đầu chỉ 10 phút/buổi – cố ý để bạn không bỏ cuộc.', 'Mỗi tuần HLV đánh giá: tuân thủ ≥80% → mời lên giai đoạn mới; dưới 50% → gợi ý làm nhẹ hơn.', 'Trong <b>Lịch tập tuần</b>: chạm một ngày để xem chi tiết; dùng nút − / + để đổi bài dễ hơn/khó hơn; chọn lại các ngày tập trong tuần.'])
  + sec('🏋️', '5. Bài tập, nhóm cơ, kiến thức', ['<b>Thư viện</b>: lọc theo loại (sức mạnh, cơ lõi, tim mạch, linh hoạt, bơi & cầu lông, dưỡng sinh, sàn chậu) và nhóm cơ. "Phù hợp tôi" ẩn bài không an toàn với tình trạng sức khỏe hoặc chưa có dụng cụ.', 'Trong mỗi bài: <b>kéo để xoay</b> mô hình 360°, chụm 2 ngón để phóng to, chọn góc Trước/Bên/Sau, 🐢 xem chậm. Màu <b style="color:#e5484d">đỏ</b> = cơ chính, <b style="color:#f5a524">cam</b> = cơ phụ.', '<b>Nhóm cơ</b>: chạm thẳng vào cơ trên mô hình để xem chức năng và bài tập liên quan.', '<b>Kiến thức</b>: 14 bài đọc ngắn về dinh dưỡng, ngủ, an toàn, tuổi teen, phụ nữ, người cao tuổi…'])
  + sec('🍚', '6. Ăn uống & ăn chay theo âm lịch', ['Xem calo, đạm, tinh bột, chất béo mục tiêu và số chén cơm tương đương mỗi ngày.', '<b>Thực đơn gợi ý</b> bằng món Việt, tự điều chỉnh lượng cơm theo mục tiêu; 🔄 để đổi, 📥 để chép vào nhật ký.', 'Ghi bữa ăn: <b>+ Thêm</b> → tìm món (gõ không dấu cũng được) → chọn số phần.', 'Chọn chế độ <b>"Chay mùng 1, rằm"</b> khi tạo hồ sơ: app tự tính ngày âm lịch, nhắc trước 1 ngày và tự chuyển thực đơn sang món chay (có thể chọn kiểu 2, 4 hoặc 10 ngày chay/tháng).'])
  + sec('📸', '7. Ảnh tiến độ trước – sau', ['Vào từ thẻ nhắc trên Hôm nay hoặc tab Báo cáo → <b>Mở ảnh tiến độ</b>.', 'Chọn góc (chính diện/nghiêng/sau) → <b>Chụp ngay</b> hoặc chọn ảnh có sẵn.', 'So sánh 2 ngày bất kỳ theo kiểu <b>cạnh nhau</b> hoặc <b>trượt so sánh</b>, kèm thay đổi cân nặng và vòng eo.', 'App nhắc chụp lại mỗi 2 hoặc 4 tuần. Ảnh chỉ nằm trên máy của bạn.'])
  + sec('📊', '8. Báo cáo', ['Chọn Tuần / Tháng / Năm, dùng ‹ › để xem kỳ trước.', 'Gồm: mức tuân thủ, số buổi & phút tập, calo, thói quen, cân nặng, giấc ngủ, nước, biểu đồ, lịch chăm chỉ, nhận xét của HLV và huy hiệu.', 'Bấm <b>In / lưu PDF</b> để lưu hoặc gửi cho bác sĩ, người thân.'])
  + sec('👨‍👩‍👧', '9. Gia đình, sao lưu, cài đặt', ['Chạm biểu tượng hồ sơ → <b>+ Thêm thành viên</b> (từ 12 tuổi). Chạm tên để chuyển hồ sơ.', '<b>Sao lưu</b> mỗi tháng: tạo tệp .json (có thể kèm ảnh) – lưu vào Google Drive/Zalo của bạn. Đổi máy thì <b>Khôi phục</b> từ tệp này.', 'Bật/tắt giọng đọc và âm báo trong phần Cài đặt.'])
  + sec('📱', '10. Cài lên điện thoại', ['Địa chỉ ứng dụng: <b>' + APP_URL + '</b>', '<b>iPhone</b>: mở link bằng Safari → nút Chia sẻ → <b>Thêm vào MH chính</b>.', '<b>Android</b>: mở bằng Chrome → <b>Cài đặt ứng dụng</b> (hoặc menu ⋮ → Thêm vào màn hình chính).', 'Lần đầu cần mạng; sau đó dùng được cả khi không có mạng.'])
  + sec('❓', 'Câu hỏi thường gặp', ['<b>Vì sao chỉ tập 10 phút?</b> Giai đoạn đầu ưu tiên tạo thói quen. Làm đều 2 tuần, HLV sẽ mời bạn lên cấp.', '<b>Cân nặng không giảm?</b> Cân dao động do nước; xem xu hướng theo tuần, kiểm tra đồ uống có đường, bia rượu, lượng cơm.', '<b>Mất dữ liệu khi xóa app?</b> Có – hãy sao lưu định kỳ.', '<b>Góp ý, báo lỗi?</b> Gửi email ' + EMAIL + '.'])
  + `<button class="btn line block" data-a="about">ℹ️ Giới thiệu, bản quyền & ủng hộ</button>`;
}
function aboutPage() {
  return `<div class="card c"><div style="font-size:56px">💪</div><h3 style="justify-content:center;font-size:19px">HLV Sức Khỏe</h3><div class="small muted">Phiên bản ${VERSION} · Huấn luyện viên sức khỏe cá nhân cho người Việt</div></div>
  <div class="card"><h3>🙏 Cảm ơn bạn đã sử dụng</h3><p class="small" style="margin:0">Ứng dụng được làm ra với mong muốn ai cũng có thể bắt đầu sống khỏe từ những bước nhỏ nhất – miễn phí, không quảng cáo, không thu thập dữ liệu. Cảm ơn bạn đã tin dùng và kiên trì cùng HLV!</p></div>
  <div class="card c"><h3 style="justify-content:center">☕ Mời người phát triển một ly cà phê</h3><p class="small muted" style="margin:0 0 8px">Nếu bạn thấy ứng dụng hữu ích và muốn ủng hộ người phát triển duy trì, cải tiến, bạn có thể chuyển khoản tùy tâm qua mã VietQR dưới đây. Mọi sự ủng hộ đều là động lực rất lớn. Xin chân thành cảm ơn!</p>
    <img src="img/qr_ung_ho.png" alt="Mã VietQR ủng hộ" style="width:min(240px,70%);border-radius:12px;border:1px solid var(--line);background:#fff;padding:6px">
    <div class="small" style="margin-top:6px"><b>${BANK.name}</b><br>${BANK.bank} · <b>${BANK.acc}</b></div>
    <div class="row" style="justify-content:center;margin-top:8px"><button class="btn sm line" data-a="copy" data-v="${BANK.acc}">📋 Chép số tài khoản</button></div>
    <p class="tiny muted" style="margin:8px 0 0">Mở ứng dụng ngân hàng → Quét QR (hoặc chụp màn hình rồi chọn ảnh QR). Ủng hộ là hoàn toàn tự nguyện; ứng dụng vẫn miễn phí đầy đủ tính năng.</p></div>
  <div class="card"><h3>🔗 Chia sẻ ứng dụng</h3><p class="small" style="margin:0 0 8px">Gửi link này cho người thân, bạn bè để cùng sống khỏe:<br><b style="word-break:break-all">${APP_URL}</b></p>
    <div class="row wrap"><button class="btn sm ghost" data-a="shareApp">📤 Chia sẻ</button><button class="btn sm line" data-a="copy" data-v="${APP_URL}">📋 Chép link</button><a class="btn sm line" href="${REPO_URL}" target="_blank" rel="noopener">🐙 Trang GitHub</a></div></div>
  <div class="card"><h3>✉️ Liên hệ, góp ý</h3><p class="small" style="margin:0 0 8px">Mọi góp ý, báo lỗi, đề xuất tính năng xin gửi về: <b>${EMAIL}</b></p><div class="row"><a class="btn sm ghost" href="mailto:${EMAIL}?subject=${encodeURIComponent('Góp ý HLV Sức Khỏe v' + VERSION)}">✉️ Gửi email</a><button class="btn sm line" data-a="copy" data-v="${EMAIL}">📋 Chép địa chỉ</button></div></div>
  <div class="card md"><h3>⚖️ Miễn trừ trách nhiệm</h3><ol class="small" style="padding-left:18px;margin:4px 0">
    <li>Ứng dụng cung cấp thông tin và hướng dẫn <b>mang tính giáo dục sức khỏe chung</b>, không phải là tư vấn, chẩn đoán hay điều trị y khoa, và không thay thế ý kiến của bác sĩ, chuyên gia dinh dưỡng hay huấn luyện viên được đào tạo.</li>
    <li>Hãy <b>hỏi ý kiến bác sĩ trước khi bắt đầu</b> chương trình tập luyện/ăn uống mới, đặc biệt nếu bạn có bệnh tim mạch, tăng huyết áp, tiểu đường, bệnh xương khớp, đang mang thai, sau sinh, mới phẫu thuật, hoặc dưới 18 tuổi (cần có cha mẹ/người giám hộ đồng hành).</li>
    <li>Các chỉ số (BMI, BMR, TDEE, calo, đạm…) và giá trị dinh dưỡng món ăn là <b>ước tính</b> theo công thức phổ biến; nhu cầu thực tế của mỗi người có thể khác.</li>
    <li>Bạn tự chịu trách nhiệm về việc áp dụng các bài tập và chế độ ăn. <b>Dừng ngay</b> và tìm hỗ trợ y tế khi có dấu hiệu bất thường (đau ngực, khó thở, chóng mặt, đau nhói khớp…). Cấp cứu: gọi <b>115</b>.</li>
    <li>Mô hình 3D chỉ minh họa động tác; hãy đọc kỹ hướng dẫn chữ và lưu ý an toàn. Tập bơi, xà đơn, cầu lông cần môi trường an toàn và người giám sát khi cần.</li>
    <li>Dữ liệu (kể cả ảnh) chỉ lưu trên thiết bị của bạn; người phát triển không thu thập và không chịu trách nhiệm khi dữ liệu bị mất do xóa ứng dụng, đổi máy hay lỗi thiết bị – hãy sao lưu định kỳ.</li>
    <li>Người phát triển không chịu trách nhiệm cho bất kỳ thiệt hại trực tiếp hay gián tiếp nào phát sinh từ việc sử dụng ứng dụng.</li></ol></div>
  <div class="card"><h3>©️ Bản quyền</h3><p class="small" style="margin:0">© ${new Date().getFullYear() > 2026 ? '2026–' + new Date().getFullYear() : '2026'} ${AUTHOR}. Bảo lưu mọi quyền. Nội dung, bài tập, thực đơn và mã nguồn ứng dụng thuộc quyền của tác giả; được phép sử dụng miễn phí cho mục đích cá nhân, phi thương mại. Không sao chép, phân phối lại hoặc sử dụng vì mục đích thương mại khi chưa có sự đồng ý bằng văn bản của tác giả.</p>
    <p class="tiny muted" style="margin:8px 0 0">Thành phần bên thứ ba: three.js © 2010–2024 three.js authors (giấy phép MIT). Âm lịch tính theo thuật toán của Hồ Ngọc Đức. Chuẩn BMI theo tuổi tham khảo WHO 2007; ngưỡng BMI người trưởng thành theo khuyến nghị cho người châu Á.</p></div>`;
}

// ---------- BẢNG TRƯỢT (SHEET) ----------
function renderSheet() {
  const s = ui.sheet, p = P();
  let h = '';
  if (s.type === 'profiles') {
    h = `<h3 style="margin:0 0 8px">👨‍👩‍👧 Hồ sơ</h3>${S.profiles.map(x => { const a = E.age(x); return `<div class="list-item" data-a="switch" data-v="${x.id}"><span class="avatar">${esc(x.avatar)}</span><span class="sp"><div class="b">${esc(x.name)}</div><div class="tiny muted">${a} tuổi · ${GOALS[x.goal].name}</div></span>${x.id === S.active ? '✅' : ''}</div>`; }).join('')}
    <div class="fab-row"><button class="btn ghost sp" data-a="addProfile">+ Thêm thành viên</button><button class="btn line sp" data-a="editProfile">✏️ Sửa hồ sơ</button></div>
    <hr class="sep"><h3 style="margin:0 0 6px">⚙️ Cài đặt</h3>
    <div class="check ${S.settings.voice ? 'on' : ''}" data-a="setting" data-v="voice"><span class="box">✓</span><span class="txt" style="text-decoration:none;color:inherit">🗣️ Giọng đọc hướng dẫn khi tập</span></div>
    <div class="check ${S.settings.sound ? 'on' : ''}" data-a="setting" data-v="sound"><span class="box">✓</span><span class="txt" style="text-decoration:none;color:inherit">🔔 Âm báo đếm giờ</span></div>
    <hr class="sep"><h3 style="margin:0 0 6px">💾 Dữ liệu</h3><p class="tiny muted" style="margin:0 0 8px">Dữ liệu chỉ nằm trên máy này. Hãy sao lưu định kỳ (mỗi tháng) để không mất khi đổi máy hoặc xóa ứng dụng.</p>
    <div class="fab-row"><button class="btn line sp" data-a="export">⬇️ Sao lưu</button><button class="btn line sp" data-a="exportPh">⬇️ Sao lưu kèm ảnh</button></div><button class="btn line block" style="margin-top:8px" data-a="import">⬆️ Khôi phục từ tệp</button>
    <hr class="sep"><div class="fab-row"><button class="btn ghost sp" data-a="guide">📖 Hướng dẫn</button><button class="btn ghost sp" data-a="about">☕ Giới thiệu & ủng hộ</button></div>
    <button class="btn line block" style="margin-top:8px;color:var(--bad)" data-a="delProfile">🗑️ Xóa hồ sơ "${esc(p.name)}"</button>
    <p class="tiny muted c" style="margin:12px 0 0">HLV Sức Khỏe v${VERSION} · © 2026 ${AUTHOR} · ${EMAIL}<br>Hướng dẫn mang tính tham khảo, không thay thế tư vấn y khoa.</p>`;
  }
  if (s.type === 'habit') { const H = HABITS[s.id]; h = `<div style="font-size:40px">${H.icon}</div><h3>${H.name}</h3><p>${H.why}</p><button class="btn block" data-a="closeSheet">Đã hiểu</button>`; }
  if (s.type === 'food') {
    const F = FOOD[s.id];
    h = `<h3 style="margin:0">${F.name}</h3><p class="small muted">${F.unit} = ${F.kcal} kcal · Đạm ${F.p} g</p>
      <label class="f">Số phần</label><div class="food-q"><button data-a="fq" data-v="-0.5">−</button><b style="min-width:50px;text-align:center;font-size:20px">${s.q}</b><button data-a="fq" data-v="0.5">+</button><span class="sp"></span><b>${n0(F.kcal * s.q)} kcal</b></div>
      <label class="f">Bữa</label><div class="chips">${Object.entries(E.MEAL_NAMES).map(([k, l]) => `<span class="chip ${s.meal === k ? 'on' : ''}" data-a="fmeal" data-v="${k}">${l}</span>`).join('')}</div>
      <button class="btn block" style="margin-top:14px" data-a="confirmFood">Thêm</button>`;
  }
  if (s.type === 'photo') { const x = PH.list.find(y => y.id === s.id); if (x) h = `<img src="${x.data}" style="width:100%;max-height:62vh;object-fit:contain;border-radius:12px;background:#000"><div class="row" style="margin-top:10px"><span class="sp small">${POSES[x.pose]} · ${E.fmtDate(x.date)}/${x.date.slice(0, 4)}</span><button class="btn sm line" style="color:var(--bad)" data-a="delPhoto" data-v="${x.id}">🗑️ Xóa</button><button class="btn sm" data-a="closeSheet">Đóng</button></div>`; }
  if (s.type === 'confirm') h = `<h3>${s.title}</h3><p class="muted">${s.text}</p><div class="fab-row"><button class="btn line sp" data-a="closeSheet">Hủy</button><button class="btn danger sp" data-a="confirmYes">${s.yes || 'Đồng ý'}</button></div>`;
  return `<div class="sheet-bg" data-a="sheetBg"><div class="sheet">${h}</div></div>`;
}

// =====================================================================
// TRÌNH PHÁT BUỔI TẬP
// =====================================================================
function startPlayer(session, date, extra = false) {
  const steps = [], add = (it, ph, set, sets) => steps.push({ ...it, ph, set, sets });
  session.warm.forEach(it => add(it, 'warm', 1, 1));
  if (session.circuit) { const R = Math.max(...session.main.map(i => i.sets)); for (let r = 1; r <= R; r++) session.main.forEach(it => { if (r <= it.sets) add(it, 'main', r, R); }); }
  else session.main.forEach(it => { for (let s = 1; s <= it.sets; s++) add(it, 'main', s, it.sets); });
  session.cool.forEach(it => add(it, 'cool', 1, 1));
  pl = { session, date, extra, steps, i: 0, mode: 'ready', remain: 0, end: 0, paused: false, t0: 0, done: 0, rpe: null };
  renderLayer();
}
let plTimer = null, wake = null;
function plTick() {
  if (!pl || pl.paused || !['work', 'rest'].includes(pl.mode)) return;
  const st = pl.steps[pl.i];
  const isTimed = pl.mode === 'rest' || st.secs;
  if (!isTimed) return;
  const rem = (pl.end - Date.now()) / 1000, prev = pl.remain; pl.remain = rem;
  if (Math.ceil(rem) !== Math.ceil(prev) && rem > 0 && rem <= 3.05) beep(660, 0.08);
  if (pl.mode === 'work' && st.secs && E.PER_SIDE.includes(st.ex) && !pl.switched && rem <= st.secs) { pl.switched = true; beep(990, 0.15); say('Đổi bên'); }
  const el = $('#plBig'); if (el) el.textContent = fmtT(rem);
  if (rem <= 0) { beep(1046, 0.25); plNext(); }
}
function plWork() {
  const st = pl.steps[pl.i]; pl.mode = 'work'; pl.switched = false;
  const secs = st.secs ? st.secs * (E.PER_SIDE.includes(st.ex) ? 2 : 1) : 0;
  if (secs) { pl.end = Date.now() + secs * 1000; pl.remain = secs; }
  say(`${EX[st.ex].name}. ${st.reps ? st.reps + ' lần' + (E.PER_SIDE.includes(st.ex) ? ' mỗi bên' : '') : (st.secs + ' giây' + (E.PER_SIDE.includes(st.ex) ? ' mỗi bên' : ''))}`);
  renderLayer();
}
function plNext() {
  const st = pl.steps[pl.i];
  if (pl.mode === 'work') {
    pl.done++;
    const nx = pl.steps[pl.i + 1];
    if (nx && st.ph === 'main' && st.rest > 0) { pl.mode = 'rest'; pl.end = Date.now() + st.rest * 1000; pl.remain = st.rest; say(`Nghỉ ${st.rest} giây. Tiếp theo: ${EX[nx.ex].name}`); renderLayer(); return; }
  }
  pl.i++;
  if (pl.i >= pl.steps.length) { pl.mode = 'done'; pl.total = Math.round((Date.now() - pl.t0) / 1000); say('Hoàn thành buổi tập. Tuyệt vời!'); releaseWake(); renderLayer(); return; }
  plWork();
}
async function requestWake() { try { if ('wakeLock' in navigator) wake = await navigator.wakeLock.request('screen'); } catch (e) { } }
function releaseWake() { try { wake && wake.release(); } catch (e) { } wake = null; }
function renderPlayer() {
  const st = pl.steps[Math.min(pl.i, pl.steps.length - 1)], e = EX[st.ex];
  const phase = { warm: 'Khởi động', main: 'Bài chính', cool: 'Thả lỏng' }[st.ph];
  const nx = pl.steps[pl.i + 1];
  const showEx = pl.mode === 'rest' && nx ? EX[nx.ex] : e;
  const prog = Math.round(pl.i / pl.steps.length * 100);
  if (pl.mode === 'done') {
    const se = pl.session, ratio = pl.done / pl.steps.length, mins = Math.max(1, Math.round(pl.total / 60));
    return `<div class="pb" style="justify-content:center"><div class="c"><div style="font-size:64px">🎉</div><h2 style="margin:6px 0">Hoàn thành!</h2>
      <p class="muted">${mins} phút · ~${Math.round(se.kcal * Math.max(0.3, ratio))} kcal · ${pl.done}/${pl.steps.length} phần</p></div>
      <div class="card"><h3>Buổi tập vừa rồi nặng thế nào? (RPE)</h3><div class="rpe">${Array.from({ length: 10 }, (_, i) => `<button class="${pl.rpe === i + 1 ? 'on' : ''}" data-a="rpe" data-v="${i + 1}">${i + 1}</button>`).join('')}</div>
      <div class="row tiny muted" style="margin-top:4px"><span>Rất nhẹ</span><span class="sp"></span><span>Vừa sức (6–8)</span><span class="sp"></span><span>Kiệt sức</span></div></div>
      <button class="btn block" data-a="plSave">💾 Lưu buổi tập</button><button class="btn line block" style="margin-top:8px" data-a="plQuit">Thoát không lưu</button></div>`;
  }
  let center = '';
  if (pl.mode === 'ready') center = `<div class="c" style="margin:auto 0"><div class="phase">${pl.session.name}</div><h2 style="margin:10px 0 4px">Sẵn sàng chưa?</h2><p class="muted small">${pl.session.minutes} phút · ${pl.steps.length} phần</p>
      <div class="card" style="text-align:left"><div class="small">✔️ Đã uống vài ngụm nước<br>✔️ Không gian thoáng, sàn không trơn<br>✔️ Dừng ngay nếu đau ngực, chóng mặt, đau nhói khớp</div></div>
      <button class="btn block" data-a="plGo" style="padding:16px;font-size:17px">▶ Bắt đầu</button></div>`;
  else if (pl.mode === 'rest') center = `<div class="c"><div class="phase" style="background:var(--warn-soft);color:var(--warn)">Nghỉ</div><div class="big" id="plBig" style="margin:8px 0">${fmtT(pl.remain)}</div>
      <div class="muted small">Tiếp theo</div><div class="b" style="font-size:18px">${nx ? EX[nx.ex].name : ''}</div><div class="small muted">${nx ? (nx.sets > 1 ? `Hiệp ${nx.set}/${nx.sets} · ` : '') + (nx.reps ? nx.reps + ' lần' : nx.secs + ' giây') : ''}</div></div>
      <div class="row" style="margin-top:auto"><button class="btn line sp" data-a="plAdd">+15 giây</button><button class="btn sp" data-a="plSkip">Bỏ qua nghỉ ›</button></div>`;
  else {
    const side = E.PER_SIDE.includes(st.ex) ? ' mỗi bên' : '';
    center = `<div class="row"><span class="phase">${phase}</span>${st.sets > 1 ? `<span class="small muted">${pl.session.circuit ? 'Vòng' : 'Hiệp'} ${st.set}/${st.sets}</span>` : ''}<span class="sp"></span><button class="btn sm line" data-a="ex" data-v="${e.id}">Hướng dẫn</button></div>
      <h2 style="margin:8px 0 2px;font-size:22px">${e.name}</h2>
      ${st.secs ? `<div class="big" id="plBig">${fmtT(pl.remain)}</div><div class="muted small">${st.secs} giây${side}</div>` : `<div class="big">${st.reps} <span style="font-size:22px">lần${side}</span></div>`}
      <div class="note ok" style="margin-top:10px"><span class="ni">🎯</span><span class="small">${esc(e.mistakes[0][1])}. ${esc(e.breath)}</span></div>
      <div class="row" style="margin-top:auto;padding-top:10px">${st.secs ? `<button class="btn line" data-a="plPause">${pl.paused ? '▶ Tiếp' : '⏸ Dừng'}</button>` : ''}<button class="btn line" data-a="plSkip">Bỏ qua</button><button class="btn sp" data-a="plDone">${st.secs ? 'Xong sớm ✓' : 'Xong ✓'}</button></div>`;
  }
  return `<div class="pv"><div class="pt"><button data-a="plExit" aria-label="Thoát">✕</button><div class="sp"><div class="bar" style="background:rgba(0,0,0,.08)"><i style="width:${prog}%"></i></div></div></div>
    <div data-v3d="${showEx.id}" style="position:absolute;inset:0"><div class="v3d-legend" style="z-index:2;top:auto;bottom:8px">${showEx.name}</div></div></div>
    <div class="pb">${center}</div>`;
}

// =====================================================================
// HÀNH ĐỘNG
// =====================================================================
function setSheet(s) { ui.sheet = s; renderLayer(); }
let confirmFn = null;
function confirmBox(title, text, yes, fn) { confirmFn = fn; setSheet({ type: 'confirm', title, text, yes }); }
function logChange() { const p = P(); save(); }
function download(name, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) { navigator.share({ files: [file], title: name }).catch(() => { }); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function fallbackCopy(t) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) { } ta.remove(); }
function importFile() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = () => { const f = inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = async () => {
    try { const d = JSON.parse(r.result); if (!d.profiles || !Array.isArray(d.profiles)) throw 0;
      for (const np of d.profiles) { const i = S.profiles.findIndex(x => x.id === np.id); if (i >= 0) S.profiles[i] = np; else S.profiles.push(np); }
      S.active = S.active || d.active || S.profiles[0].id; save(); ob = null; ui.sheet = null;
      if (Array.isArray(d.photos)) for (const ph of d.photos) await PHO.savePhoto(ph).catch(() => { });
      toast(`Đã khôi phục ${d.profiles.length} hồ sơ${d.photos ? ` và ${d.photos.length} ảnh` : ''}.`); render(); loadPhotos();
    } catch (e) { toast('Tệp sao lưu không hợp lệ.'); } }; r.readAsText(f); };
  inp.click();
}
const A = {
  tab: el => { ui.tab = el.dataset.v; ui.day = el.dataset.v === 'today' || el.dataset.v === 'food' ? ui.day : ui.day; render(); scrollTo(0, 0); },
  noop: () => { },
  back: () => { if (history.state && history.state.pg) history.back(); else pop(); },
  profiles: () => setSheet({ type: 'profiles' }),
  closeSheet: () => setSheet(null),
  sheetBg: (el, ev) => { if (ev.target === el) setSheet(null); },
  confirmYes: () => { const f = confirmFn; confirmFn = null; ui.sheet = null; f && f(); render(); },
  // onboarding
  obset: el => { let v = el.dataset.v; if (/^(days|minutes|sleepHours)$/.test(el.dataset.k) || el.dataset.num) v = +v; setK(ob.d, el.dataset.k, v); rerenderOb(); },
  obtog: el => { const k = el.dataset.k, a = getK(ob.d, k) || []; const v = el.dataset.v; setK(ob.d, k, a.includes(v) ? a.filter(x => x !== v) : [...a, v]); if (k === 'fitness.pushType') setK(ob.d, k, v); rerenderOb(); },
  obAgree: (el, ev) => { if (ev.target.closest('a')) return; ob.agree = !ob.agree; rerenderOb(); },
  obnext: () => { if (ob.step === 0 && !ob.agree && !ob.edit) return toast('Vui lòng đọc và đánh dấu đồng ý thông tin miễn trừ.'); const er = obValidate(); if (er) return toast(er); ob.step++; rerenderOb(true); },
  obback: () => { ob.step--; rerenderOb(true); },
  obcancel: () => { ob = null; render(); },
  obsug: el => { const f = E.feasibility(draftProfile()); const s = f.sug[+el.dataset.i]; if (!s) return; for (const [k, v] of Object.entries(s.patch)) ob.d[k] = v; toast('Đã áp dụng: ' + s.label); rerenderOb(); },
  obfinish: () => {
    const pr = draftProfile();
    if (ob.edit) { const i = S.profiles.findIndex(x => x.id === ob.edit); const old = S.profiles[i]; if (old.weight !== pr.weight) { pr.logs = pr.logs || {}; pr.logs[E.today()] = { ...(pr.logs[E.today()] || {}), w: pr.weight }; } S.profiles[i] = pr; toast('Đã cập nhật hồ sơ.'); }
    else { pr.id = 'p' + Date.now().toString(36); pr.startWeight = pr.weight; pr.logs = { [E.today()]: { w: pr.weight, ...(pr.waist ? { waist: pr.waist } : {}) } }; pr.adj = {}; S.profiles.push(pr); S.active = pr.id; toast('Chào mừng ' + pr.name + '! Hành trình bắt đầu từ hôm nay 🌱'); }
    save(); ob = null; ui.tab = 'today'; ui.day = E.today(); render(); scrollTo(0, 0);
  },
  import: () => importFile(),
  shareApp: () => { const d = { title: 'HLV Sức Khỏe', text: 'Huấn luyện viên sức khỏe cá nhân miễn phí cho người Việt', url: APP_URL }; if (navigator.share) navigator.share(d).catch(() => { }); else A.copy({ dataset: { v: APP_URL } }); },
  guide: () => { ui.sheet = null; push('guide'); },
  about: () => { ui.sheet = null; push('about'); },
  photos: () => push('photos'),
  copy: el => { const t = el.dataset.v; const ok = () => toast('Đã chép: ' + t); try { navigator.clipboard.writeText(t).then(ok, () => { fallbackCopy(t); ok(); }); } catch (e) { fallbackCopy(t); ok(); } },
  phPose: el => { ui.phPose = el.dataset.v; ui.cmpA = ui.cmpB = null; renderLayer(); },
  phMode: el => { ui.phMode = el.dataset.v; renderLayer(); },
  photoEvery: el => { P().photoEvery = +el.dataset.v; save(); renderLayer(); },
  viewPhoto: el => setSheet({ type: 'photo', id: el.dataset.v }),
  delPhoto: el => confirmBox('Xóa ảnh này?', 'Ảnh sẽ bị xóa vĩnh viễn khỏi máy.', 'Xóa', async () => { await PHO.deletePhoto(el.dataset.v); await loadPhotos(); }),
  addPhoto: el => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; if (el.dataset.v === 'cam') inp.setAttribute('capture', 'environment');
    inp.onchange = async () => { const f = inp.files[0]; if (!f) return; try { const data = await PHO.shrink(f); const p = P(); await PHO.savePhoto({ id: 'ph' + Date.now().toString(36), pid: p.id, date: E.today(), ts: Date.now(), pose: ui.phPose, data }); toast('Đã lưu ảnh 📸'); ui.cmpB = null; await loadPhotos(); } catch (e) { toast('Không lưu được ảnh: ' + (e.message || e)); } };
    inp.click();
  },
  exportPh: async () => { const ph = []; for (const p of S.profiles) { try { ph.push(...await PHO.listPhotos(p.id)); } catch (e) { } } download(`hlv-suc-khoe-saoluu-kemanh-${E.today()}.json`, JSON.stringify({ app: 'HLV Sức Khỏe', version: VERSION, exported: new Date().toISOString(), ...S, photos: ph })); toast(`Đã tạo tệp sao lưu kèm ${ph.length} ảnh.`); },
  // hồ sơ
  switch: el => { S.active = el.dataset.v; save(); ui.sheet = null; ui.day = E.today(); render(); loadPhotos(); },
  addProfile: () => { ui.sheet = null; startOb(); render(); scrollTo(0, 0); },
  editProfile: () => { ui.sheet = null; startOb(P()); render(); scrollTo(0, 0); },
  delProfile: () => confirmBox('Xóa hồ sơ?', `Toàn bộ nhật ký và ảnh của "${esc(P().name)}" sẽ bị xóa vĩnh viễn. Nên sao lưu trước.`, 'Xóa', () => { PHO.deleteAll(S.active).catch(() => { }); S.profiles = S.profiles.filter(x => x.id !== S.active); S.active = S.profiles[0] ? S.profiles[0].id : null; save(); }),
  setting: el => { S.settings[el.dataset.v] = !S.settings[el.dataset.v]; save(); renderLayer(); },
  export: () => { download(`hlv-suc-khoe-saoluu-${E.today()}.json`, JSON.stringify({ app: 'HLV Sức Khỏe', version: VERSION, exported: new Date().toISOString(), ...S }, null, 1)); toast('Đã tạo tệp sao lưu.'); },
  // hôm nay
  day: el => { const v = +el.dataset.v; ui.day = v === 0 ? E.today() : E.addDays(ui.day, v); if (ui.day > E.today()) ui.day = E.today(); render(); },
  habit: (el, ev) => { if (ev.target.closest('.info-i')) return; const L = LOG(); L.habits = L.habits || {}; L.habitPlan = L.habitPlan || E.habitsFor(P()); L.habits[el.dataset.v] = !L.habits[el.dataset.v]; if (L.habits[el.dataset.v]) beep(1200, 0.06, 0.08); save(); render(); },
  habitInfo: el => setSheet({ type: 'habit', id: el.dataset.v }),
  water: el => { const L = LOG(); L.water = Math.max(0, +el.dataset.v); L.habitPlan = L.habitPlan || E.habitsFor(P()); save(); render(); },
  plate: el => { const L = LOG(); L.plate = L.plate || {}; L.plate[el.dataset.v] = !L.plate[el.dataset.v]; const hp = L.habitPlan = L.habitPlan || E.habitsFor(P()); if (hp.includes('veg_half') && L.plate[el.dataset.v]) { L.habits = L.habits || {}; L.habits.veg_half = true; } save(); render(); },
  mood: el => { LOG().mood = +el.dataset.v; save(); render(); },
  markWalk: () => { const L = LOG(); L.habitPlan = L.habitPlan || E.habitsFor(P()); L.habits = L.habits || {}; L.habits.move10 = true; save(); toast('Ghi nhận! Đi bộ là vận động tuyệt vời 👣'); render(); },
  undoWorkout: () => { const L = LOG(); delete L.workout; save(); render(); },
  snooze: () => { P().evalSnooze = E.addDays(E.today(), 3); save(); render(); },
  stageUp: () => { const p = P(); if (p.stage >= 3) return; p.stage = (p.stage || 0) + 1; p.stageStart = E.today(); p.evalSnooze = E.addDays(E.today(), 7); save(); toast(`🚀 Lên giai đoạn: ${E.STAGES[p.stage].name}!`); render(); },
  stageDown: () => { const p = P(); if (!p.stage) { p.minutes = Math.max(10, p.minutes - 5); } else p.stage--; p.stageStart = E.today(); p.evalSnooze = E.addDays(E.today(), 7); save(); toast('Đã điều chỉnh nhẹ hơn – giữ nhịp là thắng lợi!'); render(); },
  harder: () => { const p = P(); p.adj = p.adj || {}; for (const k of ['push', 'squat', 'hinge', 'core', 'core2', 'legs2', 'cardio']) p.adj[k] = Math.min(2, (p.adj[k] || 0) + 1); p.evalSnooze = E.addDays(E.today(), 7); save(); toast('📈 Đã tăng độ khó bài tập.'); render(); },
  easier: () => { const p = P(); p.adj = p.adj || {}; for (const k of ['push', 'squat', 'hinge', 'core', 'core2', 'legs2', 'cardio']) p.adj[k] = Math.max(-2, (p.adj[k] || 0) - 1); p.evalSnooze = E.addDays(E.today(), 7); save(); toast('Đã giảm độ khó bài tập.'); render(); },
  start: el => { const d = el.dataset.v; const plan = E.planFor(P(), d); const se = el.dataset.t ? E.buildSession(P(), el.dataset.t, 0) : (plan.session || E.buildSession(P(), 'M')); startPlayer(se, d > E.today() ? E.today() : d); },
  startExtra: () => { const p = P(); const se = E.buildSession({ ...p, minutes: 10 }, 'M'); se.name = 'Giãn cơ & cơ lõi 10 phút'; startPlayer(se, ui.day, true); },
  session: el => push('session', el.dataset.v),
  adj: el => { const p = P(); p.adj = p.adj || {}; const k = el.dataset.v; p.adj[k] = Math.max(-2, Math.min(2, (p.adj[k] || 0) + +el.dataset.d)); save(); const before = ui.pages.length; renderLayer(); toast(+el.dataset.d > 0 ? 'Đã chọn biến thể khó hơn (nếu có).' : 'Đã chọn biến thể dễ hơn (nếu có).'); },
  // lộ trình
  applySug: el => { const p = P(); const f = E.feasibility({ ...p, weight: E.latestWeight(p) }); const s = f.sug[+el.dataset.i]; if (!s) return; Object.assign(p, s.patch); save(); toast('Đã áp dụng: ' + s.label); render(); },
  trainDay: el => { const p = P(), n = E.effDays(p), i = +el.dataset.v; let cur = ui.pendDays || E.schedule(p).filter(x => x.type !== 'R').map(x => x.dow); cur = cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i].sort(); if (cur.length > n) return toast(`Giai đoạn này tối đa ${n} buổi – bỏ chọn một ngày trước.`); if (cur.length === n) { p.trainDays = cur; ui.pendDays = null; save(); toast('Đã cập nhật lịch tập.'); } else { ui.pendDays = cur; toast(`Chọn thêm ${n - cur.length} ngày`); } render(); },
  // bài tập
  exSeg: el => { ui.exSeg = el.dataset.v; render(); },
  libCat: el => { ui.libCat = el.dataset.v; render(); },
  libMine: () => { ui.libMine = !ui.libMine; render(); },
  ex: el => push('ex', el.dataset.v),
  muscle: el => { ui.muscleSel = el.dataset.v; render(); },
  muscleGo: (el, ev) => { ev.stopPropagation(); ui.muscleSel = el.dataset.v; ui.exSeg = 'muscle'; ui.tab = 'train'; ui.pages = []; render(); scrollTo(0, 0); },
  lesson: el => push('lesson', el.dataset.v),
  v3d: el => { const v = el.dataset.v; if (v === 'play') { const on = viewer.play(); el.textContent = on ? '⏸' : '▶'; } else if (v === 'slow') { const on = el.classList.toggle('on'); viewer.setSpeed(on ? 0.5 : 1); } else viewer.view(v); },
  // ăn uống
  menuShift: () => { ui.menuShift++; render(); },
  vegToday: () => { ui.vegToday = !ui.vegToday; render(); },
  forceDetail: () => { ui.forceDetail = true; render(); },
  copyMenu: () => { const p = P(); const mn = E.menuFor(p, ui.day, ui.menuShift, ui.vegToday || E.isVegDay(p, ui.day)); const L = LOG(); L.meals = {}; for (const [k, arr] of Object.entries(mn.meals)) L.meals[k] = arr.map(([f, q]) => ({ f, q })); L.habitPlan = L.habitPlan || E.habitsFor(p); ui.forceDetail = true; save(); toast('Đã chép thực đơn vào nhật ký – chỉnh lại theo thực tế nhé.'); render(); },
  addFood: el => { ui.foodMeal = el.dataset.v; push('food', el.dataset.v); },
  foodGroup: el => { ui.foodGroup = el.dataset.v; renderLayer(); },
  pickFood: el => setSheet({ type: 'food', id: el.dataset.v, q: 1, meal: ui.foodMeal || 'trua' }),
  fq: el => { ui.sheet.q = Math.max(0.5, Math.round((ui.sheet.q + +el.dataset.v) * 2) / 2); renderLayer(); },
  fmeal: el => { ui.sheet.meal = el.dataset.v; renderLayer(); },
  confirmFood: () => { const s = ui.sheet, L = LOG(); L.meals = L.meals || {}; (L.meals[s.meal] = L.meals[s.meal] || []).push({ f: s.id, q: s.q }); L.habitPlan = L.habitPlan || E.habitsFor(P()); save(); ui.sheet = null; toast(`Đã thêm ${FOOD[s.id].name}`); ui.pages.pop(); ui.forceDetail = true; render(); },
  rmFood: el => { const L = LOG(); L.meals[el.dataset.v].splice(+el.dataset.i, 1); save(); render(); },
  foodTable: () => push('foodTable'),
  // báo cáo
  repKind: el => { ui.repKind = el.dataset.v; ui.repOff = 0; render(); },
  repOff: el => { ui.repOff = Math.min(0, ui.repOff + +el.dataset.v); render(); },
  print: () => window.print(),
  // trình phát
  plGo: () => { beep(880, 0.05, 0.01); pl.t0 = Date.now(); requestWake(); clearInterval(plTimer); plTimer = setInterval(plTick, 200); plWork(); },
  plDone: () => { if (pl.paused) pl.paused = false; plNext(); },
  plSkip: () => { if (pl.mode === 'rest') { pl.mode = 'work'; pl.i++; if (pl.i >= pl.steps.length) { pl.mode = 'done'; pl.total = Math.round((Date.now() - pl.t0) / 1000); renderLayer(); return; } plWork(); } else { pl.i++; if (pl.i >= pl.steps.length) { pl.mode = 'done'; pl.total = Math.round((Date.now() - pl.t0) / 1000); renderLayer(); return; } plWork(); } },
  plAdd: () => { pl.end += 15000; },
  plPause: () => { if (!pl.paused) { pl.paused = true; pl.left = pl.end - Date.now(); viewer.play(false); } else { pl.paused = false; pl.end = Date.now() + pl.left; viewer.play(true); } renderLayer(); },
  plExit: () => { if (pl.mode === 'ready' || pl.mode === 'done') return A.plQuit(); pl.paused = true; pl.left = pl.end - Date.now(); confirmBox('Kết thúc buổi tập?', 'Bạn có thể lưu phần đã tập.', 'Kết thúc & lưu', () => { pl.mode = 'done'; pl.paused = false; pl.total = Math.round((Date.now() - pl.t0) / 1000); }); },
  plQuit: () => { clearInterval(plTimer); releaseWake(); try { speechSynthesis.cancel(); } catch (e) { } pl = null; render(); },
  rpe: el => { pl.rpe = +el.dataset.v; renderLayer(); },
  plSave: () => {
    const p = P(), L = LOG(pl.date), se = pl.session, ratio = pl.done / pl.steps.length, mins = Math.max(1, Math.round(pl.total / 60));
    const kcal = Math.round(se.kcal * Math.max(0.3, ratio));
    if (L.workout && L.workout.done && pl.extra) { L.workout.minutes += mins; L.workout.kcal += kcal; }
    else L.workout = { done: true, minutes: mins, kcal, rpe: pl.rpe, type: se.type, name: se.name, ratio: Math.round(ratio * 100) };
    if (pl.rpe) L.workout.rpe = pl.rpe;
    L.habitPlan = L.habitPlan || E.habitsFor(p); L.habits = L.habits || {}; if (mins >= 8 || ratio > 0.7) L.habits.move10 = true;
    save(); A.plQuit(); toast('Đã lưu buổi tập 💪');
  },
};
function rerenderOb(top) { $('#app').innerHTML = renderOb(); if (top) scrollTo(0, 0); }

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]'); if (!el) return;
  const fn = A[el.dataset.a]; if (!fn) return;
  if (el.tagName === 'BUTTON' || el.dataset.a !== 'sheetBg') ev.preventDefault();
  fn(el, ev);
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.dataset.k && ob) { setK(ob.d, t.dataset.k, t.value); return; }
  if (t.id === 'cmpRange') { const v = +t.value; const top = $('#cmpTop'), ln = $('#cmpLine'); if (top) top.style.clipPath = `inset(0 ${100 - v}% 0 0)`; if (ln) ln.style.left = v + '%'; return; }
  if (t.id === 'foodQ') { const q = t.value.trim().toLowerCase(); document.querySelectorAll('#foodList [data-name]').forEach(r => r.style.display = !q || r.dataset.name.includes(q) || r.dataset.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').includes(q.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')) ? '' : 'none'); }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.log) { const L = LOG(); const k = t.dataset.log; const v = t.value.trim(); if (v === '') delete L[k]; else L[k] = k === 'note' ? v : +v; if (k === 'w' && v) L.habitPlan = L.habitPlan || E.habitsFor(P()); save(); toast('Đã lưu ✓'); return; }
  if (t.dataset.a2 === 'libMuscle') { ui.libMuscle = t.value; render(); }
  if (t.dataset.a2 === 'cmpA' || t.dataset.a2 === 'cmpB') { ui[t.dataset.a2] = t.value; renderLayer(); }
});
window.addEventListener('popstate', () => { if (pl) return; if (ui.sheet) { ui.sheet = null; renderLayer(); } if (ui.pages.length) pop(); });

render();
loadPhotos();
window.__reloadPhotos = loadPhotos;
if (!webglOK()) console.warn('WebGL không khả dụng – phần 3D sẽ hiển thị hướng dẫn chữ.');
