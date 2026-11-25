// Точка входа: роутер по #хэшу, отрисовка экранов, обработка нажатий.

import { hydrateIcons } from './icons.js';
import { $, $$, toast, confirmSheet, openSheet, closeAllSheets, esc } from './ui.js';
import * as store from './store.js';
import { plantForm, wishForm, careLogForm } from './forms.js';
import * as today from './views/today.js';
import * as plants from './views/plants.js';
import * as plant from './views/plant.js';
import * as wishes from './views/wishes.js';
import * as more from './views/more.js';
import * as stats from './views/stats.js';

/* ---------- Роутинг ---------- */

const routes = [
  { re: /^\/today$/, view: today, tab: 'today' },
  { re: /^\/plants$/, view: plants, tab: 'plants' },
  { re: /^\/plant\/([\w-]+)$/, view: plant, tab: 'plants', params: (m) => ({ id: m[1] }) },
  { re: /^\/wishes$/, view: wishes, tab: 'wishes' },
  { re: /^\/more$/, view: more, tab: 'more' },
  { re: /^\/stats$/, view: stats, tab: 'today' },
];

let current = null;
let navCount = 0; // сколько переходов внутри приложения — чтобы «Назад» работал правильно

function match() {
  const path = location.hash.replace(/^#/, '') || '/today';
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) return { ...r, params: r.params ? r.params(m) : {} };
  }
  return { ...routes[0], params: {} };
}

const viewEl = $('#view');

function render({ keepScroll = false } = {}) {
  const route = match();
  const out = route.view.render(route.params);
  const scroll = window.scrollY;

  viewEl.innerHTML = out.html;
  viewEl.className = `view view-${route.tab}${out.immersive ? ' immersive' : ''}`;
  hydrateIcons(viewEl);
  out.mount?.(viewEl, () => render({ keepScroll: true }));

  document.title = out.title ? `${out.title} · Оранжерея` : 'Оранжерея';
  $('#topbar-title').textContent = out.title || '';
  $('#topbar-back').hidden = !out.back;

  const routeChanged = current?.key !== location.hash;
  current = { ...route, out, key: location.hash };

  if (keepScroll && !routeChanged) window.scrollTo(0, scroll);
  else {
    window.scrollTo(0, 0);
    viewEl.classList.remove('enter');
    void viewEl.offsetWidth;
    viewEl.classList.add('enter');
  }

  updateFab(route); // сначала FAB: от него зависит ширина таббара
  setActiveTab(route.tab);
  onScroll();
}

/* ---------- Нижнее меню: «линза» под активной вкладкой ---------- */

function setActiveTab(tab) {
  const tabs = $$('.tab');
  tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  const active = tabs.find((t) => t.dataset.tab === tab);
  const lens = $('#tab-lens');
  if (active && lens) {
    lens.style.width = `${active.offsetWidth}px`;
    lens.style.transform = `translateX(${active.offsetLeft}px)`;
  }
}

function updateFab(route) {
  const fab = $('#fab');
  fab.hidden = route.tab === 'more';
  fab.dataset.mode = route.view === plant ? 'log' : route.tab === 'wishes' ? 'wish' : 'plant';
  fab.setAttribute('aria-label', { log: 'Запись ухода', wish: 'Новая хотелка', plant: 'Новое растение' }[fab.dataset.mode]);
}

/* ---------- Шапка, появляющаяся при прокрутке ---------- */

function onScroll() {
  const threshold = current?.out?.immersive ? 300 : 70;
  $('#topbar').classList.toggle('show', window.scrollY > threshold);
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Действия ---------- */

function goBack() {
  if (navCount > 0) history.back();
  else location.hash = '#/plants';
}

const actions = {
  back: () => goBack(),
  fab: (el) => {
    const mode = el.dataset.mode;
    if (mode === 'wish') wishForm();
    else if (mode === 'log') careLogForm(current.params.id);
    else plantForm(null, (p) => { location.hash = `#/plant/${p.id}`; });
  },
  'add-plant': () => plantForm(null, (p) => { location.hash = `#/plant/${p.id}`; }),
  'add-wish': () => wishForm(),
  'edit-plant': (el) => plantForm(el.dataset.id),
  'edit-wish': (el) => wishForm(el.dataset.id),
  'log-care': (el) => careLogForm(el.dataset.plant),

  done: (el) => {
    const { plant: id, type } = el.dataset;
    const p = store.getPlant(id);
    el.classList.add('pop');
    setTimeout(() => {
      const undo = store.logCare(id, type);
      toast(`${store.CARE[type].done} · ${p.name}`, { action: 'Отменить', onAction: undo });
    }, 220);
  },

  'del-log': async (el) => {
    if (await confirmSheet({ title: 'Удалить запись?', ok: 'Удалить' })) store.deleteLogEntry(el.dataset.plant, el.dataset.entry);
  },

  'delete-plant': async (el) => {
    const p = store.getPlant(el.dataset.id);
    if (await confirmSheet({ title: `Удалить «${p.name}»?`, text: 'Вместе с фото и историей ухода. Это нельзя отменить.' })) {
      location.hash = '#/plants';
      store.deletePlant(p.id);
      toast('Растение удалено');
    }
  },

  fulfill: (el) => {
    const p = store.fulfillWish(el.dataset.id);
    if (p) toast(`Ура! ${p.name} теперь в коллекции 🎉`, { action: 'Открыть', onAction: () => { location.hash = `#/plant/${p.id}`; } });
  },

  'delete-wish': async (el) => {
    if (await confirmSheet({ title: 'Удалить хотелку?', ok: 'Удалить' })) store.deleteWish(el.dataset.id);
  },

  'toggle-seasonal': () => {
    store.commit((s) => { s.settings.seasonal = !s.settings.seasonal; });
    toast(store.state.settings.seasonal ? 'Сезонный режим включён' : 'Сезонный режим выключен');
  },

  seed: () => { store.seedDemo(); toast('Добавила примеры — можно всё потрогать'); },

  rename: () => openSheet({
    title: 'Как к тебе обращаться?',
    body: `<form class="form"><div class="field-group"><label class="field"><input name="name" value="${esc(store.state.settings.name)}" placeholder="Имя" /></label></div>
      <button class="btn btn-primary btn-block" type="submit">Сохранить</button></form>`,
    onMount(el, close) {
      $('form', el).onsubmit = (e) => {
        e.preventDefault();
        const name = new FormData(e.target).get('name').trim();
        store.commit((s) => { s.settings.name = name || 'Юля'; });
        close();
      };
    },
  }),

  export: async () => {
    const json = store.exportJSON();
    const fname = `oranzhereya-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([json], fname, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Оранжерея — резервная копия' });
        return;
      }
    } catch (e) { if (e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = fname;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },

  reset: async () => {
    if (await confirmSheet({ title: 'Удалить всё?', text: 'Все растения, история и хотелки исчезнут с этого телефона. Сначала лучше сохранить резервную копию.', ok: 'Да, удалить всё' })) {
      store.resetAll();
      toast('Всё очищено');
    }
  },
};

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-action]');
  if (a && actions[a.dataset.action]) {
    e.preventDefault();
    e.stopPropagation();
    actions[a.dataset.action](a, e);
    return;
  }
  const link = e.target.closest('[data-href]');
  if (link) location.hash = link.dataset.href;
});

document.addEventListener('change', async (e) => {
  if (e.target.matches('[data-input="import"]')) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!(await confirmSheet({ title: 'Восстановить из копии?', text: 'Текущие данные на телефоне будут заменены данными из файла.', ok: 'Восстановить', danger: false }))) return;
    try { store.importJSON(await f.text()); toast('Данные восстановлены 🌿'); }
    catch (err) { toast(err.message || 'Не получилось прочитать файл'); }
  }
});

/* ---------- Старт ---------- */

window.addEventListener('hashchange', () => { navCount++; closeAllSheets(); render(); });
window.addEventListener('resize', () => current && setActiveTab(current.tab));

store.subscribe(() => render({ keepScroll: true }));

hydrateIcons(document);
await store.load();
if (!location.hash) history.replaceState(null, '', '#/today');
render();
requestAnimationFrame(() => document.body.classList.add('ready'));

// Офлайн-режим и установка на экран «Домой»
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW', e));
}
