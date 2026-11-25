// Экран «Сегодня»: что нужно сделать по уходу сейчас и в ближайшие дни.

import { icon } from '../icons.js';
import { esc, plantVisual, emptyState } from '../ui.js';
import { state, CARE, allTasks } from '../store.js';
import { today, addDays, formatLong, weekday, weekdayShort, relative, days, plural } from '../dates.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function taskRow(t) {
  const c = CARE[t.type];
  const when = t.left < 0 ? `просрочено на ${days(-t.left)}` : t.left === 0 ? 'сегодня' : relative(t.next);
  return `
    <div class="task card ${t.level}" data-href="#/plant/${t.plant.id}">
      ${plantVisual(t.plant, 'pv-sm')}
      <div class="task-text">
        <b>${esc(t.plant.name)}</b>
        <small><span class="hue-txt hue-${c.hue}">${icon(c.icon)} ${c.label}</span> · ${when}</small>
      </div>
      <button class="check-btn hue-${c.hue}" data-action="done" data-plant="${t.plant.id}" data-type="${t.type}" aria-label="${c.verb}">${icon('check')}</button>
    </div>`;
}

export function render() {
  const t = today();
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
      }) + `<button class="btn btn-ghost btn-block" data-action="seed">Посмотреть на примере</button>`,
    };
  }

  const tasks = allTasks(7);
  const now = tasks.filter((x) => x.left <= 0);
  const soon = tasks.filter((x) => x.left > 0);
  const doneToday = state.plants.reduce((n, p) => n + p.log.filter((e) => e.date === t).length, 0);
  const total = now.length + doneToday;
  const ratio = total ? doneToday / total : 1;

  // Кольцо прогресса дня
  const R = 30, C = 2 * Math.PI * R;
  const ring = `
    <svg class="ring" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r="${R}" class="ring-bg"/>
      <circle cx="36" cy="36" r="${R}" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - ratio)}"/>
    </svg>`;

  const heroText = now.length
    ? `<b>${now.length} ${plural(now.length, ['дело', 'дела', 'дел'])}</b> на сегодня`
    : `<b>Всё сделано</b> — растения счастливы`;

  // Полоска недели
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(t, i);
    const n = tasks.filter((x) => (i === 0 ? x.left <= 0 : x.next === d)).length;
    return `<div class="day ${i === 0 ? 'is-today' : ''}">
      <small>${weekdayShort(d)}</small><b>${Number(d.slice(8))}</b>
      <span class="dots">${'<i></i>'.repeat(Math.min(n, 3))}</span>
    </div>`;
  }).join('');

  const html = `
    ${head}
    <section class="hero glass-card">
      <div class="hero-ring">${ring}<span>${doneToday}<small>/${total}</small></span></div>
      <div class="hero-text">
        <p>${heroText}</p>
        <small>${state.plants.length} ${plural(state.plants.length, ['растение', 'растения', 'растений'])} в коллекции</small>
      </div>
    </section>

    <section class="week">${week}</section>

    <h2 class="section-title">Нужно сейчас</h2>
    ${now.length ? `<div class="list">${now.map(taskRow).join('')}</div>` : `
      <div class="all-done card">
        <div class="all-done-ico">${icon('sparkle')}</div>
        <p><b>На сегодня всё</b><br><small>Можно просто полюбоваться ими</small></p>
      </div>`}

    ${soon.length ? `
      <h2 class="section-title">На этой неделе</h2>
      <div class="list">${soon.map(taskRow).join('')}</div>` : ''}
  `;
  return { title: 'Сегодня', html };
}
