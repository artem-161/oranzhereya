// Формы в нижних шторках: растение, хотелка, запись ухода.

import { icon } from './icons.js';
import { esc, $, $$, openSheet, fileToPhoto, toast, plantVisual } from './ui.js';
import { CARE, CARE_KEYS, state, addPlant, updatePlant, getPlant, addWish, updateWish, logCare } from './store.js';
import { today } from './dates.js';

/* ---------- Общие куски ---------- */

function photoField(photo, label = 'Добавить фото') {
  return `
    <label class="photo-pick ${photo ? 'has' : ''}">
      <input type="file" accept="image/*" hidden data-photo-input />
      <img data-photo-img ${photo ? `src="${photo}"` : 'hidden'} alt="" />
      <span class="photo-hint">${icon('camera')}<b>${photo ? 'Сменить фото' : label}</b></span>
    </label>`;
}

function bindPhoto(el, onChange) {
  const input = $('[data-photo-input]', el);
  const img = $('[data-photo-img]', el);
  input.onchange = async () => {
    const f = input.files?.[0];
    if (!f) return;
    try {
      const data = await fileToPhoto(f);
      img.src = data; img.hidden = false;
      input.closest('.photo-pick').classList.add('has');
      onChange(data);
    } catch { toast('Не получилось открыть фото'); }
  };
}

function segmented(name, options, value) {
  return `<div class="segmented" data-seg="${name}">
    ${Object.entries(options).map(([k, v]) => `<button type="button" data-v="${k}" class="${k === String(value) ? 'on' : ''}">${v}</button>`).join('')}
  </div>`;
}

function bindSegmented(el, name, onChange) {
  const seg = $(`[data-seg="${name}"]`, el);
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('button', seg).forEach((x) => x.classList.toggle('on', x === b));
    onChange(b.dataset.v);
  });
}

/* ---------- Растение ---------- */

export function plantForm(id = null, onSaved) {
  const editing = id ? getPlant(id) : null;
  const p = editing ? structuredClone(editing) : {
    name: '', species: '', location: '', light: 'diffused', acquired: today(), notes: '', photo: null,
    care: Object.fromEntries(CARE_KEYS.map((k) => [k, { every: CARE[k].every, last: null }])),
  };
  const lastWater = p.care.water.last || today();
  const locations = [...new Set(state.plants.map((x) => x.location).filter(Boolean))];

  const careRows = CARE_KEYS.map((k) => `
    <div class="care-row" data-care="${k}">
      <span class="chip-ico hue-${CARE[k].hue}">${icon(CARE[k].icon)}</span>
      <div class="care-row-text">
        <b>${CARE[k].label}</b>
        <small data-every-label>${everyLabel(p.care[k].every)}</small>
      </div>
      <div class="stepper">
        <button type="button" data-step="-1" aria-label="Меньше дней">−</button>
        <output data-every>${p.care[k].every || '—'}</output>
        <button type="button" data-step="1" aria-label="Больше дней">+</button>
      </div>
    </div>`).join('');

  openSheet({
    title: editing ? 'Редактировать' : 'Новое растение',
    body: `
      <form class="form" autocomplete="off">
        ${photoField(p.photo)}
        <div class="field-group">
          <label class="field"><span>Название</span><input name="name" required placeholder="Например, Монстера" value="${esc(p.name)}" /></label>
          <label class="field"><span>Вид / сорт</span><input name="species" placeholder="Monstera deliciosa" value="${esc(p.species)}" /></label>
          <label class="field"><span>Где стоит</span><input name="location" list="loc-list" placeholder="Гостиная, подоконник…" value="${esc(p.location)}" />
            <datalist id="loc-list">${locations.map((l) => `<option value="${esc(l)}">`).join('')}</datalist></label>
          <label class="field"><span>Живёт дома с</span><input type="date" name="acquired" value="${p.acquired || ''}" /></label>
        </div>

        <h4 class="form-title">${icon('light')} Освещение</h4>
        ${segmented('light', { bright: 'Яркий', diffused: 'Рассеянный', shade: 'Полутень' }, p.light)}

        <h4 class="form-title">${icon('calendar')} Расписание ухода</h4>
        <p class="hint">Как часто, в днях. «—» значит не отслеживать.</p>
        <div class="field-group">${careRows}</div>
        <div class="field-group">
          <label class="field"><span>Последний полив</span><input type="date" name="lastWater" value="${lastWater}" max="${today()}" /></label>
        </div>

        <h4 class="form-title">${icon('note')} Заметки</h4>
        <div class="field-group">
          <label class="field"><textarea name="notes" rows="3" placeholder="Любит тёплый душ, не ставить у батареи…">${esc(p.notes)}</textarea></label>
        </div>

        <button class="btn btn-primary btn-block" type="submit">${editing ? 'Сохранить' : 'Добавить в коллекцию'}</button>
      </form>`,
    onMount(el, close) {
      bindPhoto(el, (d) => { p.photo = d; });
      bindSegmented(el, 'light', (v) => { p.light = v; });

      $$('.care-row', el).forEach((row) => {
        const k = row.dataset.care;
        row.addEventListener('click', (e) => {
          const b = e.target.closest('[data-step]');
          if (!b) return;
          const steps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 18, 21, 28, 30, 45, 60, 90, 120, 180, 365];
          const cur = p.care[k].every;
          let i = steps.findIndex((s) => s >= cur);
          if (i < 0) i = steps.length - 1;
          i = Math.max(0, Math.min(steps.length - 1, i + Number(b.dataset.step)));
          p.care[k].every = steps[i];
          $('[data-every]', row).textContent = steps[i] || '—';
          $('[data-every-label]', row).textContent = everyLabel(steps[i]);
        });
      });

      $('form', el).onsubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        const name = String(f.get('name')).trim();
        if (!name) return;
        const data = {
          name,
          species: String(f.get('species')).trim(),
          location: String(f.get('location')).trim(),
          acquired: f.get('acquired') || null,
          notes: String(f.get('notes')).trim(),
          light: p.light,
          photo: p.photo,
          care: p.care,
        };
        data.care.water.last = f.get('lastWater') || data.care.water.last;
        // Для новых растений остальные виды ухода начинаем отсчитывать с сегодняшнего дня.
        if (!editing) for (const k of CARE_KEYS) if (k !== 'water' && data.care[k].every && !data.care[k].last) data.care[k].last = today();

        let saved;
        if (editing) { updatePlant(id, data); saved = getPlant(id); toast('Сохранено'); }
        else {
          if (data.care.water.last) data.log = [{ id: 'init-' + Date.now(), type: 'water', date: data.care.water.last, note: '' }];
          saved = addPlant(data);
          toast(`${name} теперь в коллекции 🌿`);
        }
        close();
        onSaved?.(saved);
      };
    },
  });
}

function everyLabel(n) {
  if (!n) return 'не отслеживать';
  if (n === 1) return 'каждый день';
  if (n === 7) return 'раз в неделю';
  if (n === 14) return 'раз в две недели';
  if (n === 30) return 'раз в месяц';
  if (n === 365) return 'раз в год';
  return `раз в ${n} ${n % 10 >= 2 && n % 10 <= 4 && (n < 10 || n > 20) ? 'дня' : 'дней'}`;
}

/* ---------- Запись ухода задним числом / с заметкой ---------- */

export function careLogForm(plantId, preset = 'water') {
  const p = getPlant(plantId);
  let type = preset;
  openSheet({
    title: 'Запись в дневник',
    body: `
      <div class="pv-mini-row">${plantVisual(p, 'pv-sm')}<b>${esc(p.name)}</b></div>
      <div class="care-pick">
        ${CARE_KEYS.map((k) => `<button type="button" data-type="${k}" class="care-chip hue-${CARE[k].hue} ${k === type ? 'on' : ''}">${icon(CARE[k].icon)}<span>${CARE[k].label}</span></button>`).join('')}
      </div>
      <form class="form">
        <div class="field-group">
          <label class="field"><span>Дата</span><input type="date" name="date" value="${today()}" max="${today()}" /></label>
          <label class="field"><textarea name="note" rows="2" placeholder="Заметка (необязательно): новый лист, вредители…"></textarea></label>
        </div>
        <button class="btn btn-primary btn-block" type="submit">Записать</button>
      </form>`,
    onMount(el, close) {
      $('.care-pick', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-type]');
        if (!b) return;
        type = b.dataset.type;
        $$('.care-chip', el).forEach((x) => x.classList.toggle('on', x === b));
      });
      $('form', el).onsubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        const undo = logCare(plantId, type, f.get('date') || today(), String(f.get('note')).trim());
        close();
        toast(`${CARE[type].done} · ${p.name}`, { action: 'Отменить', onAction: undo });
      };
    },
  });
}

/* ---------- Хотелка ---------- */

const PRIORITY = { 1: 'Когда-нибудь', 2: 'Хочу', 3: 'Очень хочу' };

export function wishForm(id = null) {
  const editing = id ? state.wishes.find((w) => w.id === id) : null;
  const w = editing ? { ...editing } : { name: '', species: '', note: '', priority: 2, price: '', where: '', link: '', photo: null };

  openSheet({
    title: editing ? 'Редактировать' : 'Новая хотелка',
    body: `
      <form class="form" autocomplete="off">
        ${photoField(w.photo, 'Фото-референс')}
        <div class="field-group">
          <label class="field"><span>Что хочется</span><input name="name" required placeholder="Филодендрон Пинк Принцесс" value="${esc(w.name)}" /></label>
          <label class="field"><span>Вид / сорт</span><input name="species" placeholder="Латинское название" value="${esc(w.species || '')}" /></label>
        </div>
        <h4 class="form-title">${icon('heart')} Насколько хочется</h4>
        ${segmented('priority', PRIORITY, w.priority)}
        <div class="field-group mt">
          <label class="field"><span>Примерная цена, ₽</span><input name="price" inputmode="numeric" placeholder="1500" value="${esc(w.price || '')}" /></label>
          <label class="field"><span>Где искать</span><input name="where" placeholder="Магазин, рынок, обмен…" value="${esc(w.where || '')}" /></label>
          <label class="field"><span>Ссылка</span><input name="link" type="url" inputmode="url" placeholder="https://" value="${esc(w.link || '')}" /></label>
          <label class="field"><textarea name="note" rows="2" placeholder="Почему хочется, какой размер…">${esc(w.note || '')}</textarea></label>
        </div>
        <button class="btn btn-primary btn-block" type="submit">${editing ? 'Сохранить' : 'Добавить в хотелки'}</button>
      </form>`,
    onMount(el, close) {
      bindPhoto(el, (d) => { w.photo = d; });
      bindSegmented(el, 'priority', (v) => { w.priority = Number(v); });
      $('form', el).onsubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        const data = {
          name: String(f.get('name')).trim(),
          species: String(f.get('species')).trim(),
          price: String(f.get('price')).trim(),
          where: String(f.get('where')).trim(),
          link: String(f.get('link')).trim(),
          note: String(f.get('note')).trim(),
          priority: w.priority,
          photo: w.photo,
        };
        if (!data.name) return;
        if (editing) updateWish(id, data); else addWish(data);
        toast(editing ? 'Сохранено' : 'Добавлено в хотелки ✨');
        close();
      };
    },
  });
}

export { PRIORITY };
