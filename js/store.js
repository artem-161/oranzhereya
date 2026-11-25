// Хранилище: всё состояние живёт в IndexedDB на телефоне (в localStorage — запасной вариант).
// Никакого сервера. Чтобы не потерять данные — в разделе «Ещё» есть экспорт/импорт резервной копии.

import { today, addDays, diffDays } from './dates.js';

/* ---------- Справочники ---------- */

// Виды ухода. Чтобы добавить новый (например «протереть листья») — допиши сюда, остальное подхватится само.
export const CARE = {
  water:     { label: 'Полив',        verb: 'Полить',      done: 'Полито',        icon: 'drop',     hue: 'water', every: 7 },
  fertilize: { label: 'Подкормка',    verb: 'Подкормить',  done: 'Подкормлено',   icon: 'sprout',   hue: 'feed',  every: 30 },
  mist:      { label: 'Опрыскивание', verb: 'Опрыскать',   done: 'Опрыскано',     icon: 'mist',     hue: 'mist',  every: 0 },
  repot:     { label: 'Пересадка',    verb: 'Пересадить',  done: 'Пересажено',    icon: 'pot',      hue: 'soil',  every: 0 },
  prune:     { label: 'Обрезка',      verb: 'Обрезать',    done: 'Обрезано',      icon: 'scissors', hue: 'leaf',  every: 0 },
};
export const CARE_KEYS = Object.keys(CARE);

export const LIGHT = {
  bright: 'Яркий свет',
  diffused: 'Рассеянный свет',
  shade: 'Полутень',
};

/* ---------- IndexedDB (минимальная обёртка ключ-значение) ---------- */

const DB_NAME = 'oranzhereya';
const STORE = 'kv';
const KEY = 'state';
const LS_KEY = 'oranzhereya-state';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE).objectStore(STORE).get(KEY);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function idbSet(value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, KEY);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

/* ---------- Состояние ---------- */

const SCHEMA = 1;

function emptyState() {
  return {
    schema: SCHEMA,
    settings: { name: 'Юля' },
    plants: [],
    wishes: [],
  };
}

export let state = emptyState();
const listeners = new Set();

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

/** Миграции схемы данных: когда меняем формат — добавляем шаг сюда. */
function migrate(s) {
  const base = emptyState();
  const out = { ...base, ...s, settings: { ...base.settings, ...(s.settings || {}) } };
  out.plants = (out.plants || []).map(normalizePlant);
  out.wishes = out.wishes || [];
  out.schema = SCHEMA;
  return out;
}

function normalizePlant(p) {
  const care = {};
  for (const k of CARE_KEYS) {
    care[k] = { every: CARE[k].every, last: null, ...(p.care?.[k] || {}) };
  }
  return { log: [], notes: '', location: '', species: '', light: 'diffused', photo: null, ...p, care };
}

export async function load() {
  let data = null;
  try { data = await idbGet(); } catch (e) { console.warn('IndexedDB недоступна', e); }
  if (!data) {
    try { data = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch {}
  }
  state = data ? migrate(data) : emptyState();
  // Просим браузер не удалять данные при нехватке места (особенно важно на iPhone).
  navigator.storage?.persist?.().catch(() => {});
  return state;
}

let saveTimer;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try { await idbSet(state); }
    catch (e) {
      console.warn('Сохраняю в localStorage', e);
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e2) { console.error(e2); }
    }
  }, 150);
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** Единственный способ менять данные: commit(s => { ...мутации... }) */
export function commit(mutator) {
  mutator(state);
  persist();
  listeners.forEach((fn) => fn(state));
}

export function replaceState(next) {
  state = migrate(next);
  persist();
  listeners.forEach((fn) => fn(state));
}

/* ---------- Растения ---------- */

export const getPlant = (id) => state.plants.find((p) => p.id === id);

export function addPlant(data) {
  const p = normalizePlant({ id: uid(), createdAt: today(), acquired: today(), ...data });
  commit((s) => s.plants.unshift(p));
  return p;
}

export function updatePlant(id, patch) {
  commit((s) => {
    const p = s.plants.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
  });
}

export function deletePlant(id) {
  commit((s) => { s.plants = s.plants.filter((p) => p.id !== id); });
}

/** Отметить уход. Возвращает функцию «отменить». */
export function logCare(plantId, type, date = today(), note = '') {
  const p = getPlant(plantId);
  if (!p) return () => {};
  const prevLast = p.care[type]?.last ?? null;
  const entry = { id: uid(), type, date, note };
  commit(() => {
    p.log.unshift(entry);
    p.log.sort((a, b) => (a.date < b.date ? 1 : -1));
    if (!prevLast || date >= prevLast) p.care[type].last = date;
  });
  return () => commit(() => {
    p.log = p.log.filter((e) => e.id !== entry.id);
    p.care[type].last = prevLast;
  });
}

export function deleteLogEntry(plantId, entryId) {
  const p = getPlant(plantId);
  if (!p) return;
  commit(() => {
    const e = p.log.find((x) => x.id === entryId);
    p.log = p.log.filter((x) => x.id !== entryId);
    if (e && p.care[e.type]?.last === e.date) {
      // пересчитать «последний раз» по оставшейся истории
      p.care[e.type].last = p.log.find((x) => x.type === e.type)?.date ?? null;
    }
  });
}

/* ---------- Расчёт задач ухода ---------- */

/**
 * Статус одного вида ухода для растения.
 * Возвращает null, если этот уход не отслеживается (every = 0).
 */
export function careStatus(plant, type) {
  const c = plant.care[type];
  if (!c || !c.every) return null;
  const t = today();
  const next = c.last ? addDays(c.last, c.every) : t;
  const left = diffDays(t, next);
  // progress: 1 — только что ухаживали, 0 — пора
  const progress = c.last ? Math.max(0, Math.min(1, left / c.every)) : 0;
  let level = 'ok';
  if (left < 0) level = 'overdue';
  else if (left === 0) level = 'due';
  else if (left <= 2) level = 'soon';
  return { type, next, left, progress, level, last: c.last, every: c.every };
}

/** Все задачи по всем растениям, отсортированные по срочности. */
export function allTasks(horizonDays = 7) {
  const tasks = [];
  for (const p of state.plants) {
    for (const k of CARE_KEYS) {
      const st = careStatus(p, k);
      if (st && st.left <= horizonDays) tasks.push({ plant: p, ...st });
    }
  }
  return tasks.sort((a, b) => a.left - b.left || a.plant.name.localeCompare(b.plant.name));
}

/** Самый срочный статус растения — для бейджа на карточке. */
export function plantUrgency(p) {
  const list = CARE_KEYS.map((k) => careStatus(p, k)).filter(Boolean);
  if (!list.length) return null;
  return list.sort((a, b) => a.left - b.left)[0];
}

/* ---------- Хотелки ---------- */

export function addWish(data) {
  const w = { id: uid(), createdAt: today(), priority: 2, done: false, ...data };
  commit((s) => s.wishes.unshift(w));
  return w;
}

export function updateWish(id, patch) {
  commit((s) => { const w = s.wishes.find((x) => x.id === id); if (w) Object.assign(w, patch); });
}

export function deleteWish(id) {
  commit((s) => { s.wishes = s.wishes.filter((w) => w.id !== id); });
}

/** Хотелка сбылась: переносим в коллекцию. */
export function fulfillWish(id) {
  const w = state.wishes.find((x) => x.id === id);
  if (!w) return null;
  const p = addPlant({ name: w.name, species: w.species || '', photo: w.photo || null, notes: w.note || '' });
  updateWish(id, { done: true, doneAt: today(), plantId: p.id });
  return p;
}

/* ---------- Демо-данные ---------- */

export function seedDemo() {
  const t = today();
  const mk = (name, species, location, light, water, wLast, extra = {}) => normalizePlant({
    id: uid(), name, species, location, light, createdAt: t,
    acquired: addDays(t, -(30 + Math.floor(Math.random() * 500))),
    care: {
      water: { every: water, last: addDays(t, -wLast) },
      fertilize: { every: 30, last: addDays(t, -(3 + Math.floor(Math.random() * 24))) },
      ...extra,
    },
    log: [{ id: uid(), type: 'water', date: addDays(t, -wLast), note: '' }],
  });
  commit((s) => {
    s.plants.push(
      mk('Монстера', 'Monstera deliciosa', 'Гостиная', 'diffused', 7, 8, { fertilize: { every: 30, last: addDays(t, -12) } }),
      mk('Фикус Лирата', 'Ficus lyrata', 'Спальня', 'bright', 7, 7),
      mk('Калатея', 'Calathea orbifolia', 'Ванная', 'shade', 4, 2, { mist: { every: 2, last: addDays(t, -2) } }),
      mk('Сансевиерия', 'Sansevieria trifasciata', 'Коридор', 'shade', 18, 5),
      mk('Пилея', 'Pilea peperomioides', 'Подоконник', 'bright', 6, 5),
    );
    s.wishes.push(
      { id: uid(), name: 'Филодендрон Пинк Принцесс', species: 'Philodendron erubescens', note: 'С розовыми листьями!', priority: 3, price: '4500', where: 'Цветочный рынок', done: false, createdAt: t },
      { id: uid(), name: 'Хойя Керри', species: 'Hoya kerrii', note: 'Листик-сердечко', priority: 2, price: '900', where: '', done: false, createdAt: t },
      { id: uid(), name: 'Строманта Триостар', species: 'Stromanthe sanguinea', note: '', priority: 1, price: '', where: '', done: false, createdAt: t },
    );
  });
}

/* ---------- Резервная копия ---------- */

export const exportJSON = () => JSON.stringify({ app: 'oranzhereya', exportedAt: new Date().toISOString(), ...state }, null, 2);

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.plants)) throw new Error('Это не похоже на резервную копию Оранжереи');
  replaceState(data);
}

export function resetAll() { replaceState(emptyState()); }
