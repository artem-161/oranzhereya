// Экран «Коллекция»: сетка растений с поиском и фильтром по комнатам.

import { icon, hydrateIcons } from '../icons.js';
import { hydrateWiki } from '../catalog.js';
import { esc, plantVisual, emptyState } from '../ui.js';
import { state, CARE, plantUrgency, careStatus } from '../store.js';
import { GROUPS, groupOf } from '../catalog.js';
import { days, plural } from '../dates.js';

// Фильтры живут между перерисовками
const ui = { q: '', room: '', group: '' };

function badge(p) {
  const u = plantUrgency(p);
  if (!u) return '';
  const c = CARE[u.type];
  if (u.level === 'ok') return `<span class="badge ok">${icon(c.icon)} через ${days(u.left)}</span>`;
  const txt = u.left < 0 ? `${c.verb.toLowerCase()} · ${-u.left} дн.` : c.verb.toLowerCase();
  return `<span class="badge ${u.level} hue-${c.hue}">${icon(c.icon)} ${txt}</span>`;
}

function card(p) {
  return `
    <a class="plant-card" href="#/plant/${p.id}">
      ${plantVisual(p, 'pv-card')}
      ${badge(p)}
      <div class="plant-card-text">
        <b>${esc(p.name)}</b>
        <small>${esc(p.location || p.species || ' ')}</small>
      </div>
    </a>`;
}

export function render() {
  const head = (n) => `
    <header class="page-head">
      <p class="eyebrow">${n} ${plural(n, ['растение', 'растения', 'растений'])}</p>
      <h1 class="title">Коллекция</h1>
    </header>`;

  if (!state.plants.length) {
    return {
      title: 'Коллекция',
      html: head(0) + emptyState({
        icon: 'leaf', title: 'Пока пусто',
        text: 'Сфотографируй своих зелёных друзей и добавь их сюда.',
        button: 'Добавить растение', action: 'add-plant',
      }) + `<button class="btn btn-ghost btn-block" data-action="seed">Заполнить примерами</button>`,
    };
  }

  const rooms = [...new Set(state.plants.map((p) => p.location).filter(Boolean))];
  if (ui.room && !rooms.includes(ui.room)) ui.room = '';
  const groups = Object.keys(GROUPS).filter((g) => state.plants.some((p) => groupOf(p) === g));
  if (ui.group && !groups.includes(ui.group)) ui.group = '';
  const filterList = (qq) => state.plants.filter((p) =>
    (!ui.room || p.location === ui.room) &&
    (!ui.group || groupOf(p) === ui.group) &&
    (!qq || `${p.name} ${p.species} ${p.location}`.toLowerCase().includes(qq)));
  const list = filterList(ui.q.trim().toLowerCase());

  // Секции по группам (если не выбран фильтр группы и групп больше одной)
  const sections = (items) => {
    if (!items.length) return `<p class="muted center">Ничего не нашлось</p>`;
    const gs = ui.group || groups.length < 2 ? [null] : groups;
    return gs.map((g) => {
      const its = g ? items.filter((p) => groupOf(p) === g) : items;
      if (!its.length) return '';
      const thirsty = its.filter((p) => (careStatus(p, 'water')?.left ?? 1) <= 0);
      const ids = its.map((p) => p.id).join(',');
      return `
        <section class="group">
          ${g ? `<div class="group-head"><h2 class="section-title">${GROUPS[g]} <small>${its.length}</small></h2>
            <button class="pill ${thirsty.length ? 'pill-water' : ''}" data-action="water-many" data-ids="${ids}">${icon('drop')} Полить ${thirsty.length ? `· ${thirsty.length} ждут` : 'всех'}</button></div>` : ''}
          <div class="grid">${its.map(card).join('')}</div>
        </section>`;
    }).join('');
  };

  const html = `
    ${head(state.plants.length)}
    <div class="search glass-field">
      ${icon('search')}
      <input type="search" placeholder="Найти растение" value="${esc(ui.q)}" data-input="search" enterkeyhint="search" />
    </div>
    ${groups.length > 1 || rooms.length > 1 ? `
      <div class="chips scroll-x">
        <button class="chip ${!ui.room && !ui.group ? 'on' : ''}" data-action="room" data-room="" data-group="">Все</button>
        ${groups.length > 1 ? groups.map((g) => `<button class="chip ${ui.group === g ? 'on' : ''}" data-action="room" data-group="${g}">${GROUPS[g]}</button>`).join('') : ''}
        ${rooms.length > 1 ? rooms.map((r) => `<button class="chip ${ui.room === r ? 'on' : ''}" data-action="room" data-room="${esc(r)}">${icon('pin')}${esc(r)}</button>`).join('') : ''}
      </div>` : ''}
    <div data-grid>${sections(list)}</div>`;

  return {
    title: 'Коллекция',
    html,
    mount(el, rerender) {
      const input = el.querySelector('[data-input="search"]');
      input?.addEventListener('input', () => {
        ui.q = input.value;
        el.querySelector('[data-grid]').innerHTML = sections(filterList(ui.q.trim().toLowerCase()));
        hydrateIcons(el); hydrateWiki(el);
      });
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-action="room"]');
        if (!b) return;
        if ('group' in b.dataset) { ui.group = b.dataset.group; if (!b.dataset.group) ui.room = ''; }
        else ui.room = b.dataset.room;
        rerender();
      });
    },
  };
}
