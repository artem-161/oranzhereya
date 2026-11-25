// Хранилище: всё состояние живёт в IndexedDB на телефоне (в localStorage — запасной вариант).
// Никакого сервера. Чтобы не потерять данные — в разделе «Ещё» есть экспорт/импорт резервной копии.

import { today, addDays, diffDays, parseISO } from './dates.js';
import { getSpecies, MY_COLLECTION } from './catalog.js';

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
    settings: { name: 'Юля', seasonal: true, rooms: [], dismissed: [] },
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
  const every = effectiveEvery(type, c.every, t, plant);
  if (!every) return null; // уход «на паузе» по сезону
  const next = c.last ? addDays(c.last, every) : t;
  const left = diffDays(t, next);
  // progress: 1 — только что ухаживали, 0 — пора
  const progress = c.last ? Math.max(0, Math.min(1, left / every)) : 0;
  let level = 'ok';
  if (left < 0) level = 'overdue';
  else if (left === 0) level = 'due';
  else if (left <= 2) level = 'soon';
  return { type, next, left, progress, level, last: c.last, every, baseEvery: c.every, seasonal: every !== c.every };
}

/* ---------- Сезоны ---------- */

// Сезоны для комнатных растений (средняя полоса, отопительный сезон).
// k — множитель интервала полива; feed — подкармливать ли.
export const SEASONS = {
  winter: { name: 'Зима', months: [11, 0, 1], water: 1.4, feed: false,
    tip: 'Период покоя: света мало, рост замедлен. Поливай реже, подкормки на паузе, пересадку отложи до весны. Батареи сушат воздух — опрыскивание и увлажнитель очень кстати.' },
  spring: { name: 'Весна', months: [2, 3, 4], water: 1, feed: true,
    tip: 'Растения просыпаются — лучшее время для пересадки, обрезки и возобновления подкормок. Постепенно возвращай обычный режим полива.' },
  summer: { name: 'Лето', months: [5, 6, 7], water: 0.8, feed: true,
    tip: 'Активный рост: полив чаще, подкормки по расписанию. Береги от прямого полуденного солнца, можно вынести на балкон.' },
  autumn: { name: 'Осень', months: [8, 9, 10], water: 1.15, feed: true,
    tip: 'Рост замедляется: понемногу сокращай полив и подкормки. С октября подкормки лучше свести на нет. Пересаживать уже не стоит.' },
};

export function seasonOf(iso = today()) {
  const m = Number(iso.slice(5, 7)) - 1;
  return Object.entries(SEASONS).find(([, v]) => v.months.includes(m))[0];
}

/** Интервал с учётом сезона (если включён «сезонный режим»). 0 = на паузе. */
export function effectiveEvery(type, every, iso = today(), plant = null) {
  if (!every || !state.settings.seasonal) return every;
  const seasonKey = seasonOf(iso);
  const se = SEASONS[seasonKey];
  const sp = plant?.speciesId ? getSpecies(plant.speciesId) : null;
  if (sp) {
    // Для видов из каталога — их собственный зимний режим
    const month = Number(iso.slice(5, 7)) - 1;
    if (type === 'fertilize') return sp.feedMonths.includes(month) ? every : 0;
    if (type === 'water' && sp.water[0]) {
      const ratio = sp.water[1] / sp.water[0];
      const k = { winter: ratio, autumn: (1 + ratio) / 2, spring: 1, summer: 0.85 }[seasonKey];
      return Math.max(1, Math.round(every * k));
    }
    if (type === 'mist' && seasonKey === 'winter') return every;
  }
  if (type === 'water' || type === 'mist') return Math.max(1, Math.round(every * se.water));
  if (type === 'fertilize' && !se.feed) return 0;
  return every;
}

/** Когда последний раз пересаживали (по расписанию, дневнику или дате появления). */
export function lastRepot(p) {
  return p.care.repot?.last || p.log.find((e) => e.type === 'repot')?.date || null;
}

/** Совет по пересадке для растения. */
export function repotAdvice(p, t = today()) {
  const last = lastRepot(p);
  const since = last ? diffDays(last, t) : (p.acquired ? diffDays(p.acquired, t) : null);
  const season = seasonOf(t);
  const y = Number(t.slice(0, 4));
  const springStart = season === 'spring' ? t : `${Number(t.slice(5, 7)) >= 6 ? y + 1 : y}-03-01`;
  const need = since == null ? 'unknown' : since >= 540 ? 'now' : since >= 330 ? 'soon' : 'ok';
  return { last, since, need, window: springStart, inWindow: season === 'spring' };
}

/* ---------- Задачи на конкретный день ---------- */

/**
 * Что запланировано на день. Прошлое — то, что было сделано (из дневника),
 * сегодня — всё, что пора и просрочено, будущее — прогноз по интервалам.
 */
export function tasksOn(iso) {
  const t = today();
  if (iso < t) {
    const out = [];
    for (const p of state.plants) for (const e of p.log) if (e.date === iso) out.push({ plant: p, type: e.type, entry: e, done: true });
    return out;
  }
  const out = [];
  for (const p of state.plants) {
    for (const k of CARE_KEYS) {
      const st = careStatus(p, k);
      if (!st) continue;
      if (iso === t) { if (st.left <= 0) out.push({ plant: p, ...st }); continue; }
      const base = st.next < t ? t : st.next;
      const d = diffDays(base, iso);
      if (d >= 0 && d % st.every === 0) out.push({ plant: p, ...st, left: diffDays(t, iso), next: iso, level: 'ok' });
    }
  }
  return out;
}

/** Сколько дел на каждый день диапазона (для точек в календаре). */
export function countsBetween(from, to) {
  const map = {};
  for (let d = from; d <= to; d = addDays(d, 1)) map[d] = tasksOn(d).length;
  return map;
}

/* ---------- Статистика ---------- */

export function careStats(t = today()) {
  const all = state.plants.flatMap((p) => p.log.map((e) => ({ ...e, plant: p })));
  const last30 = all.filter((e) => diffDays(e.date, t) < 30 && e.date <= t);
  const byType = Object.fromEntries(CARE_KEYS.map((k) => [k, last30.filter((e) => e.type === k).length]));
  const activeDays = new Set(last30.map((e) => e.date)).size;

  // по неделям: 8 последних недель (пн–вс)
  const dow = (parseISO(t).getDay() + 6) % 7;
  const weekStart = addDays(t, -dow);
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const from = addDays(weekStart, -7 * (7 - i)), to = addDays(from, 6);
    return { from, to, n: all.filter((e) => e.date >= from && e.date <= to).length };
  });

  // реальный интервал полива vs план
  const rhythm = state.plants.map((p) => {
    const dates = [...new Set(p.log.filter((e) => e.type === 'water').map((e) => e.date))].sort();
    if (dates.length < 3 || !p.care.water.every) return null;
    const gaps = dates.slice(1).map((d, i) => diffDays(dates[i], d)).slice(-6);
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    return { plant: p, avg: Math.round(avg * 10) / 10, plan: effectiveEvery('water', p.care.water.every, t, p) };
  }).filter(Boolean);

  // прогноз на 30 дней
  const forecast = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(t, i);
    return { date: d, n: tasksOn(d).length };
  });

  return { total30: last30.length, byType, activeDays, weeks, rhythm, forecast };
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

/* ---------- Каталог видов ---------- */

/** Поля растения по виду из каталога: название, латынь, свет, интервалы ухода. */
export function fromSpecies(sp) {
  return {
    speciesId: sp.id,
    species: sp.latin,
    light: sp.light,
    care: {
      water: { every: sp.water[0], last: null },
      fertilize: { every: sp.feed, last: null },
      mist: { every: sp.mist, last: null },
      repot: { every: 0, last: null },
      prune: { every: 0, last: null },
    },
  };
}

/** Добавить коллекцию Юли целиком (пропуская уже добавленные). */
export function importCollection() {
  const t = today();
  const have = new Set(state.plants.map((p) => p.name.toLowerCase()));
  let n = 0;
  commit((s) => {
    for (const [name, id, latin] of MY_COLLECTION) {
      if (have.has(name.toLowerCase())) continue;
      const sp = getSpecies(id);
      const base = fromSpecies(sp);
      for (const k of Object.keys(base.care)) if (base.care[k].every) base.care[k].last = t;
      s.plants.push(normalizePlant({ id: uid(), name, createdAt: t, acquired: null, ...base, species: latin || sp.latin, log: [] }));
      n++;
    }
  });
  return n;
}

export function dismiss(key) {
  commit((s) => { if (!s.settings.dismissed.includes(key)) s.settings.dismissed.push(key); });
}

/* ---------- Комнаты ---------- */

export function saveRoom(room) {
  commit((s) => {
    const i = s.settings.rooms.findIndex((r) => r.id === room.id);
    if (i >= 0) {
      const old = s.settings.rooms[i].name;
      s.settings.rooms[i] = room;
      if (old !== room.name) s.plants.forEach((p) => { if (p.location === old) p.location = room.name; });
    } else s.settings.rooms.push({ ...room, id: uid() });
  });
}

export function deleteRoom(id) {
  commit((s) => { s.settings.rooms = s.settings.rooms.filter((r) => r.id !== id); });
}

export const roomOf = (p) => state.settings.rooms.find((r) => r.name === p.location) || null;

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
  const hist = (every, n, tt) => Array.from({ length: n }, (_, i) => ({ id: uid(), type: 'water', date: addDays(tt, -(i * every + (i ? Math.floor(Math.random() * 3) : 0))), note: '' }));
  const t = today();
  const mk = (name, species, location, light, water, wLast, extra = {}) => normalizePlant({
    id: uid(), name, species, location, light, createdAt: t,
    acquired: addDays(t, -(30 + Math.floor(Math.random() * 500))),
    care: {
      water: { every: water, last: addDays(t, -wLast) },
      fertilize: { every: 30, last: addDays(t, -(3 + Math.floor(Math.random() * 24))) },
      ...extra,
    },
    log: hist(water, 8, addDays(t, -wLast)),
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
