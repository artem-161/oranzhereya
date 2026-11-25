// Карточка растения: фото, быстрые действия, расписание ухода, дневник.

import { icon } from '../icons.js';
import { esc, plantVisual } from '../ui.js';
import { getPlant, CARE, CARE_KEYS, LIGHT, careStatus, repotAdvice, roomOf, state, seasonOf } from '../store.js';
import { getSpecies, roomChecks, bestRooms, HUMID_TXT, SUN_TXT, LIGHT_TXT, WINDOW, monthsRange } from '../catalog.js';
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

const LV_ICON = { ok: 'check', warn: 'sparkle', bad: 'close' };

function conditionsBlock(p) {
  const sp = p.speciesId ? getSpecies(p.speciesId) : null;
  if (!sp) {
    return `<button class="card insight link-card" data-action="link-species" data-id="${p.id}">${icon('search')}<p><b>Привязать к виду из каталога</b><br>Тогда я подскажу свет, влажность, температуру и лучшее место в доме.</p></button>`;
  }
  const winter = ['winter', 'autumn'].includes(seasonOf());
  const room = roomOf(p);
  const checks = roomChecks(sp, room, { winter });
  const problems = checks.filter((c) => c.level !== 'ok');

  // компактная строка: 4 параметра; подробности — по нажатию
  const chips = [
    ['light', LIGHT_TXT[sp.light]],
    ['drop', `полив ~${sp.water[0]}/${sp.water[1] || '—'} дн.`],
    ['sun', `${sp.temp[0]}–${sp.temp[1]}°`],
    ['mist', HUMID_TXT[sp.humidity]],
  ].map(([ic, t]) => `<span class="fact">${icon(ic)}${t}</span>`).join('');

  let place = '';
  if (room) {
    place = checks.map((c) => `<li class="lv-${c.level}">${icon(LV_ICON[c.level])}<span>${esc(c.text)}</span></li>`).join('');
    place = `<ul class="checks">${place}</ul>`;
  } else if (state.settings.rooms.length) {
    const best = bestRooms(sp, state.settings.rooms, { winter }).slice(0, 2);
    place = `<p class="hint">Лучше всего подойдёт: ${best.map((b) => `<b>${esc(b.room.name)}</b>`).join(' или ')}. Укажи комнату в «Редактировать».</p>`;
  } else {
    place = `<p class="hint">Добавь комнаты и окна в «Ещё → Мой дом» — подскажу, куда поставить.</p>`;
  }

  return `
    <h2 class="section-title">Условия</h2>
    <div class="facts">${chips}</div>
    ${problems.length ? `<div class="card insight warn-card">${icon('sparkle')}<p><b>${problems.length === 1 ? 'Есть что улучшить' : `Есть что улучшить: ${problems.length}`}</b><br>${esc(problems[0].text)}</p></div>` : ''}
    <details class="card more-info">
      <summary>Всё об уходе за видом ${icon('chevronRight', 'row-chev')}</summary>
      <div class="more-body">
        <p class="species">${esc(sp.name)} · ${esc(sp.latin)}</p>
        ${place}
        <dl>
          <dt>Свет</dt><dd>${LIGHT_TXT[sp.light]}, ${SUN_TXT[sp.sun]}. Окна: ${sp.windows.map((w) => WINDOW[w].toLowerCase()).join(', ')}</dd>
          <dt>Температура</dt><dd>летом ${sp.temp[0]}–${sp.temp[1]}°, зимой ${sp.winter[0]}–${sp.winter[1]}°</dd>
          <dt>Влажность</dt><dd>${HUMID_TXT[sp.humidity]}${sp.mist ? `, опрыскивать раз в ${sp.mist} дн.` : ', опрыскивать не нужно'}</dd>
          <dt>Полив</dt><dd>летом раз в ~${sp.water[0]} дн., зимой ${sp.water[1] ? `раз в ~${sp.water[1]} дн.` : 'почти не поливать'}</dd>
          <dt>Подкормки</dt><dd>${sp.feed ? `раз в ${sp.feed} дн., ${monthsRange(sp.feedMonths)}` : 'не нужны'}</dd>
          <dt>Грунт</dt><dd>${esc(sp.soil)}; пересадка раз в ${sp.repot} ${sp.repot === 1 ? 'год' : 'года'}, весной</dd>
          <dt>Животные</dt><dd>${sp.toxic === true ? '⚠️ ядовито для кошек и собак' : sp.toxic === false ? 'безопасно' : 'нет данных — лучше не давать грызть'}</dd>
        </dl>
        <ul class="tips">${sp.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>
    </details>`;
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

    ${conditionsBlock(p)}

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
