// Экран «Хотелки»: растения, которые хочется завести.

import { icon } from '../icons.js';
import { esc, emptyState, tintFor } from '../ui.js';
import { state } from '../store.js';
import { formatFull } from '../dates.js';

const ui = { tab: 'want' };

function hearts(n) {
  return `<span class="hearts">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}">${icon('heart')}</i>`).join('')}</span>`;
}

function wishCard(w) {
  const [a, b] = tintFor(w.name);
  const visual = w.photo
    ? `<img src="${w.photo}" alt="" loading="lazy" />`
    : `<span style="--a:${a};--b:${b}">${icon('sparkle')}</span>`;
  return `
    <article class="wish card ${w.done ? 'is-done' : ''}">
      <div class="wish-visual">${visual}</div>
      <div class="wish-body">
        <div class="wish-top">
          <b>${esc(w.name)}</b>
          ${w.done ? '' : hearts(w.priority)}
        </div>
        ${w.species ? `<small class="species">${esc(w.species)}</small>` : ''}
        ${w.note ? `<p>${esc(w.note)}</p>` : ''}
        <div class="wish-meta">
          ${w.price ? `<span>${esc(Number(w.price) ? Number(w.price).toLocaleString('ru-RU') : w.price)} ₽</span>` : ''}
          ${w.where ? `<span>${icon('pin')}${esc(w.where)}</span>` : ''}
          ${w.link ? `<a href="${esc(w.link)}" target="_blank" rel="noopener">${icon('link')}ссылка</a>` : ''}
          ${w.done ? `<span>${icon('check')}сбылось ${formatFull(w.doneAt)}</span>` : ''}
        </div>
        <div class="wish-actions">
          ${w.done
            ? (w.plantId ? `<a class="pill" href="#/plant/${w.plantId}">${icon('leaf')} В коллекции</a>` : '')
            : `<button class="pill pill-primary" data-action="fulfill" data-id="${w.id}">${icon('gift')} Уже моё!</button>`}
          <button class="pill" data-action="edit-wish" data-id="${w.id}" aria-label="Изменить">${icon('edit')}</button>
          <button class="pill" data-action="delete-wish" data-id="${w.id}" aria-label="Удалить">${icon('trash')}</button>
        </div>
      </div>
    </article>`;
}

export function render() {
  const want = state.wishes.filter((w) => !w.done).sort((a, b) => b.priority - a.priority);
  const got = state.wishes.filter((w) => w.done);
  const sum = want.reduce((s, w) => s + (Number(w.price) || 0), 0);

  const head = `
    <header class="page-head">
      <p class="eyebrow">${want.length ? `${want.length} в списке${sum ? ` · ≈ ${sum.toLocaleString('ru-RU')} ₽` : ''}` : 'список желаний'}</p>
      <h1 class="title">Хотелки</h1>
    </header>`;

  if (!state.wishes.length) {
    return {
      title: 'Хотелки',
      html: head + emptyState({
        icon: 'heart', title: 'Мечты о новых листиках',
        text: 'Записывай растения, которые хочется завести, — с ценой, ссылкой и фото-референсом.',
        button: 'Добавить хотелку', action: 'add-wish',
      }),
    };
  }

  const list = ui.tab === 'want' ? want : got;
  const html = `
    ${head}
    <div class="segmented wide glass-seg">
      <button data-action="wish-tab" data-tab="want" class="${ui.tab === 'want' ? 'on' : ''}">Хочу · ${want.length}</button>
      <button data-action="wish-tab" data-tab="got" class="${ui.tab === 'got' ? 'on' : ''}">Сбылось · ${got.length}</button>
    </div>
    <div class="list">
      ${list.length ? list.map(wishCard).join('') : `<p class="muted center mt">${ui.tab === 'want' ? 'Всё желаемое уже дома 🌿' : 'Пока ничего — но всё впереди'}</p>`}
    </div>`;

  return {
    title: 'Хотелки',
    html,
    mount(el, rerender) {
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-action="wish-tab"]');
        if (!b) return;
        ui.tab = b.dataset.tab;
        rerender();
      });
    },
  };
}

