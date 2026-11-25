// Даты храним строками 'YYYY-MM-DD' в локальном времени — так проще и без сюрпризов с часовыми поясами.

const pad = (n) => String(n).padStart(2, '0');

export function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const today = () => toISO(new Date());

export function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** Сколько дней от a до b (b - a). */
export function diffDays(a, b) {
  return Math.round((parseISO(b) - parseISO(a)) / 86400000);
}

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const WD_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

export function formatLong(iso) {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatFull(iso) {
  const d = parseISO(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${sameYear ? '' : ' ' + d.getFullYear()}`;
}

export const weekday = (iso) => WEEKDAYS[parseISO(iso).getDay()];
export const weekdayShort = (iso) => WD_SHORT[parseISO(iso).getDay()];

/** Склонение: plural(3, ['день','дня','дней']) */
export function plural(n, forms) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export const days = (n) => `${n} ${plural(n, ['день', 'дня', 'дней'])}`;

/** «сегодня», «вчера», «3 дня назад», «через 2 дня» */
export function relative(iso) {
  const n = diffDays(today(), iso);
  if (n === 0) return 'сегодня';
  if (n === -1) return 'вчера';
  if (n === 1) return 'завтра';
  if (n < 0) return `${days(-n)} назад`;
  return `через ${days(n)}`;
}

/** Сколько времени растение живёт дома: «2 года 3 мес.» */
export function age(iso) {
  const total = diffDays(iso, today());
  if (total < 1) return 'первый день';
  if (total < 31) return days(total);
  const months = Math.floor(total / 30.44);
  const y = Math.floor(months / 12), m = months % 12;
  const parts = [];
  if (y) parts.push(`${y} ${plural(y, ['год', 'года', 'лет'])}`);
  if (m) parts.push(`${m} мес.`);
  return parts.join(' ');
}
