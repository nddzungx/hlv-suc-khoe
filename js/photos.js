// ===== ẢNH TIẾN ĐỘ: lưu trong IndexedDB của máy (không gửi đi đâu) =====
const DB = 'hlvsk-photos', ST = 'photos';
let dbp = null;
function db() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => { const s = r.result.createObjectStore(ST, { keyPath: 'id' }); s.createIndex('pid', 'pid'); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  });
  return dbp;
}
const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction(ST, mode); const out = fn(t.objectStore(ST)); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); }); };
export async function listPhotos(pid) {
  const d = await db();
  return new Promise((res, rej) => { const r = d.transaction(ST).objectStore(ST).index('pid').getAll(pid); r.onsuccess = () => res(r.result.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.ts - b.ts)); r.onerror = () => rej(r.error); });
}
export const savePhoto = rec => tx('readwrite', s => s.put(rec));
export const deletePhoto = id => tx('readwrite', s => s.delete(id));
export async function deleteAll(pid) { const all = await listPhotos(pid); await tx('readwrite', s => all.forEach(p => s.delete(p.id))); }
// thu nhỏ ảnh về tối đa 900 px, JPEG ~80% (khoảng 80–150 KB/ảnh)
export function shrink(file, max = 900) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Không đọc được ảnh')); };
    img.src = url;
  });
}
