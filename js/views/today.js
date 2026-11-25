// Экран «Сегодня»: дела на выбранный день, полоска недели, календарь месяца.

import { icon } from '../icons.js';
import { esc, plantVisual, emptyState, openSheet } from '../ui.js';
import { state, CARE, allTasks, tasksOn, countsBetween, SEASONS, seasonOf } from '../store.js';
import { collectionTips } from '../tips.js';
import { today, addDays, parseISO, toISO, formatLong, weekday, weekdayShort, relative, days, plural } from '../dates.js';

// Выбранный день живёт между перерисовками
const ui = { day: null };
const selected = () => ui.day || today();

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

const mondayOf = (iso) => addDays(iso, -((parseISO(iso).getDay() + 6) % 7));

function taskRow(t, { canCheck = true } = {}) {
  const c = CARE[t.type];
  let when;
  if (t.done) when = t.entry.note ? esc(t.entry.note) : 'сделано';
  else if (t.left < 0) when = `просрочено на ${days(-t.left)}`;
  else if (t.left === 0) when = 'сегодня';
  else when = relative(t.next);
  const right = t.done
    ? `<span class="done-mark hue-${c.hue}">${icon('check')}</span>`
    : canCheck
      ? `<button class="check-btn hue-${c.hue}" data-action="done" data-plant="${t.plant.id}" data-type="${t.type}" aria-label="${c.verb}">${icon('check')}</button>`
      : '';
  return `
    <div class="task card ${t.level || ''}" data-href="#/plant/${t.plant.id}">
      ${plantVisual(t.plant, 'pv-sm')}
      <div class="task-text">
        <b>${esc(t.plant.name)}</b>
        <small><span class="hue-txt hue-${c.hue}">${icon(c.icon)} ${c.label}</span> · ${when}</small>
      </div>
      ${right}
    </div>`;
}

function weekStrip(sel) {
  const t = today();
  const start = mondayOf(sel);
  const counts = countsBetween(start, addDays(start, 6));
  const cells = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i);
    const n = counts[d];
    return `<button class="day ${d === t ? 'is-today' : ''} ${d === sel ? 'is-sel' : ''} ${d < t ? 'is-past' : ''}" data-action="pick-day" data-day="${d}">
      <small>${weekdayShort(d)}</small><b>${Number(d.slice(8))}</b>
      <span class="dots">${'<i></i>'.repeat(Math.min(n, 3))}</span>
    </button>`;
  }).join('');
  return `
    <section class="week-nav">
      <button class="week-arrow" data-action="shift-week" data-dir="-1" aria-label="Прошлая неделя">${icon('chevronLeft')}</button>
      <div class="week">${cells}</div>
      <button class="week-arrow" data-action="shift-week" data-dir="1" aria-label="Следующая неделя">${icon('chevronRight')}</button>
    </section>`;
}

/* ---------- Календарь месяца в шторке ---------- */

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

function monthGrid(year, month, sel) {
  const t = today();
  const first = toISO(new Date(year, month, 1));
  const lastDay = new Date(year, month + 1, 0).getDate();
  const last = toISO(new Date(year, month, lastDay));
  const counts = countsBetween(first, last);
  const lead = (parseISO(first).getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<span></span>');
  for (let d = 1; d <= lastDay; d++) {
    const iso = toISO(new Date(year, month, d));
    const n = counts[iso];
    cells.push(`<button class="cal-day ${iso === t ? 'is-today' : ''} ${iso === sel ? 'is-sel' : ''} ${iso < t ? 'is-past' : ''}" data-day="${iso}">
      <b>${d}</b><span class="dots">${'<i></i>'.repeat(Math.min(n, 3))}</span></button>`);
  }
  return `
    <div class="cal-head">
      <button class="glass-btn icon-btn" data-month="-1" aria-label="Предыдущий месяц">${icon('chevronLeft')}</button>
      <b>${MONTHS[month]} ${year}</b>
      <button class="glass-btn icon-btn" data-month="1" aria-label="Следующий месяц">${icon('chevronRight')}</button>
    </div>
    <div class="cal-wd">${['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map((w) => `<span>${w}</span>`).join('')}</div>
    <div class="cal-grid">${cells.join('')}</div>
    <p class="hint center">Точки — сколько дел: в прошлом сделанных, в будущем запланированных.</p>
    <button class="btn btn-ghost btn-block" data-go-today>Вернуться к сегодня</button>`;
}

export function openCalendar(rerender) {
  const sel = selected();
  let y = Number(sel.slice(0, 4)), m = Number(sel.slice(5, 7)) - 1;
  openSheet({
    title: 'Календарь',
    body: `<div data-cal>${monthGrid(y, m, sel)}</div>`,
    onMount(el, close) {
      const box = el.querySelector('[data-cal]');
      box.addEventListener('click', (e) => {
        const nav = e.target.closest('[data-month]');
        if (nav) {
          m += Number(nav.dataset.month);
          if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
          box.innerHTML = monthGrid(y, m, selected());
          return;
        }
        const day = e.target.closest('[data-day]');
        if (day) { ui.day = day.dataset.day; close(); rerender(); return; }
        if (e.target.closest('[data-go-today]')) { ui.day = null; close(); rerender(); }
      });
    },
  });
}

function tipsBlock() {
  const tips = collectionTips(2);
  if (!tips.length) return '';
  return `<div class="tips-list">${tips.map((x) => `
    <div class="tip card" ${x.href ? `data-href="${x.href}"` : x.action ? `data-action="${x.action}"` : ''}>
      <span class="tip-ico">${icon(x.icon)}</span>
      <div><b>${esc(x.title)}</b><p>${esc(x.text)}</p></div>
      <button class="tip-x" data-action="dismiss-tip" data-key="${esc(x.key)}" aria-label="Скрыть">${icon('close')}</button>
    </div>`).join('')}</div>`;
}

/* ---------- Экран ---------- */

export function render() {
  const t = today();
  const sel = selected();
  const name = state.settings.name;
  const head = `
    <header class="page-head">
      <p class="eyebrow">${weekday(t)}, ${formatLong(t)}</p>
      <h1 class="title">${greeting()},<br><em>${esc(name)}</em></h1>
    </header>`;

  if (!state.plants.length) {
    return {
      title: 'Сегодня',
      html: head + emptyState({
        icon: 'sprout', title: 'Здесь будет твой сад',
        text: 'Добавь первое растение — и я напомню, когда его полить и подкормить.',
        button: 'Добавить растение', action: 'add-plant',
      }) + `<button class="btn btn-ghost btn-block" data-action="import-collection">Добавить мою коллекцию (23 растения)</button>
           <button class="btn btn-ghost btn-block" data-action="seed">Посмотреть на примере</button>`,
    };
  }

  const tasks = allTasks(7);
  const now = tasks.filter((x) => x.left <= 0);
  const doneToday = state.plants.reduce((n, p) => n + p.log.filter((e) => e.date === t).length, 0);
  const total = now.length + doneToday;
  const ratio = total ? doneToday / total : 1;

  const R = 30, C = 2 * Math.PI * R;
  const ring = `
    <svg class="ring" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r="${R}" class="ring-bg"/>
      <circle cx="36" cy="36" r="${R}" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - ratio)}"/>
    </svg>`;
  const heroText = now.length
    ? `<b>${now.length} ${plural(now.length, ['дело', 'дела', 'дел'])}</b> на сегодня`
    : `<b>Всё сделано</b> — растения счастливы`;
  const season = SEASONS[seasonOf(t)];

  // Блок дел: для сегодня — как раньше, для другого дня — его список
  let dayBlock;
  if (sel === t) {
    const soon = tasks.filter((x) => x.left > 0);
    dayBlock = `
      <h2 class="section-title">Нужно сейчас</h2>
      ${now.length ? `<div class="list">${now.map((x) => taskRow(x)).join('')}</div>` : `
        <div class="all-done card">
          <div class="all-done-ico">${icon('sparkle')}</div>
          <p><b>На сегодня всё</b><br><small>Можно просто полюбоваться ими</small></p>
        </div>`}
      ${soon.length ? `
        <h2 class="section-title">На этой неделе</h2>
        <div class="list">${soon.map((x) => taskRow(x)).join('')}</div>` : ''}`;
  } else {
    const list = tasksOn(sel);
    const past = sel < t;
    dayBlock = `
      <div class="section-row">
        <h2 class="section-title">${weekday(sel)[0].toUpperCase() + weekday(sel).slice(1)}, ${formatLong(sel)}</h2>
        <button class="link-btn" data-action="pick-day" data-day="${t}">К сегодня</button>
      </div>
      ${list.length
        ? `<p class="hint">${past ? 'Что было сделано в этот день' : 'Прогноз по расписанию — может сдвинуться, если полить раньше или позже'}</p>
           <div class="list">${list.map((x) => taskRow(x, { canCheck: false })).join('')}</div>`
        : `<div class="all-done card"><div class="all-done-ico">${icon(past ? 'note' : 'sun')}</div>
           <p><b>${past ? 'В этот день записей нет' : 'Свободный день'}</b><br><small>${past ? 'Можно добавить запись задним числом в карточке растения' : 'Ничего не запланировано'}</small></p></div>`}`;
  }

  const html = `
    ${head}
    <section class="hero glass-card" data-href="#/stats">
      <div class="hero-ring">${ring}<span>${doneToday}<small>/${total}</small></span></div>
      <div class="hero-text">
        <p>${heroText}</p>
        <small>${state.plants.length} ${plural(state.plants.length, ['растение', 'растения', 'растений'])} · ${season.name.toLowerCase()} · статистика ›</small>
      </div>
    </section>

    ${sel === t ? tipsBlock() : ''}

    <div class="section-row cal-row">
      <span class="eyebrow">${mondayOf(sel) === mondayOf(t) ? 'Эта неделя' : `Неделя с ${formatLong(mondayOf(sel))}`}</span>
      <button class="link-btn" data-action="open-calendar">${icon('calendar')} Календарь</button>
    </div>
    ${weekStrip(sel)}
    ${dayBlock}
  `;
  return {
    title: 'Сегодня',
    html,
    mount(el, rerender) {
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-action="pick-day"], [data-action="shift-week"], [data-action="open-calendar"]');
        if (!b) return;
        e.stopPropagation();
        if (b.dataset.action === 'pick-day') ui.day = b.dataset.day === t ? null : b.dataset.day;
        else if (b.dataset.action === 'shift-week') ui.day = addDays(sel, 7 * Number(b.dataset.dir));
        else return openCalendar(rerender);
        rerender();
      });
    },
  };
}
