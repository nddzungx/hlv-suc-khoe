// ===== BỘ MÁY HLV: tính chỉ số, đánh giá khả thi, lộ trình, lịch tập, thực đơn, báo cáo =====
import { EX, HABITS, FOOD, MENUS, TEEN_BMI } from './data.js';
import { isVegLunar } from './lunar.js';

// ---------- ngày tháng ----------
const pad = n => String(n).padStart(2, '0');
export const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => ds(new Date());
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ds(d); };
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
export const dowMon = s => (parse(s).getDay() + 6) % 7; // 0 = Thứ 2
export const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
export const DOW_FULL = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
export const fmtDate = s => { const d = parse(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
const r1 = x => Math.round(x * 10) / 10;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export const age = p => new Date().getFullYear() - p.birthYear;
export const kcalBurn = (met, kg, min) => met * 3.5 * kg / 200 * min;
export const latestWeight = p => {
  const ks = Object.keys(p.logs || {}).filter(k => p.logs[k].w).sort();
  return ks.length ? p.logs[ks[ks.length - 1]].w : p.weight;
};
const HIGH_RISK = ['heart', 'pregnant', 'dizzy', 'injury'];
export const highRisk = p => (p.health || []).some(h => HIGH_RISK.includes(h));

// ---------- chỉ số cơ thể ----------
export function bmiCategory(bmi, a, sex) {
  if (a < 18) {
    const t = TEEN_BMI[sex][clamp(a, 12, 17)];
    if (bmi < t[0]) return { label: 'Gầy (theo chuẩn WHO cho tuổi)', lv: 'warn', key: 'under' };
    if (bmi > t[2]) return { label: 'Béo phì (theo chuẩn WHO cho tuổi)', lv: 'bad', key: 'obese' };
    if (bmi > t[1]) return { label: 'Thừa cân (theo chuẩn WHO cho tuổi)', lv: 'warn', key: 'over' };
    return { label: 'Bình thường (theo chuẩn WHO cho tuổi)', lv: 'ok', key: 'normal' };
  }
  if (bmi < 18.5) return { label: 'Thiếu cân', lv: 'warn', key: 'under' };
  if (bmi < 23) return { label: 'Bình thường', lv: 'ok', key: 'normal' };
  if (bmi < 25) return { label: 'Thừa cân', lv: 'warn', key: 'over' };
  if (bmi < 30) return { label: 'Béo phì độ I', lv: 'bad', key: 'obese' };
  return { label: 'Béo phì độ II', lv: 'bad', key: 'obese' };
}
const ACT = { sed: 1.2, light: 1.375, mod: 1.55, high: 1.725 };

export function metrics(p, w = latestWeight(p)) {
  const a = age(p), h = p.height, hm = h / 100;
  const bmi = w / (hm * hm);
  const cat = bmiCategory(bmi, a, p.sex);
  const bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === 'male' ? 5 : -161);
  const tdee = bmr * (ACT[p.activity] || 1.375);
  const teen = a < 18, senior = a >= 60;
  let kcal = tdee, note = 'Ăn đủ nhu cầu để duy trì cân nặng.';
  if (p.goal === 'lose') {
    if (teen) { kcal = cat.key === 'over' || cat.key === 'obese' ? tdee * 0.9 : tdee; note = teen && kcal < tdee ? 'Tuổi đang lớn: chỉ giảm nhẹ ~10%, tập trung vận động và bỏ đồ ngọt.' : 'Tuổi đang lớn: không ăn kiêng, tập trung vận động và ăn lành mạnh.'; }
    else { const def = Math.min(500, tdee * 0.2); kcal = tdee - def; note = `Thâm hụt khoảng ${Math.round(def)} kcal/ngày để giảm mỡ an toàn.`; }
    const floor = teen ? tdee * 0.9 : Math.max(bmr, p.sex === 'male' ? 1500 : 1200);
    if (kcal < floor) { kcal = floor; }
  } else if (p.goal === 'muscle') { kcal = tdee + (teen ? 200 : 250); note = 'Dư nhẹ ~250 kcal để xây cơ, hạn chế tích mỡ.'; }
  else if (p.goal === 'gain') { kcal = tdee + 400; note = 'Dư ~400 kcal/ngày để tăng cân lành mạnh (kết hợp tập sức mạnh).'; }
  const pk = teen ? 1.2 : senior ? 1.3 : (['lose', 'muscle', 'gain'].includes(p.goal) ? 1.8 : 1.3);
  const refW = (p.goal === 'lose' && cat.key === 'obese' && !teen) ? 23 * hm * hm * 1.1 : w; // người béo phì: tính đạm theo cân nặng điều chỉnh
  const protein = Math.round(pk * refW);
  const fat = Math.round(kcal * 0.27 / 9);
  const carb = Math.max(80, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const riceBowls = r1(Math.max(1, (carb * 0.55) / 44));
  const water = Math.round(w * 35 / 250);
  const whtr = p.waist ? p.waist / h : null;
  const waistRisk = p.waist ? (p.waist >= (p.sex === 'male' ? 90 : 80)) : null;
  return { age: a, bmi: r1(bmi), cat, bmr: Math.round(bmr), tdee: Math.round(tdee), kcal: Math.round(kcal / 10) * 10, note, protein, fat, carb, riceBowls,
    water, fiber: p.sex === 'male' ? 30 : 25, whtr: whtr && Math.round(whtr * 100) / 100, waistRisk, teen, senior,
    healthy: [r1(18.5 * hm * hm), r1(22.9 * hm * hm)], weight: w };
}

// ---------- đánh giá khả thi ----------
export function feasibility(p) {
  const m = metrics(p, p.weight), items = [], sug = [];
  const w = p.weight, tw = +p.targetWeight || null, weeks = +p.targetWeeks || null;
  let rate = null, recWeeks = null;
  const push = (lv, t) => items.push({ lv, t });
  if (highRisk(p)) push('bad', 'Bạn có tình trạng sức khỏe cần **ý kiến bác sĩ trước** khi tập cường độ vừa trở lên. Lộ trình sẽ giữ ở mức nhẹ, tác động thấp.');
  if ((p.health || []).includes('bp') || (p.health || []).includes('diabetes')) push('warn', 'Tăng huyết áp / tiểu đường: tập đều đặn rất có lợi, nhưng hãy theo dõi chỉ số và không nín thở khi tập.');
  if (m.teen) push('warn', 'Người dùng 12–17 tuổi: nên có bố mẹ hoặc thầy cô đồng hành. Ưu tiên vận động vui, ngủ đủ, không ăn kiêng khắt khe.');
  if (tw && ['lose', 'gain', 'muscle'].includes(p.goal)) {
    const delta = tw - w;
    if (p.goal === 'lose' && delta >= 0) push('bad', 'Mục tiêu là giảm cân nhưng cân nặng mong muốn không thấp hơn hiện tại.');
    else if ((p.goal === 'gain' || p.goal === 'muscle') && delta < 0) push('bad', 'Mục tiêu tăng cơ/tăng cân nhưng cân nặng mong muốn thấp hơn hiện tại – có thể bạn muốn "giảm mỡ, săn chắc"?');
    const tBmi = tw / ((p.height / 100) ** 2);
    if (!m.teen && tBmi < 18.5) {
      push('bad', `Cân nặng mục tiêu ${tw} kg cho BMI ${r1(tBmi)} – dưới mức khỏe mạnh. Khoảng cân nặng khỏe mạnh của bạn là ${m.healthy[0]}–${m.healthy[1]} kg.`);
      sug.push({ label: `Đặt mục tiêu ${Math.ceil(m.healthy[0] + 1)} kg`, patch: { targetWeight: Math.ceil(m.healthy[0] + 1) } });
    }
    if (weeks && delta) {
      rate = Math.abs(delta) / weeks;
      const max = p.goal === 'lose' ? (m.teen ? 0.5 : Math.min(1, w * 0.01)) : (p.goal === 'gain' ? 0.5 : 0.35);
      const rec = p.goal === 'lose' ? (m.teen ? 0.3 : Math.max(0.3, w * 0.0065)) : (p.goal === 'gain' ? 0.35 : 0.25);
      recWeeks = Math.ceil(Math.abs(delta) / rec);
      if (rate > max) {
        push('bad', `Tốc độ cần đạt **${r1(rate)} kg/tuần** – vượt mức an toàn (tối đa ~${r1(max)} kg/tuần). Đi quá nhanh dễ mất cơ, mệt mỏi và tăng cân trở lại.`);
        sug.push({ label: `Giữ ${tw} kg, kéo dài thành ${recWeeks} tuần`, patch: { targetWeeks: recWeeks } });
        const mid = r1(w + Math.sign(delta) * rec * weeks);
        sug.push({ label: `Giữ ${weeks} tuần, mục tiêu trung gian ${mid} kg`, patch: { targetWeight: mid } });
      } else if (rate < 0.1) push('ok', `Tốc độ ${r1(rate)} kg/tuần – rất nhẹ nhàng, dễ duy trì.`);
      else push('ok', `Tốc độ ${r1(rate)} kg/tuần – nằm trong ngưỡng an toàn.`);
    } else if (!weeks && delta) { sug.push({ label: `Đề xuất thời gian: ${recWeeks || Math.ceil(Math.abs(delta) / 0.5)} tuần`, patch: { targetWeeks: Math.ceil(Math.abs(delta) / (p.goal === 'lose' ? Math.max(0.3, w * 0.0065) : 0.3)) } }); }
  }
  if (p.goal === 'lose' && m.cat.key === 'under') { push('bad', 'Bạn đang thiếu cân – không nên giảm cân thêm. Gợi ý chuyển mục tiêu sang tăng cân/tăng cơ lành mạnh.'); sug.push({ label: 'Đổi mục tiêu: tăng cân lành mạnh', patch: { goal: 'gain', targetWeight: Math.ceil(m.healthy[0] + 1) } }); }
  const wkMin = p.days * p.minutes;
  if (wkMin < 60) push('warn', `Quỹ thời gian ${wkMin} phút/tuần khá ít. Không sao – ta bắt đầu từ đây; WHO khuyến nghị 150–300 phút vận động vừa mỗi tuần (gồm cả đi bộ hằng ngày).`);
  if ((p.goal === 'muscle' || p.goal === 'gain') && p.days < 2) { push('warn', 'Tăng cơ cần tối thiểu 2–3 buổi sức mạnh/tuần.'); sug.push({ label: 'Tăng lên 3 buổi/tuần', patch: { days: 3 } }); }
  if ((p.goal === 'muscle' || p.goal === 'gain') && !(p.equip || []).includes('db') && p.place !== 'gym') push('warn', 'Không có tạ: vẫn tăng cơ được ở giai đoạn đầu bằng trọng lượng cơ thể. Về sau nên có 1 đôi tạ đơn điều chỉnh hoặc dùng chai nước, ba lô đựng sách.');
  if (p.diet === 'chay' && ['muscle', 'gain'].includes(p.goal)) push('warn', 'Ăn chay và tăng cơ: cần chủ động đậu phụ, sữa đậu nành, các loại đậu, có thể bổ sung đạm thực vật.');
  if ((p.sleepHours || 7) < 6) push('warn', 'Ngủ dưới 6 tiếng làm chậm tiến độ rõ rệt – ngủ thêm là "bài tập" dễ nhất.');
  if (p.goal === 'lose' && !tw) push('ok', `Không đặt cân nặng mục tiêu? Hãy theo dõi vòng eo – mục tiêu khỏe mạnh: dưới ${p.sex === 'male' ? 90 : 80} cm.`);
  const lv = items.some(i => i.lv === 'bad') ? 'bad' : items.some(i => i.lv === 'warn') ? 'warn' : 'ok';
  return { lv, items, sug, rate, recWeeks, m };
}

// ---------- giai đoạn ----------
export const STAGES = [
  { name: 'Khởi động thói quen', short: 'Thói quen', weeks: 2, minCap: 10, dayCap: 3, icon: '🌱', desc: 'Mỗi ngày một chút: 10 phút vận động, 3 thói quen nhỏ. Mục tiêu duy nhất: KHÔNG bỏ cuộc.' },
  { name: 'Xây nền tảng', short: 'Nền tảng', weeks: 4, minCap: 20, dayCap: 4, icon: '🧱', desc: 'Học kỹ thuật đúng, tăng lên 2 hiệp, thêm thói quen ăn uống và giấc ngủ.' },
  { name: 'Phát triển', short: 'Phát triển', weeks: 6, minCap: 35, dayCap: 5, icon: '📈', desc: 'Tập đủ quỹ thời gian của bạn, tăng tải dần, bài khó hơn.' },
  { name: 'Tăng tốc & duy trì', short: 'Tăng tốc', weeks: 0, minCap: 999, dayCap: 7, icon: '🚀', desc: 'Đa dạng bài tập, tối ưu dinh dưỡng, giữ phong độ lâu dài.' },
];
export function stageInfo(p, at = today()) {
  const st = STAGES[p.stage || 0];
  const days = Math.max(0, diffDays(p.stageStart || p.start, at));
  const week = Math.floor(days / 7) + 1;
  return { ...st, idx: p.stage || 0, week, pct: st.weeks ? clamp(days / (st.weeks * 7), 0, 1) : 1 };
}
export const effMinutes = p => Math.min(p.minutes, STAGES[p.stage || 0].minCap);
export const effDays = p => Math.min(p.days, STAGES[p.stage || 0].dayCap);

// ---------- thói quen ----------
export function habitsFor(p) {
  const bad = p.badHabits || [], st = p.stage || 0;
  const L = [['water_morning', 'move10', bad.includes('skip_bf') ? 'breakfast' : 'veg_half']];
  L.push([bad.includes('sugar') ? 'no_sugar_drink' : 'protein_each', bad.includes('sit') ? 'stand_hourly' : 'sleep_23']);
  L.push([bad.includes('late') ? 'no_late_snack' : 'steps7k', bad.includes('alcohol') ? 'no_alcohol' : 'less_salt']);
  L.push(['stretch_eve', 'fruit2']);
  const out = [];
  const hl = p.health || [];
  if (hl.includes('postpartum') || hl.includes('pregnant')) L[0].push('kegel');
  if (age(p) >= 55 || p.goal === 'mobility') L[0].push('qigong');
  for (let i = 0; i <= st && i < L.length; i++) for (const h of L[i]) if (!out.includes(h)) out.push(h);
  if (st >= 1 && bad.includes('skip_bf') && !out.includes('veg_half')) out.push('veg_half');
  return out.filter(h => HABITS[h]);
}

// ---------- chọn bài tập ----------
function baseLevels(p) {
  const f = p.fitness || {}, self = f.self || 1;
  const push = f.push == null ? self : (f.pushType === 'full' ? (f.push >= 10 ? 3 : f.push >= 3 ? 2 : 1) : f.pushType === 'knee' ? (f.push >= 10 ? 2 : 1) : 1);
  const squat = f.squat == null ? self : (f.squat >= 22 ? 3 : f.squat >= 14 ? 2 : 1);
  const core = f.plank == null ? self : (f.plank >= 45 ? 3 : f.plank >= 20 ? 2 : 1);
  return { push, pull: push, squat, hinge: Math.min(squat, 2), core, legs2: squat, cardio: Math.round((squat + core) / 2) };
}
const POOLS = {
  push: ['wall_pushup', 'knee_pushup', 'pushup'], squat: ['chair_squat', 'squat', 'goblet_squat'], hinge: ['glute_bridge', 'hip_hinge', 'rdl'],
  core: ['bird_dog', 'dead_bug', 'plank'], legs2: ['calf_raise', 'wall_sit', 'reverse_lunge'],
  core2: ['crunch', 'plank', 'hang_knee_raise|side_plank'],
  pull: ['band_row|db_row|dead_hang', 'db_row|band_row|dead_hang', 'chin_up|db_row|band_row'], pull2: ['band_pull_apart', 'band_pull_apart|dead_hang', 'dead_hang|band_pull_apart'],
  press: ['db_lateral|band_pull_apart', 'db_press|band_pull_apart', 'db_press'], arms: ['db_curl', 'db_curl', 'tri_ext'], arms2: ['tri_ext', 'tri_ext', 'db_curl'],
  legs3: ['calf_raise', 'band_side_step|wall_sit', 'band_side_step|reverse_lunge'],
  pelvic: ['belly_breath', 'pelvic_tilt|kegel', 'heel_slide|kegel'], qigong: ['ds_nang_troi', 'ds_tach_troi', 'ds_giuong_cung'],
};
export const PER_SIDE = ['bird_dog', 'dead_bug', 'reverse_lunge', 'side_plank'];
const hasEquip = (p, e) => !e.length || e.every(x => x === 'chair' || (x === 'pool' ? ((p.likes || []).includes('swim') || (p.equip || []).includes('pool')) : x === 'racket' ? (p.likes || []).includes('badminton') : ((p.equip || []).includes(x) || p.place === 'gym')));
export const allowed = (p, ex) => !(ex.avoid || []).some(f => (p.health || []).includes(f)) && hasEquip(p, ex.equip);
export function levelFor(p, pattern) {
  const b = baseLevels(p), st = p.stage || 0;
  let lv = (b[pattern] || b[pattern.replace(/\d/, '')] || 1) + (st >= 2 ? 1 : 0) + (st >= 3 ? 0.5 : 0);
  lv += (p.adj && p.adj[pattern]) || 0;
  if (highRisk(p) || age(p) >= 65) lv = Math.min(lv, 2);
  return clamp(Math.floor(lv), 1, 3);
}
export function pickEx(p, pattern) {
  const pool = POOLS[pattern]; if (!pool) return null;
  const lv = levelFor(p, pattern);
  const ok = slot => (slot || '').split('|').map(id => EX[id]).find(e => e && allowed(p, e));
  for (let i = lv - 1; i >= 0; i--) { const e = ok(pool[i]); if (e) return e.id; }
  for (let i = lv; i < pool.length; i++) { const e = ok(pool[i]); if (e && e.level <= 2) return e.id; }
  return null;
}
function dose(p, ex) {
  const st = p.stage || 0, e = EX[ex];
  const reps = [8, 10, 12, 12][st], secs = [20, 30, 40, 45][st];
  let rest = [30, 40, 45, 50][st];
  if (p.goal === 'muscle' || p.goal === 'gain') rest += st >= 2 ? 25 : 10;
  if (p.goal === 'lose' || p.goal === 'endurance') rest -= 5;
  const sets = st === 0 ? (effMinutes(p) <= 10 ? 1 : 2) : st === 1 ? 2 : 3;
  return e.type === 'time' ? { ex, sets, secs, rest } : { ex, sets, reps: (e.cat === 'core' && st < 2) ? Math.max(6, reps - 2) : reps, rest };
}
export function itemSeconds(it) {
  const side = PER_SIDE.includes(it.ex) ? 2 : 1;
  const work = it.secs ? it.secs * side : it.reps * 3.2 * side;
  return it.sets * work + Math.max(0, it.sets - 1) * it.rest + 15; // +15s chuyển bài
}
const TEMPLATES = {
  S: [['squat', 'push', 'hinge', 'pull', 'core', 'legs2', 'press', 'arms'], ['legs3', 'push', 'hinge', 'pull', 'core2', 'squat', 'pull2', 'arms']],
  U: [['push', 'pull', 'press', 'core', 'pull2', 'arms', 'arms2', 'core2']], L: [['squat', 'hinge', 'legs3', 'core2', 'legs2', 'core']],
  M: [['core', 'hinge', 'core2', 'legs2']],
};
export const TYPE_NAME = { S: 'Sức mạnh toàn thân', U: 'Sức mạnh thân trên', L: 'Sức mạnh thân dưới', C: 'Tim mạch – đốt mỡ', M: 'Linh hoạt & cơ lõi', R: 'Nghỉ ngơi chủ động' };
export const TYPE_ICON = { S: '💪', U: '🏋️', L: '🦵', C: '❤️', M: '🧘', R: '🌿' };

export function buildSession(p, type, variant = 0) {
  const M = effMinutes(p), st = p.stage || 0, kg = latestWeight(p);
  const warm = st === 0 || M <= 12 ? [{ ex: 'march', sets: 1, secs: 60, rest: 0 }, { ex: 'arm_circles', sets: 1, secs: 30, rest: 0 }]
    : [{ ex: 'march', sets: 1, secs: 90, rest: 0 }, { ex: 'arm_circles', sets: 1, secs: 40, rest: 0 }, { ex: 'cat_cow', sets: 1, secs: 40, rest: 0 }];
  if (age(p) >= 55 && allowed(p, EX.ds_xoay_eo)) warm[1] = { ex: 'ds_xoay_eo', sets: 1, secs: 45, rest: 0 };
  if ((p.health || []).includes('postpartum')) warm.unshift({ ex: 'belly_breath', sets: 1, secs: 40, rest: 0 });
  else if ((p.health || []).includes('pregnant')) warm.push({ ex: 'kegel', sets: 1, reps: 5, rest: 0 });
  const ff = allowed(p, EX.forward_fold);
  const cool = st === 0 || M <= 12 ? [{ ex: ff ? 'forward_fold' : 'cat_cow', sets: 1, secs: 30, rest: 0 }]
    : [{ ex: ff ? 'forward_fold' : 'cat_cow', sets: 1, secs: 40, rest: 0 }, { ex: 'cat_cow', sets: 1, secs: 40, rest: 0 }];
  if (!ff && cool.length > 1) cool[1] = { ex: 'arm_circles', sets: 1, secs: 30, rest: 0 };
  const secOf = arr => arr.reduce((s, i) => s + itemSeconds(i), 0);
  let budget = M * 60 - secOf(warm) - secOf(cool);
  const main = []; let circuit = false;
  const acts = ['def', ...((p.likes || []).includes('swim') ? ['swim'] : []), ...((p.likes || []).includes('badminton') && allowed(p, EX.bad_clear) ? ['badminton'] : [])];
  const act = type === 'C' ? acts[variant % acts.length] : 'def';
  let sname = null, sicon = null;
  if (type === 'C' && act === 'swim') {
    const ex = levelFor(p, 'cardio') >= 2 && allowed(p, EX.swim_free) ? 'swim_free' : 'swim_breast';
    main.push({ ex, sets: 1, secs: Math.max(300, Math.round(budget / 60) * 60), rest: 0 }); sname = 'Bơi (tại bể bơi)'; sicon = '🏊';
  } else if (type === 'C' && act === 'badminton') {
    circuit = true; sname = 'Cầu lông'; sicon = '🏸';
    const block = [{ ex: 'bad_footwork', secs: [30, 40, 45, 60][st], rest: 20 }, { ex: 'bad_clear', secs: [30, 40, 45, 60][st], rest: 20 }];
    if (!allowed(p, EX.bad_footwork)) block.shift();
    const per = block.reduce((s, b) => s + b.secs + b.rest, 0);
    const rounds = clamp(Math.floor(budget / per), 1, 12); for (const b of block) main.push({ ...b, sets: rounds });
  } else if (type === 'C') {
    circuit = true;
    const lv = levelFor(p, 'cardio'), outdoor = p.place === 'park' || (p.likes || []).includes('walk');
    if (outdoor && st <= 1) { main.push({ ex: 'brisk_walk', sets: 1, secs: Math.max(120, Math.round(budget / 60) * 60), rest: 0 }); circuit = false; }
    else {
      const block = [{ ex: lv >= 2 ? 'brisk_walk' : 'march', secs: st === 0 ? 60 : 90, rest: 0 }];
      if (lv >= 2 && allowed(p, EX.jumping_jack)) block.push({ ex: 'jumping_jack', secs: [20, 30, 30, 40][st], rest: 15 });
      else block.push({ ex: lv >= 2 ? 'march' : 'brisk_walk', secs: 60, rest: 10 });
      if (lv >= 2 && allowed(p, EX.mountain_climber) && st >= 2) block.push({ ex: 'mountain_climber', secs: 20, rest: 15 });
      if (lv >= 3 && allowed(p, EX.high_knees)) block.push({ ex: 'high_knees', secs: [15, 20, 20, 30][st], rest: 20 });
      const per = block.reduce((s, b) => s + b.secs + b.rest, 0);
      const rounds = clamp(Math.floor(budget / per), 1, 12);
      for (const b of block) main.push({ ...b, sets: rounds });
    }
  } else {
    const tpl = TEMPLATES[type] ? TEMPLATES[type][variant % TEMPLATES[type].length] : TEMPLATES.S[0];
    const used = new Set(), maxEx = [4, 6, 7, 8][st];
    for (const slot of tpl) {
      if (main.length >= maxEx) break;
      const ex = pickEx(p, slot);
      if (!ex || used.has(ex)) continue;
      const it = dose(p, ex), t = itemSeconds(it);
      if (t > budget * 1.15 && main.length >= 2) break;
      if (t > budget && main.length >= 2) continue;
      main.push(it); used.add(ex); budget -= t;
    }
    const hl = p.health || [];
    const extras = type === 'M' ? [
      ...(hl.includes('postpartum') || hl.includes('pregnant') ? ['kegel', 'belly_breath', 'pelvic_tilt', 'heel_slide'] : []),
      ...(age(p) >= 55 || p.goal === 'mobility' ? ['ds_nang_troi', 'ds_tach_troi', 'ds_giuong_cung'] : []),
      'bird_dog', 'cat_cow', 'glute_bridge'] : [];
    if ((hl.includes('postpartum') || hl.includes('pregnant')) && type === 'M') { main.length = 0; used.clear(); budget = M * 60 - secOf(warm) - secOf(cool); }
    if (type === 'M') for (const ex of extras) {
      if (used.has(ex) || !allowed(p, EX[ex])) continue;
      const it = dose(p, ex), t = itemSeconds(it); if (t <= budget) { main.push(it); used.add(ex); budget -= t; }
    }
    let guard = 0;
    while (budget > 90 && guard++ < 20) {
      const cap = [2, 3, 4, 4][st];
      const it = [...main].sort((a, b) => a.sets - b.sets).find(i => i.sets < cap && itemSeconds({ ...i, sets: i.sets + 1 }) - itemSeconds(i) <= budget);
      if (!it) break; const before = itemSeconds(it); it.sets++; budget -= itemSeconds(it) - before;
    }
    if (budget > 90) { const ex = allowed(p, EX.jumping_jack) && levelFor(p, 'cardio') >= 2 ? 'jumping_jack' : 'march'; main.push({ ex, sets: 1, secs: Math.round(budget / 10) * 10, rest: 0, finisher: true }); }
  }
  const all = [...warm, ...main, ...cool];
  const secs = secOf(all);
  const kcal = all.reduce((s, i) => s + kcalBurn(EX[i.ex].met, kg, itemSeconds(i) / 60), 0);
  return { type, variant, name: sname || TYPE_NAME[type], icon: sicon || TYPE_ICON[type], warm, main, cool, circuit, minutes: Math.round(secs / 60), kcal: Math.round(kcal) };
}

// ---------- lịch tuần ----------
const DAY_SETS = { 1: [2], 2: [1, 4], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
const GOAL_TYPES = {
  lose: ['S', 'C', 'S', 'C', 'S', 'C', 'M'], muscle: ['S', 'S', 'S', 'C', 'S', 'M', 'C'], gain: ['S', 'S', 'S', 'M', 'S', 'C', 'M'],
  health: ['S', 'C', 'S', 'M', 'C', 'S', 'M'], endurance: ['C', 'S', 'C', 'S', 'C', 'M', 'C'], mobility: ['M', 'S', 'M', 'S', 'M', 'C', 'M'],
};
export function schedule(p) {
  const n = effDays(p);
  const days = (p.trainDays && p.trainDays.length === n) ? p.trainDays : DAY_SETS[n];
  let types = GOAL_TYPES[p.goal] || GOAL_TYPES.health;
  if ((p.goal === 'muscle' || p.goal === 'gain') && (p.stage || 0) >= 2 && n >= 4) types = ['U', 'L', 'C', 'U', 'L', 'M', 'C'];
  const chosen = types.slice(0, n);
  const hl = p.health || [];
  if ((hl.includes('postpartum') || hl.includes('pregnant')) && n >= 2 && !chosen.includes('M')) chosen[chosen.length - 1] = 'M';
  // xen kẽ: sắp xếp để sức mạnh không dồn liên tiếp quá nhiều
  const seq = []; const pool = [...chosen];
  while (pool.length) { const last = seq[seq.length - 1]; let i = pool.findIndex(t => t !== last); if (i < 0) i = 0; seq.push(pool.splice(i, 1)[0]); }
  const counter = {};
  return Array.from({ length: 7 }, (_, d) => {
    const k = days.indexOf(d);
    if (k < 0) return { dow: d, type: 'R' };
    const t = seq[k]; counter[t] = (counter[t] || 0) + 1;
    return { dow: d, type: t, variant: counter[t] - 1 };
  });
}
export function planFor(p, date = today()) {
  const sc = schedule(p)[dowMon(date)];
  if (sc.type === 'R') return { ...sc, name: TYPE_NAME.R, rest: true };
  return { ...sc, session: buildSession(p, sc.type, sc.variant) };
}

// ---------- thực đơn ----------
export const isVegDay = (p, date = today()) => p.diet === 'chay' || (p.diet === 'chay_ky' && isVegLunar(date, p.vegDays || '2'));
export function menuFor(p, date = today(), shift = 0, forceVeg = false) {
  const m = metrics(p);
  const veg = forceVeg || isVegDay(p, date);
  const wd = dowMon(date) < 5;
  const style = p.eatStyle === 'ngoai' ? (wd ? 'ngoai' : 'nha') : p.eatStyle === 'mix' ? (dowMon(date) % 2 ? 'ngoai' : 'nha') : 'nha';
  let list = MENUS.filter(x => x.diet === (veg ? 'chay' : 'man') && x.style === style);
  if (!list.length) list = MENUS.filter(x => x.diet === (veg ? 'chay' : 'man'));
  const idx = (Math.floor(parse(date) / 864e5) + shift) % list.length;
  const t = list[(idx + list.length) % list.length];
  const meals = { sang: t.sang.map(x => [...x]), trua: t.trua.map(x => [...x]), toi: t.toi.map(x => [...x]), phu: t.phu.map(x => [...x]) };
  const kc = arr => arr.reduce((s, [f, q]) => s + FOOD[f].kcal * q, 0);
  const fixed = () => kc(meals.sang) + kc(meals.trua) + kc(meals.toi) + kc(meals.phu);
  const slots = t.noFlexLunch ? ['toi'] : ['trua', 'toi'];
  let need = m.kcal - fixed();
  if (need < 100 && meals.phu.length) { meals.phu.pop(); need = m.kcal - fixed(); }
  if (need < 100) { meals.sang = meals.sang.map(([f, q]) => [f, q * 0.7]); need = m.kcal - fixed(); }
  const rice = veg || p.goal === 'lose' ? 'com' : 'com';
  let per = clamp(Math.round((need / 200 / slots.length) * 2) / 2, 0.5, 3);
  for (const s of slots) meals[s].unshift([rice, per]);
  let extra = m.kcal - fixed();
  if (extra > 250) { meals.phu.push(['sua_tuoi', 1]); extra -= 115; }
  if (extra > 250) { meals.phu.push([veg ? 'sua_dau' : 'trung_luoc', veg ? 1 : 2]); }
  const tot = { kcal: 0, p: 0, c: 0, f: 0 };
  for (const k in meals) for (const [f, q] of meals[k]) { const F = FOOD[f]; tot.kcal += F.kcal * q; tot.p += F.p * q; tot.c += F.c * q; tot.f += F.f * q; }
  for (const k in tot) tot[k] = Math.round(tot[k]);
  return { name: t.name, meals, tot, target: m.kcal, proteinTarget: m.protein };
}
export const MEAL_NAMES = { sang: 'Bữa sáng', trua: 'Bữa trưa', toi: 'Bữa tối', phu: 'Bữa phụ' };
export function intake(log) {
  const tot = { kcal: 0, p: 0, c: 0, f: 0 }, meals = (log && log.meals) || {};
  let any = false;
  for (const k in meals) for (const it of meals[k]) { const F = FOOD[it.f]; if (!F) continue; any = true; tot.kcal += F.kcal * it.q; tot.p += F.p * it.q; tot.c += F.c * it.q; tot.f += F.f * it.q; }
  for (const k in tot) tot[k] = Math.round(tot[k]);
  return any ? tot : null;
}

// ---------- thống kê & báo cáo ----------
export function dayStats(p, date) {
  const L = (p.logs || {})[date] || {};
  const hp = L.habitPlan || habitsFor(p);
  const done = hp.filter(h => L.habits && L.habits[h]).length;
  const plan = planFor(p, date);
  return { date, log: L, planned: !plan.rest, done: !!(L.workout && L.workout.done), minutes: (L.workout && L.workout.minutes) || 0, kcalOut: (L.workout && L.workout.kcal) || 0,
    habitDone: done, habitTotal: hp.length, active: !!(L.workout && L.workout.done) || done > 0 || !!L.w, intake: intake(L) };
}
export function streak(p) {
  let d = today(), n = 0;
  if (!dayStats(p, d).active) d = addDays(d, -1);
  while (dayStats(p, d).active && n < 3650) { n++; d = addDays(d, -1); }
  return n;
}
export function periodRange(kind, offset = 0, ref = today()) {
  const d = parse(ref);
  if (kind === 'week') { const s = addDays(ref, -dowMon(ref) + offset * 7); return { from: s, to: addDays(s, 6), label: `Tuần ${fmtDate(s)} – ${fmtDate(addDays(s, 6))}` }; }
  if (kind === 'month') { const m = new Date(d.getFullYear(), d.getMonth() + offset, 1); const e = new Date(m.getFullYear(), m.getMonth() + 1, 0); return { from: ds(m), to: ds(e), label: `Tháng ${m.getMonth() + 1}/${m.getFullYear()}` }; }
  const y = d.getFullYear() + offset; return { from: `${y}-01-01`, to: `${y}-12-31`, label: `Năm ${y}` };
}
const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
export function report(p, kind, offset = 0) {
  const R = periodRange(kind, offset), t = today();
  const start = p.start > R.from ? p.start : R.from, end = R.to < t ? R.to : t;
  const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(dayStats(p, d));
  const planned = days.filter(x => x.planned).length, done = days.filter(x => x.done).length;
  const extra = days.filter(x => x.done && !x.planned).length;
  const hTot = days.reduce((s, x) => s + x.habitTotal, 0), hDone = days.reduce((s, x) => s + x.habitDone, 0);
  const pick = k => days.map(x => x.log[k]).filter(v => v != null && v !== '');
  const weights = days.filter(x => x.log.w).map(x => [x.date, +x.log.w]);
  const waists = days.filter(x => x.log.waist).map(x => [x.date, +x.log.waist]);
  const intakes = days.map(x => x.intake).filter(Boolean);
  const rpes = days.map(x => x.log.workout && x.log.workout.rpe).filter(Boolean);
  const wRate = planned ? Math.min(1, (done) / planned) : (done ? 1 : 0);
  const hRate = hTot ? hDone / hTot : 0;
  const adherence = days.length ? Math.round((wRate * 0.5 + hRate * 0.5) * 100) : 0;
  const res = { ...R, days, nDays: days.length, planned, done, extra, minutes: days.reduce((s, x) => s + x.minutes, 0), kcalOut: days.reduce((s, x) => s + x.kcalOut, 0),
    hRate: Math.round(hRate * 100), wRate: Math.round(wRate * 100), adherence,
    water: avg(pick('water').map(Number)), sleep: avg(pick('sleep').map(Number)), steps: avg(pick('steps').map(Number)), mood: avg(pick('mood').map(Number)),
    weights, waists, wDelta: weights.length >= 2 ? r1(weights[weights.length - 1][1] - weights[0][1]) : null,
    kcalIn: avg(intakes.map(i => i.kcal)), protein: avg(intakes.map(i => i.p)), rpe: avg(rpes), activeDays: days.filter(x => x.active).length };
  res.comments = coachComments(p, res, kind);
  return res;
}
function coachComments(p, r, kind) {
  const c = [], m = metrics(p);
  if (!r.nDays) return [{ lv: 'ok', t: 'Chưa có dữ liệu cho giai đoạn này.' }];
  if (r.adherence >= 80) c.push({ lv: 'ok', t: `Tuyệt vời! Mức tuân thủ ${r.adherence}% – bạn đang xây thói quen rất vững.` });
  else if (r.adherence >= 50) c.push({ lv: 'warn', t: `Mức tuân thủ ${r.adherence}%. Khá tốt! Hãy chọn 1 thói quen hay bị bỏ lỡ và gắn nó vào một việc cố định trong ngày.` });
  else c.push({ lv: 'bad', t: `Mức tuân thủ ${r.adherence}%. Kế hoạch có thể đang quá sức – thử giảm thời gian mỗi buổi hoặc số buổi để giữ nhịp, rồi tăng lại sau.` });
  if (r.planned && r.done < r.planned) c.push({ lv: 'warn', t: `Hoàn thành ${r.done}/${r.planned} buổi tập theo lịch. Nếu bận, buổi 10 phút vẫn được tính!` });
  if (r.wDelta != null) {
    const per = kind === 'week' ? 1 : r.nDays / 7;
    const wk = r.wDelta / Math.max(1, per);
    if (p.goal === 'lose') {
      if (wk < -1.2) c.push({ lv: 'warn', t: `Giảm ${Math.abs(r.wDelta)} kg – hơi nhanh. Đảm bảo ăn đủ đạm (${m.protein} g/ngày) để không mất cơ.` });
      else if (r.wDelta < 0) c.push({ lv: 'ok', t: `Cân nặng giảm ${Math.abs(r.wDelta)} kg – đúng hướng!` });
      else c.push({ lv: 'warn', t: 'Cân nặng chưa giảm. Đừng nản: dao động nước rất phổ biến. Kiểm tra lại đồ uống có đường, bia rượu và khẩu phần cơm.' });
    } else if (p.goal === 'muscle' || p.goal === 'gain') {
      if (r.wDelta > 0) c.push({ lv: 'ok', t: `Tăng ${r.wDelta} kg – tốt. Theo dõi vòng eo để chắc tăng cơ là chính.` });
      else c.push({ lv: 'warn', t: 'Cân nặng chưa tăng: thêm 1 bữa phụ (sữa + chuối, bánh mì trứng) mỗi ngày.' });
    }
  } else c.push({ lv: 'warn', t: 'Chưa có đủ số đo cân nặng. Cân 1–2 lần/tuần vào buổi sáng để theo dõi xu hướng.' });
  if (r.sleep != null && r.sleep < 7) c.push({ lv: 'warn', t: `Ngủ trung bình ${r1(r.sleep)} giờ – thử lên giường sớm hơn 15 phút mỗi tuần.` });
  if (r.water != null && r.water < m.water * 0.75) c.push({ lv: 'warn', t: `Uống trung bình ${r1(r.water)} cốc/ngày, mục tiêu ${m.water} cốc. Mang bình nước theo người.` });
  if (r.kcalIn != null) {
    const d = r.kcalIn - m.kcal;
    if (Math.abs(d) <= 150) c.push({ lv: 'ok', t: `Năng lượng ăn vào trung bình ${Math.round(r.kcalIn)} kcal – sát mục tiêu ${m.kcal}.` });
    else c.push({ lv: 'warn', t: `Ăn vào trung bình ${Math.round(r.kcalIn)} kcal, ${d > 0 ? 'cao' : 'thấp'} hơn mục tiêu ${Math.abs(Math.round(d))} kcal.` });
    if (r.protein != null && r.protein < m.protein * 0.8) c.push({ lv: 'warn', t: `Đạm trung bình ${Math.round(r.protein)} g/ngày, mục tiêu ${m.protein} g: thêm trứng, sữa, đậu phụ.` });
  }
  if (r.rpe != null && r.rpe <= 4) c.push({ lv: 'ok', t: 'Bạn chấm buổi tập khá nhẹ – sẵn sàng tăng độ khó bài tập.' });
  if (r.rpe != null && r.rpe >= 9) c.push({ lv: 'warn', t: 'Buổi tập đang rất nặng (RPE ≥ 9) – nên giảm độ khó một bậc.' });
  return c;
}
// đánh giá để lên/xuống giai đoạn: dựa trên 7 ngày gần nhất
export function evaluate(p) {
  const t = today(), from = addDays(t, -7);
  const st = stageInfo(p), daysIn = diffDays(p.stageStart || p.start, t);
  if (diffDays(p.start, t) < 7) return { kind: 'wait', t: `Còn ${7 - diffDays(p.start, t)} ngày nữa sẽ có đánh giá tuần đầu tiên.` };
  const days = []; for (let d = from; d < t; d = addDays(d, 1)) days.push(dayStats(p, d));
  const planned = days.filter(x => x.planned).length, done = days.filter(x => x.done).length;
  const hT = days.reduce((s, x) => s + x.habitTotal, 0), hD = days.reduce((s, x) => s + x.habitDone, 0);
  const adh = Math.round(((planned ? Math.min(1, done / planned) : 1) * 0.5 + (hT ? hD / hT : 0) * 0.5) * 100);
  const rpes = days.map(x => x.log.workout && x.log.workout.rpe).filter(Boolean), rpe = avg(rpes);
  if (adh >= 80 && st.weeks && daysIn >= st.weeks * 7 && st.idx < 3) return { kind: 'up', adh, t: `7 ngày qua bạn tuân thủ ${adh}%. Bạn đã sẵn sàng lên giai đoạn "${STAGES[st.idx + 1].name}".` };
  if (adh >= 80 && rpe && rpe <= 4) return { kind: 'harder', adh, t: `Tuân thủ ${adh}% và thấy bài nhẹ – có thể tăng độ khó bài tập ngay.` };
  if (adh < 50) return { kind: 'down', adh, t: `7 ngày qua tuân thủ ${adh}%. Không sao cả – hãy làm kế hoạch nhẹ hơn để giữ thói quen.` };
  if (rpe && rpe >= 9) return { kind: 'easier', adh, t: 'Các buổi tập đang quá nặng – nên giảm độ khó bài.' };
  return { kind: 'keep', adh, t: `Tuân thủ ${adh}%. Tiếp tục giữ nhịp${st.weeks ? `, còn ${Math.max(0, st.weeks * 7 - daysIn)} ngày nữa để hoàn thành giai đoạn` : ''}.` };
}
export function badges(p) {
  const logs = p.logs || {}, ks = Object.keys(logs).sort();
  const wk = ks.filter(k => logs[k].workout && logs[k].workout.done).length;
  const s = streak(p), m0 = p.startWeight || p.weight, lw = latestWeight(p);
  const water = ks.filter(k => (logs[k].water || 0) >= metrics(p).water).length;
  return [
    { icon: '🌱', name: 'Bước đầu tiên', got: wk >= 1, d: 'Hoàn thành buổi tập đầu tiên' },
    { icon: '🔥', name: 'Chuỗi 7 ngày', got: s >= 7, d: '7 ngày liên tiếp có hoạt động' },
    { icon: '🏅', name: '10 buổi tập', got: wk >= 10, d: 'Hoàn thành 10 buổi' },
    { icon: '🏆', name: '30 buổi tập', got: wk >= 30, d: 'Hoàn thành 30 buổi' },
    { icon: '💎', name: 'Chuỗi 30 ngày', got: s >= 30, d: '30 ngày liên tiếp' },
    { icon: '💧', name: 'Đủ nước 7 ngày', got: water >= 7, d: 'Uống đủ nước 7 ngày' },
    { icon: '📉', name: 'Tiến bộ 2 kg', got: Math.abs(lw - m0) >= 2 && ((p.goal === 'lose' && lw < m0) || (p.goal !== 'lose' && lw > m0)), d: 'Thay đổi 2 kg đúng mục tiêu' },
    { icon: '🚀', name: 'Lên giai đoạn 3', got: (p.stage || 0) >= 2, d: 'Đạt giai đoạn Phát triển' },
  ];
}
export function projection(p) {
  if (!p.targetWeight || !p.targetWeeks) return null;
  const pts = []; const w0 = p.startWeight || p.weight;
  for (let i = 0; i <= p.targetWeeks; i++) pts.push([addDays(p.start, i * 7), r1(w0 + (p.targetWeight - w0) * i / p.targetWeeks)]);
  return pts;
}
