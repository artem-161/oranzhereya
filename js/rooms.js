// «Мой дом»: комнаты, стороны окон, батареи и влажность — для советов, куда что поставить.

import { icon } from './icons.js';
import { esc, $, $$, openSheet, confirmSheet } from './ui.js';
import { state, saveRoom, deleteRoom } from './store.js';
import { WINDOW } from './catalog.js';

const HUM = { low: 'Сухо', medium: 'Средне', high: 'Влажно' };

function seg(name, options, value) {
  return `<div class="segmented" data-seg="${name}">${Object.entries(options).map(([k, v]) =>
    `<button type="button" data-v="${k}" class="${k === value ? 'on' : ''}">${v}</button>`).join('')}</div>`;
}

export function roomsSheet() {
  const list = () => state.settings.rooms.length
    ? state.settings.rooms.map((r) => `
      <button class="row" data-room="${r.id}">
        <span class="row-ico">${icon('pin')}</span>
        <span class="row-text"><b>${esc(r.name)}</b><small>окно: ${WINDOW[r.window || 'none'].toLowerCase()} · ${HUM[r.humidity || 'medium'].toLowerCase()}${r.heating ? ' · батарея рядом' : ''} · ${state.plants.filter((p) => p.location === r.name).length} раст.</small></span>
        ${icon('chevronRight', 'row-chev')}
      </button>`).join('')
    : '<p class="muted center" style="padding:14px">Пока нет комнат</p>';

  openSheet({
    title: 'Мой дом',
    body: `
      <p class="hint">Укажи, куда выходят окна и есть ли батарея под подоконником — я подскажу, какому растению где лучше, а зимой предупрежу о сухом воздухе.</p>
      <div class="card rows" data-list>${list()}</div>
      <button class="btn btn-primary btn-block mt" data-add>${icon('plus')} Добавить комнату</button>`,
    onMount(el, close) {
      el.addEventListener('click', (e) => {
        const r = e.target.closest('[data-room]');
        if (r) { close(); roomForm(state.settings.rooms.find((x) => x.id === r.dataset.room)); }
        if (e.target.closest('[data-add]')) { close(); roomForm(); }
      });
    },
  });
}

function roomForm(room = null) {
  const r = room ? { ...room } : { name: '', window: 'E', humidity: 'medium', heating: true };
  openSheet({
    title: room ? 'Комната' : 'Новая комната',
    body: `
      <form class="form">
        <div class="field-group"><label class="field"><span>Название</span><input name="name" required placeholder="Спальня, кухня, подоконник в зале…" value="${esc(r.name)}" /></label></div>
        <h4 class="form-title">${icon('sun')} Куда выходит окно</h4>
        ${seg('window', { S: 'Юг', E: 'Восток', W: 'Запад', N: 'Север', none: 'Нет' }, r.window)}
        <p class="hint">Не знаешь? Утром солнце — восток, вечером — запад, весь день — юг, почти никогда — север.</p>
        <h4 class="form-title">${icon('mist')} Влажность воздуха</h4>
        ${seg('humidity', HUM, r.humidity)}
        <div class="field-group mt">
          <label class="field toggle-field"><span>Батарея рядом с растениями</span><input type="checkbox" name="heating" ${r.heating ? 'checked' : ''} /></label>
        </div>
        <button class="btn btn-primary btn-block" type="submit">Сохранить</button>
        ${room ? '<button type="button" class="btn btn-ghost-danger btn-block mt" data-del>Удалить комнату</button>' : ''}
      </form>`,
    onMount(el, close) {
      for (const k of ['window', 'humidity']) {
        $(`[data-seg="${k}"]`, el).addEventListener('click', (e) => {
          const b = e.target.closest('button');
          if (!b) return;
          $$(`[data-seg="${k}"] button`, el).forEach((x) => x.classList.toggle('on', x === b));
          r[k] = b.dataset.v;
        });
      }
      $('form', el).onsubmit = (e) => {
        e.preventDefault();
        const name = e.target.elements.name.value.trim();
        if (!name) return;
        saveRoom({ ...r, name, heating: e.target.elements.heating.checked });
        close();
        setTimeout(roomsSheet, 350);
      };
      const del = $('[data-del]', el);
      if (del) del.onclick = async () => {
        close();
        if (await confirmSheet({ title: `Удалить «${r.name}»?`, text: 'Растения останутся, просто без комнаты.' })) deleteRoom(r.id);
        setTimeout(roomsSheet, 350);
      };
    },
  });
}
