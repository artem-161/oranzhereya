// Общие UI-помощники: экранирование, тосты, нижние шторки, подтверждения, фото.

import { icon, hydrateIcons } from './icons.js';

export const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- Плейсхолдер для растения без фото ---------- */

// Мягкие «ботанические» градиенты; выбираются по имени, чтобы у растения всегда был один и тот же цвет.
const TINTS = [
  ['#cfe3c0', '#8fbf8a'], ['#d9e8d0', '#6fa78a'], ['#e5ecd2', '#a3b979'],
  ['#cfe6dd', '#6aa59a'], ['#e3ead9', '#88a983'], ['#d6e6c9', '#5f9a6c'],
];
export function tintFor(str = '') {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

export function plantVisual(p, cls = '') {
  if (p.photo) return `<div class="pv ${cls}"><img src="${p.photo}" alt="" loading="lazy" /></div>`;
  const [a, b] = tintFor(p.name);
  return `<div class="pv pv-empty ${cls}" style="--a:${a};--b:${b}">${icon('leaf')}</div>`;
}

/* ---------- Тосты ---------- */

export function toast(message, { action, onAction, timeout = 3800 } = {}) {
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = 'toast glass';
  el.innerHTML = `<span>${esc(message)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  const close = () => { el.classList.remove('in'); setTimeout(() => el.remove(), 300); };
  if (action) el.querySelector('button').onclick = () => { onAction?.(); close(); };
  setTimeout(close, timeout);
}

/* ---------- Нижняя шторка ---------- */

/**
 * openSheet({ title, body, onMount }) → { el, close }
 * body — HTML-строка. Закрывается тапом по фону, кнопкой или свайпом вниз.
 */
const openSheets = new Set();
/** Закрыть все открытые шторки (например, при переходе на другой экран). */
export const closeAllSheets = () => [...openSheets].forEach((c) => c());
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllSheets(); });

export function openSheet({ title = '', body = '', onMount, onClose } = {}) {
  const root = $('#sheet-root');
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `
    <div class="sheet-scrim"></div>
    <section class="sheet" role="dialog" aria-modal="true">
      <div class="sheet-grab"><span></span></div>
      <header class="sheet-head">
        <h2>${esc(title)}</h2>
        <button class="icon-btn glass-btn" data-close aria-label="Закрыть">${icon('close')}</button>
      </header>
      <div class="sheet-body">${body}</div>
    </section>`;
  root.appendChild(wrap);
  hydrateIcons(wrap);
  document.body.classList.add('sheet-open');

  const sheet = $('.sheet', wrap);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    openSheets.delete(close);
    wrap.classList.remove('in');
    setTimeout(() => {
      wrap.remove();
      if (!root.children.length) document.body.classList.remove('sheet-open');
      onClose?.();
    }, 320);
  };

  $('.sheet-scrim', wrap).onclick = close;
  $('[data-close]', wrap).onclick = close;

  // Свайп вниз за «ручку» или заголовок
  let startY = null, dy = 0;
  const grabZone = [$('.sheet-grab', wrap), $('.sheet-head', wrap)];
  grabZone.forEach((z) => {
    z.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; dy = 0; sheet.style.transition = 'none'; }, { passive: true });
    z.addEventListener('touchmove', (e) => {
      if (startY == null) return;
      dy = Math.max(0, e.touches[0].clientY - startY);
      sheet.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    z.addEventListener('touchend', () => {
      sheet.style.transition = '';
      sheet.style.transform = '';
      if (dy > 90) close();
      startY = null;
    });
  });

  openSheets.add(close);
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('in')));
  onMount?.(wrap, close);
  return { el: wrap, close };
}

/** Красивое подтверждение вместо системного confirm(). */
export function confirmSheet({ title, text = '', ok = 'Удалить', danger = true }) {
  return new Promise((resolve) => {
    let answered = false;
    openSheet({
      title,
      body: `
        ${text ? `<p class="muted center">${esc(text)}</p>` : ''}
        <div class="stack gap-s mt">
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-yes>${esc(ok)}</button>
          <button class="btn btn-ghost" data-no>Отмена</button>
        </div>`,
      onMount: (el, close) => {
        $('[data-yes]', el).onclick = () => { answered = true; resolve(true); close(); };
        $('[data-no]', el).onclick = close;
      },
      onClose: () => { if (!answered) resolve(false); },
    });
  });
}

/* ---------- Фото: сжимаем перед сохранением, чтобы не раздувать хранилище ---------- */

export async function fileToPhoto(file, max = 1080, quality = 0.82) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Пустое состояние экрана. */
export function emptyState({ icon: ic = 'leaf', title, text = '', button = '', action = '' }) {
  return `
    <div class="empty">
      <div class="empty-ico">${icon(ic)}</div>
      <h3>${esc(title)}</h3>
      ${text ? `<p>${esc(text)}</p>` : ''}
      ${button ? `<button class="btn btn-primary" data-action="${action}">${esc(button)}</button>` : ''}
    </div>`;
}
