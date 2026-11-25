// Умные подсказки по коллекции. Показываем максимум 2 самых важных — и только пока они актуальны.
// Каждая подсказка: { key, priority, icon, title, text, href? }. key — для «скрыть навсегда».
// Добавить правило: допиши ещё один блок в collectionTips().

import { state, seasonOf, roomOf, repotAdvice } from './store.js';
import { getSpecies, roomChecks } from './catalog.js';
import { today } from './dates.js';

export function collectionTips(limit = 2) {
  const t = today();
  const season = seasonOf(t);
  const year = t.slice(0, 4);
  const winter = season === 'winter' || season === 'autumn';
  const tips = [];
  const withSp = state.plants.map((p) => ({ p, sp: p.speciesId ? getSpecies(p.speciesId) : null })).filter((x) => x.sp);

  // 1. Плохое место для конкретного растения
  for (const { p, sp } of withSp) {
    const room = roomOf(p);
    const bad = roomChecks(sp, room, { winter }).find((c) => c.level === 'bad');
    if (bad) tips.push({ key: `place-${p.id}-${bad.key}-${season}`, priority: 90, icon: 'pin', title: `${p.name}: ${room.name.toLowerCase()}`, text: bad.text, href: `#/plant/${p.id}` });
  }

  // 2. Зима + влаголюбивые у батареи
  if (winter) {
    const humid = withSp.filter(({ p, sp }) => sp.humidity === 'high' && (roomOf(p)?.heating ?? true));
    if (humid.length) tips.push({ key: `dry-air-${year}-${season}`, priority: 80, icon: 'mist',
      title: 'Батареи сушат воздух',
      text: `${humid.map((x) => x.p.name).join(', ')} ${humid.length > 1 ? 'любят' : 'любит'} влажность. Поставь рядом увлажнитель или поддон с мокрой галькой, держи подальше от батареи.` });

    // 3. Прохладная зимовка для цветения
    const cool = withSp.filter(({ sp }) => sp.winter[1] <= 15 && ['cactus', 'succulent', 'flowering'].includes(sp.group));
    if (cool.length >= 2) tips.push({ key: `cool-winter-${year}`, priority: 60, icon: 'sparkle',
      title: 'Прохладная зимовка',
      text: `${cool.slice(0, 4).map((x) => x.p.name).join(', ')}${cool.length > 4 ? ' и др.' : ''} зимой лучше держать ближе к холодному стеклу (10–15°) и поливать редко — так весной они пойдут в рост и зацветут.` });
  }

  // 4. Декабрист: осенью — прохлада для бутонов, с бутонами не трогать
  const dec = withSp.find(({ sp }) => sp.id === 'schlumbergera');
  if (dec && ['autumn', 'winter'].includes(season)) tips.push({ key: `schlumbergera-${year}`, priority: 70, icon: 'sparkle',
    title: `${dec.p.name}: время цветения`, text: 'Пока есть бутоны — не переставляй и не поворачивай горшок, иначе он их сбросит. Землю не пересушивай.', href: `#/plant/${dec.p.id}` });

  // 5. Весна — пора пересаживать
  if (season === 'spring') {
    const need = state.plants.filter((p) => ['now', 'soon'].includes(repotAdvice(p, t).need));
    if (need.length) tips.push({ key: `repot-${year}`, priority: 85, icon: 'pot', title: 'Сезон пересадки',
      text: `Сейчас лучшее время. В очереди: ${need.slice(0, 5).map((p) => p.name).join(', ')}${need.length > 5 ? '…' : ''}.`, href: '#/stats' });
  }

  // 6. Без фото
  const noPhoto = state.plants.filter((p) => !p.photo);
  if (noPhoto.length >= 3) tips.push({ key: 'photos', priority: 20, icon: 'camera', title: 'Сфотографируй своих',
    text: `У ${noPhoto.length} растений пока фото из справочника. Свои фото помогут потом сравнивать рост.`, href: '#/plants' });

  // 7. Дом не настроен
  if (withSp.length && !state.settings.rooms.length) tips.push({ key: 'rooms', priority: 50, icon: 'pin', title: 'Расскажи про свой дом',
    text: 'Добавь комнаты и стороны окон — подскажу, кому где лучше и кого зимой отодвинуть от батареи.', action: 'rooms' });

  const hidden = new Set(state.settings.dismissed);
  return tips.filter((x) => !hidden.has(x.key)).sort((a, b) => b.priority - a.priority).slice(0, limit);
}
