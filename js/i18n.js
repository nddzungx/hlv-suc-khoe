// ===== NGÔN NGỮ (Việt/Anh) + ĐƠN VỊ ĐO (kg-cm / lb-in) + SỐ CẤP CỨU THEO NƯỚC =====
import EN from './en.js';

export const LANGS = { vi: 'Tiếng Việt', en: 'English' };
let lang = 'vi';
try { lang = localStorage.getItem('hlvsk.lang') || ((navigator.language || 'vi').toLowerCase().startsWith('vi') ? 'vi' : 'en'); } catch (e) { }
if (!LANGS[lang]) lang = 'vi';
export const getLang = () => lang;
export function setLang(l) { lang = l; try { localStorage.setItem('hlvsk.lang', l); } catch (e) { } }
export const isEN = () => lang === 'en';
export const LOCALE = () => (lang === 'en' ? 'en-US' : 'vi-VN');

// ---------- đơn vị ----------
let units = 'metric';
export const setUnits = u => { units = u === 'imperial' ? 'imperial' : 'metric'; };
export const imp = () => units === 'imperial';
const LB = 2.20462262, IN = 0.393700787;
const r1 = x => Math.round(x * 10) / 10;
export const wOut = kg => kg == null || kg === '' || isNaN(kg) ? kg : r1(imp() ? kg * LB : +kg);
export const wIn = v => v == null || v === '' || isNaN(v) ? v : (imp() ? +v / LB : +v);
export const lOut = cm => cm == null || cm === '' || isNaN(cm) ? cm : r1(imp() ? cm * IN : +cm);
export const lIn = v => v == null || v === '' || isNaN(v) ? v : (imp() ? +v / IN : +v);
export const WU = () => (imp() ? 'lb' : 'kg');
export const LU = () => (imp() ? 'in' : 'cm');
const parseNum = s => { if (/,/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.')); if (/^\d{1,3}(\.\d{3})+$/.test(s)) return parseFloat(s.replace(/\./g, '')); return parseFloat(s); };
const fmtNum = x => r1(x).toLocaleString(LOCALE());
function unitPass(s) {
  if (!imp() || !/kg|cm/.test(s)) return s;
  const t = s.trim();
  if (t === 'kg') return s.replace('kg', 'lb');
  if (t === 'cm') return s.replace('cm', 'in');
  return s.replace(/\((kg|cm)\)/g, (m, u) => u === 'kg' ? '(lb)' : '(in)')
    .replace(/(\d+(?:[.,]\d+)*)(\s*[–-]\s*(\d+(?:[.,]\d+)*))?\s?(kg|cm)(?![a-zA-Z])/g, (m, a, r, b, u) => {
      const f = u === 'kg' ? LB : IN;
      return `${fmtNum(parseNum(a) * f)}${b ? '–' + fmtNum(parseNum(b) * f) : ''} ${u === 'kg' ? 'lb' : 'in'}`;
    });
}

// ---------- quốc gia & số cấp cứu ----------
export const COUNTRIES = {
  VN: ['Việt Nam', '113', 'metric'], US: ['Hoa Kỳ (Mỹ)', '911', 'imperial'], CA: ['Canada', '911', 'metric'], AU: ['Úc (Australia)', '000', 'metric'],
  NZ: ['New Zealand', '111', 'metric'], GB: ['Vương quốc Anh', '999', 'metric'], EU: ['Châu Âu (EU)', '112', 'metric'], RU: ['Nga', '112', 'metric'],
  JP: ['Nhật Bản', '119', 'metric'], KR: ['Hàn Quốc', '119', 'metric'], TW: ['Đài Loan', '119', 'metric'], CN: ['Trung Quốc', '120', 'metric'],
  SG: ['Singapore', '995', 'metric'], MY: ['Malaysia', '999', 'metric'], TH: ['Thái Lan', '1669', 'metric'], OTHER: ['Nước khác', '', 'metric'],
};
export function guessCountry() {
  let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { }
  if (/Ho_Chi_Minh|Saigon|Hanoi/.test(tz)) return 'VN';
  if (/Toronto|Vancouver|Montreal|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Calgary/.test(tz)) return 'CA';
  if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana|Kentucky|Boise)|^Pacific\/Honolulu|^US\//.test(tz)) return 'US';
  if (/^Australia\//.test(tz)) return 'AU'; if (/Auckland/.test(tz)) return 'NZ'; if (/London|Belfast/.test(tz)) return 'GB';
  if (/Moscow/.test(tz)) return 'RU'; if (/^Europe\//.test(tz)) return 'EU';
  const m = { Tokyo: 'JP', Seoul: 'KR', Taipei: 'TW', Shanghai: 'CN', Chongqing: 'CN', Singapore: 'SG', Kuala_Lumpur: 'MY', Bangkok: 'TH' };
  for (const k in m) if (tz.includes(k)) return m[k];
  return 'VN';
}
// chuỗi số cấp cứu để hiển thị
export function sos(country) {
  const c = COUNTRIES[country] || COUNTRIES.VN;
  if (country === 'VN') return isEN() ? '113 (115 still works during the transition)' : '113 (hoặc 115 trong giai đoạn chuyển tiếp)';
  if (!c[1]) return isEN() ? 'your local emergency number' : 'số cấp cứu tại nơi bạn sống';
  return c[1];
}

// ---------- dịch ----------
const COLLECT = (() => { try { return /collect/.test(location.search) || localStorage.getItem('hlvsk.collect') === '1'; } catch (e) { return false; } })();
export const missing = new Map();
const NUM = /\d+(?:[.,]\d+)*/g;
function split3(s) { const m = s.match(/^([^\p{L}\p{N}]*)([\s\S]*?)([^\p{L}\p{N}%)”"»]*)$/u); return m ? [m[1], m[2], m[3]] : ['', s, '']; }
function keyOf(core) {
  const qs = [], nums = [];
  let k = core.replace(/[“"]([^”"]+)[”"]/g, (m, x) => { qs.push(x); return `“{q${'abcdefgh'[qs.length - 1]}}”`; });
  k = k.replace(NUM, n => { nums.push(n); return `{${nums.length - 1}}`; });
  return { k, qs, nums };
}
function lookup(core) {
  if (EN[core] != null) return EN[core];
  const { k, qs, nums } = keyOf(core);
  const v = EN[k]; if (v == null) return null;
  return v.replace(/\{q([a-h])\}/g, (m, i) => tr(qs['abcdefgh'.indexOf(i)])).replace(/\{(\d+)\}/g, (m, i) => nums[i] ?? '');
}
const SEPS = [' · ', ' – ', ' — ', ' | ', '. ', ': ', '; '];
function tr(s) {
  if (!/\p{L}/u.test(s)) return s;
  const [pre, core, post] = split3(s); if (!core) return s;
  const v = lookup(core); if (v != null) return pre + v + post;
  for (const sep of SEPS) if (core.includes(sep)) return pre + core.split(sep).map(tr).join(sep) + post;
  return s;
}
function collect(s) {
  if (!/\p{L}/u.test(s)) return;
  const [, core] = split3(s); if (!core || !/\p{L}/u.test(core)) return;
  const { k } = keyOf(core); if (!missing.has(k)) missing.set(k, core);
}
export function T(s) {
  if (s == null) return s; s = String(s);
  if (lang === 'en') { s = tr(s); if (COLLECT && /[À-ỹĐđ]/.test(s)) collect(s); } else if (COLLECT) collect(s);
  return unitPass(s);
}
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
export function translateDOM(root) {
  if (!root || (lang !== 'en' && !imp() && !COLLECT)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => { const p = n.parentElement; if (!p || /^(SCRIPT|STYLE|TEXTAREA|OPTION_)$/.test(p.tagName) || p.closest('.nt,[translate="no"]')) return NodeFilter.FILTER_REJECT; return /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  for (const n of nodes) { const v = T(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
  if (root.querySelectorAll) for (const el of root.querySelectorAll('[placeholder],[title],[aria-label],[alt]')) for (const a of ATTRS) if (el.hasAttribute(a)) { const o = el.getAttribute(a), v = T(o); if (v !== o) el.setAttribute(a, v); }
}
export function observeBody() {
  try { new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.id !== 'app' && n.id !== 'layer') translateDOM(n); }).observe(document.body, { childList: true }); } catch (e) { }
}
