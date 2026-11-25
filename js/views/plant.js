// Карточка растения: фото, быстрые действия, расписание ухода, дневник.

import { icon } from '../icons.js';
import { esc, plantVisual } from '../ui.js';
import { getPlant, CARE, CARE_KEYS, LIGHT, careStatus, repotAdvice } from '../store.js';
import { formatFull, relative, days, age } from '../dates.js';

function scheduleCard(st) {
  const c = CARE[st.type];
  const when = st.left < 0 ? `просрочено на ${days(-st.left)}`
    : st.left === 0 ? 'сегодня'
    : `через ${days(st.left)}`;
  return `
    <div class="sched card ${st.level}">
      <div class="sched-top">
        <span class="chip-ico hue-${c.hue}">${icon(c.icon)}</span>
        <div><b>${c.label}</b><small>каждые ${days(st.every)}${st.seasonal ? ` · по сезону (обычно ${st.baseEvery})` : ''}</small></div>
        <span class="sched-when">${when}</span>
      </div>
      <div class="bar hue-${c.hue}"><i style="width:${Math.round(st.progress * 100)}%"></i></div>
      <small class="muted">${st.last ? `Последний раз ${relative(st.last)}` : 'Ещё не отмечали'}</small>
    </div>`;
}

function repotBlock(p) {
  const a = repotAdvice(p);
  if (a.need === 'ok') return '';
  const text = a.need === 'unknown'
    ? 'Отметь пересадку, когда будешь её делать, — тогда я подскажу следующую.'
    : a.inWindow ? 'Сейчас весна — самое подходящее время для пересадки.'
    : `Лучше дождаться весны: окно откроется ${formatFull(a.window)}. Сейчас корни растут медленно, и растению тяжелее восстановиться.`;
  return `<div class="card insight repot-tip">${icon('pot')}<p><b>${a.need === 'now' ? 'Пора подумать о пересадке' : a.need === 'soon' ? 'Пересадка в этом году' : 'Пересадка'}</b><br>${text}</p></div>`;
}

export function render({ id }) {
  const p = getPlant(id);
  if (!p) return { title: 'Не найдено', html: `<div class="empty"><h3>Растение не найдено</h3><a class="btn btn-primary" href="#/plants">К коллекции</a></div>` };

  const statuses = CARE_KEYS.map((k) => careStatus(p, k)).filter(Boolean).sort((a, b) => a.left - b.left);

  const facts = [
    p.location && `<span class="fact">${icon('pin')}${esc(p.location)}</span>`,
    p.light && `<span class="fact">${icon('light')}${LIGHT[p.light] || ''}</span>`,
    p.acquired && `<span class="fact">${icon('calendar')}дома ${age(p.acquired)}</span>`,
  ].filter(Boolean).join('');

  const log = p.log.slice(0, 40).map((e) => {
    const c = CARE[e.type] || { label: e.type, icon: 'leaf', hue: 'leaf' };
    return `
      <li class="log-item">
        <span class="chip-ico sm hue-${c.hue}">${icon(c.icon)}</span>
        <div><b>${c.label}</b>${e.note ? `<p>${esc(e.note)}</p>` : ''}</div>
        <time>${formatFull(e.date)}</time>
        <button class="log-del" data-action="del-log" data-plant="${p.id}" data-entry="${e.id}" aria-label="Удалить запись">${icon('close')}</button>
      </li>`;
  }).join('');

  const html = `
    <div class="plant-hero">
      ${plantVisual(p, 'pv-hero')}
      <div class="plant-hero-fade"></div>
      <a class="hero-btn glass-btn left" href="#/plants" data-action="back" aria-label="Назад">${icon('chevronLeft')}</a>
      <button class="hero-btn glass-btn right" data-action="edit-plant" data-id="${p.id}" aria-label="Редактировать">${icon('edit')}</button>
    </div>

    <header class="plant-head">
      <h1 class="title">${esc(p.name)}</h1>
      ${p.species ? `<p class="species">${esc(p.species)}</p>` : ''}
      ${facts ? `<div class="facts">${facts}</div>` : ''}
    </header>

    <div class="quick">
      ${CARE_KEYS.map((k) => `
        <button class="quick-btn hue-${CARE[k].hue}" data-action="done" data-plant="${p.id}" data-type="${k}">
          <span class="chip-ico">${icon(CARE[k].icon)}</span><small>${CARE[k].verb}</small>
        </button>`).join('')}
    </div>

    ${statuses.length ? `
      <h2 class="section-title">Расписание</h2>
      <div class="list">${statuses.map(scheduleCard).join('')}</div>` : ''}

    ${repotBlock(p)}

    ${p.notes ? `
      <h2 class="section-title">Заметки</h2>
      <div class="card notes">${esc(p.notes).replace(/\n/g, '<br>')}</div>` : ''}

    <div class="section-row">
      <h2 class="section-title">Дневник ухода</h2>
      <button class="link-btn" data-action="log-care" data-plant="${p.id}">${icon('plus')} Запись</button>
    </div>
    ${log ? `<ul class="card log">${log}</ul>` : `<p class="muted center">Пока нет записей. Нажми на действие выше — оно попадёт сюда.</p>`}

    <button class="btn btn-ghost-danger btn-block mt-l" data-action="delete-plant" data-id="${p.id}">${icon('trash')} Удалить растение</button>
  `;
  return { title: p.name, html, back: true, immersive: true };
}
