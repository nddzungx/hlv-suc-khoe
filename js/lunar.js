// ===== ÂM LỊCH VIỆT NAM (thuật toán Hồ Ngọc Đức, múi giờ +7) =====
const INT = Math.floor, PI = Math.PI, TZ = 7;
function jdFromDate(dd, mm, yy) {
  const a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  return jd;
}
function newMoon(k) {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr) - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr)) - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr)) + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3 : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return INT(Jd1 + C1 - deltat + 0.5 + TZ / 24);
}
function sunLong(jdn) {
  const T = (jdn - 2451545.5 - TZ / 24) / 36525, T2 = T * T, dr = PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr; L -= PI * 2 * INT(L / (PI * 2));
  return INT(L / PI * 6);
}
function month11(yy) {
  const k = INT((jdFromDate(31, 12, yy) - 2415021) / 29.530588853);
  let nm = newMoon(k); if (sunLong(nm) >= 9) nm = newMoon(k - 1); return nm;
}
function leapOffset(a11) {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last, i = 1, arc = sunLong(newMoon(k + i));
  do { last = arc; i++; arc = sunLong(newMoon(k + i)); } while (arc !== last && i < 14);
  return i - 1;
}
const cache = new Map();
// 'YYYY-MM-DD' -> { d, m, y, leap }
export function toLunar(s) {
  if (cache.has(s)) return cache.get(s);
  const [yy, mm, dd] = s.split('-').map(Number);
  const dn = jdFromDate(dd, mm, yy), k = INT((dn - 2415021.076998695) / 29.530588853);
  let ms = newMoon(k + 1); if (ms > dn) ms = newMoon(k);
  let a11 = month11(yy), b11 = a11, ly;
  if (a11 >= ms) { ly = yy; a11 = month11(yy - 1); } else { ly = yy + 1; b11 = month11(yy + 1); }
  const d = dn - ms + 1, diff = INT((ms - a11) / 29);
  let leap = 0, m = diff + 11;
  if (b11 - a11 > 365) { const lo = leapOffset(a11); if (diff >= lo) { m = diff + 10; if (diff === lo) leap = 1; } }
  if (m > 12) m -= 12; if (m >= 11 && diff < 4) ly -= 1;
  const r = { d, m, y: ly, leap }; cache.set(s, r); return r;
}
const next = s => { const [y, m, d] = s.split('-').map(Number); const t = new Date(y, m - 1, d + 1); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
export const isLastLunarDay = s => toLunar(next(s)).d === 1;
// kiểu ăn chay kỳ: '2' = mùng 1 & rằm; '4' = 30 (ngày cuối tháng), 1, 14, 15; '10' = thập trai
export const VEG_SETS = { 2: 'Mùng 1 và rằm (15)', 4: 'Ngày cuối tháng, mùng 1, 14, rằm', 10: 'Thập trai: 1, 8, 14, 15, 18, 23, 24, 28, 29, 30' };
export function isVegLunar(s, kind = '2') {
  const L = toLunar(s), last = isLastLunarDay(s);
  if (kind == '4') return [1, 14, 15].includes(L.d) || last;
  if (kind == '10') { if ([1, 8, 14, 15, 18, 23, 24, 28, 29, 30].includes(L.d)) return true; return L.d === 27 && isLastLunarDay(next(next(s))); }
  return L.d === 1 || L.d === 15;
}
export const lunarLabel = s => { const L = toLunar(s); return L.d === 1 ? `Mùng 1/${L.m}${L.leap ? ' (nhuận)' : ''}` : L.d === 15 ? `Rằm tháng ${L.m}` : `${L.d}/${L.m}${L.leap ? ' nhuận' : ''} âm lịch`; };
