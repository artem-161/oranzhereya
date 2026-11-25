// Экран «Ещё»: имя, резервная копия, установка на экран «Домой», сброс.

import { icon } from '../icons.js';
import { esc } from '../ui.js';
import { state } from '../store.js';

const isStandalone = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;

function row({ ic, title, sub = '', action = '', danger = false, tag = 'button', extra = '' }) {
  return `<${tag} class="row ${danger ? 'danger' : ''}" ${action ? `data-action="${action}"` : ''} ${extra}>
    <span class="row-ico">${icon(ic)}</span>
    <span class="row-text"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>
    ${icon('chevronRight', 'row-chev')}
  </${tag}>`;
}

export function render() {
  const logs = state.plants.reduce((n, p) => n + p.log.length, 0);
  const html = `
    <header class="page-head">
      <p class="eyebrow">настройки</p>
      <h1 class="title">Ещё</h1>
    </header>

    <section class="stats">
      <div class="stat card"><b>${state.plants.length}</b><small>растений</small></div>
      <div class="stat card"><b>${logs}</b><small>записей ухода</small></div>
      <div class="stat card"><b>${state.wishes.filter((w) => !w.done).length}</b><small>хотелок</small></div>
    </section>

    <h2 class="section-title">Профиль</h2>
    <div class="card rows">
      ${row({ ic: 'user', title: 'Как к тебе обращаться', sub: esc(state.settings.name), action: 'rename' })}
      ${row({ ic: 'calendar', title: 'Статистика и прогноз', sub: 'Графики, ритм полива, когда пересаживать', tag: 'a', extra: 'href="#/stats"' })}
      <button class="row" data-action="toggle-seasonal">
        <span class="row-ico">${icon('sun')}</span>
        <span class="row-text"><b>Сезонный режим</b><small>Зимой поливать реже и не подкармливать, летом — чаще</small></span>
        <span class="switch ${state.settings.seasonal ? 'on' : ''}"><i></i></span>
      </button>
    </div>

    ${isStandalone() ? '' : `
      <h2 class="section-title">Установка</h2>
      <div class="card install">
        <p><b>Добавь на экран «Домой»</b> — приложение будет открываться как настоящее, без строки браузера, и данные будут храниться надёжнее.</p>
        <ol>
          <li>Нажми <b>«Поделиться»</b> внизу Safari</li>
          <li>Выбери <b>«На экран „Домой“»</b></li>
          <li>Нажми <b>«Добавить»</b></li>
        </ol>
      </div>`}

    <h2 class="section-title">Данные</h2>
    <div class="card rows">
      ${row({ ic: 'download', title: 'Сохранить резервную копию', sub: 'Файл .json — в «Файлы» или себе в Telegram', action: 'export' })}
      ${row({ ic: 'upload', title: 'Восстановить из копии', sub: 'Заменит текущие данные', tag: 'label', extra: 'for="import-file"' })}
      ${row({ ic: 'sparkle', title: 'Добавить примеры', sub: 'Пара растений и хотелок для пробы', action: 'seed' })}
    </div>
    <input type="file" id="import-file" accept="application/json,.json" hidden data-input="import" />

    <p class="hint center">${icon('shield')} Все данные хранятся только на этом телефоне.<br>Иногда сохраняй резервную копию.</p>

    <div class="card rows mt">
      ${row({ ic: 'trash', title: 'Удалить все данные', action: 'reset', danger: true })}
    </div>

    <p class="colophon">Оранжерея · сделано с любовью 💚</p>
  `;
  return { title: 'Ещё', html };
}
