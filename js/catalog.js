// Каталог видов: условия и уход. Данные — обобщённые рекомендации для квартиры в средней полосе.
// Добавить вид: скопируй любую запись и поправь. Поля:
//   light: 'bright' | 'diffused' | 'shade'   sun: терпит ли прямое солнце (true / 'morning' / false)
//   windows: подходящие стороны окна (S — юг, E — восток, W — запад, N — север)
//   temp: [мин, макс] летом, winter: [мин, макс] зимой (°C)
//   humidity: 'low' | 'medium' | 'high'
//   water: [лето, зима] — раз в сколько дней поливать (0 — почти не поливать)
//   feed: интервал подкормки в днях, feedMonths: месяцы подкормок (0 — январь)
//   mist: опрыскивать раз в N дней (0 — не надо), repot: раз в сколько лет пересаживать
//   toxic: true / false / null (нет данных), wiki: название статьи в англ. Википедии (для фото)

const SPRING_SUMMER = [3, 4, 5, 6, 7, 8];
const GROW = [2, 3, 4, 5, 6, 7, 8];

export const SPECIES = [
  // ---------- суккуленты и кактусы ----------
  { id: 'crassula-muscosa', name: 'Толстянка плауновидная', latin: 'Crassula muscosa', group: 'succulent', aliases: ['крассула', 'плаун'],
    light: 'bright', sun: true, windows: ['S', 'E', 'W'], temp: [18, 26], winter: [10, 15], humidity: 'low',
    water: [10, 25], feed: 30, feedMonths: SPRING_SUMMER, mist: 0, repot: 2, soil: 'Для кактусов и суккулентов + перлит', toxic: true, wiki: 'Crassula muscosa',
    tips: ['Поливай, только когда земля полностью просохла.', 'Без солнца стебли вытягиваются и редеют — держи на самом светлом месте.', 'Легко размножается кусочками стебля.'] },
  { id: 'delosperma-echinatum', name: 'Делосперма ежистая', latin: 'Delosperma echinatum', group: 'succulent', aliases: ['делосперма'],
    light: 'bright', sun: true, windows: ['S', 'W'], temp: [18, 27], winter: [8, 12], humidity: 'low',
    water: [10, 30], feed: 30, feedMonths: [3, 4, 5, 6, 7], mist: 0, repot: 2, soil: 'Песчаный, для суккулентов', toxic: null, wiki: 'Delosperma echinatum',
    tips: ['Любит много солнца — южное окно идеально.', 'Зимой прохлада и почти сухое содержание.', 'Боится застоя воды: обязателен дренаж.'] },
  { id: 'aloe-vera', name: 'Алоэ настоящее', latin: 'Aloe vera', group: 'succulent', aliases: ['алоэ', 'алое'],
    light: 'bright', sun: true, windows: ['S', 'E', 'W'], temp: [18, 27], winter: [10, 15], humidity: 'low',
    water: [14, 30], feed: 45, feedMonths: [3, 4, 5, 6, 7], mist: 0, repot: 2, soil: 'Для кактусов и суккулентов', toxic: true, wiki: 'Aloe vera',
    tips: ['К прямому солнцу приучай постепенно — иначе листья краснеют от ожога.', 'Не лей в розетку листьев, только по краю горшка.', 'Ядовито для кошек и собак.'] },
  { id: 'schlumbergera', name: 'Шлюмбергера (декабрист)', latin: 'Schlumbergera truncata', group: 'flowering', aliases: ['декабрист', 'шлюмбергера', 'рождественник'],
    light: 'diffused', sun: 'morning', windows: ['E', 'W'], temp: [18, 24], winter: [14, 18], humidity: 'medium',
    water: [7, 10], feed: 21, feedMonths: [2, 3, 4, 5, 6, 7], mist: 7, repot: 2, soil: 'Лёгкий, для эпифитов (кора + торф + перлит)', toxic: false, wiki: 'Schlumbergera truncata',
    tips: ['Это лесной кактус: землю не пересушивай полностью, в отличие от обычных кактусов.', 'С бутонами не переставляй и не поворачивай горшок — сбросит бутоны.', 'Для цветения осенью нужна прохлада 12–16° и короткий день.', 'Пересаживай после цветения, весной.'] },
  { id: 'nopalea', name: 'Нопалея кошениленосная', latin: 'Nopalea cochenillifera', group: 'cactus', aliases: ['нопалея', 'опунция'],
    light: 'bright', sun: true, windows: ['S'], temp: [20, 30], winter: [8, 12], humidity: 'low',
    water: [12, 30], feed: 30, feedMonths: [3, 4, 5, 6, 7], mist: 0, repot: 3, soil: 'Для кактусов, много песка и мелкого гравия', toxic: false, wiki: 'Opuntia cochenillifera',
    tips: ['Максимум солнца: южное окно, летом — балкон.', 'Зимой — прохладно и почти сухо, иначе вытянется.'] },
  { id: 'sempervivum', name: 'Молодило кровельное', latin: 'Sempervivum tectorum', group: 'succulent', aliases: ['молодило', 'каменная роза'],
    light: 'bright', sun: true, windows: ['S'], temp: [15, 25], winter: [0, 10], humidity: 'low',
    water: [14, 30], feed: 0, feedMonths: [], mist: 0, repot: 3, soil: 'Бедный каменистый', toxic: false, wiki: 'Sempervivum tectorum',
    tips: ['Это уличное растение: в тёплой квартире зимой вытягивается и теряет форму.', 'Лучше всего — застеклённый холодный балкон или самое солнечное и прохладное место.', 'Подкормки почти не нужны.'] },
  { id: 'mammillaria-crinita', name: 'Маммиллярия Кринита', latin: 'Mammillaria crinita', group: 'cactus', aliases: ['маммиллярия', 'кактус'],
    light: 'bright', sun: true, windows: ['S', 'E'], temp: [20, 30], winter: [8, 12], humidity: 'low',
    water: [12, 40], feed: 30, feedMonths: [3, 4, 5, 6, 7], mist: 0, repot: 2, soil: 'Для кактусов + пемза/перлит', toxic: false, wiki: 'Mammillaria crinita',
    tips: ['Для цветения важна прохладная сухая зимовка (8–12°).', 'Поливай по краю горшка, не на сам кактус.'] },
  { id: 'haworthiopsis', name: 'Хавортия оттянутая', latin: 'Haworthiopsis attenuata', group: 'succulent', aliases: ['хавортия', 'хавортиопсис'],
    light: 'bright', sun: 'morning', windows: ['E', 'W'], temp: [18, 27], winter: [10, 15], humidity: 'low',
    water: [12, 30], feed: 45, feedMonths: [3, 4, 5, 6, 7], mist: 0, repot: 3, soil: 'Для суккулентов', toxic: false, wiki: 'Haworthiopsis attenuata',
    tips: ['Полуденное летнее солнце может обжечь — лучше восток или запад.', 'Хорошо переносит небольшую тень, в отличие от других суккулентов.'] },
  { id: 'crassula-ovata', name: 'Толстянка яйцевидная (денежное дерево)', latin: 'Crassula ovata', group: 'succulent', aliases: ['толстянка', 'денежное дерево', 'крассула'],
    light: 'bright', sun: true, windows: ['S', 'W', 'E'], temp: [18, 26], winter: [10, 15], humidity: 'low',
    water: [12, 30], feed: 30, feedMonths: SPRING_SUMMER, mist: 0, repot: 3, soil: 'Для суккулентов, тяжёлый устойчивый горшок', toxic: true, wiki: 'Crassula ovata',
    tips: ['Перелив — главный враг: листья становятся мягкими и опадают.', 'Красные края листьев — нормальная реакция на яркое солнце.', 'Слабо токсична для животных.'] },

  // ---------- тропические лиственные ----------
  { id: 'zamioculcas', name: 'Замиокулькас', latin: 'Zamioculcas zamiifolia', group: 'tropical', aliases: ['замиокулькас', 'долларовое дерево'],
    light: 'diffused', sun: false, windows: ['E', 'W', 'N'], temp: [18, 26], winter: [15, 18], humidity: 'low',
    water: [14, 25], feed: 30, feedMonths: [3, 4, 5, 6, 7, 8], mist: 0, repot: 3, soil: 'Рыхлый, для суккулентов + кора', toxic: true, wiki: 'Zamioculcas',
    tips: ['Запасает воду в клубне — лучше недолить, чем перелить.', 'Терпит тень, но на свету растёт быстрее.', 'Сок ядовит, пересаживай в перчатках.'] },
  { id: 'philodendron-birkin', name: 'Филодендрон Биркин', latin: "Philodendron 'Birkin'", group: 'tropical', aliases: ['филодендрон', 'биркин'],
    light: 'diffused', sun: false, windows: ['E', 'W'], temp: [18, 27], winter: [16, 20], humidity: 'high',
    water: [7, 12], feed: 21, feedMonths: GROW, mist: 3, repot: 2, soil: 'Для ароидных: кора + перлит + торф', toxic: true, wiki: 'Philodendron',
    tips: ['Белые полосы ярче при хорошем рассеянном свете.', 'Поливай, когда верхние 2–3 см земли просохли.', 'Сухой воздух → коричневые кончики листьев.'] },
  { id: 'calathea-lancifolia', name: 'Калатея замечательная', latin: 'Goeppertia lancifolia', group: 'tropical', aliases: ['калатея', 'гёппертия', 'ланцифолия'],
    light: 'shade', sun: false, windows: ['E', 'N'], temp: [18, 25], winter: [17, 20], humidity: 'high',
    water: [5, 8], feed: 21, feedMonths: [3, 4, 5, 6, 7], mist: 2, repot: 2, soil: 'Рыхлый, влагоёмкий, для марантовых', toxic: false, wiki: 'Goeppertia insignis',
    tips: ['Земля всегда слегка влажная, но не мокрая.', 'Поливай отстоянной или фильтрованной тёплой водой — от жёсткой сохнут края.', 'Сухой воздух от батарей — главная беда зимой: нужен увлажнитель или поддон с мокрой галькой.'] },
  { id: 'ficus-benjamina', name: 'Фикус Бенджамина', latin: 'Ficus benjamina', group: 'tropical', aliases: ['фикус', 'бенджамина'],
    light: 'bright', sun: 'morning', windows: ['E', 'W', 'S'], temp: [18, 25], winter: [16, 20], humidity: 'medium',
    water: [6, 10], feed: 14, feedMonths: GROW, mist: 3, repot: 2, soil: 'Универсальный + перлит', toxic: true, wiki: 'Ficus benjamina',
    tips: ['Не любит переезды и сквозняки — сбрасывает листья.', 'Выбери постоянное место и поворачивай горшок минимально.', 'Млечный сок раздражает кожу и токсичен для животных.'] },
  { id: 'ficus-microcarpa', name: 'Фикус мелкоплодный', latin: 'Ficus microcarpa', group: 'tropical', aliases: ['фикус', 'микрокарпа', 'жинсенг'],
    light: 'bright', sun: 'morning', windows: ['E', 'W', 'S'], temp: [18, 25], winter: [15, 18], humidity: 'medium',
    water: [5, 9], feed: 14, feedMonths: GROW, mist: 2, repot: 2, soil: 'Универсальный + перлит', toxic: true, wiki: 'Ficus microcarpa',
    tips: ['Любит регулярное опрыскивание и тёплый душ.', 'Часто формируют как бонсай — обрезка весной.'] },
  { id: 'tradescantia-spathacea', name: 'Традесканция разноцветная (рео)', latin: 'Tradescantia spathacea', group: 'tropical', aliases: ['рео', 'традесканция'],
    light: 'bright', sun: 'morning', windows: ['E', 'W', 'S'], temp: [18, 26], winter: [14, 18], humidity: 'medium',
    water: [6, 12], feed: 21, feedMonths: GROW, mist: 0, repot: 2, soil: 'Универсальный', toxic: true, wiki: 'Tradescantia spathacea',
    tips: ['На хорошем свету изнанка листьев ярко-фиолетовая, в тени бледнеет.', 'Не лей в пазухи листьев — может загнить.', 'Сок раздражает кожу.'] },
  { id: 'epipremnum', name: 'Эпипремнум золотистый', latin: 'Epipremnum aureum', group: 'tropical', aliases: ['эпипремнум', 'сциндапсус', 'потос'],
    light: 'diffused', sun: false, windows: ['E', 'W', 'N'], temp: [18, 26], winter: [15, 18], humidity: 'medium',
    water: [7, 12], feed: 21, feedMonths: GROW, mist: 4, repot: 2, soil: 'Для ароидных', toxic: true, wiki: 'Epipremnum aureum',
    tips: ['Очень выносливый, терпит тень — но пёстрость в тени пропадает.', 'Поливай, когда верхний слой просох.', 'Длинные плети можно укоренить в воде.'] },
  { id: 'epipremnum-neon', name: 'Эпипремнум Неон', latin: "Epipremnum aureum 'Neon'", group: 'tropical', aliases: ['эпипремнум', 'неон', 'потос'],
    light: 'bright', sun: false, windows: ['E', 'W'], temp: [18, 26], winter: [15, 18], humidity: 'medium',
    water: [7, 12], feed: 21, feedMonths: GROW, mist: 4, repot: 2, soil: 'Для ароидных', toxic: true, wiki: 'Epipremnum aureum',
    tips: ['Неоновому цвету нужно больше света, чем обычному эпипремнуму — иначе листья темнеют.', 'Прямое солнце обжигает нежные листья.'] },
  { id: 'peperomia-obtusifolia', name: 'Пеперомия туполистная', latin: 'Peperomia obtusifolia', group: 'tropical', aliases: ['пеперомия'],
    light: 'diffused', sun: false, windows: ['E', 'W'], temp: [18, 25], winter: [16, 20], humidity: 'medium',
    water: [10, 18], feed: 30, feedMonths: [3, 4, 5, 6, 7, 8], mist: 0, repot: 3, soil: 'Рыхлый + перлит', toxic: false, wiki: 'Peperomia obtusifolia',
    tips: ['Мясистые листья запасают воду — поливай после просыхания земли.', 'Пёстрые формы светлее и требуют больше света.'] },
  { id: 'aglaonema', name: 'Аглаонема', latin: 'Aglaonema', group: 'tropical', aliases: ['аглаонема', 'siam aurora', 'pink star', 'сиам'],
    light: 'diffused', sun: false, windows: ['E', 'W', 'N'], temp: [20, 27], winter: [17, 20], humidity: 'medium',
    water: [6, 10], feed: 21, feedMonths: GROW, mist: 3, repot: 2, soil: 'Для ароидных', toxic: true, wiki: 'Aglaonema',
    tips: ['Красные и розовые сорта (Siam Aurora, Pink Star) ярче на хорошем рассеянном свету.', 'Не любит холод ниже 16° и сквозняки.', 'Сок токсичен.'] },
  { id: 'hoya-carnosa', name: 'Хойя мясистая', latin: 'Hoya carnosa', group: 'flowering', aliases: ['хойя', 'восковой плющ'],
    light: 'bright', sun: 'morning', windows: ['E', 'W'], temp: [18, 26], winter: [12, 16], humidity: 'medium',
    water: [8, 18], feed: 21, feedMonths: [3, 4, 5, 6, 7, 8], mist: 0, repot: 3, soil: 'Рыхлый, для эпифитов', toxic: false, wiki: 'Hoya carnosa',
    tips: ['Цветёт в тесном горшке — не торопись пересаживать.', 'Не срезай старые цветоносы: на них цветёт снова.', 'С бутонами не переставляй.', 'Прохладная зимовка помогает цветению.'] },
  { id: 'stephanotis', name: 'Стефанотис обильноцветущий', latin: 'Stephanotis floribunda', group: 'flowering', aliases: ['стефанотис', 'мадагаскарский жасмин'],
    light: 'bright', sun: 'morning', windows: ['E', 'W', 'S'], temp: [20, 25], winter: [14, 16], humidity: 'high',
    water: [4, 10], feed: 14, feedMonths: [2, 3, 4, 5, 6, 7], mist: 3, repot: 2, soil: 'Питательный, слабокислый', toxic: false, wiki: 'Marsdenia floribunda',
    tips: ['Для цветения нужна прохладная зимовка 14–16° и умеренный полив.', 'С бутонами не переставляй горшок.', 'Опрыскивай листья, но не цветы.', 'Лиане нужна опора.'] },
  { id: 'pelargonium', name: 'Пеларгония (герань)', latin: 'Pelargonium hortorum', group: 'flowering', aliases: ['пеларгония', 'герань'],
    light: 'bright', sun: true, windows: ['S', 'W', 'E'], temp: [18, 25], winter: [10, 15], humidity: 'low',
    water: [5, 12], feed: 14, feedMonths: [2, 3, 4, 5, 6, 7, 8], mist: 0, repot: 2, soil: 'Универсальный + перлит', toxic: true, wiki: 'Pelargonium × hortorum',
    tips: ['Не опрыскивай: опушённые листья от воды гниют.', 'Весной обрезай вытянутые побеги — куст станет пышнее.', 'Прохладная зимовка = обильное цветение летом.'] },

  // ---------- популярные дополнительно ----------
  { id: 'monstera', name: 'Монстера', latin: 'Monstera deliciosa', group: 'tropical', aliases: ['монстера'],
    light: 'diffused', sun: 'morning', windows: ['E', 'W'], temp: [18, 27], winter: [16, 20], humidity: 'medium',
    water: [7, 12], feed: 21, feedMonths: GROW, mist: 3, repot: 2, soil: 'Для ароидных + кора', toxic: true, wiki: 'Monstera deliciosa',
    tips: ['Нужна опора (кокосовая или моховая палка).', 'Прорези на листьях появляются при хорошем свете.'] },
  { id: 'sansevieria', name: 'Сансевиерия', latin: 'Dracaena trifasciata', group: 'succulent', aliases: ['сансевиерия', 'щучий хвост', 'тёщин язык'],
    light: 'diffused', sun: 'morning', windows: ['E', 'W', 'S', 'N'], temp: [18, 27], winter: [14, 18], humidity: 'low',
    water: [14, 30], feed: 30, feedMonths: [3, 4, 5, 6, 7], mist: 0, repot: 3, soil: 'Для суккулентов', toxic: true, wiki: 'Dracaena trifasciata',
    tips: ['Почти неубиваемая — кроме перелива.', 'Не лей в центр розетки.'] },
  { id: 'spathiphyllum', name: 'Спатифиллум', latin: 'Spathiphyllum wallisii', group: 'flowering', aliases: ['спатифиллум', 'женское счастье'],
    light: 'shade', sun: false, windows: ['N', 'E', 'W'], temp: [18, 25], winter: [16, 20], humidity: 'high',
    water: [4, 8], feed: 14, feedMonths: GROW, mist: 2, repot: 1, soil: 'Влагоёмкий, рыхлый', toxic: true, wiki: 'Spathiphyllum wallisii',
    tips: ['Сам показывает жажду — листья опускаются.', 'Не пересушивай: восстанавливается, но кончики сохнут.'] },
  { id: 'chlorophytum', name: 'Хлорофитум', latin: 'Chlorophytum comosum', group: 'tropical', aliases: ['хлорофитум'],
    light: 'diffused', sun: 'morning', windows: ['E', 'W', 'N'], temp: [18, 25], winter: [12, 18], humidity: 'medium',
    water: [5, 10], feed: 21, feedMonths: GROW, mist: 0, repot: 1, soil: 'Универсальный', toxic: false, wiki: 'Chlorophytum comosum',
    tips: ['Детки на усах легко укореняются.', 'Безопасен для кошек.'] },
  { id: 'phalaenopsis', name: 'Орхидея фаленопсис', latin: 'Phalaenopsis', group: 'flowering', aliases: ['орхидея', 'фаленопсис'],
    light: 'diffused', sun: false, windows: ['E', 'W'], temp: [20, 27], winter: [16, 20], humidity: 'medium',
    water: [7, 12], feed: 14, feedMonths: GROW, mist: 0, repot: 2, soil: 'Кора, прозрачный горшок', toxic: false, wiki: 'Phalaenopsis',
    tips: ['Поливай погружением на 15 минут, когда корни посеребрели.', 'Вода не должна стоять в пазухах листьев.', 'Перепад день/ночь 5–6° провоцирует цветение.'] },
  { id: 'pilea', name: 'Пилея', latin: 'Pilea peperomioides', group: 'tropical', aliases: ['пилея', 'китайское денежное'],
    light: 'bright', sun: 'morning', windows: ['E', 'W'], temp: [16, 24], winter: [12, 18], humidity: 'medium',
    water: [6, 12], feed: 21, feedMonths: GROW, mist: 0, repot: 1, soil: 'Универсальный + перлит', toxic: false, wiki: 'Pilea peperomioides',
    tips: ['Поворачивай горшок раз в неделю — тянется к свету.'] },
  { id: 'ficus-lyrata', name: 'Фикус лировидный', latin: 'Ficus lyrata', group: 'tropical', aliases: ['фикус', 'лирата'],
    light: 'bright', sun: 'morning', windows: ['E', 'W', 'S'], temp: [18, 26], winter: [16, 20], humidity: 'medium',
    water: [7, 12], feed: 21, feedMonths: GROW, mist: 0, repot: 2, soil: 'Универсальный + кора', toxic: true, wiki: 'Ficus lyrata',
    tips: ['Протирай большие листья от пыли.', 'Не любит переезды.'] },
];

export const getSpecies = (id) => SPECIES.find((s) => s.id === id) || null;

// Группы для коллекции (порядок = порядок секций)
export const GROUPS = {
  succulent: 'Суккуленты',
  cactus: 'Кактусы',
  tropical: 'Тропические лиственные',
  flowering: 'Цветущие',
  other: 'Без группы',
};
export const groupOf = (p) => (p.speciesId && getSpecies(p.speciesId)?.group) || p.group || 'other';

const norm = (s) => s.toLowerCase().replace(/ё/g, 'е').replace(/['"«»]/g, '');
export function searchSpecies(q) {
  const n = norm(q.trim());
  if (!n) return SPECIES;
  return SPECIES.filter((s) => norm([s.name, s.latin, ...s.aliases].join(' ')).includes(n));
}

/* ---------- Подписи ---------- */

export const WINDOW = { S: 'Юг', E: 'Восток', W: 'Запад', N: 'Север', none: 'Без окна' };
export const LIGHT_TXT = { bright: 'Яркий свет', diffused: 'Рассеянный свет', shade: 'Полутень' };
export const HUMID_TXT = { low: 'Сухой воздух ок', medium: 'Средняя влажность', high: 'Высокая влажность' };
export const SUN_TXT = { true: 'прямое солнце можно', morning: 'утреннее солнце можно', false: 'без прямого солнца' };
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
export const monthsRange = (arr) => arr.length ? `${MONTHS_SHORT[arr[0]]}–${MONTHS_SHORT[arr[arr.length - 1]]}` : 'не нужны';

/* ---------- Совместимость с комнатой ---------- */

const HUM_LEVEL = { low: 0, medium: 1, high: 2 };

/**
 * Насколько комната подходит виду. Возвращает список проверок: { key, ok, level, text }.
 * level: 'ok' | 'warn' | 'bad'. winter — учитывать отопление.
 */
export function roomChecks(sp, room, { winter = false } = {}) {
  if (!sp || !room) return [];
  const out = [];
  const w = room.window || 'none';
  if (w === 'none') out.push({ key: 'light', level: sp.light === 'shade' ? 'warn' : 'bad', text: 'В комнате без окна света не хватит' });
  else if (sp.windows.includes(w)) out.push({ key: 'light', level: 'ok', text: `${WINDOW[w]} — подходящее окно` });
  else if (w === 'S' && !sp.sun) out.push({ key: 'light', level: 'warn', text: 'Южное окно: притени тюлем или отодвинь на 1–2 м от стекла' });
  else if (w === 'S' && sp.sun === 'morning') out.push({ key: 'light', level: 'warn', text: 'Южное окно: летом в полдень притеняй' });
  else if (w === 'N' && sp.light === 'bright') out.push({ key: 'light', level: 'bad', text: 'Северное окно — слишком темно, лучше юг/восток/запад' });
  else out.push({ key: 'light', level: 'warn', text: `${WINDOW[w]} — не идеально, лучше: ${sp.windows.map((x) => WINDOW[x].toLowerCase()).join(', ')}` });

  const roomHum = room.humidity || 'medium';
  const dry = winter && room.heating;
  const effHum = dry ? Math.max(0, HUM_LEVEL[roomHum] - 1) : HUM_LEVEL[roomHum];
  const need = HUM_LEVEL[sp.humidity];
  if (need > effHum) out.push({ key: 'humidity', level: need - effHum >= 2 ? 'bad' : 'warn', text: dry ? 'Батарея сушит воздух — нужен увлажнитель или поддон с мокрой галькой' : 'Влажности маловато — увлажнитель или группа растений рядом' });
  else out.push({ key: 'humidity', level: 'ok', text: 'Влажность подходит' });

  if (winter && room.heating && sp.winter[1] <= 15) out.push({ key: 'temp', level: 'warn', text: `Зимой ему нужна прохлада ${sp.winter[0]}–${sp.winter[1]}°: поставь ближе к стеклу, подальше от батареи` });
  return out;
}

/** Лучшие комнаты для вида из списка комнат дома. */
export function bestRooms(sp, rooms, opts) {
  const score = { ok: 2, warn: 1, bad: 0 };
  return rooms.map((r) => {
    const checks = roomChecks(sp, r, opts);
    return { room: r, checks, score: checks.reduce((a, c) => a + score[c.level], 0) };
  }).sort((a, b) => b.score - a.score);
}

/* ---------- Фото вида из Википедии (кэшируется) ---------- */

const WIKI_KEY = 'oranzhereya-wiki-v2';
const wikiCache = (() => { try { return JSON.parse(localStorage.getItem(WIKI_KEY) || '{}'); } catch { return {}; } })();
const pending = {};

export function wikiThumb(title) {
  if (title in wikiCache) return Promise.resolve(wikiCache[title]);
  if (pending[title]) return pending[title];
  pending[title] = fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      const url = j?.thumbnail?.source?.replace(/\/\d+px-/, '/500px-') || null;
      wikiCache[title] = url;
      try { localStorage.setItem(WIKI_KEY, JSON.stringify(wikiCache)); } catch {}
      return url;
    })
    .catch(() => null);
  return pending[title];
}

/** Подставляет фото видов в элементы с data-wiki внутри контейнера. */
export function hydrateWiki(root) {
  root.querySelectorAll('[data-wiki]').forEach(async (el) => {
    const url = await wikiThumb(el.dataset.wiki);
    if (!url || !el.isConnected) return;
    el.style.backgroundImage = `url("${url}")`;
    el.classList.add('has-wiki');
  });
}

/* ---------- Коллекция Юли (для импорта одним нажатием) ---------- */

export const MY_COLLECTION = [
  ['Толстянка плауновидная', 'crassula-muscosa'],
  ['Делосперма ежистая', 'delosperma-echinatum'],
  ['Алоэ настоящее', 'aloe-vera'],
  ['Замиокулькас', 'zamioculcas'],
  ['Декабрист', 'schlumbergera'],
  ['Пеларгония', 'pelargonium'],
  ['Филодендрон Биркин', 'philodendron-birkin'],
  ['Калатея замечательная', 'calathea-lancifolia'],
  ['Нопалея', 'nopalea'],
  ['Молодило', 'sempervivum'],
  ['Маммиллярия Кринита', 'mammillaria-crinita'],
  ['Фикус Бенджамина', 'ficus-benjamina'],
  ['Хавортия', 'haworthiopsis'],
  ['Толстянка яйцевидная', 'crassula-ovata'],
  ['Стефанотис', 'stephanotis'],
  ['Фикус мелкоплодный', 'ficus-microcarpa'],
  ['Традесканция рео', 'tradescantia-spathacea'],
  ['Эпипремнум', 'epipremnum'],
  ['Эпипремнум Неон', 'epipremnum-neon'],
  ['Пеперомия туполистная', 'peperomia-obtusifolia'],
  ["Аглаонема 'Siam Aurora'", 'aglaonema', "Aglaonema 'Siam Aurora'"],
  ["Аглаонема 'Pink Star'", 'aglaonema', "Aglaonema 'Pink Star'"],
  ['Хойя мясистая', 'hoya-carnosa'],
];
