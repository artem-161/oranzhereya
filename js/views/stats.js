// Экран «Статистика»: уход за 30 дней, ритм полива, прогноз нагрузки, сезон и пересадка.

import { icon } from '../icons.js';
import { esc, plantVisual, emptyState } from '../ui.js';
import { state, CARE, CARE_KEYS, careStats, SEASONS, seasonOf, repotAdvice } from '../store.js';
import { today, formatLong, formatFull, weekdayShort, days, plural, diffDays, age } from '../dates.js';

/** Простой столбчатый график (одна серия) с подписью значения при наведении/тапе. */
function bars(items, { label, height = 120, highlight = -1 }) {
  const max = Math.max(1, ...items.map((x) => x.n));
  const w = 100 / items.length;
  const cols = items.map((x, i) => {
    const h = x.n ? Math.max(4, (x.n / max) * (height - 22)) : 0;
    return `<div class="bar-col ${i === highlight ? 'hl' : ''}" style="width:${w}%" tabindex="0" title="${esc(x.tip)}">
      <span class="bar-tip">${esc(x.tip)}</span>
      <i style="height:${h}px"></i>
      <small>${esc(x.label)}</small>
    </div>`;
  }).join('');
  return `<div class="bars" style="height:${height + 20}px" role="img" aria-label="${esc(label)}">${cols}</div>`;
}

const REPOT_TEXT = {
  now: 'давно пора пересадить',
  soon: 'пересадка в этом году',
  ok: 'пересадка не нужна',
  unknown: 'нет данных о пересадке',
};

export function render() {
  const head = `
    <header class="page-head">
      <a class="link-btn back-link" href="#/today" data-action="back">${icon('chevronLeft')} Назад</a>
      <p class="eyebrow">анализ коллекции</p>
      <h1 class="title">Статистика</h1>
    </header>`;
  if (!state.plants.length) {
    return { title: 'Статистика', back: true, html: head + emptyState({ icon: 'leaf', title: 'Пока нечего считать', text: 'Добавь растения и отмечай уход — здесь появятся графики и советы.', button: 'Добавить растение', action: 'add-plant' }) };
  }

  const t = today();
  const s = careStats(t);
  const seasonKey = seasonOf(t);
  const season = SEASONS[seasonKey];

  // --- Сводка
  const kpi = `
    <section class="stats">
      <div class="stat card"><b>${s.total30}</b><small>дел за 30 дней</small></div>
      <div class="stat card"><b>${s.byType.water}</b><small>${plural(s.byType.water, ['полив', 'полива', 'поливов'])}</small></div>
      <div class="stat card"><b>${s.activeDays}</b><small>${plural(s.activeDays, ['день', 'дня', 'дней'])} с уходом</small></div>
    </section>`;

  // --- По видам ухода (список, не цветной график)
  const typeMax = Math.max(1, ...Object.values(s.byType));
  const byType = CARE_KEYS.filter((k) => s.byType[k]).map((k) => `
    <div class="type-row">
      <span class="chip-ico sm hue-${CARE[k].hue}">${icon(CARE[k].icon)}</span>
      <span class="type-name">${CARE[k].label}</span>
      <span class="type-bar hue-${CARE[k].hue}"><i style="width:${(s.byType[k] / typeMax) * 100}%"></i></span>
      <b>${s.byType[k]}</b>
    </div>`).join('');

  // --- По неделям
  const weeks = bars(s.weeks.map((w, i) => ({
    n: w.n, label: i === 7 ? 'эта' : formatLong(w.from).split(' ')[0],
    tip: `${formatLong(w.from)} – ${formatLong(w.to)}: ${w.n}`,
  })), { label: 'Дела ухода по неделям', highlight: 7 });

  // --- Прогноз
  const busiest = [...s.forecast].sort((a, b) => b.n - a.n)[0];
  const next7 = s.forecast.slice(0, 7).reduce((a, x) => a + x.n, 0);
  const forecast = bars(s.forecast.slice(0, 14).map((x, i) => ({
    n: x.n, label: i % 2 ? '' : (i === 0 ? 'сег' : weekdayShort(x.date)),
    tip: `${formatLong(x.date)}: ${x.n}`,
  })), { label: 'Прогноз дел на 2 недели', height: 90, highlight: 0 });

  // --- Ритм полива
  const rhythm = s.rhythm.map((r) => {
    const diff = r.avg - r.plan;
    const verdict = Math.abs(diff) < 1 ? ['ok', 'в ритме'] : diff < 0 ? ['often', 'чаще плана'] : ['rare', 'реже плана'];
    return `
      <div class="rhythm-row">
        ${plantVisual(r.plant, 'pv-xs')}
        <div><b>${esc(r.plant.name)}</b><small>в среднем раз в ${r.avg} дн. · план ${r.plan}</small></div>
        <span class="tag tag-${verdict[0]}">${verdict[1]}</span>
      </div>`;
  }).join('');
  const offPlan = s.rhythm.filter((r) => Math.abs(r.avg - r.plan) >= 1.5);

  // --- Инсайты
  const insights = [];
  if (offPlan.length) {
    const r = offPlan[0];
    insights.push(r.avg < r.plan
      ? `${r.plant.name} ты поливаешь чаще плана (раз в ${r.avg} дн.). Если земля не успевает просохнуть — можно сдвинуть интервал до ${Math.round(r.avg)} дн. в расписании или поливать реже.`
      : `${r.plant.name} получает воду реже плана (раз в ${r.avg} дн.). Возможно, ей и так хорошо — тогда поставь интервал ${Math.round(r.avg)} дн., чтобы не мучили напоминания.`);
  }
  if (busiest.n >= 3) insights.push(`Самый загруженный день в ближайший месяц — ${formatLong(busiest.date)} (${busiest.n} ${plural(busiest.n, ['дело', 'дела', 'дел'])}). Часть можно сделать накануне.`);
  insights.push(`На следующей неделе ожидается ${next7} ${plural(next7, ['дело', 'дела', 'дел'])} по уходу.`);
  if (!state.settings.seasonal) insights.push('Сезонный режим выключен: интервалы не меняются зимой и летом. Включить можно в «Ещё».');

  // --- Пересадка
  const repots = state.plants.map((p) => ({ p, a: repotAdvice(p, t) }))
    .sort((x, y) => ['now', 'soon', 'unknown', 'ok'].indexOf(x.a.need) - ['now', 'soon', 'unknown', 'ok'].indexOf(y.a.need));
  const toWindow = diffDays(t, repots[0]?.a.window || t);
  const repotRows = repots.map(({ p, a }) => `
    <a class="rhythm-row" href="#/plant/${p.id}">
      ${plantVisual(p, 'pv-xs')}
      <div><b>${esc(p.name)}</b><small>${a.last ? `пересажено ${formatFull(a.last)}` : a.since != null ? `дома ${age(p.acquired)}, пересадку не отмечали` : 'нет данных'}</small></div>
      <span class="tag tag-${a.need === 'now' ? 'rare' : a.need === 'soon' ? 'often' : 'ok'}">${REPOT_TEXT[a.need]}</span>
    </a>`).join('');

  const seasonCalendar = ['winter', 'spring', 'summer', 'autumn'].map((k) => `
    <div class="season-cell ${k === seasonKey ? 'on' : ''}">
      <b>${SEASONS[k].name}</b>
      <small>полив ${SEASONS[k].water > 1 ? 'реже' : SEASONS[k].water < 1 ? 'чаще' : 'обычно'}</small>
      <small>${SEASONS[k].feed ? 'подкормки ✓' : 'без подкормок'}</small>
      <small>${k === 'spring' ? 'пересадка ✓' : 'без пересадки'}</small>
    </div>`).join('');

  const html = `
    ${head}

    <section class="season card">
      <div class="season-top">
        <span class="chip-ico">${icon(seasonKey === 'summer' ? 'sun' : seasonKey === 'winter' ? 'sparkle' : 'leaf')}</span>
        <div><small class="eyebrow">сейчас</small><b>${season.name}</b></div>
      </div>
      <p>${season.tip}</p>
      ${state.settings.seasonal ? `<p class="hint">${icon('drop')} Сезонный режим включён: интервалы полива ${season.water > 1 ? `увеличены ×${season.water}` : season.water < 1 ? `сокращены ×${season.water}` : 'обычные'}${season.feed ? '' : ', подкормки на паузе'}.</p>` : ''}
    </section>

    ${kpi}

    <h2 class="section-title">Неделя за неделей</h2>
    <div class="card chart-card">${weeks}<p class="hint">Сколько раз ты ухаживала за растениями — последние 8 недель.</p></div>

    ${byType ? `<h2 class="section-title">Что делали за месяц</h2><div class="card type-list">${byType}</div>` : ''}

    <h2 class="section-title">Прогноз</h2>
    <div class="card chart-card">${forecast}<p class="hint">Дела по расписанию на 2 недели вперёд.</p></div>

    <h2 class="section-title">Наблюдения</h2>
    <div class="list">${insights.map((x) => `<div class="card insight">${icon('sparkle')}<p>${esc(x)}</p></div>`).join('')}</div>

    ${rhythm ? `<h2 class="section-title">Ритм полива</h2><div class="card rows-list">${rhythm}</div>` : ''}

    <h2 class="section-title">Пересадка</h2>
    <p class="hint">${season === SEASONS.spring ? 'Сейчас лучшее время — весна!' : `Лучшее окно — весна, с марта по май. До неё ${days(Math.max(0, toWindow))}.`} Обычно молодые растения пересаживают раз в год, взрослые — раз в 2–3 года, когда корни вылезают из дренажа.</p>
    <div class="card rows-list">${repotRows}</div>

    <h2 class="section-title">Год растения</h2>
    <div class="season-grid">${seasonCalendar}</div>
  `;
  return { title: 'Статистика', html, back: true };
}
