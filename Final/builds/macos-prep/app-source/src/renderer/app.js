'use strict';

// ═══════════════════════════════════════════════
// PDF EXPORT — via Electron printToPDF
// ═══════════════════════════════════════════════
async function exportPDF() {
  if (!window.electronAPI?.exportPDF) {
    alert('PDF export is only available in the Electron app');
    return;
  }
  try {
    const result = await window.electronAPI.exportPDF();
    if (result.success) {
      showStatus('PDF eksportovano: ' + result.path);
    } else {
      alert('Pomylka eksportu PDF: ' + (result.error || 'Skasovano'));
    }
  } catch (err) {
    alert('Pomylka eksportu PDF: ' + String(err));
  }
}

// ═══════════════════════════════════════════════
// КОНСТАНТИ
// ═══════════════════════════════════════════════
const BASE_ZOOM = 3;
const PAGE_W = 210;
const PAGE_H = 297;
const GRID_MM = 10;
const SNAP_CROSS = 6;
const HIT_TOLERANCE = 3;
const ARROW_STEP = 1;
const ARROW_STEP_BIG = 10;
const SNAP_RADIUS_PX = 12;

// Rulers
const RULER_BG   = '#2d2d2d';
const RULER_FG   = '#aaaaaa';
const RULER_TICK = '#666666';

// ═══════════════════════════════════════════════
// ТИПИ ЛІНІЙ (ГОСТ 2.303-68)
// ═══════════════════════════════════════════════
const LINE_TYPES = {
  // в"–1 — Суцільна товста основна (контури видимих поверхонь)
  solid_thick: {
    name:        'Суцільна товста',
    dasharray:   'none',
    widthFactor: 1.0,   // × базова товщина S
  },
  // в"–2 — Суцільна тонка (розмірні, виносні, штриховка)
  solid_thin: {
    name:        'Суцільна тонка',
    dasharray:   'none',
    widthFactor: 0.33,  // S/3
  },
  // в"–4 — Штрихова (невидимий контур)
  dashed: {
    name:        'Штрихова',
    dasharray:   '5,2',
    widthFactor: 0.33,
  },
  // в"–5 — Штрихпунктирна тонка (осьові, центрові)
  dash_dot: {
    name:        'Штрихпунктирна (осьова)',
    dasharray:   '12,3,1,3',
    widthFactor: 0.33,
  },
  // в"–6 — Штрихпунктирна Р· 2 точками (лінії згину)
  dash_dot_dot: {
    name:        'Штрихпунктирна (2 точки)',
    dasharray:   '12,3,1,3,1,3',
    widthFactor: 0.33,
  },
  // в"–7 — Штрихпунктирна потовщена (термообробка)
  dash_dot_thick: {
    name:        'Штрихпунктирна товста',
    dasharray:   '12,3,1,3',
    widthFactor: 0.66,  // S/2 до 2S/3
  },
};

// Базова товщина лінії S РІ мм
const LINE_S_MM = 0.5;

// ═══════════════════════════════════════════════
// ФОРМАТИ АРКУШІВ (ГОСТ 2.301-68)
// ═══════════════════════════════════════════════
const PAGE_FORMATS = {
  'A4': { w: 210,  h: 297,  name: 'A4 (210×297)',  verticalOnly: false },
  'A3': { w: 297,  h: 420,  name: 'A3 (297×420)',  verticalOnly: false },
  'A2': { w: 420,  h: 594,  name: 'A2 (420×594)',  verticalOnly: false },
  'A1': { w: 594,  h: 841,  name: 'A1 (594×841)',  verticalOnly: false },
  'A0': { w: 841,  h: 1189, name: 'A0 (841×1189)', verticalOnly: false },
};

// Рамка (мм):
const FRAME_LEFT   = 20; // від лівого краю
const FRAME_OTHER  = 5;  // від правого, верхнього, нижнього країв

// ════════════════════════════════════════════════════════
// SVG ІКОНКИ ДЛЯ TOAST ПОВІДОМЛЕНЬ
// ════════════════════════════════════════════════════════
const TOAST_ICONS = {
  success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`,
  error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9"  y1="9" x2="15" y2="15"/>
  </svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94
             a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9"  x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8"  x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`,
  save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11
             a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>`,
  delete: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>`,
  dimension: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="2"  y1="12" x2="22" y2="12"/>
    <line x1="2"  y1="8"  x2="2"  y2="16"/>
    <line x1="22" y1="8"  x2="22" y2="16"/>
    <line x1="12" y1="6"  x2="12" y2="10"/>
    <text x="12" y="10" font-size="7" text-anchor="middle"
          fill="currentColor" stroke="none">мм</text>
  </svg>`,
  image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>`,
  project: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5
             a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>`,
  measure: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 6H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h18
             a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z"/>
    <line x1="7"  y1="10" x2="7"  y2="14"/>
    <line x1="11" y1="10" x2="11" y2="12"/>
    <line x1="15" y1="10" x2="15" y2="14"/>
    <line x1="19" y1="10" x2="19" y2="12"/>
  </svg>`,
  toggle_off: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="6" width="22" height="12" rx="6"/>
    <circle cx="8" cy="12" r="4" fill="currentColor" stroke="none"/>
  </svg>`,
  toggle_on: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="6" width="22" height="12" rx="6"/>
    <circle cx="16" cy="12" r="4" fill="currentColor" stroke="none"/>
  </svg>`,
  horizontal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="2" y1="12" x2="22" y2="12"/>
    <polyline points="6 8 2 12 6 16"/>
    <polyline points="18 8 22 12 18 16"/>
  </svg>`,
  vertical: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="2" x2="12" y2="22"/>
    <polyline points="8 6 12 2 16 6"/>
    <polyline points="8 18 12 22 16 18"/>
  </svg>`,
  centerline: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="2"  y1="12" x2="6"  y2="12"/>
    <line x1="9"  y1="12" x2="15" y2="12" stroke-dasharray="4 2"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="12" y1="2"  x2="12" y2="6"/>
    <line x1="12" y1="9"  x2="12" y2="15" stroke-dasharray="4 2"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
  </svg>`,
  stamp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2"  y="14" width="20" height="7" rx="1"/>
    <line x1="2"  y1="17" x2="22" y2="17"/>
    <line x1="7"  y1="14" x2="7"  y2="21"/>
    <line x1="14" y1="14" x2="14" y2="21"/>
  </svg>`,
};

// ════════════════════════════════════════════════════════
// UI_ICONS — SVG іконки для діалогів і кнопок
// ════════════════════════════════════════════════════════
const UI_ICONS = {
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6"  x2="6"  y2="18"/>
    <line x1="6"  y1="6"  x2="18" y2="18"/>
  </svg>`,

  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`,

  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>`,

  save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11
             a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>`,

  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94
             a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9"  x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,

  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8"  x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`,

  folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5
             a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>`,

  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3"  y1="9"  x2="21" y2="9"/>
    <line x1="9"  y1="21" x2="9"  y2="9"/>
  </svg>`,

  image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>`,

  stamp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2"  y="14" width="20" height="7" rx="1"/>
    <line x1="2"  y1="17" x2="22" y2="17"/>
    <line x1="7"  y1="14" x2="7"  y2="21"/>
    <line x1="14" y1="14" x2="14" y2="21"/>
  </svg>`,

  dimension: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="2"  y1="12" x2="22" y2="12"/>
    <line x1="2"  y1="8"  x2="2"  y2="16"/>
    <line x1="22" y1="8"  x2="22" y2="16"/>
    <line x1="12" y1="6"  x2="12" y2="9"/>
  </svg>`,

  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14
             a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>`,

  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5"  y1="12" x2="19" y2="12"/>
  </svg>`,

  centerline: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="2"  y1="12" x2="7"  y2="12"/>
    <line x1="17" y1="12" x2="22" y2="12"/>
    <line x1="12" y1="2"  x2="12" y2="7"/>
    <line x1="12" y1="17" x2="12" y2="22"/>
  </svg>`,

  horizontal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="2" y1="12" x2="22" y2="12"/>
    <polyline points="6 8 2 12 6 16"/>
    <polyline points="18 8 22 12 18 16"/>
  </svg>`,

  vertical: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="2" x2="12" y2="22"/>
    <polyline points="8 6 12 2 16 6"/>
    <polyline points="8 18 12 22 16 18"/>
  </svg>`,

  diameter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="8"/>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>`,

  radius: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="8"/>
    <line x1="12" y1="12" x2="19.07" y2="4.93"/>
  </svg>`,

  mirror: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="3" x2="12" y2="21" stroke-dasharray="3 2"/>
    <path d="M3 12l4-4v8L3 12z" fill="currentColor" stroke="none"/>
    <path d="M21 12l-4-4v8l4-4z" fill="currentColor" stroke="none"/>
  </svg>`,

  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9
             a2 2 0 0 1 2 2v1"/>
  </svg>`,

  rotate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>`,

  export_file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>`,
};

// в"Ђв"Ђ Хелпер: створити span Р· SVG іконкою в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
function makeIconSpan(iconKey, size = 14, colorOverride = null) {
  const svgStr = UI_ICONS[iconKey];
  if (!svgStr) {
    const empty = document.createElement('span');
    empty.style.cssText =
      `display:inline-flex;width:${size}px;height:${size}px;flex-shrink:0;`;
    return empty;
  }

  const span = document.createElement('span');
  span.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: ${size}px;
    height: ${size}px;
    flex-shrink: 0;
    ${colorOverride ? `color: ${colorOverride};` : ''}
  `;
  span.innerHTML = svgStr;

  const svg = span.querySelector('svg');
  if (svg) {
    svg.style.width  = '100%';
    svg.style.height = '100%';
    svg.style.display = 'block';
  }
  return span;
}

// в"Ђв"Ђ Хелпер: SVG рядок для inline HTML в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
function iconHtml(iconKey, size = 14, color = 'currentColor') {
  const svg = UI_ICONS[iconKey] || '';
  return `<span style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;flex-shrink:0;color:${color};vertical-align:middle;">${svg}</span>`;
}

// в"Ђв"Ђ Кольори типів в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
const TOAST_COLORS = {
  success:    { border: '#4caf50', icon: '#4caf50', bg: '#1a2a1a' },
  error:      { border: '#f44336', icon: '#f44336', bg: '#2a1a1a' },
  warning:    { border: '#ff9800', icon: '#ff9800', bg: '#2a2010' },
  info:       { border: '#007acc', icon: '#7ec8e3', bg: '#0d1f2d' },
  save:       { border: '#007acc', icon: '#7ec8e3', bg: '#0d1f2d' },
  delete:     { border: '#f44336', icon: '#f88'   , bg: '#2a1a1a' },
  dimension:  { border: '#7ec8e3', icon: '#7ec8e3', bg: '#0d1f2d' },
  image:      { border: '#9c27b0', icon: '#ce93d8', bg: '#1a0d2a' },
  project:    { border: '#007acc', icon: '#7ec8e3', bg: '#0d1f2d' },
  measure:    { border: '#7ec8e3', icon: '#7ec8e3', bg: '#0d1f2d' },
  toggle_off: { border: '#555'   , icon: '#888'   , bg: '#1e1e1e' },
  toggle_on:  { border: '#007acc', icon: '#7ec8e3', bg: '#0d1f2d' },
  horizontal: { border: '#7ec8e3', icon: '#7ec8e3', bg: '#0d1f2d' },
  vertical:   { border: '#7ec8e3', icon: '#7ec8e3', bg: '#0d1f2d' },
  centerline: { border: '#ff6b6b', icon: '#ff6b6b', bg: '#2a0d0d' },
  stamp:      { border: '#7ec8e3', icon: '#7ec8e3', bg: '#0d1f2d' },
};

// в"Ђв"Ђ Визначення типу повідомлення по тексту в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
function detectToastType(msg) {
  const m = msg.toLowerCase();

  // в"Ђв"Ђ Помилки в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (m.includes('помилка') || m.includes('невірн') ||
      m.includes('error')   || m.includes('не вдал'))
    return 'error';

  // в"Ђв"Ђ Попередження в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (m.includes('увага')   || m.includes('перекри') ||
      m.includes('warning') || m.includes('обережно'))
    return 'warning';

  // в"Ђв"Ђ Збереження в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (m.includes('збережен') || m.includes('зберігаєт'))
    return 'save';

  // в"Ђв"Ђ Видалення / очищення в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (m.includes('видален') || m.includes('очищен') ||
      m.includes('видалено') || m.includes('прибран'))
    return 'delete';

  // в"Ђв"Ђ Зображення в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (m.includes('зображен') || m.includes('фото') ||
      m.includes('картинк'))
    return 'image';

  // в"Ђв"Ђ Проект в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (m.includes('проект') || m.includes('файл відкрит'))
    return 'project';

  // в"Ђв"Ђ Штамп в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (m.includes('штамп'))
    return 'stamp';

  // в"Ђв"Ђ Горизонталь в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (m.includes('горизонт'))
    return 'horizontal';

  // в"Ђв"Ђ Вертикаль в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (m.includes('вертикал'))
    return 'vertical';

  // в"Ђв"Ђ Осьові лінії в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (m.includes('осьов') || m.includes('centerline'))
    return 'centerline';

  // в"Ђв"Ђ Розміри в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (m.includes('розмір') || m.includes('діаметр') ||
      m.includes('радіус') || m.includes('довжин'))
    return 'dimension';

  // в"Ђв"Ђ Вимкнено в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (m.includes('вимкн') || m.includes('прихован') ||
      m.includes('сховано'))
    return 'toggle_off';

  // в"Ђв"Ђ Увімкнено в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (m.includes('увімкн') || m.includes('показан') ||
      m.includes('відображ'))
    return 'toggle_on';

  // в"Ђв"Ђ Успіх в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (m.includes('додано') || m.includes('готово') ||
      m.includes('застосован') || m.includes('оновлен') ||
      m.includes('встановлен'))
    return 'success';

  // в"Ђв"Ђ За замовчуванням в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  return 'info';
}

// в"Ђв"Ђ Очистити текст від емодзі в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
function stripEmoji(str) {
  return str.replace(
    /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27FF}]|[⬜✓✛⊙↔↕↗✕]/gu,
    ''
  ).trim();
}

// в"Ђв"Ђ Нова showStatus в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
function showStatus(msg, durationMs = 2500) {
  const old = document.getElementById('toast-notification');
  if (old) {
    clearTimeout(old._hideTimer);
    clearTimeout(old._removeTimer);
    old.remove();
  }

  const type   = detectToastType(msg);
  const colors = TOAST_COLORS[type] || TOAST_COLORS.info;
  const icon   = TOAST_ICONS[type]  || TOAST_ICONS.info;
  const text   = stripEmoji(msg);

  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.style.cssText = `
    position: fixed;
    bottom: 48px;
    left: 50%;
    transform: translateX(-50%) translateY(12px);
    display: flex;
    align-items: center;
    gap: 10px;
    background: ${colors.bg};
    border: 1px solid ${colors.border};
    border-left: 3px solid ${colors.border};
    border-radius: 4px;
    padding: 9px 16px 9px 12px;
    color: #cccccc;
    font-family: 'Segoe UI', system-ui, monospace;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.01em;
    box-shadow: 0 4px 16px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4);
    z-index: 99999;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease, transform 0.15s ease;
    max-width: 420px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    user-select: none;
    -webkit-user-select: none;
  `;

  const iconWrap = document.createElement('span');
  iconWrap.style.cssText = `
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${colors.icon};
    opacity: 0.95;
  `;
  iconWrap.innerHTML = icon;

  const textSpan = document.createElement('span');
  textSpan.style.cssText = `
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #d4d4d4;
    line-height: 1.4;
  `;
  textSpan.textContent = text;

  toast.appendChild(iconWrap);
  toast.appendChild(textSpan);
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity   = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
  });

  toast._hideTimer = setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(-50%) translateY(8px)';
    toast._removeTimer = setTimeout(() => toast.remove(), 200);
  }, durationMs);
}

// ════════════════════════════════════════════════════════
// РОЗУМНЕ ФОРМАТУВАННЯ ЧИСЕЛ В ММ
// ════════════════════════════════════════════════════════
// Правила:
// - Цілі числа: "25" (без десяткових)
// - Одна десяткова якщо потрібно: "25.5"
// - Не більше 2 знаків: "25.53"
function formatMM(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';

  // Round to 2 decimal places to avoid floating point artifacts
  const rounded = Math.round(value * 100) / 100;

  // Якщо ціле число
  if (Number.isInteger(rounded)) {
    return rounded.toString();
  }

  // Якщо одна десяткова достатня
  if (Math.round(rounded * 10) / 10 === rounded) {
    return rounded.toFixed(1);
  }

  // Інакше дві десяткові
  return rounded.toFixed(2);
}

// ════════════════════════════════════════════════════════
// РђВТО-РОЗМІТКА (автоматичне додавання розмірів)
// ════════════════════════════════════════════════════════
const AUTO_ANNOTATE = {
  enabled:       true,   // вмикати авто-розмітку
  offsetDefault: 8,      // відступ розмірної лінії від об'єкта (мм)
  showDialog:    true,   // показувати діалог вибору
};

// ═══════════════════════════════════════════════
// СТАН ПРОГРАМИ
// ═══════════════════════════════════════════════
const state = {
  zoom: 1.0,
  panX: 20,
  panY: 20,
  tool: 'select',
  entities: [],
  nextId: 1,
  selectedId: null,
  selectedIds: new Set(), // множинне виділення
  lineStart: null,
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  panStartPanX: 0,
  panStartPanY: 0,
  snapEnabled: true,
  gridVisible: true,
  gridType: 'mm',
  history: [],
  historyIndex: -1,
  isDragging: false,
  dragStartW: null,
  lastDragW: null,
  dragEntitySnap: null,
  isDraggingEndpoint: false,
  dragEndpointEntId: null,
  dragEndpointIdx: null,
  dragEndpointOrigX: null,
  dragEndpointOrigY: null,
  isDraggingDimOffset: false,
  dragDimId: null,
  hoveredId: null,
  isBoxSelecting: false,
  boxSelectStart: null,
  boxSelectRect: null,
  boxHoverIds: new Set(),
  polylinePoints: [],
  snapPoint: null,        // { x, y, type }
  coordInputActive: false,
  coordInputCallback: null,
  coordInputBuffer: '',   // for digit accumulation

  // Line-endpoint connections: track which line endpoints are connected to other entities
  connections: [],        // [{ lineId, endpoint: 'start'|'end', targetId }]

  // Arc tool state
  arcP1:        null,
  arcPhase:     0,
  arcDragId:    null,

  // Dimension tool state
  dimStep: 0,
  dimP1: null,
  dimP2: null,

  // Clipboard for copy/paste
  clipboard: null,
  imagesLocked: false,

  // ═══ GOST: Page format and stamp ═══
  pageFormat:      'A4',       // поточний формат
  pageOrientation: 'portrait', // 'portrait' або 'landscape'
  showFrame:       true,       // показувати рамку
  showStamp:       false,      // показувати штамп
  showPage:        true,       // показувати/ховати аркуш цілком (рамка+штамп+міліметрівка)
  paperGridVisible: true,      // міліметрівка на аркуші
  projects:        [],         // список відкритих проектів (вкладки)
  activeProjectIdx: 0,         // індекс активного проекту
  customPageW:     null,       // кастомна ширина
  customPageH:     null,       // кастомна висота
  stampData: {
    title:      '',    // Графа 1 — Найменування виробу
    docNumber:  '',    // Графа 2 — Позначення документа
    material:   '',    // Графа 3 — Матеріал деталі
    letter:     'Рќ',   // Графа 4 — Літера (Рќ — навчальне)
    mass:       '',    // Графа 5 — Маса
    scale:      '1:1', // Графа 6 — Масштаб
    sheetNum:   '1',   // Графа 7 — Номер аркуша
    sheetTotal: '1',   // Графа 8 — Кількість аркушів
    org:        '',    // Графа 9 — Назва організації
    developer:  '',    // Графа 11 — Розробив
    checker:    '',    // Графа 11 — Перевірив
    date:       '',    // Графа 13 — Дата
  },
};


// ═══════════════════════════════════════════════
// DOM ЕЛЕМЕНТИ
// ═══════════════════════════════════════════════
const viewport      = document.getElementById('viewport');
const gridCanvas    = document.getElementById('grid-canvas');
const drawingSvg    = document.getElementById('drawing-svg');
const entitiesLayer = document.getElementById('entities-layer');
const previewLayer  = document.getElementById('preview-layer');
const pageRect      = document.getElementById('page-rect');

const rulerH    = document.getElementById('ruler-h');
const rulerV    = document.getElementById('ruler-v');
const rulerHCtx = rulerH.getContext('2d');
const rulerVCtx = rulerV.getContext('2d');

const statusTool   = document.getElementById('status-tool');
const statusCoords = document.getElementById('status-coords');
const statusZoom   = document.getElementById('status-zoom');

const btnSelect    = document.getElementById('btn-select');
const btnLine      = document.getElementById('btn-line');
const btnRect      = document.getElementById('btn-rect');
const btnCircle    = document.getElementById('btn-circle');
const btnPolyline  = document.getElementById('btn-polyline');
const btnArc       = document.getElementById('btn-arc');
const btnDimension = document.getElementById('btn-dimension');
const btnHatch     = document.getElementById('btn-hatch');
const btnCenterline= document.getElementById('btn-centerline');
const btnInsertImage = document.getElementById('btn-insert-image') || document.getElementById('btn-add-image');
const btnUndo      = document.getElementById('btn-undo');
const btnRedo      = document.getElementById('btn-redo');
const btnSnap      = document.getElementById('btn-snap');
const btnGrid      = document.getElementById('btn-grid');
const btnPaperGrid = document.getElementById('btn-paper-grid');
const btnSave      = document.getElementById('btn-save');
const btnOpen      = document.getElementById('btn-open');
const btnExportSVG = document.getElementById('btn-export-svg');
const btnExportDXF = document.getElementById('btn-export-dxf');
const btnExportPNG = document.getElementById('btn-export-png');
const btnZoomFit   = document.getElementById('btn-zoomfit');
const btnClear     = document.getElementById('btn-clear');
const btnMirrorX   = document.getElementById('btn-mirror-x');
const btnMirrorY   = document.getElementById('btn-mirror-y');

// GOST: Page format, orientation, stamp, hatch, centerline
const selPageFormat    = document.getElementById('sel-page-format');
const btnOrientation   = document.getElementById('btn-orientation');
const btnStampEdit     = document.getElementById('btn-stamp-edit');
const btnStampToggle   = document.getElementById('btn-stamp-toggle');

const gridCtx = gridCanvas.getContext('2d');

// Properties Panel
const propsPanel = document.getElementById('props-panel');
const propsTitle = document.getElementById('props-title');
const propsBody  = document.getElementById('props-body');
document.getElementById('props-close').addEventListener('click', () => {
  propsPanel.style.display = 'none';
});

// Coordinate Input
const coordBox   = document.getElementById('coord-input-box');
const coordLabel = document.getElementById('coord-input-label');
const coordField = document.getElementById('coord-input-field');

localStorage.removeItem('chisel_templates');

coordField.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') {
    const v = parseFloat(coordField.value);
    if (!isNaN(v) && state.coordInputCallback) state.coordInputCallback(v);
    hideCoordInput();
  }
  if (e.key === 'Escape') {
    hideCoordInput();
    state.lineStart = null;
    state.polylinePoints = [];
    previewLayer.innerHTML = '';
  }
});

// ═══════════════════════════════════════════════
// SVG HELPERS
// ═══════════════════════════════════════════════

function makeSVGLine(x1, y1, x2, y2, stroke, width, dash) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  el.setAttribute('x1', x1.toFixed(2));
  el.setAttribute('y1', y1.toFixed(2));
  el.setAttribute('x2', x2.toFixed(2));
  el.setAttribute('y2', y2.toFixed(2));
  el.setAttribute('stroke', stroke);
  el.setAttribute('stroke-width', width);
  if (dash) el.setAttribute('stroke-dasharray', dash);
  el.setAttribute('stroke-linecap', 'butt');
  el.setAttribute('stroke-linejoin', 'miter');
  el.setAttribute('stroke-miterlimit', '10');
  el.setAttribute('vector-effect', 'non-scaling-stroke');
  return el;
}

// в"Ђв"Ђ Calculate arc from 3 points в"Ђв"Ђ
// p1 = start, ctrl = control point, p2 = end
function calcArcFromThreePoints(p1, ctrl, p2) {
  const chordDx  = p2.x - p1.x;
  const chordDy  = p2.y - p1.y;
  const chordLen = Math.hypot(chordDx, chordDy);

  if (chordLen < 0.001) return { isLine: true, r: Infinity, cx: 0, cy: 0, startAngle: 0, endAngle: 0, sweepFlag: 1 };

  // Sagitta (arrow height) = perpendicular distance from ctrl to chord line p1-p2
  const sagitta = Math.abs(
    (p2.y - p1.y) * ctrl.x - (p2.x - p1.x) * ctrl.y + p2.x * p1.y - p2.y * p1.x
  ) / chordLen;

  // If sagitta < 1mm — render as straight line
  const MIN_SAGITTA = 1.0;
  if (sagitta < MIN_SAGITTA) {
    return { isLine: true, r: Infinity, cx: 0, cy: 0, startAngle: 0, endAngle: 0, sweepFlag: 1 };
  }

  // Maximum radius = 5000mm. If r would exceed this — treat as line
  // r = (chordLen^2 / (8 * sagitta)) + sagitta / 2  (approximate for shallow arcs)
  const approxR = (chordLen * chordLen) / (8 * sagitta) + sagitta / 2;
  const MAX_RADIUS = 5000;
  if (approxR > MAX_RADIUS) {
    return { isLine: true, r: Infinity, cx: 0, cy: 0, startAngle: 0, endAngle: 0, sweepFlag: 1 };
  }

  // Compute circumcenter via perpendicular bisectors
  const ax = p1.x, ay = p1.y;
  const bx = ctrl.x, by = ctrl.y;
  const cx2 = p2.x, cy2 = p2.y;

  const D = 2 * (ax * (by - cy2) + bx * (cy2 - ay) + cx2 * (ay - by));
  if (Math.abs(D) < 1e-10) {
    return { isLine: true, r: Infinity, cx: 0, cy: 0, startAngle: 0, endAngle: 0, sweepFlag: 1 };
  }

  const a2 = ax * ax + ay * ay;
  const b2 = bx * bx + by * by;
  const c2 = cx2 * cx2 + cy2 * cy2;

  const ucx = (a2 * (by - cy2) + b2 * (cy2 - ay) + c2 * (ay - by)) / D;
  const ucy = (a2 * (cx2 - bx) + b2 * (ax - cx2) + c2 * (bx - ax)) / D;

  const r = Math.hypot(ax - ucx, ay - ucy);

  if (r > MAX_RADIUS || r < 0.001) {
    return { isLine: true, r: Infinity, cx: 0, cy: 0, startAngle: 0, endAngle: 0, sweepFlag: 1 };
  }

  const startAngle = Math.atan2(ay - ucy, ax - ucx) * 180 / Math.PI;
  const endAngle   = Math.atan2(cy2 - ucy, cx2 - ucx) * 180 / Math.PI;

  // Determine sweep direction: check which side ctrl is on
  // Cross product of (p2-p1) x (ctrl-p1)
  const cross = (p2.x - p1.x) * (ctrl.y - p1.y) - (p2.y - p1.y) * (ctrl.x - p1.x);
  const sweepFlag = cross > 0 ? 0 : 1;

  return {
    cx: ucx, cy: ucy, r,
    startAngle, endAngle,
    sweepFlag,
    isLine: false,
  };
}

function makeArcSVGPath(ent, stroke, width, dash) {
  // If isLine or r=Infinity в†' draw as line
  if (ent.isLine || !isFinite(ent.r)) {
    const p1x = ent.x1 !== undefined ? ent.x1 : ent.cx + ent.r * Math.cos(ent.startAngle);
    const p1y = ent.y1 !== undefined ? ent.y1 : ent.cy + ent.r * Math.sin(ent.startAngle);
    const p2x = ent.x2 !== undefined ? ent.x2 : ent.cx + ent.r * Math.cos(ent.endAngle);
    const p2y = ent.y2 !== undefined ? ent.y2 : ent.cy + ent.r * Math.sin(ent.endAngle);
    const p1 = worldToSVG(p1x, p1y);
    const p2 = worldToSVG(p2x, p2y);
    return makeSVGLine(p1.x, p1.y, p2.x, p2.y, stroke, width, dash || '');
  }

  // Determine start/end points (from x1/y1/x2/y2 if new format, or from angles if old format)
  let p1x, p1y, p2x, p2y;
  if (ent.x1 !== undefined && ent.y1 !== undefined) {
    p1x = ent.x1; p1y = ent.y1;
    p2x = ent.x2; p2y = ent.y2;
  } else {
    // Old format: compute from angles
    p1x = ent.cx + ent.r * Math.cos(ent.startAngle);
    p1y = ent.cy + ent.r * Math.sin(ent.startAngle);
    p2x = ent.cx + ent.r * Math.cos(ent.endAngle);
    p2y = ent.cy + ent.r * Math.sin(ent.endAngle);
  }

  const p1  = worldToSVG(p1x, p1y);
  const p2  = worldToSVG(p2x, p2y);
  const rPx = ent.r * effectiveZoom();
  const cSVG = worldToSVG(ent.cx, ent.cy);

  // Determine sweep-flag: recompute from ctrl point in WORLD coordinates
  // (NOT SVG coordinates — SVG has Y-axis flipped which inverts the cross product)
  let sweepFlag;
  if (ent.ctrl) {
    const crossWorld = (ent.x2 - ent.x1) * (ent.ctrl.y - ent.y1) -
                      (ent.y2 - ent.y1) * (ent.ctrl.x - ent.x1);
    // SVG Y-axis is flipped relative to world, so invert
    sweepFlag = crossWorld > 0 ? 0 : 1;
  } else if (ent.sweepFlag !== undefined && ent.sweepFlag !== null) {
    sweepFlag = ent.sweepFlag;
  } else {
    sweepFlag = 1;
  }

  // Compute largeArcFlag from sagitta (ctrl point distance from chord)
  // More reliable than angle math across coordinate systems
  let largeArc = 0;
  const chordLen = Math.hypot(ent.x2 - ent.x1, ent.y2 - ent.y1);
  if (ent.ctrl && chordLen > 0.001) {
    // Sagitta = perpendicular distance from ctrl to chord line
    const sagitta = Math.abs(
      (ent.y2 - ent.y1) * ent.ctrl.x -
      (ent.x2 - ent.x1) * ent.ctrl.y +
      ent.x2 * ent.y1 - ent.y2 * ent.x1
    ) / chordLen;
    largeArc = sagitta > ent.r ? 1 : 0;
  } else {
    // Fallback: use angle math in world coordinates
    const startA = Math.atan2(ent.y1 - ent.cy, ent.x1 - ent.cx);
    const endA   = Math.atan2(ent.y2 - ent.cy, ent.x2 - ent.cx);
    let diff = Math.abs(endA - startA);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    largeArc = diff > Math.PI ? 1 : 0;
  }

  const d =
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} ` +
    `A ${rPx.toFixed(2)} ${rPx.toFixed(2)} ` +
    `0 ${largeArc} ${sweepFlag} ` +
    `${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;

  const el = document.createElementNS('http://www.w3.org/2000/svg','path');
  el.setAttribute('d', d);
  el.setAttribute('stroke', stroke);
  el.setAttribute('stroke-width', width);
  el.setAttribute('fill', 'none');
  if (dash) el.setAttribute('stroke-dasharray', dash);
  el.setAttribute('stroke-linecap', 'butt');
  el.setAttribute('stroke-linejoin', 'miter');
  el.setAttribute('stroke-miterlimit', '10');
  el.setAttribute('vector-effect', 'non-scaling-stroke');
  return el;
}

// ═══════════════════════════════════════════════
// HIT-TESTING
// ═══════════════════════════════════════════════

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt((px - (x1 + t * dx)) ** 2 + (py - (y1 + t * dy)) ** 2);
}

function isAngleInArc(angle, startA, endA, sweepFlag) {
  const norm = a => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const a = norm(angle);
  const s = norm(startA);
  const e = norm(endA);

  if (sweepFlag === 1) {
    // Clockwise in SVG (increasing angle in standard math)
    if (s <= e) return a >= s && a <= e;
    else        return a >= s || a <= e; // wraps around 0
  } else {
    // Counter-clockwise
    if (s >= e) return a <= s && a >= e;
    else        return a <= s || a >= e;
  }
}

function hitTest(ent, wx, wy) {
  const tol = HIT_TOLERANCE / effectiveZoom();
  if (ent.type === 'line' || ent.type === 'centerline') {
    return distToSegment(wx, wy, ent.x1, ent.y1, ent.x2, ent.y2) < tol;
  }
  if (ent.type === 'rect') {
    const x1 = Math.min(ent.x1, ent.x2), x2 = Math.max(ent.x1, ent.x2);
    const y1 = Math.min(ent.y1, ent.y2), y2 = Math.max(ent.y1, ent.y2);
    return (
      distToSegment(wx, wy, x1, y1, x2, y1) < tol ||
      distToSegment(wx, wy, x2, y1, x2, y2) < tol ||
      distToSegment(wx, wy, x2, y2, x1, y2) < tol ||
      distToSegment(wx, wy, x1, y2, x1, y1) < tol
    );
  }
  if (ent.type === 'circle') {
    const d = Math.sqrt((wx - ent.cx) ** 2 + (wy - ent.cy) ** 2);
    return Math.abs(d - ent.r) < tol;
  }
  if (ent.type === 'polyline') {
    for (let i = 0; i < ent.points.length - 1; i++) {
      if (distToSegment(wx, wy,
        ent.points[i].x, ent.points[i].y,
        ent.points[i+1].x, ent.points[i+1].y) < tol) return true;
    }
    return false;
  }
  if (ent.type === 'arc') {
    if (ent.isLine || !isFinite(ent.r)) {
      return distToSegment(wx, wy, ent.x1, ent.y1, ent.x2, ent.y2) < tol;
    }

    const dx   = wx - ent.cx;
    const dy   = wy - ent.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (Math.abs(dist - ent.r) > tol * 2) return false;

    // Check if point angle is within arc sweep
    if (!ent.ctrl) return true;

    const crossWorld = (ent.x2 - ent.x1) * (ent.ctrl.y - ent.y1) -
                       (ent.y2 - ent.y1) * (ent.ctrl.x - ent.x1);
    const sweepFlag = crossWorld > 0 ? 0 : 1;

    const hitAngle = Math.atan2(dy, dx);
    const startAngle = Math.atan2(ent.y1 - ent.cy, ent.x1 - ent.cx);
    const endAngle   = Math.atan2(ent.y2 - ent.cy, ent.x2 - ent.cx);

    return isAngleInArc(hitAngle, startAngle, endAngle, sweepFlag);
  }
  if (ent.type === 'dimension') {
    return hitTestDimension(ent, wx, wy);
  }
  if (ent.type === 'image') {
    if (ent.locked) return false;
    const w2 = ent.w || 0, h2 = ent.h || 0;
    return wx >= ent.x && wx <= ent.x + w2 &&
           wy >= ent.y && wy <= ent.y + h2;
  }
  if (ent.type === 'centerline') {
    return distToSegment(wx, wy, ent.x1, ent.y1, ent.x2, ent.y2) < tol;
  }
  return false;
}

// Хелпер: відстань від точки до відрізка
function distPointToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const len2 = abx*abx + aby*aby;
  if (len2 < 0.0001) return Math.sqrt((px-ax)**2 + (py-ay)**2);
  const t = Math.max(0, Math.min(1, ((px-ax)*abx + (py-ay)*aby) / len2));
  return Math.sqrt((px - (ax + t*abx))**2 + (py - (ay + t*aby))**2);
}

// Hit test для dimension (підтримує aligned)
function hitTestDimension(ent, wx, wy) {
  const tol = HIT_TOLERANCE / effectiveZoom() * 2;

  const dx = ent.x2 - ent.x1;
  const dy = ent.y2 - ent.y1;
  const entLen = Math.sqrt(dx*dx + dy*dy);
  const ux = entLen > 0 ? dx/entLen : 1;
  const uy = entLen > 0 ? dy/entLen : 0;
  const nx = -uy, ny = ux;

  let d1w, d2w;

  if (ent.dimType === 'aligned') {
    d1w = { x: ent.x1 + nx * ent.offset, y: ent.y1 + ny * ent.offset };
    d2w = { x: ent.x2 + nx * ent.offset, y: ent.y2 + ny * ent.offset };
  } else {
    const isHoriz = Math.abs(dx) >= Math.abs(dy);
    if (isHoriz) {
      d1w = { x: ent.x1, y: ent.y1 + ent.offset };
      d2w = { x: ent.x2, y: ent.y1 + ent.offset };
    } else {
      d1w = { x: ent.x1 + ent.offset, y: ent.y1 };
      d2w = { x: ent.x1 + ent.offset, y: ent.y2 };
    }
  }

  return distPointToSegment(wx, wy, d1w.x, d1w.y, d2w.x, d2w.y) < tol;
}

function moveEntity(ent, dx, dy) {
  if (ent.type === 'line' || ent.type === 'rect') {
    ent.x1 += dx; ent.y1 += dy; ent.x2 += dx; ent.y2 += dy;
  } else if (ent.type === 'circle') {
    ent.cx += dx; ent.cy += dy;
  } else if (ent.type === 'polyline') {
    ent.points = ent.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
  } else if (ent.type === 'arc') {
    ent.x1 += dx; ent.y1 += dy;
    ent.x2 += dx; ent.y2 += dy;
    ent.cx += dx; ent.cy += dy;
    if (ent.ctrl) { ent.ctrl.x += dx; ent.ctrl.y += dy; }
  } else if (ent.type === 'dimension') {
    ent.x1 += dx; ent.y1 += dy; ent.x2 += dx; ent.y2 += dy;
  } else if (ent.type === 'image') {
    ent.x += dx; ent.y += dy;
  }
}

function isEndpointConnected(entId, px, py) {
  const TOL = 0.5;
  for (const other of state.entities) {
    if (other.id === entId) continue;
    if (other.type !== 'line' && other.type !== 'centerline' && other.type !== 'arc') continue;
    if (Math.hypot(other.x1 - px, other.y1 - py) < TOL) return true;
    if (Math.hypot(other.x2 - px, other.y2 - py) < TOL) return true;
  }
  return false;
}

// Legacy connection builder kept for reference
function buildLineConnectionsLegacy(lineId, x1, y1, x2, y2) {
  const TOL = 2.0; // достатньо для після-trim координат
  const conns = [];
  for (const other of state.entities) {
    if (other.id === lineId) continue;
    if (other.type !== 'line' && other.type !== 'centerline' && other.type !== 'arc' && other.type !== 'rect') continue;

    const otherX1 = other.x1 ?? null;
    const otherY1 = other.y1 ?? null;
    const otherX2 = other.x2 ?? null;
    const otherY2 = other.y2 ?? null;

    // Skip entities without endpoint coords (e.g. circles without x1/y1/x2/y2)
    if (otherX1 === null || otherY1 === null) continue;

    // Check if new line start is near other entity's endpoint
    if (Math.hypot(otherX1 - x1, otherY1 - y1) < TOL) {
      conns.push({ lineId, endpoint: 'start', targetId: other.id });
      // Reverse connection: other entity also connects to this line
      if (other.type === 'line' || other.type === 'centerline') {
        conns.push({ lineId: other.id, endpoint: 'start', targetId: lineId });
      }
    }
    if (Math.hypot(otherX2 - x1, otherY2 - y1) < TOL) {
      conns.push({ lineId, endpoint: 'start', targetId: other.id });
      if (other.type === 'line' || other.type === 'centerline') {
        conns.push({ lineId: other.id, endpoint: 'end', targetId: lineId });
      }
    }
    // Check if new line end is near other entity's endpoint
    if (Math.hypot(otherX1 - x2, otherY1 - y2) < TOL) {
      conns.push({ lineId, endpoint: 'end', targetId: other.id });
      if (other.type === 'line' || other.type === 'centerline') {
        conns.push({ lineId: other.id, endpoint: 'start', targetId: lineId });
      }
    }
    if (Math.hypot(otherX2 - x2, otherY2 - y2) < TOL) {
      conns.push({ lineId, endpoint: 'end', targetId: other.id });
      if (other.type === 'line' || other.type === 'centerline') {
        conns.push({ lineId: other.id, endpoint: 'end', targetId: lineId });
      }
    }
  }
  return conns;
}
// Active endpoint-only connection builder used after drag/snap updates
function buildLineConnections(lineId, x1, y1, x2, y2) {
  const TOL = 0.5; // only tight endpoint-to-endpoint matches should create connections
  const conns = [];

  for (const other of state.entities) {
    if (other.id === lineId) continue;
    if (other.type !== 'line' && other.type !== 'centerline' && other.type !== 'arc' && other.type !== 'rect') continue;

    const otherX1 = other.x1 ?? null;
    const otherY1 = other.y1 ?? null;
    const otherX2 = other.x2 ?? null;
    const otherY2 = other.y2 ?? null;

    if (otherX1 === null || otherY1 === null) continue;

    const s1o1 = Math.hypot(x1 - otherX1, y1 - otherY1) < TOL;
    const s1o2 = otherX2 !== null && otherY2 !== null && Math.hypot(x1 - otherX2, y1 - otherY2) < TOL;
    const s2o1 = Math.hypot(x2 - otherX1, y2 - otherY1) < TOL;
    const s2o2 = otherX2 !== null && otherY2 !== null && Math.hypot(x2 - otherX2, y2 - otherY2) < TOL;

    if (s1o1 || s1o2) {
      conns.push({ lineId, endpoint: 'start', targetId: other.id });
      if (other.type === 'line' || other.type === 'centerline') {
        conns.push({ lineId: other.id, endpoint: s1o1 ? 'start' : 'end', targetId: lineId });
      }
    }

    if (s2o1 || s2o2) {
      conns.push({ lineId, endpoint: 'end', targetId: other.id });
      if (other.type === 'line' || other.type === 'centerline') {
        conns.push({ lineId: other.id, endpoint: s2o1 ? 'start' : 'end', targetId: lineId });
      }
    }
  }

  return conns;
}

function rebuildLineConnections(lineIds) {
  const ids = new Set();

  lineIds.forEach(id => {
    const ent = state.entities.find(e => e.id === id);
    if (!ent) return;
    if (ent.type !== 'line' && ent.type !== 'centerline') return;
    ids.add(id);
  });

  if (ids.size === 0) return;

  state.connections = state.connections.filter(
    c => !ids.has(c.lineId) && !ids.has(c.targetId)
  );

  ids.forEach(id => {
    const ent = state.entities.find(e => e.id === id);
    if (!ent) return;
    state.connections.push(...buildLineConnections(ent.id, ent.x1, ent.y1, ent.x2, ent.y2));
  });
}

// Move all line endpoints that are connected to a moved entity
function moveConnectedEndpoints(movedEntId, dx, dy) {
  if (dx === 0 && dy === 0) return;
  state.connections = state.connections.filter(conn => {
    // Remove stale connections (line or target no longer exists)
    const line = state.entities.find(e => e.id === conn.lineId);
    const target = state.entities.find(e => e.id === conn.targetId);
    if (!line || !target) return false;

    if (conn.targetId === movedEntId) {
      // Move the line endpoint along with the target entity
      if (conn.endpoint === 'start') { line.x1 += dx; line.y1 += dy; }
      else { line.x2 += dx; line.y2 += dy; }
    }
    return true;
  });
}

function updateLinkedDimensions(movedEnt, dx, dy) {
  if (!movedEnt || movedEnt.type === 'dimension') return;
  // Allow dx=0/dy=0 calls — still need to clear text cache when entity changes

  state.entities.forEach(dim => {
    if (dim.type !== 'dimension') return;
    if (!dim.anchoredTo || dim.anchoredTo.length === 0) return;

    let changed = false;

    dim.anchoredTo.forEach(anchor => {
      const anchoredEnt = state.entities.find(e => e.id === anchor.entityId);
      if (!anchoredEnt) return;

      if (anchor.entityId === movedEnt.id) {
        if (dx !== 0 || dy !== 0) {
          if (anchor.end === 'p1') { dim.x1 += dx; dim.y1 += dy; changed = true; }
          if (anchor.end === 'p2') { dim.x2 += dx; dim.y2 += dy; changed = true; }
        } else {
          if (anchor.end === 'p1') { dim.x1 = anchoredEnt.x1; dim.y1 = anchoredEnt.y1; changed = true; }
          if (anchor.end === 'p2') { dim.x2 = anchoredEnt.x2; dim.y2 = anchoredEnt.y2; changed = true; }
        }
      } else {
        if (anchor.end === 'p1') { dim.x1 = anchoredEnt.x1; dim.y1 = anchoredEnt.y1; changed = true; }
        if (anchor.end === 'p2') { dim.x2 = anchoredEnt.x2; dim.y2 = anchoredEnt.y2; changed = true; }
      }
    });

    // Always clear text cache if anchored — so value updates on next render
    if (changed) dim.text = '';
  });
}

function refreshArcGeometry(ent) {
  if (!ent || ent.type !== 'arc' || !ent.ctrl) return;

  const data = calcArcFromThreePoints(
    { x: ent.x1, y: ent.y1 },
    ent.ctrl,
    { x: ent.x2, y: ent.y2 }
  );

  if (data && !data.isLine) {
    ent.cx = data.cx;
    ent.cy = data.cy;
    ent.r = data.r;
    ent.startAngle = data.startAngle;
    ent.endAngle = data.endAngle;
    ent.isLine = false;
    return;
  }

  ent.isLine = true;
  delete ent.cx;
  delete ent.cy;
  delete ent.r;
  delete ent.startAngle;
  delete ent.endAngle;
}

function stretchAnchoredEntity(anchorX, anchorY, dx, dy) {
  const TOL = 0.5;

  state.entities.forEach(ent => {
    if (ent.type === 'dimension') return;

    if (ent.type === 'line' || ent.type === 'centerline' || ent.type === 'arc') {
      const prevSnaps = getSnapPoints(ent);
      let moved = false;

      if (Math.hypot(ent.x1 - anchorX, ent.y1 - anchorY) < TOL) {
        ent.x1 += dx;
        ent.y1 += dy;
        if (ent.type === 'arc' && ent.ctrl) refreshArcGeometry(ent);
        moved = true;
      }
      if (Math.hypot(ent.x2 - anchorX, ent.y2 - anchorY) < TOL) {
        ent.x2 += dx;
        ent.y2 += dy;
        if (ent.type === 'arc' && ent.ctrl) refreshArcGeometry(ent);
        moved = true;
      }

      if (moved) updateLinkedDimensions(ent, 0, 0);
    }
  });
}

function applyDimensionResize(dim, newLen) {
  if (typeof solveAndUpdateDimension === 'function' && dim.constraintId) {
    const solved = solveAndUpdateDimension(newLen, dim);
    if (solved) return;
  }

  const TOL = 0.5;
  const oldP1 = { x: dim.x1, y: dim.y1 };
  const oldP2 = { x: dim.x2, y: dim.y2 };

  let p1Anchored = false;
  let p2Anchored = false;

  state.entities.forEach(ent => {
    if (ent.type === 'dimension') return;
    const snaps = getSnapPoints(ent);
    snaps.forEach(sp => {
      if (Math.hypot(sp.x - oldP1.x, sp.y - oldP1.y) < TOL) p1Anchored = true;
      if (Math.hypot(sp.x - oldP2.x, sp.y - oldP2.y) < TOL) p2Anchored = true;
    });
  });

  const dx = oldP2.x - oldP1.x;
  const dy = oldP2.y - oldP1.y;
  const curLen = Math.hypot(dx, dy) || 1;
  const ux = dx / curLen;
  const uy = dy / curLen;
  const delta = newLen - curLen;

  if (p1Anchored && p2Anchored) {
    stretchAnchoredEntity(oldP1.x, oldP1.y, -ux * delta / 2, -uy * delta / 2);
    stretchAnchoredEntity(oldP2.x, oldP2.y, ux * delta / 2, uy * delta / 2);
    dim.x1 = oldP1.x - ux * delta / 2;
    dim.y1 = oldP1.y - uy * delta / 2;
    dim.x2 = oldP2.x + ux * delta / 2;
    dim.y2 = oldP2.y + uy * delta / 2;
  } else if (p1Anchored && !p2Anchored) {
    stretchAnchoredEntity(oldP2.x, oldP2.y, ux * delta, uy * delta);
    dim.x2 = oldP2.x + ux * delta;
    dim.y2 = oldP2.y + uy * delta;
  } else if (!p1Anchored && p2Anchored) {
    stretchAnchoredEntity(oldP1.x, oldP1.y, -ux * delta, -uy * delta);
    dim.x1 = oldP1.x - ux * delta;
    dim.y1 = oldP1.y - uy * delta;
  } else {
    const cx = (oldP1.x + oldP2.x) / 2;
    const cy = (oldP1.y + oldP2.y) / 2;
    dim.x1 = cx - ux * newLen / 2;
    dim.y1 = cy - uy * newLen / 2;
    dim.x2 = cx + ux * newLen / 2;
    dim.y2 = cy + uy * newLen / 2;
  }

  dim.text = '';
}

function findNearestEndpoint(px, py, excludeId, maxDistMm) {
  let best = null;
  let bestDist = maxDistMm;

  state.entities.forEach(other => {
    if (other.id === excludeId) return;
    if (other.type !== 'line' && other.type !== 'centerline' && other.type !== 'arc') return;

    const d1 = Math.hypot(other.x1 - px, other.y1 - py);
    const d2 = Math.hypot(other.x2 - px, other.y2 - py);

    if (d1 < bestDist) {
      bestDist = d1;
      best = { x: other.x1, y: other.y1 };
    }
    if (d2 < bestDist) {
      bestDist = d2;
      best = { x: other.x2, y: other.y2 };
    }
  });

  return best;
}

function entityInBox(ent, r) {
  function segCrossesBox(x1, y1, x2, y2) {
    const inB = (x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (inB(x1, y1) || inB(x2, y2)) return true;

    function segsIntersect(ax, ay, bx, by, cx, cy, dx2, dy2) {
      const d1x = bx - ax;
      const d1y = by - ay;
      const d2x = dx2 - cx;
      const d2y = dy2 - cy;
      const cr = d1x * d2y - d1y * d2x;
      if (Math.abs(cr) < 1e-10) return false;
      const t = ((cx - ax) * d2y - (cy - ay) * d2x) / cr;
      const u = ((cx - ax) * d1y - (cy - ay) * d1x) / cr;
      return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }

    const { x, y, w, h } = r;
    return segsIntersect(x1, y1, x2, y2, x, y, x + w, y) ||
           segsIntersect(x1, y1, x2, y2, x + w, y, x + w, y + h) ||
           segsIntersect(x1, y1, x2, y2, x + w, y + h, x, y + h) ||
           segsIntersect(x1, y1, x2, y2, x, y + h, x, y);
  }

  const inB = (x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

  if (ent.type === 'line' || ent.type === 'centerline') {
    return segCrossesBox(ent.x1, ent.y1, ent.x2, ent.y2);
  }
  if (ent.type === 'arc') {
    return segCrossesBox(ent.x1, ent.y1, ent.x2, ent.y2) || (isFinite(ent.cx) && inB(ent.cx, ent.cy));
  }
  if (ent.type === 'dimension') {
    return segCrossesBox(ent.x1, ent.y1, ent.x2, ent.y2);
  }
  if (ent.type === 'rect') {
    return inB(ent.x1, ent.y1) || inB(ent.x2, ent.y2) ||
      segCrossesBox(ent.x1, ent.y1, ent.x2, ent.y1) ||
      segCrossesBox(ent.x2, ent.y1, ent.x2, ent.y2) ||
      segCrossesBox(ent.x2, ent.y2, ent.x1, ent.y2) ||
      segCrossesBox(ent.x1, ent.y2, ent.x1, ent.y1);
  }
  if (ent.type === 'circle') {
    return inB(ent.cx, ent.cy) ||
      Math.hypot(
        Math.max(r.x, Math.min(r.x + r.w, ent.cx)) - ent.cx,
        Math.max(r.y, Math.min(r.y + r.h, ent.cy)) - ent.cy
      ) <= ent.r;
  }

  return false;
}

// Warn if a freshly created dimension overlaps with an existing one.
function checkDimensionOverlap(newDim) {
  const TOL = 3; // mm
  const conflicts = state.entities.filter(ent => {
    if (ent.type !== 'dimension') return false;
    if (ent.id === newDim.id) return false;
    const sameLine =
      (Math.abs(ent.x1 - newDim.x1) < TOL && Math.abs(ent.x2 - newDim.x2) < TOL) ||
      (Math.abs(ent.y1 - newDim.y1) < TOL && Math.abs(ent.y2 - newDim.y2) < TOL);
    const sameOffset = Math.abs((ent.offset || 0) - (newDim.offset || 0)) < TOL;
    return sameLine && sameOffset;
  });
  if (conflicts.length > 0) {
    showStatus('Розмір може перекриватись Р· іншим. Змініть відступ Сѓ панелі властивостей.', 4000);
  }
}

// ═══════════════════════════════════════════════
// SNAP
// ═══════════════════════════════════════════════

function snapToGrid(x, y, shiftHeld) {
  if (!state.snapEnabled || shiftHeld) return { x, y };

  const ez = effectiveZoom();
  // If 1mm grid is visible (>=3 px) в†' snap to 1mm; else snap to 10mm
  const snapStep = (ez >= 3) ? 1 : 10;

  return {
    x: Math.round(x / snapStep) * snapStep,
    y: Math.round(y / snapStep) * snapStep,
  };
}

function getSnapPoints(ent) {
  const pts = [];

  if (ent.type === 'line') {
    // Endpoints
    pts.push({ x: ent.x1, y: ent.y1, type: 'endpoint' });
    pts.push({ x: ent.x2, y: ent.y2, type: 'endpoint' });
    // Midpoint
    pts.push({ x: (ent.x1 + ent.x2) / 2, y: (ent.y1 + ent.y2) / 2, type: 'midpoint' });
    // Quarter points (25% and 75%)
    pts.push({ x: ent.x1 + (ent.x2 - ent.x1) * 0.25, y: ent.y1 + (ent.y2 - ent.y1) * 0.25, type: 'midpoint' });
    pts.push({ x: ent.x1 + (ent.x2 - ent.x1) * 0.75, y: ent.y1 + (ent.y2 - ent.y1) * 0.75, type: 'midpoint' });
  }

  else if (ent.type === 'rect') {
    const x1 = Math.min(ent.x1, ent.x2), x2 = Math.max(ent.x1, ent.x2);
    const y1 = Math.min(ent.y1, ent.y2), y2 = Math.max(ent.y1, ent.y2);
    // 4 corners
    pts.push({ x: x1, y: y1, type: 'endpoint' });
    pts.push({ x: x2, y: y1, type: 'endpoint' });
    pts.push({ x: x2, y: y2, type: 'endpoint' });
    pts.push({ x: x1, y: y2, type: 'endpoint' });
    // 4 edge midpoints
    pts.push({ x: (x1+x2)/2, y: y1,        type: 'midpoint' });
    pts.push({ x: (x1+x2)/2, y: y2,        type: 'midpoint' });
    pts.push({ x: x1,        y: (y1+y2)/2, type: 'midpoint' });
    pts.push({ x: x2,        y: (y1+y2)/2, type: 'midpoint' });
    // Center
    pts.push({ x: (x1+x2)/2, y: (y1+y2)/2, type: 'center' });
  }

  else if (ent.type === 'circle') {
    // Center
    pts.push({ x: ent.cx, y: ent.cy, type: 'center' });
    // 4 cardinal points
    pts.push({ x: ent.cx + ent.r, y: ent.cy,        type: 'endpoint' });
    pts.push({ x: ent.cx - ent.r, y: ent.cy,        type: 'endpoint' });
    pts.push({ x: ent.cx,         y: ent.cy + ent.r, type: 'endpoint' });
    pts.push({ x: ent.cx,         y: ent.cy - ent.r, type: 'endpoint' });
    // 4 diagonal points (45В°)
    const d45 = ent.r * Math.cos(Math.PI / 4);
    pts.push({ x: ent.cx + d45, y: ent.cy + d45, type: 'midpoint' });
    pts.push({ x: ent.cx - d45, y: ent.cy + d45, type: 'midpoint' });
    pts.push({ x: ent.cx + d45, y: ent.cy - d45, type: 'midpoint' });
    pts.push({ x: ent.cx - d45, y: ent.cy - d45, type: 'midpoint' });
  }

  else if (ent.type === 'polyline') {
    // All vertices
    ent.points.forEach(p => {
      pts.push({ x: p.x, y: p.y, type: 'endpoint' });
    });
    // Segment midpoints
    for (let i = 0; i < ent.points.length - 1; i++) {
      pts.push({
        x: (ent.points[i].x + ent.points[i+1].x) / 2,
        y: (ent.points[i].y + ent.points[i+1].y) / 2,
        type: 'midpoint'
      });
    }
  }

  else if (ent.type === 'arc') {
    // Start and end points
    pts.push({ x: ent.x1, y: ent.y1, type: 'endpoint' });
    pts.push({ x: ent.x2, y: ent.y2, type: 'endpoint' });
    // Center
    if (ent.cx !== undefined) {
      pts.push({ x: ent.cx, y: ent.cy, type: 'center' });
    }
    // Arc midpoint
    if (ent.startAngle !== undefined && ent.endAngle !== undefined) {
      let sweep = ent.endAngle - ent.startAngle;
      if (sweep < 0) sweep += Math.PI * 2;
      const midAngle = ent.startAngle + sweep / 2;
      pts.push({
        x: ent.cx + ent.r * Math.cos(midAngle),
        y: ent.cy + ent.r * Math.sin(midAngle),
        type: 'midpoint'
      });
    }
  }

  else if (ent.type === 'dimension') {
    pts.push({ x: ent.x1, y: ent.y1, type: 'endpoint' });
    pts.push({ x: ent.x2, y: ent.y2, type: 'endpoint' });
    pts.push({ x: (ent.x1 + ent.x2) / 2, y: (ent.y1 + ent.y2) / 2, type: 'midpoint' });
  }

  return pts;
}

function findObjectSnap(wx, wy) {
  const snapRadMM = SNAP_RADIUS_PX / effectiveZoom();

  // Priority: endpoint > center > midpoint
  const priority = { endpoint: 0, center: 1, midpoint: 2 };

  let best = null;
  let bestDist = snapRadMM;
  let bestPriority = 99;

  for (const ent of state.entities) {
    for (const pt of getSnapPoints(ent)) {
      const d = Math.sqrt((wx - pt.x) ** 2 + (wy - pt.y) ** 2);
      const p = priority[pt.type] ?? 3;

      // Pick closest, but prefer higher priority types
      if (d < bestDist || (d < bestDist * 1.2 && p < bestPriority)) {
        bestDist     = d;
        bestPriority = p;
        best = { x: pt.x, y: pt.y, type: pt.type };
      }
    }
  }
  return best;
}

function getWorkingPoint(clientX, clientY, shiftHeld) {
  const raw = screenToWorld(clientX, clientY);

  // Shift = force object snap with an enlarged search radius so the
  // user can always latch onto a feature, even when grid snap would
  // otherwise win.
  if (shiftHeld) {
    const objSnap = findObjectSnap(raw.x, raw.y);
    if (objSnap) { state.snapPoint = objSnap; return { x: objSnap.x, y: objSnap.y }; }
    state.snapPoint = null;
    return { x: raw.x, y: raw.y }; // Shift bypasses grid as well
  }

  // Normal: object snap has priority over grid snap.
  if (state.snapEnabled) {
    const objSnap = findObjectSnap(raw.x, raw.y);
    if (objSnap) { state.snapPoint = objSnap; return { x: objSnap.x, y: objSnap.y }; }
  }

  state.snapPoint = null;
  return snapToGrid(raw.x, raw.y, shiftHeld);
}

function showSnapMarker(svgX, svgY, snapType) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.classList.add('snap-marker');

  if (snapType === 'endpoint') {
    // Orange square 10×10 with cross inside
    const size = 10;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x',      svgX - size/2);
    rect.setAttribute('y',      svgY - size/2);
    rect.setAttribute('width',  size);
    rect.setAttribute('height', size);
    rect.setAttribute('fill',   'none');
    rect.setAttribute('stroke', '#ff6600');
    rect.setAttribute('stroke-width', '1.5');
    g.appendChild(rect);

    // Cross inside
    const cross1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    cross1.setAttribute('x1', svgX - 3); cross1.setAttribute('y1', svgY);
    cross1.setAttribute('x2', svgX + 3); cross1.setAttribute('y2', svgY);
    cross1.setAttribute('stroke', '#ff6600');
    cross1.setAttribute('stroke-width', '1');
    g.appendChild(cross1);

    const cross2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    cross2.setAttribute('x1', svgX); cross2.setAttribute('y1', svgY - 3);
    cross2.setAttribute('x2', svgX); cross2.setAttribute('y2', svgY + 3);
    cross2.setAttribute('stroke', '#ff6600');
    cross2.setAttribute('stroke-width', '1');
    g.appendChild(cross2);

  } else if (snapType === 'midpoint') {
    // Yellow triangle
    const s = 8;
    const tri = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    tri.setAttribute('points',
      `${svgX},${svgY - s} ${svgX + s},${svgY + s} ${svgX - s},${svgY + s}`
    );
    tri.setAttribute('fill',         'none');
    tri.setAttribute('stroke',       '#ffcc00');
    tri.setAttribute('stroke-width', '1.5');
    g.appendChild(tri);

  } else if (snapType === 'center') {
    // Blue circle + cross
    const circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circ.setAttribute('cx',           svgX);
    circ.setAttribute('cy',           svgY);
    circ.setAttribute('r',            7);
    circ.setAttribute('fill',         'none');
    circ.setAttribute('stroke',       '#00aaff');
    circ.setAttribute('stroke-width', '1.5');
    g.appendChild(circ);

    // Cross
    [[-5,0,5,0],[0,-5,0,5]].forEach(([x1,y1,x2,y2]) => {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', svgX + x1); l.setAttribute('y1', svgY + y1);
      l.setAttribute('x2', svgX + x2); l.setAttribute('y2', svgY + y2);
      l.setAttribute('stroke', '#00aaff');
      l.setAttribute('stroke-width', '1');
      g.appendChild(l);
    });

  } else {
    // Grid snap — blue cross
    const s = SNAP_CROSS;
    [[-s,0,s,0],[0,-s,0,s]].forEach(([x1,y1,x2,y2]) => {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', svgX + x1); l.setAttribute('y1', svgY + y1);
      l.setAttribute('x2', svgX + x2); l.setAttribute('y2', svgY + y2);
      l.setAttribute('stroke',       '#0066cc');
      l.setAttribute('stroke-width', '1');
      g.appendChild(l);
    });
  }
  return g;
}

// ═══════════════════════════════════════════════
// КОНВЕРТАЦІЯ КООРДИНАТ
// ═══════════════════════════════════════════════

function effectiveZoom() { return state.zoom * BASE_ZOOM; }

function screenToWorld(clientX, clientY) {
  const rect = viewport.getBoundingClientRect();
  const vx = clientX - rect.left, vy = clientY - rect.top;
  const ez = effectiveZoom();
  return { x: (vx - state.panX) / ez, y: (vy - state.panY) / ez };
}

function worldToSVG(wx, wy) {
  const ez = effectiveZoom();
  let x = wx * ez + state.panX;
  let y = wy * ez + state.panY;
  // Clamp to prevent huge SVG coords that lock up the renderer at extreme zoom
  const LIMIT = 100000;
  if (x < -LIMIT) x = -LIMIT; else if (x > LIMIT) x = LIMIT;
  if (y < -LIMIT) y = -LIMIT; else if (y > LIMIT) y = LIMIT;
  return { x, y };
}

// Coarse entity bounding box (in world/mm) used for viewport culling.
function getEntityBBox(ent) {
  if (!ent) return null;
  if (ent.type === 'line' || ent.type === 'rect' || ent.type === 'dimension') {
    const minX = Math.min(ent.x1, ent.x2), maxX = Math.max(ent.x1, ent.x2);
    const minY = Math.min(ent.y1, ent.y2), maxY = Math.max(ent.y1, ent.y2);
    return { minX, minY, maxX, maxY };
  }
  if (ent.type === 'circle') {
    return { minX: ent.cx - ent.r, minY: ent.cy - ent.r,
             maxX: ent.cx + ent.r, maxY: ent.cy + ent.r };
  }
  if (ent.type === 'arc') {
    return { minX: ent.cx - ent.r, minY: ent.cy - ent.r,
             maxX: ent.cx + ent.r, maxY: ent.cy + ent.r };
  }
  if (ent.type === 'polyline' && ent.points && ent.points.length) {
    let mnX = Infinity, mnY = Infinity, mxX = -Infinity, mxY = -Infinity;
    for (const p of ent.points) {
      if (p.x < mnX) mnX = p.x; if (p.x > mxX) mxX = p.x;
      if (p.y < mnY) mnY = p.y; if (p.y > mxY) mxY = p.y;
    }
    return { minX: mnX, minY: mnY, maxX: mxX, maxY: mxY };
  }
  if (ent.type === 'image') {
    return { minX: ent.x, minY: ent.y,
             maxX: ent.x + (ent.w || 0), maxY: ent.y + (ent.h || 0) };
  }
  if (ent.type === 'centerline') {
    const minX = Math.min(ent.x1, ent.x2), maxX = Math.max(ent.x1, ent.x2);
    const minY = Math.min(ent.y1, ent.y2), maxY = Math.max(ent.y1, ent.y2);
    return { minX, minY, maxX, maxY };
  }
  return null;
}

function isEntityVisible(ent) {
  const bbox = getEntityBBox(ent);
  if (!bbox) return true; // render everything we can't bound
  const rect = drawingSvg ? drawingSvg.getBoundingClientRect() : null;
  if (!rect) return true;
  const margin = 500;
  const tl = worldToSVG(bbox.minX, bbox.minY);
  const br = worldToSVG(bbox.maxX, bbox.maxY);
  const minX = Math.min(tl.x, br.x), maxX = Math.max(tl.x, br.x);
  const minY = Math.min(tl.y, br.y), maxY = Math.max(tl.y, br.y);
  return !(maxX < -margin || minX > rect.width + margin ||
           maxY < -margin || minY > rect.height + margin);
}

// ═══════════════════════════════════════════════
// RULERS
// ═══════════════════════════════════════════════

function niceRulerStep(ez) {
  const minPx = 40, rawMM = minPx / ez;
  const mag = Math.pow(10, Math.floor(Math.log10(rawMM)));
  const norm = rawMM / mag;
  let nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * mag;
}

function drawRulerH() {
  const bounds = rulerH.getBoundingClientRect();
  const w = bounds.width, h = 24;
  if (w <= 0) return;
  const dpr = window.devicePixelRatio || 1;
  rulerH.width = Math.round(w*dpr); rulerH.height = Math.round(h*dpr);
  rulerH.style.width = w+'px'; rulerH.style.height = h+'px';
  const ctx = rulerHCtx;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle = RULER_BG; ctx.fillRect(0,0,w,h);
  const ez = effectiveZoom(), step = niceRulerStep(ez), stepPx = step*ez;
  const startMM = Math.floor(-state.panX/ez/step)*step;
  ctx.font='9px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='top';
  for (let mm=startMM; ; mm+=step) {
    const px = mm*ez+state.panX;
    if (px > w+stepPx) break; if (px < -stepPx) continue;
    ctx.strokeStyle=RULER_TICK; ctx.beginPath(); ctx.moveTo(px,h-8); ctx.lineTo(px,h); ctx.stroke();
    if (stepPx>20 && px>=0 && px<=w) { ctx.fillStyle=RULER_FG; ctx.fillText(String(Math.round(mm)),px,2); }
    if (stepPx>40) { const half=px+stepPx/2; if(half>=0&&half<=w){ ctx.beginPath(); ctx.moveTo(half,h-4); ctx.lineTo(half,h); ctx.stroke(); } }
  }
  ctx.strokeStyle='#555'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,h-0.5); ctx.lineTo(w,h-0.5); ctx.stroke();
}

function drawRulerV() {
  const bounds = rulerV.getBoundingClientRect();
  const w=24, h=bounds.height;
  if (h <= 0) return;
  const dpr = window.devicePixelRatio || 1;
  rulerV.width=Math.round(w*dpr); rulerV.height=Math.round(h*dpr);
  rulerV.style.width=w+'px'; rulerV.style.height=h+'px';
  const ctx = rulerVCtx;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle=RULER_BG; ctx.fillRect(0,0,w,h);
  const ez=effectiveZoom(), step=niceRulerStep(ez), stepPx=step*ez;
  const startMM=Math.floor(-state.panY/ez/step)*step;
  ctx.font='9px sans-serif'; ctx.textAlign='right'; ctx.textBaseline='middle';
  for (let mm=startMM; ; mm+=step) {
    const py=mm*ez+state.panY;
    if (py>h+stepPx) break; if (py<-stepPx) continue;
    ctx.strokeStyle=RULER_TICK; ctx.beginPath(); ctx.moveTo(w-8,py); ctx.lineTo(w,py); ctx.stroke();
    if (stepPx>20 && py>=0 && py<=h) { ctx.save(); ctx.fillStyle=RULER_FG; ctx.translate(w-10,py); ctx.rotate(-Math.PI/2); ctx.fillText(String(Math.round(mm)),0,0); ctx.restore(); }
    if (stepPx>40) { const half=py+stepPx/2; if(half>=0&&half<=h){ ctx.beginPath(); ctx.moveTo(w-4,half); ctx.lineTo(w,half); ctx.stroke(); } }
  }
  ctx.strokeStyle='#555'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(w-0.5,0); ctx.lineTo(w-0.5,h); ctx.stroke();
}

function updateRulerCursor(svgX, svgY) {
  const dpr=window.devicePixelRatio||1;
  drawRulerH(); rulerHCtx.save(); rulerHCtx.setTransform(dpr,0,0,dpr,0,0);
  rulerHCtx.strokeStyle='#ff6600'; rulerHCtx.lineWidth=1;
  rulerHCtx.beginPath(); rulerHCtx.moveTo(svgX,0); rulerHCtx.lineTo(svgX,24); rulerHCtx.stroke();
  rulerHCtx.restore();
  drawRulerV(); rulerVCtx.save(); rulerVCtx.setTransform(dpr,0,0,dpr,0,0);
  rulerVCtx.strokeStyle='#ff6600'; rulerVCtx.lineWidth=1;
  rulerVCtx.beginPath(); rulerVCtx.moveTo(0,svgY); rulerVCtx.lineTo(24,svgY); rulerVCtx.stroke();
  rulerVCtx.restore();
}

// ═══════════════════════════════════════════════
// UNDO / REDO
// ═══════════════════════════════════════════════

function deepCopyEntities(entities) {
  return entities.map(e => {
    const copy = { ...e };
    if (e.ctrl)   copy.ctrl   = { ...e.ctrl };
    if (e.points) copy.points = e.points.map(p => ({ ...p }));
    return copy;
  });
}

// ═══════════════════════════════════════════════
// МУЛЬТИ-ПРОЕКТ
// ═══════════════════════════════════════════════

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createProjectSnapshot() {
  return {
    entities:        deepCopyEntities(state.entities),
    nextId:          state.nextId,
    pageFormat:      state.pageFormat,
    pageOrientation: state.pageOrientation,
    customPageW:     state.customPageW || null,
    customPageH:     state.customPageH || null,
    stampData:       JSON.parse(JSON.stringify(state.stampData || {})),
    showStamp:       state.showStamp !== false,
    showPage:        state.showPage  !== false,
    zoom:            state.zoom,
    panX:            state.panX,
    panY:            state.panY,
  };
}

function applyProjectSnapshot(snap) {
  state.entities        = deepCopyEntities(snap.entities || []);
  state.nextId          = snap.nextId          || 1;
  state.pageFormat      = snap.pageFormat      || 'A4';
  state.pageOrientation = snap.pageOrientation || 'portrait';
  state.customPageW     = snap.customPageW     || null;
  state.customPageH     = snap.customPageH     || null;
  state.stampData       = JSON.parse(JSON.stringify(snap.stampData || {}));
  state.showStamp       = snap.showStamp !== false;
  state.showPage        = snap.showPage  !== false;
  state.zoom            = snap.zoom  || 1;
  state.panX            = snap.panX  || 50;
  state.panY            = snap.panY  || 50;
  state.history         = [];
  state.historyIndex    = -1;
  state.selectedId      = null;
  state.selectedIds     = new Set();
  state.lineStart       = null;
  state.polylinePoints  = [];
  state.hatchPoints     = [];
  state.arcPhase        = 0;
  state.arcP1           = null;
  state.arcDragId       = null;
  state.dimStep         = 0;
  state.dimP1           = null;
  state.dimP2           = null;
}

function createNewProject(name) {
  const idx   = state.projects.length;
  const pName = name || `Проект ${idx + 1}`;

  const proj = {
    id:    Date.now() + Math.random(),
    name:  pName,
    dirty: false,
    snap:  {
      entities:        [],
      nextId:          1,
      pageFormat:      'A4',
      pageOrientation: 'portrait',
      customPageW:     null,
      customPageH:     null,
      stampData:       {},
      showStamp:       true,
      showPage:        true,
      zoom:            1,
      panX:            50,
      panY:            50,
    },
  };

  state.projects.push(proj);
  switchToProject(state.projects.length - 1);
}

function switchToProject(idx) {
  if (idx === state.activeProjectIdx && state.projects.length > 0) return;
  if (idx < 0 || idx >= state.projects.length) return;

  // Save current project state
  const curProj = state.projects[state.activeProjectIdx];
  if (curProj) {
    curProj.entities        = JSON.parse(JSON.stringify(state.entities));
    curProj.nextId          = state.nextId;
    curProj.pageFormat      = state.pageFormat;
    curProj.pageOrientation = state.pageOrientation;
    curProj.zoom            = state.zoom;
    curProj.panX            = state.panX;
    curProj.panY            = state.panY;
    curProj.stampData       = JSON.parse(JSON.stringify(state.stampData || {}));
  }

  // Load new project
  state.activeProjectIdx = idx;
  const proj = state.projects[idx];

  state.entities        = JSON.parse(JSON.stringify(proj.entities || []));
  state.nextId          = proj.nextId || 1;
  state.pageFormat      = proj.pageFormat || 'A4';
  state.pageOrientation = proj.pageOrientation || 'portrait';
  state.zoom            = proj.zoom || 1;
  state.panX            = proj.panX || 0;
  state.panY            = proj.panY || 0;
  state.stampData       = JSON.parse(JSON.stringify(proj.stampData || {}));
  state.selectedId      = null;
  state.selectedIds     = new Set();

  if (typeof selPageFormat !== 'undefined') selPageFormat.value = state.pageFormat;

  renderProjectTabs();
  render();
  showStatus(`Відкрито: ${proj.name}`);
}

function renderProjectTabs() {
  const tabBar = document.getElementById('project-tab-bar');
  if (!tabBar) return;

  tabBar.innerHTML = '';

  state.projects.forEach((proj, idx) => {
    const isActive = idx === state.activeProjectIdx;

    const tab = document.createElement('div');
    tab.className = 'project-tab' + (isActive ? ' active' : '');
    tab.dataset.idx = idx;
    tab.title = proj.name;

    const dirty = proj.dirty || (isActive && state.entities.length > 0 && proj.dirty);

    tab.innerHTML = `
      <span class="tab-name">${escapeHtml(proj.name)}</span>
      ${dirty ? '<span class="tab-dirty">●</span>' : ''}
      <button class="tab-close" data-idx="${idx}" title="Закрити">✕</button>
    `;

    // Use click instead of mousedown to avoid accidental triggers
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.classList.contains('tab-close')) return;
      if (e.target.closest && e.target.closest('.tab-close')) return;
      if (idx === state.activeProjectIdx) return; // already active — do nothing
      switchToProject(idx);
    });

    tab.addEventListener('dblclick', (e) => {
      if (e.target.classList.contains('tab-close')) return;
      renameProject(idx);
    });

    tabBar.appendChild(tab);
  });

  const newBtn = document.createElement('button');
  newBtn.className = 'tab-new-btn';
  newBtn.textContent = '+';
  newBtn.title = 'Новий проект (Ctrl+N)';
  newBtn.addEventListener('click', () => createNewProject());
  tabBar.appendChild(newBtn);

  tabBar.querySelectorAll('.tab-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeProject(parseInt(btn.dataset.idx, 10));
    });
  });

  const activeTab = tabBar.querySelector('.project-tab.active');
  if (activeTab) {
    activeTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

function closeProject(idx) {
  if (state.projects.length === 0) return;
  const proj = state.projects[idx];
  if (!proj) return;

  const isActive    = idx === state.activeProjectIdx;
  const hasEntities = isActive
    ? state.entities.length > 0
    : (proj.snap.entities || []).length > 0;

  if (hasEntities && proj.dirty) {
    showCloseConfirmDialog(proj.name, () => {
      // Save then close
      if (isActive) {
        triggerSaveProject(() => doCloseProject(idx));
      } else {
        doCloseProject(idx);
      }
    }, () => {
      doCloseProject(idx);
    });
    return;
  }

  doCloseProject(idx);
}

function doCloseProject(idx) {
  state.projects.splice(idx, 1);

  if (state.projects.length === 0) {
    state.entities        = [];
    state.nextId          = 1;
    state.selectedId      = null;
    state.selectedIds     = new Set();
    state.activeProjectIdx = 0;
    createNewProject('Проект 1');
    return;
  }

  const newIdx = Math.min(idx, state.projects.length - 1);
  state.activeProjectIdx = newIdx;
  const proj = state.projects[newIdx];
  const wasDirty = proj.dirty;
  applyProjectSnapshot(proj.snap);

  saveSnapshot();
  proj.dirty = wasDirty;
  if (typeof render === 'function') render();
  renderProjectTabs();
  if (typeof showPropsPanel === 'function') showPropsPanel(null);
  document.title = `${proj.name} — ToolCAD`;
}

function renameProject(idx) {
  const proj = state.projects[idx];
  if (!proj) return;

  const dialog = document.createElement('div');
  dialog.style.cssText = `
    position:fixed; top:50%; left:50%;
    transform:translate(-50%,-50%);
    background:#252526; border:1px solid #007acc;
    border-radius:6px; padding:20px; z-index:10001;
    color:#ccc; font-family:monospace; font-size:13px;
    box-shadow:0 8px 32px rgba(0,0,0,0.85);
    min-width:280px; box-sizing:border-box;
  `;
  dialog.innerHTML = `
    <div style="color:#7ec8e3;margin-bottom:12px;font-size:13px;">
      ✏ Перейменувати проект
    </div>
    <input id="rename-input" type="text"
      value="${escapeHtml(proj.name)}"
      style="width:100%;background:#1a1a1a;border:1px solid #555;
             color:#fff;padding:6px 8px;border-radius:3px;
             font-size:13px;box-sizing:border-box;margin-bottom:12px;">
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button id="rename-cancel"
        style="padding:5px 14px;background:#333;border:1px solid #555;
               color:#ccc;border-radius:3px;cursor:pointer;font-size:12px;">
        Скасувати
      </button>
      <button id="rename-ok"
        style="padding:5px 14px;background:#094771;border:1px solid #007acc;
               color:#fff;border-radius:3px;cursor:pointer;font-size:12px;">
        OK
      </button>
    </div>
  `;
  document.body.appendChild(dialog);
  dialog.addEventListener('mousedown', e => e.stopPropagation());
  dialog.addEventListener('mousemove', e => e.stopPropagation());
  dialog.addEventListener('mouseup', e => e.stopPropagation());

  const inp = dialog.querySelector('#rename-input');
  inp.focus();
  inp.select();

  const apply = () => {
    const newName = inp.value.trim();
    if (newName) {
      state.projects[idx].name = newName;
      renderProjectTabs();
      if (idx === state.activeProjectIdx) {
        document.title = `${newName} — ToolCAD`;
      }
    }
    dialog.remove();
  };

  dialog.querySelector('#rename-ok').onclick     = apply;
  dialog.querySelector('#rename-cancel').onclick = () => dialog.remove();
  inp.addEventListener('keydown', e => {
    if (e.code === 'Enter')  apply();
    if (e.code === 'Escape') dialog.remove();
  });
}

function showCloseConfirmDialog(projName, onSave, onDiscard) {
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    position:fixed; top:50%; left:50%;
    transform:translate(-50%,-50%);
    background:#252526; border:1px solid #555;
    border-radius:6px; padding:24px; z-index:10001;
    color:#ccc; font-family:monospace; font-size:13px;
    box-shadow:0 8px 32px rgba(0,0,0,0.85);
    min-width:320px; text-align:center; box-sizing:border-box;
  `;
  dialog.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;
                margin-bottom:14px;justify-content:center;">
      <span style="color:#ff9800;width:18px;height:18px;
                   display:flex;align-items:center;flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94
                   a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9"  x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </span>
      <span style="font-size:13px;color:#cccccc;font-weight:500;">
        Зберегти зміни?
      </span>
    </div>
    <div style="color:#888;font-size:11px;margin-bottom:20px;">
      "${escapeHtml(projName)}"<br>
      Незбережені зміни будуть втрачені.
    </div>
    <div style="display:flex;gap:8px;justify-content:center;">
      <button id="close-cancel"
        style="padding:6px 14px;background:#333;border:1px solid #555;
               color:#ccc;border-radius:3px;cursor:pointer;font-size:12px;
               font-family:inherit;">
        Скасувати
      </button>
      <button id="close-discard"
        style="padding:6px 14px;background:#3a1a1a;border:1px solid #6a2a2a;
               color:#f88;border-radius:3px;cursor:pointer;font-size:12px;
               font-family:inherit;">
        Не зберігати
      </button>
      <button id="close-save"
        style="display:flex;align-items:center;gap:6px;
               padding:6px 14px;background:#094771;border:1px solid #007acc;
               color:#fff;border-radius:3px;cursor:pointer;font-size:12px;
               font-family:inherit;">
        <span style="width:14px;height:14px;display:flex;align-items:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11
                     a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
        </span>
        Зберегти
      </button>
    </div>
  `;
  document.body.appendChild(dialog);

  dialog.querySelector('#close-cancel').onclick  = () => dialog.remove();
  dialog.querySelector('#close-discard').onclick = () => { dialog.remove(); onDiscard && onDiscard(); };
  dialog.querySelector('#close-save').onclick    = () => { dialog.remove(); onSave && onSave(); };
}

function triggerSaveProject(callback) {
  const btn = document.getElementById('btn-save');
  if (btn) {
    btn.click();
  } else if (typeof saveProject === 'function') {
    try { saveProject(); } catch (_) {}
  }
  if (callback) callback();
}

// ════════════════════════════════════════════════════════
// РђВТО-РОЗМІТКА — функції
// ════════════════════════════════════════════════════════

// Helper: build anchoredTo array for a dimension that measures entity ent
function makeAnchors(entId, p1Anchored, p2Anchored) {
  const anchors = [];
  if (p1Anchored) anchors.push({ entityId: entId, end: 'p1' });
  if (p2Anchored) anchors.push({ entityId: entId, end: 'p2' });
  return anchors;
}

// Add default dimension to a single entity (used in batch annotate)
function addDefaultDimension(ent) {
  const off = AUTO_ANNOTATE.offsetDefault;

  if (ent.type === 'line' || ent.type === 'centerline') {
    const dx  = ent.x2 - ent.x1;
    const dy  = ent.y2 - ent.y1;
    const isH = Math.abs(dy) < 0.1;
    const isV = Math.abs(dx) < 0.1;

    state.entities.push({
      id: state.nextId++,
      type: 'dimension',
      lineType: 'solid_thin',
      color: '#000000',
      dimType: isH || isV ? 'linear' : 'aligned',
      x1: ent.x1, y1: ent.y1,
      x2: ent.x2, y2: ent.y2,
      offset: isV ? -off : off,
      text: '',
      isDiameter: false,
      isRadius: false,
      anchoredTo: makeAnchors(ent.id, true, true),
    });

  } else if (ent.type === 'rect') {
    const x1 = Math.min(ent.x1, ent.x2);
    const x2 = Math.max(ent.x1, ent.x2);
    const y1 = Math.min(ent.y1, ent.y2);
    const y2 = Math.max(ent.y1, ent.y2);
    // Width top
    state.entities.push({
      id: state.nextId++, type: 'dimension',
      lineType: 'solid_thin', color: '#000000', dimType: 'linear',
      x1, y1, x2, y2: y1,
      offset: off, text: '', isDiameter: false, isRadius: false,
      anchoredTo: makeAnchors(ent.id, true, true),
    });
    // Height right
    state.entities.push({
      id: state.nextId++, type: 'dimension',
      lineType: 'solid_thin', color: '#000000', dimType: 'linear',
      x1: x2, y1, x2: x2, y2,
      offset: -off, text: '', isDiameter: false, isRadius: false,
      anchoredTo: makeAnchors(ent.id, true, true),
    });

  } else if (ent.type === 'circle') {
    state.entities.push({
      id: state.nextId++, type: 'dimension',
      lineType: 'solid_thin', color: '#000000', dimType: 'linear',
      x1: ent.cx - ent.r, y1: ent.cy,
      x2: ent.cx + ent.r, y2: ent.cy,
      offset: off, text: '', isDiameter: true, isRadius: false,
      anchoredTo: makeAnchors(ent.id, true, true),
    });

  } else if (ent.type === 'arc') {
    if (ent.isLine || !isFinite(ent.r)) return;
    const midAngle = (ent.startAngle + ent.endAngle) / 2;
    state.entities.push({
      id: state.nextId++, type: 'dimension',
      lineType: 'solid_thin', color: '#000000', dimType: 'linear',
      x1: ent.cx, y1: ent.cy,
      x2: ent.cx + ent.r * Math.cos(midAngle),
      y2: ent.cy + ent.r * Math.sin(midAngle),
      offset: 0, text: '', isDiameter: false, isRadius: true,
      anchoredTo: makeAnchors(ent.id, true, true),
    });
  }
}

// Add bounding box dimension across all entities
function addBoundingDimension(entities, direction) {
  const off = AUTO_ANNOTATE.offsetDefault;

  // Collect all endpoints
  const points = [];
  entities.forEach(ent => {
    if (ent.type === 'line' || ent.type === 'centerline' || ent.type === 'arc') {
      points.push({ x: ent.x1, y: ent.y1 });
      points.push({ x: ent.x2, y: ent.y2 });
    } else if (ent.type === 'rect') {
      points.push({ x: ent.x1, y: ent.y1 });
      points.push({ x: ent.x2, y: ent.y2 });
    } else if (ent.type === 'circle') {
      points.push({ x: ent.cx - ent.r, y: ent.cy });
      points.push({ x: ent.cx + ent.r, y: ent.cy });
      points.push({ x: ent.cx, y: ent.cy - ent.r });
      points.push({ x: ent.cx, y: ent.cy + ent.r });
    }
  });

  if (points.length < 2) return;

  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));

  if (direction === 'horizontal') {
    // Skip if zero width
    if (Math.abs(maxX - minX) < 0.1) return;
    state.entities.push({
      id: state.nextId++, type: 'dimension',
      lineType: 'solid_thin', color: '#000000', dimType: 'linear',
      x1: minX, y1: minY,
      x2: maxX, y2: minY,
      offset: off * 2,
      text: '', isDiameter: false, isRadius: false,
      anchoredTo: [],
    });
  } else if (direction === 'vertical') {
    // Skip if zero height
    if (Math.abs(maxY - minY) < 0.1) return;
    state.entities.push({
      id: state.nextId++, type: 'dimension',
      lineType: 'solid_thin', color: '#000000', dimType: 'linear',
      x1: maxX, y1: minY,
      x2: maxX, y2: maxY,
      offset: -(off * 2),
      text: '', isDiameter: false, isRadius: false,
      anchoredTo: [],
    });
  }
}

function showBatchAnnotateDialog(entities) {
  const old = document.getElementById('batch-annotate-dialog');
  if (old) old.remove();

  const dialog = document.createElement('div');
  dialog.id = 'batch-annotate-dialog';
  dialog.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: #1e2a3a;
    border: 1px solid #007acc;
    border-radius: 8px;
    padding: 16px 20px;
    z-index: 99999;
    color: #ccc;
    font-family: monospace;
    font-size: 13px;
    min-width: 320px;
    max-width: 480px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.8);
  `;

  // Title
  const title = document.createElement('div');
  title.style.cssText = 'color:#7ec8e3;font-size:14px;margin-bottom:12px;';
  title.textContent = `📏 Розмітити ${entities.length} об'єктів`;
  dialog.appendChild(title);

  // Options
  const optionsDiv = document.createElement('div');
  optionsDiv.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-bottom:14px;';

  const options = [
    {
      label: '📐 Розмір кожного об\'єкта',
      desc: 'Додає розмірку до кожного виділеного об\'єкта окремо',
      action: () => {
        entities.forEach(ent => {
          addDefaultDimension(ent);
        });
        saveSnapshot();
        render();
      }
    },
    {
      label: '↔ Загальна ширина (X)',
      desc: 'Розмірка від крайньої лівої до крайньої правої точки',
      action: () => {
        addBoundingDimension(entities, 'horizontal');
        saveSnapshot();
        render();
      }
    },
    {
      label: '↕ Загальна висота (Y)',
      desc: 'Розмірка від крайньої верхньої до крайньої нижньої точки',
      action: () => {
        addBoundingDimension(entities, 'vertical');
        saveSnapshot();
        render();
      }
    },
    {
      label: '⊞ Ширина + Висота (габарит)',
      desc: 'Обидві розмірки габариту всіх виділених',
      action: () => {
        addBoundingDimension(entities, 'horizontal');
        addBoundingDimension(entities, 'vertical');
        saveSnapshot();
        render();
      }
    },
    {
      label: '📏 Всі розміри всіх об\'єктів',
      desc: 'Розмірка до кожного об\'єкта + загальний габарит',
      action: () => {
        entities.forEach(ent => addDefaultDimension(ent));
        addBoundingDimension(entities, 'horizontal');
        addBoundingDimension(entities, 'vertical');
        saveSnapshot();
        render();
      }
    },
  ];

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.style.cssText = `
      background: #0d3a5c;
      border: 1px solid #007acc;
      color: #ccc;
      border-radius: 4px;
      padding: 8px 12px;
      cursor: pointer;
      text-align: left;
      font-family: monospace;
      font-size: 12px;
      transition: background 0.15s;
    `;
    btn.innerHTML = `<div style="color:#fff;margin-bottom:2px;">${opt.label}</div>
                     <div style="color:#888;font-size:11px;">${opt.desc}</div>`;
    btn.addEventListener('mouseenter', () => btn.style.background = '#1a5276');
    btn.addEventListener('mouseleave', () => btn.style.background = '#0d3a5c');
    btn.addEventListener('click', () => {
      opt.action();
      dialog.remove();
      document.removeEventListener('keydown', escHandler);
    });
    optionsDiv.appendChild(btn);
  });

  dialog.appendChild(optionsDiv);

  // Cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.style.cssText = `
    background: #333;
    border: 1px solid #555;
    color: #aaa;
    border-radius: 4px;
    padding: 6px 16px;
    cursor: pointer;
    font-family: monospace;
    font-size: 12px;
    float: right;
  `;
  cancelBtn.textContent = 'Скасувати';
  cancelBtn.addEventListener('click', () => {
    dialog.remove();
    document.removeEventListener('keydown', escHandler);
  });
  dialog.appendChild(cancelBtn);

  document.body.appendChild(dialog);

  // Close on Escape
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      dialog.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Auto-close after 15 sec
  const timer = setTimeout(() => {
    dialog.remove();
    document.removeEventListener('keydown', escHandler);
  }, 15000);
  dialog.addEventListener('mouseenter', () => clearTimeout(timer));
}

function autoAnnotate(ent) {
  if (!AUTO_ANNOTATE.enabled) return;
  if (!ent) return;
  switch (ent.type) {
    case 'line':      autoAnnotateLine(ent);     break;
    case 'rect':      autoAnnotateRect(ent);     break;
    case 'circle':    autoAnnotateCircle(ent);   break;
    case 'arc':       autoAnnotateArc(ent);      break;
    case 'polyline':  autoAnnotatePolyline(ent); break;
  }
}

function showAnnotateDialog(ent, options, onConfirm) {
  if (!AUTO_ANNOTATE.showDialog) { return; }
  if (!options || options.length === 0) { return; }

  const old = document.getElementById('annotate-dialog');
  if (old) old.remove();

  const dialog = document.createElement('div');
  dialog.id = 'annotate-dialog';
  dialog.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: #1e2a3a;
    border: 1px solid #007acc;
    border-radius: 6px;
    padding: 12px 16px;
    z-index: 99999;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    font-family: monospace;
    font-size: 12px;
    color: #ccc;
    animation: slideUp 0.2s ease;
  `;

  const label = document.createElement('span');
  label.style.cssText = 'color:#7ec8e3;display:inline-flex;align-items:center;gap:6px;';
  label.innerHTML = `${iconHtml('dimension', 14, '#7ec8e3')}<span>Додати розмітку:</span>`;
  dialog.appendChild(label);

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.innerHTML = opt.label;
    btn.style.cssText = `
      padding: 4px 10px;
      background: #094771;
      border: 1px solid #007acc;
      color: #fff;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    `;
    btn.addEventListener('click', () => {
      try { opt.action(); } catch (err) { console.error('[autoAnnotate]', err); }
      dialog.remove();
      document.removeEventListener('keydown', escHandler);
    });
    dialog.appendChild(btn);
  });

  const skipBtn = document.createElement('button');
  skipBtn.innerHTML = iconHtml('close', 12, '#aaa');
  skipBtn.title = 'Пропустити (Esc)';
  skipBtn.style.cssText = `
    padding: 4px 8px;
    background: #333;
    border: 1px solid #555;
    color: #aaa;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    margin-left: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  `;
  skipBtn.addEventListener('click', () => {
    dialog.remove();
    document.removeEventListener('keydown', escHandler);
  });
  dialog.appendChild(skipBtn);

  document.body.appendChild(dialog);

  const timer = setTimeout(() => {
    dialog.remove();
    document.removeEventListener('keydown', escHandler);
  }, 8000);
  dialog.addEventListener('mouseenter', () => clearTimeout(timer));

  const escHandler = (e) => {
    if (e.code === 'Escape') {
      dialog.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function autoAnnotateLine(ent) {
  const dx  = ent.x2 - ent.x1;
  const dy  = ent.y2 - ent.y1;
  const len = Math.sqrt(dx * dx + dy * dy);

  const isStrictHoriz = Math.abs(dy) < 0.1;
  const isStrictVert  = Math.abs(dx) < 0.1;
  const isDiagonal    = !isStrictHoriz && !isStrictVert;

  const off = AUTO_ANNOTATE.offsetDefault;
  const options = [];

  if (isDiagonal) {
    options.push({
      label: `${iconHtml('dimension',12)} Довжина вздовж (${len.toFixed(1)} мм)`,
      action: () => {
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000',
          dimType: 'aligned',
          x1: ent.x1, y1: ent.y1, x2: ent.x2, y2: ent.y2,
          offset: off, text: '', isDiameter: false, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        saveSnapshot(); render();
        showStatus(`Похилий розмір: ${len.toFixed(1)} мм`);
      }
    });
    options.push({
      label: `${iconHtml('horizontal',12)} Проекція X (${Math.abs(dx).toFixed(1)} мм)`,
      action: () => {
        const yBase = Math.max(ent.y1, ent.y2) + off;
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000',
          dimType: 'linear',
          x1: Math.min(ent.x1, ent.x2), y1: yBase,
          x2: Math.max(ent.x1, ent.x2), y2: yBase,
          offset: 0, text: '', isDiameter: false, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        saveSnapshot(); render();
        showStatus(`↔ Горизонтальна проекція: ${Math.abs(dx).toFixed(1)} мм`);
      }
    });
    options.push({
      label: `${iconHtml('vertical',12)} Проекція Y (${Math.abs(dy).toFixed(1)} мм)`,
      action: () => {
        const xBase = Math.max(ent.x1, ent.x2) + off;
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000',
          dimType: 'linear',
          x1: xBase, y1: Math.min(ent.y1, ent.y2),
          x2: xBase, y2: Math.max(ent.y1, ent.y2),
          offset: 0, text: '', isDiameter: false, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        saveSnapshot(); render();
        showStatus(`↕ Вертикальна проекція: ${Math.abs(dy).toFixed(1)} мм`);
      }
    });
    options.push({
      label: `${iconHtml('dimension',12)} Всі (L + X + Y)`,
      action: () => {
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000', dimType: 'aligned',
          x1: ent.x1, y1: ent.y1, x2: ent.x2, y2: ent.y2,
          offset: off, text: '', isDiameter: false, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        const yBase = Math.max(ent.y1, ent.y2) + off * 1.8;
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000', dimType: 'linear',
          x1: Math.min(ent.x1, ent.x2), y1: yBase,
          x2: Math.max(ent.x1, ent.x2), y2: yBase,
          offset: 0, text: '', isDiameter: false, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        const xBase = Math.max(ent.x1, ent.x2) + off * 1.8;
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000', dimType: 'linear',
          x1: xBase, y1: Math.min(ent.y1, ent.y2),
          x2: xBase, y2: Math.max(ent.y1, ent.y2),
          offset: 0, text: '', isDiameter: false, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        saveSnapshot(); render();
        showStatus(`Всі розміри: ${len.toFixed(1)} + ${Math.abs(dx).toFixed(1)} + ${Math.abs(dy).toFixed(1)} мм`);
      }
    });
  } else if (isStrictHoriz) {
    options.push({
      label: `${iconHtml('horizontal',12)} Довжина (${len.toFixed(1)} мм)`,
      action: () => {
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000',
          dimType: 'linear',
          x1: ent.x1, y1: ent.y1, x2: ent.x2, y2: ent.y2,
          offset: off, text: '', isDiameter: false, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        saveSnapshot(); render();
        showStatus(`↔ Горизонтальний розмір: ${len.toFixed(1)} мм`);
      }
    });
  } else {
    options.push({
      label: `${iconHtml('vertical',12)} Висота (${len.toFixed(1)} мм)`,
      action: () => {
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000',
          dimType: 'linear',
          x1: ent.x1, y1: ent.y1, x2: ent.x2, y2: ent.y2,
          offset: off, text: '', isDiameter: false, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        saveSnapshot(); render();
        showStatus(`↕ Вертикальний розмір: ${len.toFixed(1)} мм`);
      }
    });
  }

  showAnnotateDialog(ent, options);
}

function autoAnnotateRect(ent) {
  const w = Math.abs(ent.x2 - ent.x1).toFixed(1);
  const h = Math.abs(ent.y2 - ent.y1).toFixed(1);
  const x1 = Math.min(ent.x1, ent.x2);
  const y1 = Math.min(ent.y1, ent.y2);
  const x2 = Math.max(ent.x1, ent.x2);
  const y2 = Math.max(ent.y1, ent.y2);
  const off = AUTO_ANNOTATE.offsetDefault; // 8мм

  showAnnotateDialog(ent, [
    {
      label: `${iconHtml('dimension',12)} Обидва (${w} × ${h})`,
      action: () => {
        // Ширина — розмірна лінія ЗВЕРХУ прямокутника
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000', dimType: 'linear',
          x1, y1: y1, x2, y2: y1,
          offset: -off, text: '', isDiameter: false, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });

        // Висота — розмірна лінія СПРАВА від прямокутника
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000', dimType: 'linear',
          x1: x2, y1, x2: x2, y2,
          offset: off, text: '', isDiameter: false, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });

        saveSnapshot(); render();
        showStatus(`Розміри: ${w} × ${h} мм`);
      }
    },

    {
      label: `${iconHtml('horizontal',12)} Ширина (${w} мм)`,
      action: () => {
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000', dimType: 'linear',
          x1, y1: y1, x2, y2: y1,
          offset: -off, text: '', isDiameter: false, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        saveSnapshot(); render();
      }
    },

    {
      label: `${iconHtml('vertical',12)} Висота (${h} мм)`,
      action: () => {
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000', dimType: 'linear',
          x1: x2, y1, x2: x2, y2,
          offset: off, text: '', isDiameter: false, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        saveSnapshot(); render();
      }
    },

    // Ще варіанти — знизу і зліва
    {
      label: `${iconHtml('horizontal',12)} Ширина знизу`,
      action: () => {
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000', dimType: 'linear',
          x1, y1: y2, x2, y2: y2,
          offset: off, text: '', isDiameter: false, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        saveSnapshot(); render();
      }
    },

    {
      label: `${iconHtml('vertical',12)} Висота зліва`,
      action: () => {
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000', dimType: 'linear',
          x1: x1, y1, x2: x1, y2,
          offset: -off, text: '', isDiameter: false, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        saveSnapshot(); render();
      }
    },
  ]);
}

function autoAnnotateCircle(ent) {
  const r = ent.r.toFixed(1);
  const d = (ent.r * 2).toFixed(1);
  const off = AUTO_ANNOTATE.offsetDefault;

  showAnnotateDialog(ent, [
    {
      label: `${iconHtml('diameter',12)} Діаметр Ø${d} мм`,
      action: () => {
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000', dimType: 'linear',
          x1: ent.cx - ent.r, y1: ent.cy,
          x2: ent.cx + ent.r, y2: ent.cy,
          offset: -off, text: '',
          isDiameter: true, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        saveSnapshot(); render();
        showStatus(`⊙ Діаметр Ø${d} мм`);
      }
    },
    {
      label: `${iconHtml('radius',12)} Радіус R${r} мм`,
      action: () => {
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000', dimType: 'linear',
          x1: ent.cx, y1: ent.cy,
          x2: ent.cx + ent.r * Math.cos(-Math.PI/4),
          y2: ent.cy + ent.r * Math.sin(-Math.PI/4),
          offset: 0, text: '',
          isDiameter: false, isRadius: true,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        saveSnapshot(); render();
        showStatus(`↗ Радіус R${r} мм`);
      }
    },
    {
      label: `${iconHtml('centerline',12)} Осьові лінії`,
      action: () => {
        const ext = 5;
        state.entities.push({
          id: state.nextId++, type: 'centerline',
          lineType: 'dash_dot', color: '#000000',
          x1: ent.cx - ent.r - ext, y1: ent.cy,
          x2: ent.cx + ent.r + ext, y2: ent.cy,
        });
        state.entities.push({
          id: state.nextId++, type: 'centerline',
          lineType: 'dash_dot', color: '#000000',
          x1: ent.cx, y1: ent.cy - ent.r - ext,
          x2: ent.cx, y2: ent.cy + ent.r + ext,
        });
        saveSnapshot(); render();
        showStatus(`✛ Осьові лінії додано`);
      }
    },
    {
      label: `${iconHtml('diameter',12)}${iconHtml('centerline',12)} Все`,
      action: () => {
        const ext = 5;
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000', dimType: 'linear',
          x1: ent.cx - ent.r, y1: ent.cy,
          x2: ent.cx + ent.r, y2: ent.cy,
          offset: -off, text: '', isDiameter: true, isRadius: false,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        state.entities.push({
          id: state.nextId++, type: 'centerline',
          lineType: 'dash_dot', color: '#000000',
          x1: ent.cx - ent.r - ext, y1: ent.cy,
          x2: ent.cx + ent.r + ext, y2: ent.cy,
        });
        state.entities.push({
          id: state.nextId++, type: 'centerline',
          lineType: 'dash_dot', color: '#000000',
          x1: ent.cx, y1: ent.cy - ent.r - ext,
          x2: ent.cx, y2: ent.cy + ent.r + ext,
        });
        saveSnapshot(); render();
        showStatus(`Діаметр та осьові додано`);
      }
    },
  ]);
}

function autoAnnotateArc(ent) {
  if (ent.isLine || !isFinite(ent.r)) return;
  const r = ent.r ? ent.r.toFixed(1) : '?';

  showAnnotateDialog(ent, [
    {
      label: `${iconHtml('radius',12)} Радіус R${r} мм`,
      action: () => {
        if (ent.cx === undefined || !ent.r) return;
        const midAngle = ent.startAngle !== undefined && ent.endAngle !== undefined
          ? (ent.startAngle + ent.endAngle) / 2
          : 0;
        state.entities.push({
          id: state.nextId++, type: 'dimension',
          lineType: 'solid_thin', color: '#000000', dimType: 'linear',
          x1: ent.cx, y1: ent.cy,
          x2: ent.cx + ent.r * Math.cos(midAngle),
          y2: ent.cy + ent.r * Math.sin(midAngle),
          offset: 0, text: '',
          isDiameter: false, isRadius: true,
          anchoredTo: makeAnchors(ent.id, true, true),
        });
        saveSnapshot(); render();
        showStatus(`↗ Радіус R${r} мм`);
      }
    },
    {
      label: `${iconHtml('centerline',12)} Центр (осьові)`,
      action: () => {
        if (ent.cx === undefined) return;
        const ext = Math.max((ent.r || 10) * 0.3, 5);
        state.entities.push({
          id: state.nextId++, type: 'centerline',
          lineType: 'dash_dot', color: '#000000',
          x1: ent.cx - ext, y1: ent.cy,
          x2: ent.cx + ext, y2: ent.cy,
        });
        state.entities.push({
          id: state.nextId++, type: 'centerline',
          lineType: 'dash_dot', color: '#000000',
          x1: ent.cx, y1: ent.cy - ext,
          x2: ent.cx, y2: ent.cy + ext,
        });
        saveSnapshot(); render();
        showStatus(`✛ Центр дуги позначено`);
      }
    },
  ]);
}

function autoAnnotatePolyline(ent) {
  if (!ent.points || ent.points.length < 2) return;

  let totalLen = 0;
  for (let i = 0; i < ent.points.length - 1; i++) {
    const dx = ent.points[i+1].x - ent.points[i].x;
    const dy = ent.points[i+1].y - ent.points[i].y;
    totalLen += Math.sqrt(dx*dx + dy*dy);
  }

  const off = AUTO_ANNOTATE.offsetDefault;
  const pts = ent.points;
  const first = pts[0];
  const last  = pts[pts.length - 1];

  showAnnotateDialog(ent, [
    {
      label: `${iconHtml('dimension',12)} Всі сегменти (${ent.points.length - 1} шт)`,
      action: () => {
        for (let i = 0; i < pts.length - 1; i++) {
          const p1 = pts[i], p2 = pts[i+1];
          const sdx = p2.x - p1.x;
          const sdy = p2.y - p1.y;
          const slen = Math.sqrt(sdx*sdx + sdy*sdy);
          if (slen < 0.5) continue;

          // Визначити тип розміру для сегменту
          const segIsHoriz = Math.abs(sdy) < 0.1;
          const segIsVert  = Math.abs(sdx) < 0.1;
          const segDimType = (segIsHoriz || segIsVert) ? 'linear' : 'aligned';

          state.entities.push({
            id: state.nextId++, type: 'dimension',
            lineType: 'solid_thin', color: '#000000', dimType: segDimType,
            x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
            offset: off, text: '', isDiameter: false, isRadius: false,
            anchoredTo: makeAnchors(ent.id, true, true),
          });
        }
        saveSnapshot(); render();
        showStatus(`Додано ${ent.points.length - 1} розмірів`);
      }
    },
    {
      label: `${iconHtml('horizontal',12)} Габарит (${totalLen.toFixed(1)} мм)`,
      action: () => {
        const gx = Math.abs(last.x - first.x);
        const gy = Math.abs(last.y - first.y);
        if (gx > 1) {
          state.entities.push({
            id: state.nextId++, type: 'dimension',
            lineType: 'solid_thin', color: '#000000', dimType: 'linear',
            x1: Math.min(first.x, last.x), y1: Math.max(first.y, last.y),
            x2: Math.max(first.x, last.x), y2: Math.max(first.y, last.y),
            offset: off, text: '', isDiameter: false, isRadius: false,
            anchoredTo: makeAnchors(ent.id, true, true),
          });
        }
        if (gy > 1) {
          state.entities.push({
            id: state.nextId++, type: 'dimension',
            lineType: 'solid_thin', color: '#000000', dimType: 'linear',
            x1: Math.max(first.x, last.x), y1: Math.min(first.y, last.y),
            x2: Math.max(first.x, last.x), y2: Math.max(first.y, last.y),
            offset: off, text: '', isDiameter: false, isRadius: false,
            anchoredTo: makeAnchors(ent.id, true, true),
          });
        }
        saveSnapshot(); render();
        showStatus(`↔ Габаритні розміри додано`);
      }
    },
  ]);
}

function saveSnapshot() {
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(deepCopyEntities(state.entities));
  if (state.history.length > 50) state.history.shift();
  else state.historyIndex++;
  updateUndoRedoButtons();
  markActiveProjectDirty();
}

function markActiveProjectDirty() {
  if (!state.projects || !state.projects[state.activeProjectIdx]) return;
  const proj = state.projects[state.activeProjectIdx];
  if (proj.dirty) return;
  proj.dirty = true;
  const tabBar = document.getElementById('project-tab-bar');
  if (!tabBar) return;
  const activeTab = tabBar.querySelector(
    `.project-tab[data-idx="${state.activeProjectIdx}"]`
  );
  if (activeTab && !activeTab.querySelector('.tab-dirty')) {
    const dot = document.createElement('span');
    dot.className = 'tab-dirty';
    dot.textContent = '●';
    const closeBtn = activeTab.querySelector('.tab-close');
    if (closeBtn) activeTab.insertBefore(dot, closeBtn);
    else          activeTab.appendChild(dot);
  }
}

function undo() {
  if (state.historyIndex <= 0) return;
  state.historyIndex--;
  state.entities = deepCopyEntities(state.history[state.historyIndex]);
  state.selectedId = null; state.lineStart = null; state.polylinePoints = [];
  state.arcPhase = 0; state.arcDragId = null;
  previewLayer.innerHTML = ''; render(); updateUndoRedoButtons();
}

function redo() {
  if (state.historyIndex >= state.history.length - 1) return;
  state.historyIndex++;
  state.entities = deepCopyEntities(state.history[state.historyIndex]);
  state.selectedId = null; state.lineStart = null; state.polylinePoints = [];
  state.arcPhase = 0; state.arcDragId = null;
  previewLayer.innerHTML = ''; render(); updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  const canUndo=state.historyIndex>0, canRedo=state.historyIndex<state.history.length-1;
  btnUndo.style.opacity=canUndo?'1':'0.3'; btnUndo.style.cursor=canUndo?'pointer':'not-allowed';
  btnRedo.style.opacity=canRedo?'1':'0.3'; btnRedo.style.cursor=canRedo?'pointer':'not-allowed';
}

// ═══════════════════════════════════════════════
// PROPERTIES PANEL
// ═══════════════════════════════════════════════

function showPropsPanel(ent) {
  if (!ent) { propsPanel.style.display='none'; return; }
  propsPanel.style.display='block';
  propsBody.innerHTML='';

  // в"Ђв"Ђ Common: line type and color for all entities with lineType в"Ђв"Ђ
  const hasLineType = ['line','rect','circle','polyline','arc','hatch','centerline'].includes(ent.type);
  const hasColor = ['line','rect','circle','polyline','arc','hatch','centerline','dimension'].includes(ent.type);

  if (hasLineType) {
    addPropSeparator();
    addPropLabel('— Лінія —');

    addPropSelect('Тип лінії', ent.lineType || 'solid_thick',
      Object.entries(LINE_TYPES).map(([key, val]) => ({
        value: key,
        label: val.name
      })),
      (v) => {
        ent.lineType = v;
        saveSnapshot();
        render();
        showPropsPanel(ent);
      }
    );
  }

  if (hasColor) {
    addPropColor('Колір', ent.color || '#000000', (v) => {
      ent.color = v;
      saveSnapshot();
      render();
    });
  }

  if (ent.type==='line') {
    propsTitle.textContent='Лінія';
    const dx=ent.x2-ent.x1, dy=ent.y2-ent.y1, len=Math.sqrt(dx*dx+dy*dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    addPropField('Довжина (мм)', Math.round(len * 100) / 100, (newLen) => {
      if (newLen <= 0) return;
      const rad = Math.atan2(ent.y2 - ent.y1, ent.x2 - ent.x1);
      const oldX2 = ent.x2, oldY2 = ent.y2;
      ent.x2 = ent.x1 + Math.cos(rad) * newLen;
      ent.y2 = ent.y1 + Math.sin(rad) * newLen;
      const ddx = ent.x2 - oldX2, ddy = ent.y2 - oldY2;
      updateLinkedDimensions(ent, ddx, ddy);
      clearDimTextCacheForEntity(ent.id);
      saveSnapshot(); render(); showPropsPanel(ent);
    });

    addPropField('Кут (°)', Math.round(angle * 10) / 10, (newAngle) => {
      const rad = newAngle * Math.PI / 180;
      const curLen = Math.hypot(ent.x2 - ent.x1, ent.y2 - ent.y1);
      ent.x2 = ent.x1 + Math.cos(rad) * curLen;
      ent.y2 = ent.y1 + Math.sin(rad) * curLen;
      saveSnapshot(); render(); showPropsPanel(ent);
    });

    addPropField('X1 (мм)', Math.round(ent.x1 * 10) / 10, v => { ent.x1 = v; saveSnapshot(); render(); showPropsPanel(ent); });
    addPropField('Y1 (мм)', Math.round(ent.y1 * 10) / 10, v => { ent.y1 = v; saveSnapshot(); render(); showPropsPanel(ent); });
    addPropField('X2 (мм)', Math.round(ent.x2 * 10) / 10, v => { ent.x2 = v; saveSnapshot(); render(); showPropsPanel(ent); });
    addPropField('Y2 (мм)', Math.round(ent.y2 * 10) / 10, v => { ent.y2 = v; saveSnapshot(); render(); showPropsPanel(ent); });
    addPropSeparator();
    addPropButton(`${iconHtml('dimension',13)} Додати розмір`, () => { autoAnnotate(ent); }, '#094771', '#007acc');
  } else if (ent.type==='rect') {
    propsTitle.textContent='Прямокутник';
    const w = Math.abs((ent.x2 || ent.x + ent.w || 0) - (ent.x1 || ent.x));
    const h = Math.abs((ent.y2 || ent.y + ent.h || 0) - (ent.y1 || ent.y));
    const posX = ent.x1 !== undefined ? Math.min(ent.x1, ent.x2) : (ent.x || 0);
    const posY = ent.y1 !== undefined ? Math.min(ent.y1, ent.y2) : (ent.y || 0);

    addPropField('Ширина (мм)', Math.round(w * 10) / 10, (newW) => {
      if (newW <= 0) return;
      if (ent.x2 !== undefined) { const mn = Math.min(ent.x1, ent.x2); ent.x1 = mn; ent.x2 = mn + newW; }
      else ent.w = newW;
      saveSnapshot(); render(); showPropsPanel(ent);
    });

    addPropField('Висота (мм)', Math.round(h * 10) / 10, (newH) => {
      if (newH <= 0) return;
      if (ent.y2 !== undefined) { const mn = Math.min(ent.y1, ent.y2); ent.y1 = mn; ent.y2 = mn + newH; }
      else ent.h = newH;
      saveSnapshot(); render(); showPropsPanel(ent);
    });

    addPropField('X (мм)', Math.round(posX * 10) / 10, v => {
      const dx = v - posX;
      if (ent.x1 !== undefined) { ent.x1 += dx; ent.x2 += dx; }
      else ent.x = v;
      saveSnapshot(); render(); showPropsPanel(ent);
    });

    addPropField('Y (мм)', Math.round(posY * 10) / 10, v => {
      const dy = v - posY;
      if (ent.y1 !== undefined) { ent.y1 += dy; ent.y2 += dy; }
      else ent.y = v;
      saveSnapshot(); render(); showPropsPanel(ent);
    });

    addPropSeparator();
    addPropReadonly('Площа', formatMM(w*h)+' мм²');
    addPropSeparator();
    addPropButton(`${iconHtml('dimension',13)} Додати розмір`, () => { autoAnnotate(ent); }, '#094771', '#007acc');
  } else if (ent.type==='circle') {
    propsTitle.textContent='Коло';

    addPropField('Радіус (мм)', Math.round((ent.r || 0) * 10) / 10, (newR) => {
      if (newR <= 0) return;
      ent.r = newR;
      clearDimTextCacheForEntity(ent.id);
      saveSnapshot(); render(); showPropsPanel(ent);
    });

    addPropField('Діаметр (мм)', Math.round((ent.r || 0) * 2 * 10) / 10, (newD) => {
      if (newD <= 0) return;
      ent.r = newD / 2;
      clearDimTextCacheForEntity(ent.id);
      saveSnapshot(); render(); showPropsPanel(ent);
    });

    addPropField('Центр X (мм)', Math.round(ent.cx * 10) / 10, v => { ent.cx = v; saveSnapshot(); render(); showPropsPanel(ent); });
    addPropField('Центр Y (мм)', Math.round(ent.cy * 10) / 10, v => { ent.cy = v; saveSnapshot(); render(); showPropsPanel(ent); });

    addPropSeparator();
    addPropReadonly('Діаметр', formatMM(ent.r*2)+' мм');
    addPropReadonly('Периметр', formatMM(2*Math.PI*ent.r)+' мм');
    addPropSeparator();
    addPropButton(`${iconHtml('dimension',13)} Додати розмір`, () => { autoAnnotate(ent); }, '#094771', '#007acc');
    addPropButton(`${iconHtml('centerline',13)} Осьові лінії`, () => {
      const ext = ent.r + 5;
      state.entities.push({
        id: state.nextId++, type: 'centerline',
        lineType: 'dash_dot', color: '#000000',
        x1: ent.cx - ext, y1: ent.cy, x2: ent.cx + ext, y2: ent.cy,
      });
      state.entities.push({
        id: state.nextId++, type: 'centerline',
        lineType: 'dash_dot', color: '#000000',
        x1: ent.cx, y1: ent.cy - ext, x2: ent.cx, y2: ent.cy + ext,
      });
      saveSnapshot(); render();
      showStatus('Осьові лінії додано');
    }, '#1a3a1a', '#2a6a2a');
  } else if (ent.type==='polyline') {
    propsTitle.textContent='Ламана лінія';
    addPropReadonly('Точок', ent.points.length);
    let tl=0;
    for(let i=0;i<ent.points.length-1;i++){const dx=ent.points[i+1].x-ent.points[i].x,dy=ent.points[i+1].y-ent.points[i].y;tl+=Math.sqrt(dx*dx+dy*dy);}
    addPropReadonly('Довжина', formatMM(tl)+' мм');
    addPropSeparator();
    addPropButton(`${iconHtml('dimension',13)} Додати розмір`, () => { autoAnnotate(ent); }, '#094771', '#007acc');
  } else if (ent.type==='arc') {
    propsTitle.textContent='Дуга';
    if (ent.isLine || !isFinite(ent.r)) {
      // ALWAYS show chord length — even for degenerate (isLine) arcs
      const chord = Math.hypot(ent.x2 - ent.x1, ent.y2 - ent.y1);

      addPropField('Довжина хорди (мм)', Math.round(chord * 100) / 100, (newChord) => {
        if (newChord <= 0) return;
        const scale  = newChord / (chord || 1);
        const midX   = (ent.x1 + ent.x2) / 2;
        const midY   = (ent.y1 + ent.y2) / 2;
        ent.x1 = midX + (ent.x1 - midX) * scale;
        ent.y1 = midY + (ent.y1 - midY) * scale;
        ent.x2 = midX + (ent.x2 - midX) * scale;
        ent.y2 = midY + (ent.y2 - midY) * scale;
        if (ent.ctrl) {
          ent.ctrl.x = midX + (ent.ctrl.x - midX) * scale;
          ent.ctrl.y = midY + (ent.ctrl.y - midY) * scale;
        } else {
          const dx = ent.x2 - ent.x1, dy = ent.y2 - ent.y1;
          const len = Math.hypot(dx, dy) || 1;
          ent.ctrl = {
            x: (ent.x1 + ent.x2) / 2 + (-dy / len) * 2.0,
            y: (ent.y1 + ent.y2) / 2 + ( dx / len) * 2.0,
          };
        }
        const d = calcArcFromThreePoints(
          { x: ent.x1, y: ent.y1 }, ent.ctrl, { x: ent.x2, y: ent.y2 }
        );
        if (d && !d.isLine) {
          ent.cx = d.cx; ent.cy = d.cy; ent.r = d.r;
          ent.startAngle = d.startAngle; ent.endAngle = d.endAngle;
          ent.sweepFlag = d.sweepFlag; ent.isLine = false;
        }
        clearDimTextCacheForEntity(ent.id);
        saveSnapshot(); render(); showPropsPanel(ent);
      });

      addPropField('X1 (мм)', Math.round(ent.x1 * 10) / 10, v => { ent.x1 = v; saveSnapshot(); render(); showPropsPanel(ent); });
      addPropField('Y1 (мм)', Math.round(ent.y1 * 10) / 10, v => { ent.y1 = v; saveSnapshot(); render(); showPropsPanel(ent); });
      addPropField('X2 (мм)', Math.round(ent.x2 * 10) / 10, v => { ent.x2 = v; saveSnapshot(); render(); showPropsPanel(ent); });
      addPropField('Y2 (мм)', Math.round(ent.y2 * 10) / 10, v => { ent.y2 = v; saveSnapshot(); render(); showPropsPanel(ent); });
      addPropSeparator();
      addPropButton(`${iconHtml('dimension',13)} Додати розмір`, () => { autoAnnotate(ent); }, '#094771', '#007acc');
    } else {
      const chord = Math.hypot(ent.x2 - ent.x1, ent.y2 - ent.y1);
      let sweep = ent.endAngle - ent.startAngle;
      if (sweep < 0) sweep += Math.PI * 2;
      const arcLen = ent.r * sweep;

      addPropField('Радіус (мм)', Math.round((ent.r || 0) * 10) / 10, (newR) => {
        if (newR <= 0) return;
        ent.r = newR;
        // Recompute arc from endpoints and new radius
        if (ent.ctrl) {
          const midX = (ent.x1 + ent.x2) / 2;
          const midY = (ent.y1 + ent.y2) / 2;
          const ctrlDx = ent.ctrl.x - midX;
          const ctrlDy = ent.ctrl.y - midY;
          const ctrlDist = Math.hypot(ctrlDx, ctrlDy) || 1;
          const halfChord = chord / 2;
          if (newR >= halfChord) {
            const arrow = newR - Math.sqrt(newR * newR - halfChord * halfChord);
            ent.ctrl = {
              x: midX + (ctrlDx / ctrlDist) * arrow,
              y: midY + (ctrlDy / ctrlDist) * arrow,
            };
            const d = calcArcFromThreePoints({ x: ent.x1, y: ent.y1 }, ent.ctrl, { x: ent.x2, y: ent.y2 });
            if (d && !d.isLine) {
              ent.cx = d.cx; ent.cy = d.cy; ent.r = d.r;
              ent.startAngle = d.startAngle; ent.endAngle = d.endAngle;
            }
          }
        }
        clearDimTextCacheForEntity(ent.id);
        saveSnapshot(); render(); showPropsPanel(ent);
      });

      addPropField('Довжина хорди (мм)', Math.round(chord * 10) / 10, (newChord) => {
        if (newChord <= 0) return;
        const scale = newChord / (chord || 1);
        const cx = (ent.x1 + ent.x2) / 2;
        const cy = (ent.y1 + ent.y2) / 2;
        ent.x1 = cx + (ent.x1 - cx) * scale;
        ent.y1 = cy + (ent.y1 - cy) * scale;
        ent.x2 = cx + (ent.x2 - cx) * scale;
        ent.y2 = cy + (ent.y2 - cy) * scale;
        if (ent.ctrl) {
          ent.ctrl.x = cx + (ent.ctrl.x - cx) * scale;
          ent.ctrl.y = cy + (ent.ctrl.y - cy) * scale;
        }
        const d = calcArcFromThreePoints({ x: ent.x1, y: ent.y1 }, ent.ctrl, { x: ent.x2, y: ent.y2 });
        if (d && !d.isLine) {
          ent.cx = d.cx; ent.cy = d.cy; ent.r = d.r;
          ent.startAngle = d.startAngle; ent.endAngle = d.endAngle;
        }
        saveSnapshot(); render(); showPropsPanel(ent);
      });

      addPropField('X1 (мм)', Math.round(ent.x1 * 10) / 10, v => { ent.x1 = v; saveSnapshot(); render(); showPropsPanel(ent); });
      addPropField('Y1 (мм)', Math.round(ent.y1 * 10) / 10, v => { ent.y1 = v; saveSnapshot(); render(); showPropsPanel(ent); });
      addPropField('X2 (мм)', Math.round(ent.x2 * 10) / 10, v => { ent.x2 = v; saveSnapshot(); render(); showPropsPanel(ent); });
      addPropField('Y2 (мм)', Math.round(ent.y2 * 10) / 10, v => { ent.y2 = v; saveSnapshot(); render(); showPropsPanel(ent); });

      addPropSeparator();
      addPropReadonly('Початок', (ent.startAngle * 180/Math.PI).toFixed(1) + '°');
      addPropReadonly('Кінець',  (ent.endAngle   * 180/Math.PI).toFixed(1) + '°');
      addPropReadonly('Кут',     (sweep * 180/Math.PI).toFixed(1) + '°');
      addPropReadonly('Довжина дуги', formatMM(arcLen) + ' мм');
      addPropSeparator();
      addPropButton(`${iconHtml('dimension',13)} Додати розмір`, () => { autoAnnotate(ent); }, '#094771', '#007acc');
      addPropButton(`${iconHtml('centerline',13)} Осьові лінії`, () => {
        const ext = Math.max(ent.r * 0.3, 5);
        state.entities.push({
          id: state.nextId++, type: 'centerline',
          lineType: 'dash_dot', color: '#000000',
          x1: ent.cx - ext, y1: ent.cy, x2: ent.cx + ext, y2: ent.cy,
        });
        state.entities.push({
          id: state.nextId++, type: 'centerline',
          lineType: 'dash_dot', color: '#000000',
          x1: ent.cx, y1: ent.cy - ext, x2: ent.cx, y2: ent.cy + ext,
        });
        saveSnapshot(); render();
        showStatus('Осьові лінії додано');
      }, '#1a3a1a', '#2a6a2a');
    }
  } else if (ent.type==='dimension') {
    propsTitle.textContent='Розмір';
    const dimLen = Math.hypot(ent.x2 - ent.x1, ent.y2 - ent.y1);

    // Show computed value (read-only display)
    addPropReadonly('Виміряне значення: ' + getDimensionDisplayText(ent));

    // Editable custom label (overrides computed value)
    addPropField('Мітка (текст)', ent.text || '', (val) => {
      ent.text = val.trim(); // empty = auto-compute
      saveSnapshot(); render();
    });

    addPropField('Відступ (мм)', Math.round((ent.offset || 0) * 10) / 10, (newOffset) => {
      ent.offset = newOffset;
      saveSnapshot(); render();
    });
  } else if (ent.type==='hatch') {
    propsTitle.textContent='Штриховка';
    addPropField('Кут (°)',   ent.angle   || 45,  v => { ent.angle   = v; saveSnapshot(); render(); });
    addPropField('Крок (мм)', ent.spacing || 3,   v => { ent.spacing = v; saveSnapshot(); render(); });
    addPropSeparator();
    addPropLabel('Стандартні кути:');
    [30, 45, 60].forEach(a => {
      addPropButton(`${a}°`, () => {
        ent.angle = a;
        saveSnapshot();
        render();
        showPropsPanel(ent);
      });
    });
  } else if (ent.type==='centerline') {
    propsTitle.textContent='Осьова лінія';
    const dx=ent.x2-ent.x1, dy=ent.y2-ent.y1, len=Math.sqrt(dx*dx+dy*dy);
    addPropField('X1 (мм)', ent.x1, v=>{ent.x1=v;});
    addPropField('Y1 (мм)', ent.y1, v=>{ent.y1=v;});
    addPropField('X2 (мм)', ent.x2, v=>{ent.x2=v;});
    addPropField('Y2 (мм)', ent.y2, v=>{ent.y2=v;});
    addPropSeparator();
    addPropReadonly('Довжина', formatMM(len)+' мм');
  } else if (ent.type === 'image') {
    propsTitle.textContent = 'Зображення-макет';
    addPropLabel('Зображення-макет');
    addPropSeparator();

    addPropField('X (мм)',      ent.x, v => { ent.x = v; saveSnapshot(); render(); });
    addPropField('Y (мм)',      ent.y, v => { ent.y = v; saveSnapshot(); render(); });
    addPropField('Ширина (мм)', ent.w, v => { ent.w = v; saveSnapshot(); render(); });
    addPropField('Висота (мм)', ent.h, v => { ent.h = v; saveSnapshot(); render(); });

    addPropSeparator();

    // Прозорість — слайдер
    addPropRange('Прозорість', ent.opacity || 0.4, 0.05, 1.0, 0.05, (v) => {
      ent.opacity = v;
      render();
    }, () => saveSnapshot());

    addPropSeparator();

    // Кнопка видалення зображення
    addPropButton(`<span style="display:flex;align-items:center;gap:6px;">
      <span style="width:13px;height:13px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/>
          <path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </span>
      Видалити зображення
    </span>`, () => {
      state.entities = state.entities.filter(e => e.id !== ent.id);
      state.selectedId = null;
      showPropsPanel(null);
      saveSnapshot();
      render();
    }, '#3a1a1a', '#6a2a2a');
  }
}

function addPropField(label, value, onChange) {
  const row = document.createElement('div'); row.className = 'prop-row';
  const lbl = document.createElement('span'); lbl.className = 'prop-label'; lbl.textContent = label;
  const inp = document.createElement('input');
  inp.type      = 'number';
  inp.className = 'prop-input';
  inp.step      = '0.1';
  const initial = (typeof value === 'number' && isFinite(value))
    ? parseFloat(formatMM(value))
    : value;
  inp.value = initial;

  // Ctrl+колесо — крок 0.1, Shift+колесо — 10, звичайне — 1
  inp.addEventListener('wheel', (e) => {
    if (document.activeElement !== inp) return;
    e.preventDefault();
    const step  = e.shiftKey ? 10 : (e.ctrlKey ? 0.1 : 1);
    const delta = e.deltaY < 0 ? step : -step;
    const cur   = parseFloat(inp.value) || 0;
    const next  = cur + delta;
    inp.value = e.ctrlKey ? next.toFixed(1) : String(Math.round(next));
    const parsed = parseFloat(inp.value);
    if (!isNaN(parsed)) { onChange(parsed); render(); }
  }, { passive: false });

  inp.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      e.preventDefault();
      const step  = e.shiftKey ? 10 : (e.ctrlKey ? 0.1 : 1);
      const delta = e.code === 'ArrowUp' ? step : -step;
      const cur   = parseFloat(inp.value) || 0;
      const next  = cur + delta;
      inp.value = e.ctrlKey ? next.toFixed(1) : String(Math.round(next));
      const parsed = parseFloat(inp.value);
      if (!isNaN(parsed)) { onChange(parsed); render(); }
    } else if (e.key === 'Enter') {
      const v = parseFloat(inp.value);
      if (!isNaN(v)) { onChange(v); clearDimTextCacheForEntity(ent.id); saveSnapshot(); render(); }
      inp.blur();
    } else if (e.key === 'Escape') {
      inp.value = initial;
      inp.blur();
    }
    e.stopPropagation();
  });

  inp.addEventListener('blur', () => {
    const v = parseFloat(inp.value);
    if (!isNaN(v)) {
      onChange(v);
      clearDimTextCacheForEntity(ent.id);
      saveSnapshot(); render();
      const e2 = state.entities.find(x => x.id === state.selectedId);
      if (e2) showPropsPanel(e2);
    }
  });

  inp.addEventListener('dblclick', () => inp.select());

  row.appendChild(lbl); row.appendChild(inp); propsBody.appendChild(row);
  return inp;
}

function addPropCheckbox(label, value, onChange) {
  const row = document.createElement('div');
  row.className = 'prop-row';
  row.style.cssText = 'display:flex; gap:8px; align-items:center; padding:2px 0;';

  const inp = document.createElement('input');
  inp.type    = 'checkbox';
  inp.checked = !!value;
  inp.style.cssText = 'width:14px; height:14px; cursor:pointer; accent-color:#007acc;';

  const lbl = document.createElement('label');
  lbl.textContent = label;
  lbl.style.cssText = 'font-size:11px; color:#ccc; cursor:pointer; user-select:none;';
  lbl.addEventListener('click', () => {
    inp.checked = !inp.checked;
    onChange(inp.checked);
  });

  inp.addEventListener('change', () => onChange(inp.checked));

  row.appendChild(inp);
  row.appendChild(lbl);
  propsBody.appendChild(row);
  return inp;
}

function addPropText(label, value, onChange) {
  const row = document.createElement('div'); row.className = 'prop-row';
  const lbl = document.createElement('span'); lbl.className = 'prop-label'; lbl.textContent = label;
  const inp = document.createElement('input');
  inp.type      = 'text';
  inp.className = 'prop-input';
  inp.value     = value || '';
  inp.placeholder = 'авто';
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { onChange(inp.value); saveSnapshot(); render(); inp.blur(); }
    if (e.key === 'Escape') { inp.value = value || ''; inp.blur(); }
    e.stopPropagation();
  });
  inp.addEventListener('blur', () => { onChange(inp.value); saveSnapshot(); render(); });
  row.appendChild(lbl); row.appendChild(inp); propsBody.appendChild(row);
  return inp;
}

function addPropReadonly(label, value) {
  const row=document.createElement('div'); row.className='prop-row';
  const lbl=document.createElement('span'); lbl.className='prop-label'; lbl.textContent=label;
  const val=document.createElement('span'); val.className='prop-readonly'; val.textContent=value;
  row.appendChild(lbl); row.appendChild(val); propsBody.appendChild(row);
}

function addPropSeparator() {
  const sep=document.createElement('div'); sep.className='prop-separator'; propsBody.appendChild(sep);
}

function addPropLabel(text) {
  const row=document.createElement('div'); row.className='prop-row';
  const lbl=document.createElement('span'); lbl.className='prop-label';
  lbl.textContent = text; lbl.style.color = '#888';
  row.appendChild(lbl); propsBody.appendChild(row);
}

function addPropSelect(label, value, options, onChange) {
  const row = document.createElement('div'); row.className = 'prop-row';
  const lbl = document.createElement('label'); lbl.className = 'prop-label'; lbl.textContent = label;
  const sel = document.createElement('select'); sel.className = 'prop-select';
  sel.style.cssText = 'flex:1; background:#1e1e1e; color:#ccc; border:1px solid #444; border-radius:3px; padding:2px 4px; font-size:11px;';
  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt.value; o.textContent = opt.label;
    if (opt.value === value) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => onChange(sel.value));
  row.appendChild(lbl); row.appendChild(sel); propsBody.appendChild(row);
}

function addPropColor(label, value, onChange) {
  const row = document.createElement('div'); row.className = 'prop-row';
  const lbl = document.createElement('label'); lbl.className = 'prop-label'; lbl.textContent = label;
  const inp = document.createElement('input'); inp.type = 'color'; inp.value = value;
  inp.style.cssText = 'flex:1; height:24px; border:1px solid #444; border-radius:3px; cursor:pointer; background:none;';
  inp.addEventListener('mousedown', e => e.stopPropagation());
  inp.addEventListener('click', e => e.stopPropagation());
  inp.addEventListener('input', () => onChange(inp.value));
  inp.addEventListener('change', () => { onChange(inp.value); saveSnapshot(); render(); });
  row.appendChild(lbl); row.appendChild(inp); propsBody.appendChild(row);
}

function addPropButton(label, onClick, bgColor, borderColor) {
  const row = document.createElement('div'); row.className = 'prop-row';
  const btn = document.createElement('button');
  // Підтримка як тексту, так і HTML
  btn.innerHTML = typeof label === 'string' ? label : '';
  if (typeof label !== 'string') btn.appendChild(label);
  const bg     = bgColor     || '#333';
  const border = borderColor || '#555';
  btn.style.cssText = `flex:1; background:${bg}; color:#ccc; border:1px solid ${border}; border-radius:3px; padding:4px 8px; cursor:pointer; font-size:11px; text-align:left; transition:filter 0.15s; display:flex; align-items:center; justify-content:center;`;
  btn.addEventListener('mouseenter', () => { btn.style.filter = 'brightness(1.2)'; });
  btn.addEventListener('mouseleave', () => { btn.style.filter = ''; });
  btn.addEventListener('click', onClick);
  row.appendChild(btn); propsBody.appendChild(row);
  return btn;
}

function addPropRange(label, value, min, max, step, onInput, onEnd) {
  const row = document.createElement('div');
  row.className = 'prop-row';
  row.style.flexDirection = 'column';
  row.style.gap = '2px';

  const topRow = document.createElement('div');
  topRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';

  const lbl = document.createElement('label');
  lbl.style.cssText = 'font-size:11px; color:#888;';
  lbl.textContent = label;

  const val = document.createElement('span');
  val.style.cssText = 'font-size:11px; color:#7ec8e3; font-family:monospace;';
  val.textContent = Math.round(value * 100) + '%';

  topRow.appendChild(lbl);
  topRow.appendChild(val);

  const slider = document.createElement('input');
  slider.type  = 'range';
  slider.min   = min;
  slider.max   = max;
  slider.step  = step;
  slider.value = value;
  slider.style.cssText = 'width:100%; accent-color:#007acc; cursor:pointer;';
  slider.addEventListener('mousedown', e => e.stopPropagation());
  slider.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

  slider.addEventListener('input', () => {
    val.textContent = Math.round(parseFloat(slider.value) * 100) + '%';
    if (onInput) onInput(parseFloat(slider.value));
  });
  slider.addEventListener('change', () => {
    if (onEnd) onEnd(parseFloat(slider.value));
  });

  row.appendChild(topRow);
  row.appendChild(slider);
  propsBody.appendChild(row);
}

// ═══════════════════════════════════════════════
// COORDINATE INPUT
// ═══════════════════════════════════════════════

function showCoordInput(label, defaultVal, callback) {
  state.coordInputActive=true; state.coordInputCallback=callback;
  coordLabel.textContent=label; coordField.value=defaultVal!==null?defaultVal:'';
  coordBox.style.display='flex';
  setTimeout(()=>{coordField.focus(); coordField.select();},50);
}

function hideCoordInput() {
  state.coordInputActive=false; state.coordInputCallback=null;
  coordBox.style.display='none'; coordField.value='';
}

// ═══════════════════════════════════════════════
// РЕДАГУВАННЯ РОЗМІРУ ПОДВІЙНИМ КЛІКОМ
// ═══════════════════════════════════════════════

function openDimensionEditDialog(ent) {
  const old = document.getElementById('dim-edit-dialog');
  if (old) old.remove();

  const dx  = ent.x2 - ent.x1;
  const dy  = ent.y2 - ent.y1;
  const currentLen = Math.sqrt(dx*dx + dy*dy);
  const displayLen = (!ent.text || ent.text === '0') ? formatMM(currentLen) : ent.text;

  // в"Ђв"Ђ Розрахувати позицію тексту розміру в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  const isHoriz = Math.abs(dx) >= Math.abs(dy);
  const midW = {
    x: (ent.x1 + ent.x2) / 2 + (isHoriz ? 0 : (ent.offset || 0)),
    y: (ent.y1 + ent.y2) / 2 + (isHoriz ? (ent.offset || 0) : 0),
  };
  const midSVG  = worldToSVG(midW.x, midW.y);
  const svgRect = drawingSvg.getBoundingClientRect();
  const screenX = svgRect.left + midSVG.x;
  const screenY = svgRect.top  + midSVG.y;

  const DLG_W  = 230;
  const DLG_H  = 190;
  const OFFSET = 16;

  let left = screenX + OFFSET;
  let top  = screenY - DLG_H / 2;

  if (left + DLG_W > window.innerWidth - 8) {
    left = screenX - DLG_W - OFFSET;
  }
  if (left < 8) left = 8;

  if (top + DLG_H > window.innerHeight - 8) {
    top = window.innerHeight - DLG_H - 8;
  }
  if (top < 8) top = 8;

  const dialog = document.createElement('div');
  dialog.id = 'dim-edit-dialog';
  dialog.style.cssText = `
    position: fixed;
    left: ${left}px;
    top:  ${top}px;
    background: #252526;
    border: 1px solid #007acc;
    border-radius: 4px;
    padding: 0;
    z-index: 10001;
    box-shadow: 0 4px 20px rgba(0,0,0,0.7);
    min-width: ${DLG_W}px;
    overflow: hidden;
    font-family: 'Segoe UI', system-ui, monospace;
    font-size: 12px;
    color: #cccccc;
    user-select: none;
  `;

  dialog.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;
                padding:8px 10px;background:#2d2d2d;
                border-bottom:1px solid #3e3e42;">
      <span style="color:#007acc;display:flex;align-items:center;
                   width:14px;height:14px;flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="2"  y1="12" x2="22" y2="12"/>
          <line x1="2"  y1="8"  x2="2"  y2="16"/>
          <line x1="22" y1="8"  x2="22" y2="16"/>
        </svg>
      </span>
      <span style="flex:1;font-size:12px;color:#cccccc;">
        Редагувати розмір
      </span>
      <button id="dim-edit-close" style="
        background:none;border:none;color:#555;cursor:pointer;
        display:flex;align-items:center;padding:2px;border-radius:2px;
        width:20px;height:20px;justify-content:center;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6"  y2="18"/>
          <line x1="6"  y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div style="padding:12px 12px 8px;">
      <div style="font-size:10px;color:#555;
                  text-transform:uppercase;letter-spacing:0.05em;
                  margin-bottom:6px;">
        Нове значення (мм)
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <input id="dim-edit-input" type="number"
          value="${parseFloat(displayLen) || parseFloat(currentLen.toFixed(2))}"
          step="0.1" min="0.1"
          style="flex:1;background:#1e1e1e;border:1px solid #3e3e42;
                 border-radius:3px;color:#ffffff;padding:6px 8px;
                 font-size:13px;font-family:monospace;
                 box-sizing:border-box;outline:none;user-select:text;">
        <span style="color:#555;font-size:11px;flex-shrink:0;">мм</span>
      </div>
      <div style="margin-top:6px;font-size:10px;color:#444;
                  display:flex;align-items:center;gap:4px;">
        <span>Зараз:</span>
        <span style="color:#555;font-family:monospace;">
          ${formatMM(currentLen)} мм
        </span>
      </div>
    </div>

    <div style="padding:0 12px 8px;display:flex;align-items:center;gap:8px;">
      <input type="checkbox" id="dim-edit-propagate"
        checked style="cursor:pointer;accent-color:#007acc;">
      <label for="dim-edit-propagate"
        style="font-size:11px;color:#858585;cursor:pointer;">
        Підігнати прив'язані об'єкти
      </label>
    </div>

    <div style="padding:8px 12px;border-top:1px solid #3e3e42;
                display:flex;gap:6px;justify-content:flex-end;">
      <button id="dim-edit-cancel" style="
        padding:5px 12px;background:transparent;
        border:1px solid #3e3e42;border-radius:3px;
        color:#858585;cursor:pointer;font-size:11px;font-family:inherit;">
        Скасувати
      </button>
      <button id="dim-edit-apply" style="
        padding:5px 12px;background:#094771;
        border:1px solid #007acc;border-radius:3px;
        color:#ffffff;cursor:pointer;font-size:11px;font-family:inherit;">
        Застосувати
      </button>
    </div>
  `;

  document.body.appendChild(dialog);

  const input = dialog.querySelector('#dim-edit-input');
  input.focus();
  input.select();

  function applyEdit() {
    const val = input.value.trim();
    const newLen = parseFloat(val);
    if (!isNaN(newLen) && newLen > 0) {
      const propagate = dialog.querySelector('#dim-edit-propagate').checked;
      saveSnapshot();
      applyDimensionResize(ent, newLen, propagate);
      dialog.remove();
      render();
      showStatus(`Розмір: ${formatMM(newLen)} мм`);
      return;
    }
    if (val !== '') {
      saveSnapshot();
      ent.text = val;
      dialog.remove();
      render();
      showStatus(`Мітка: ${val}`);
      return;
    }
    input.style.borderColor = '#f44336';
    input.focus();
    return;
    showStatus(`Розмір встановлено: ${formatMM(newLen)} мм`);
  }

  dialog.querySelector('#dim-edit-apply').onclick  = applyEdit;
  dialog.querySelector('#dim-edit-cancel').onclick = () => dialog.remove();
  dialog.querySelector('#dim-edit-close').onclick  = () => dialog.remove();

  input.addEventListener('keydown', e => {
    if (e.code === 'Enter')  { e.preventDefault(); applyEdit(); }
    if (e.code === 'Escape') dialog.remove();
  });

  input.addEventListener('focus',   () => input.style.borderColor = '#007acc');
  input.addEventListener('blur',    () => input.style.borderColor = '#3e3e42');

  ['#dim-edit-apply','#dim-edit-cancel','#dim-edit-close'].forEach(sel => {
    const btn = dialog.querySelector(sel);
    if (!btn) return;
    btn.addEventListener('mouseenter', () => {
      if (sel === '#dim-edit-apply')       btn.style.background = '#0e5c8a';
      else if (sel === '#dim-edit-cancel') btn.style.background = '#2a2d2e';
      else                                 btn.style.background = '#3e3e42';
    });
    btn.addEventListener('mouseleave', () => {
      if (sel === '#dim-edit-apply')       btn.style.background = '#094771';
      else if (sel === '#dim-edit-cancel') btn.style.background = 'transparent';
      else                                 btn.style.background = 'none';
    });
  });

  function outsideClick(ev) {
    if (!dialog.contains(ev.target)) {
      dialog.remove();
      document.removeEventListener('mousedown', outsideClick, true);
    }
  }
  setTimeout(() => {
    document.addEventListener('mousedown', outsideClick, true);
  }, 100);
}

function applyDimensionResizeLegacy(dim, newLen, propagate) {
  // Try parametric solver first (if available)
  if (typeof solveAndUpdateDimension === 'function' && dim.constraintId) {
    const solved = solveAndUpdateDimension(newLen, dim);
    if (solved) return; // Solver succeeded — no need for manual resize
  }
  const dx     = dim.x2 - dim.x1;
  const dy     = dim.y2 - dim.y1;
  const oldLen = Math.sqrt(dx*dx + dy*dy);
  if (oldLen < 0.001) return;

  const old = { x1: dim.x1, y1: dim.y1, x2: dim.x2, y2: dim.y2 };

  const ux = dx / oldLen;
  const uy = dy / oldLen;

  const newX2 = dim.x1 + ux * newLen;
  const newY2 = dim.y1 + uy * newLen;

  const ddx = newX2 - dim.x2;
  const ddy = newY2 - dim.y2;

  dim.x2 = newX2;
  dim.y2 = newY2;
  dim.text = '';

  if (!propagate) return;

  const TOLERANCE = 0.5;

  state.entities.forEach(ent => {
    if (ent.id === dim.id) return;
    if (ent.type === 'dimension') return;

    switch (ent.type) {
      case 'line':
        if (Math.hypot(ent.x1 - old.x2, ent.y1 - old.y2) < TOLERANCE) {
          ent.x1 += ddx; ent.y1 += ddy;
        }
        if (Math.hypot(ent.x2 - old.x2, ent.y2 - old.y2) < TOLERANCE) {
          ent.x2 += ddx; ent.y2 += ddy;
        }
        break;
      case 'rect':
        if (Math.hypot(ent.x2 - old.x2, ent.y2 - old.y2) < TOLERANCE) {
          ent.x2 += ddx; ent.y2 += ddy;
        }
        if (Math.hypot(ent.x1 - old.x2, ent.y1 - old.y2) < TOLERANCE) {
          ent.x1 += ddx; ent.y1 += ddy;
        }
        break;
      case 'circle':
        if (Math.hypot(ent.cx - old.x2, ent.cy - old.y2) < TOLERANCE) {
          ent.cx += ddx; ent.cy += ddy;
        }
        break;
      case 'arc':
        if (Math.hypot(ent.x1 - old.x2, ent.y1 - old.y2) < TOLERANCE) {
          ent.x1 += ddx; ent.y1 += ddy;
        }
        if (Math.hypot(ent.x2 - old.x2, ent.y2 - old.y2) < TOLERANCE) {
          ent.x2 += ddx; ent.y2 += ddy;
        }
        break;
      case 'polyline':
        if (ent.points) {
          ent.points.forEach(pt => {
            if (Math.hypot(pt.x - old.x2, pt.y - old.y2) < TOLERANCE) {
              pt.x += ddx; pt.y += ddy;
            }
          });
        }
        break;
    }
  });

  // Оновити інші dimension що прив'язані до точки що рухалась
  state.entities.forEach(ent => {
    if (ent.id === dim.id) return;
    if (ent.type !== 'dimension') return;
    if (Math.hypot(ent.x1 - old.x2, ent.y1 - old.y2) < TOLERANCE) {
      ent.x1 += ddx; ent.y1 += ddy;
    }
    if (Math.hypot(ent.x2 - old.x2, ent.y2 - old.y2) < TOLERANCE) {
      ent.x2 += ddx; ent.y2 += ddy;
    }
  });
}

// ═══════════════════════════════════════════════
// РЕНДЕРИНГ
// ═══════════════════════════════════════════════

function render() {
  const ez=effectiveZoom(), vw=viewport.clientWidth, vh=viewport.clientHeight;
  const dpr=window.devicePixelRatio||1;
  gridCanvas.width=vw*dpr; gridCanvas.height=vh*dpr;
  gridCanvas.style.width=vw+'px'; gridCanvas.style.height=vh+'px';
  gridCtx.setTransform(dpr,0,0,dpr,0,0);
  drawingSvg.setAttribute('width',vw); drawingSvg.setAttribute('height',vh);

  // Dynamic page dimensions based on format and orientation
  const fmt = PAGE_FORMATS[state.pageFormat];
  let pw = fmt.w, ph = fmt.h;
  if (state.pageOrientation === 'landscape' && !fmt.verticalOnly) {
    pw = fmt.h; ph = fmt.w;
  }

  const po=worldToSVG(0,0);
  pageRect.setAttribute('x',po.x); pageRect.setAttribute('y',po.y);
  pageRect.setAttribute('width',pw*ez); pageRect.setAttribute('height',ph*ez);
  pageRect.style.display = state.showPage ? '' : 'none';

  drawGrid(vw,vh); drawRulerH(); drawRulerV();
  renderPageFrame();
  drawPaperGrid();
  renderStamp();
  renderEntities(); updateSelectionStatus();
  renderEndpointMarkers();
  updateGridStatus();
  statusZoom.textContent=`Zoom: ${Math.round(state.zoom*100)}%`;

  // Update props panel if entity is selected
  if (state.selectedId !== null) {
    const ent = state.entities.find(e => e.id === state.selectedId);
    if (ent) showPropsPanel(ent);
    else showPropsPanel(null); // entity was deleted
  } else {
    // Only hide if no selection (avoid hiding during active editing)
    if (propsPanel.style.display !== 'none' && state.tool === 'select') {
      // keep visible if panel was manually opened
    }
  }

  if (state.isBoxSelecting && state.boxSelectRect) drawBoxSelectRect(state.boxSelectRect);
  else document.getElementById('box-select-rect')?.remove();
}

// Recursively move connected endpoints
function updateConnectedEndpoints(entId, epKey, oldX, oldY, newX, newY, visited) {
  if (visited.has(entId)) return;
  visited.add(entId);

  const conns = state.connections.filter(
    c => c.lineId === entId && c.endpoint === epKey
  );

  conns.forEach(conn => {
    if (visited.has(conn.targetId)) return;
    const target = state.entities.find(e => e.id === conn.targetId);
    if (!target) return;

    if (Math.hypot(target.x1 - oldX, target.y1 - oldY) < 1.0) {
      target.x1 = newX; target.y1 = newY;
      if (target.type === 'arc' && target.ctrl) refreshArcGeometry(target);
      updateConnectedEndpoints(target.id, 'start', oldX, oldY, newX, newY, visited);
    } else if (Math.hypot(target.x2 - oldX, target.y2 - oldY) < 1.0) {
      target.x2 = newX; target.y2 = newY;
      if (target.type === 'arc' && target.ctrl) refreshArcGeometry(target);
      updateConnectedEndpoints(target.id, 'end', oldX, oldY, newX, newY, visited);
    }
  });
}

function renderEndpointMarkers() {
  document.querySelectorAll('.endpoint-marker').forEach(el => el.remove());

  if (state.tool !== 'select') return;

  const idsToShow = new Set(state.selectedIds || []);
  if (state.selectedId !== null) idsToShow.add(state.selectedId);
  if (state.hoveredId !== null) idsToShow.add(state.hoveredId);
  if (idsToShow.size === 0) return;

  const svgNS = 'http://www.w3.org/2000/svg';

  idsToShow.forEach(id => {
    const ent = state.entities.find(e => e.id === id);
    if (!ent) return;
    if (ent.type !== 'line' && ent.type !== 'centerline' && ent.type !== 'arc') return;

    const points = [
      { x: ent.x1, y: ent.y1, idx: 0 },
      { x: ent.x2, y: ent.y2, idx: 1 },
    ];

    if (ent.type === 'line') {
      points.push({
        x: (ent.x1 + ent.x2) / 2,
        y: (ent.y1 + ent.y2) / 2,
        idx: 2,
        isMid: true,
      });
    }

    if (ent.type === 'arc') {
      // Create default ctrl if missing (degenerate arc / isLine)
      if (!ent.ctrl) {
        const dx = ent.x2 - ent.x1, dy = ent.y2 - ent.y1;
        const len = Math.hypot(dx, dy) || 1;
        ent.ctrl = {
          x: (ent.x1 + ent.x2) / 2 + (-dy / len) * 2.0,
          y: (ent.y1 + ent.y2) / 2 + ( dx / len) * 2.0,
        };
      }
      points.push({
        x: ent.ctrl.x,
        y: ent.ctrl.y,
        idx: 2,
        isCtrl: true,
      });
    }

    points.forEach(pt => {
      const sp = worldToSVG(pt.x, pt.y);

      if (pt.isMid || pt.isCtrl) {
        const size = 7;
        const diamond = document.createElementNS(svgNS, 'rect');
        diamond.setAttribute('x', (sp.x - size / 2).toFixed(1));
        diamond.setAttribute('y', (sp.y - size / 2).toFixed(1));
        diamond.setAttribute('width', size);
        diamond.setAttribute('height', size);
        diamond.setAttribute('transform', `rotate(45,${sp.x},${sp.y})`);
        diamond.setAttribute('fill', pt.isCtrl ? '#ff9500' : '#00aa44');
        diamond.setAttribute('stroke', '#fff');
        diamond.setAttribute('stroke-width', '1.5');
        diamond.setAttribute('class', 'endpoint-marker');
        diamond.setAttribute('data-ent-id', ent.id);
        diamond.setAttribute('data-pt-idx', pt.idx);
        diamond.style.cursor = 'crosshair';
        diamond.style.pointerEvents = 'all';
        diamond.addEventListener('mousedown', markerMousedown);
        drawingSvg.appendChild(diamond);
      } else {
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', sp.x.toFixed(1));
        circle.setAttribute('cy', sp.y.toFixed(1));
        circle.setAttribute('r', '5');
        circle.setAttribute('fill', 'white');
        circle.setAttribute('stroke', '#0066cc');
        circle.setAttribute('stroke-width', '1.5');
        circle.setAttribute('class', 'endpoint-marker');
        circle.setAttribute('data-ent-id', ent.id);
        circle.setAttribute('data-pt-idx', pt.idx);
        circle.style.cursor = 'crosshair';
        circle.style.pointerEvents = 'all';
        circle.addEventListener('mousedown', markerMousedown);
        drawingSvg.appendChild(circle);
      }
    });
  });
}

function markerMousedown(e) {
  e.stopPropagation();
  e.preventDefault();

  const entId = parseInt(this.getAttribute('data-ent-id'), 10);
  const ptIdx = parseInt(this.getAttribute('data-pt-idx'), 10);
  const ent = state.entities.find(en => en.id === entId);
  if (!ent) return;

  if (ptIdx === 2 && ent.type === 'line') {
    saveSnapshot();
    const midX = (ent.x1 + ent.x2) / 2;
    const midY = (ent.y1 + ent.y2) / 2;
    ent.type = 'arc';
    ent.ctrl = { x: midX, y: midY };
    ent.isLine = true;
    refreshArcGeometry(ent);
  }

  // Don't remove connections yet — save them temporarily for potential restore
  // Connections will be removed only when user actually starts dragging (mousemove)
  const epKey = ptIdx === 0 ? 'start' : 'end';
  state.dragEndpointPrevConns = state.connections.filter(
    c => (c.lineId === ent.id && c.endpoint === epKey) ||
         (c.targetId === ent.id) // reverse connections too
  );
  state.dragEndpointDisconnected = false; // not disconnected yet

  state.isDraggingEndpoint = true;
  state.dragEndpointEntId = ent.id;
  state.dragEndpointIdx = ptIdx;
  state.dragEndpointOrigX = ent.type === 'line'
    ? (ptIdx === 0 ? ent.x1 : ent.x2)
    : null;
  state.dragEndpointOrigY = ent.type === 'line'
    ? (ptIdx === 0 ? ent.y1 : ent.y2)
    : null;
  state.selectedId = ent.id;
  state.selectedIds = new Set([ent.id]);
  render();
}

function drawBoxSelectRect(r) {
  const svgNS = 'http://www.w3.org/2000/svg';
  let el = document.getElementById('box-select-rect');
  if (!el) {
    el = document.createElementNS(svgNS, 'rect');
    el.setAttribute('id', 'box-select-rect');
    el.setAttribute('fill', 'rgba(0,102,204,0.08)');
    el.setAttribute('stroke', '#0066cc');
    el.setAttribute('stroke-width', '1');
    el.setAttribute('stroke-dasharray', '4,2');
    el.style.pointerEvents = 'none';
    drawingSvg.appendChild(el);
  }

  const s1 = worldToSVG(r.x, r.y);
  const s2 = worldToSVG(r.x + r.w, r.y + r.h);
  el.setAttribute('x', s1.x);
  el.setAttribute('y', s1.y);
  el.setAttribute('width', Math.max(0, s2.x - s1.x));
  el.setAttribute('height', Math.max(0, s2.y - s1.y));
}

// Trims all line endpoints that stick out past a connection point
// ix = { x, y } — the junction point
// involvedIds = Set of entity IDs that were just moved to ix
function trimAllStubsAtPoint(ix, involvedIds) {
  const TOL = 1.5;

  // Collect all entities that have an endpoint AT the junction point
  const connectedAtJunction = [];
  state.entities.forEach(ent => {
    if (ent.type !== 'line' && ent.type !== 'centerline') return;
    if (involvedIds && involvedIds.size > 0 && involvedIds.has(ent.id)) return;
    const p1At = Math.hypot(ent.x1 - ix.x, ent.y1 - ix.y) < TOL;
    const p2At = Math.hypot(ent.x2 - ix.x, ent.y2 - ix.y) < TOL;
    if (p1At || p2At) connectedAtJunction.push(ent);
  });

  console.log('[TRIM] ix:', ix.x.toFixed(2), ix.y.toFixed(2));
  console.log('[TRIM] connectedAtJunction ids:', connectedAtJunction.map(e => e.id));
  connectedAtJunction.forEach((ent, i) => {
    console.log('[TRIM] ent', ent.id,
      'x1:', ent.x1.toFixed(2), 'y1:', ent.y1.toFixed(2),
      'x2:', ent.x2.toFixed(2), 'y2:', ent.y2.toFixed(2));
  });

  // For each entity connected at the junction:
  // Move its junction endpoint to exact ix position
  connectedAtJunction.forEach(ent => {
    const p1At = Math.hypot(ent.x1 - ix.x, ent.y1 - ix.y) < TOL;
    const p2At = Math.hypot(ent.x2 - ix.x, ent.y2 - ix.y) < TOL;

    if (p1At) { ent.x1 = ix.x; ent.y1 = ix.y; }
    if (p2At) { ent.x2 = ix.x; ent.y2 = ix.y; }

    if (ent.type === 'arc' && ent.ctrl) refreshArcGeometry(ent);
  });

  // Now trim overshoots: for each connected entity, check if its OTHER endpoint
  // sticks past any other connected entity's line
  for (let i = 0; i < connectedAtJunction.length; i++) {
    const ent = connectedAtJunction[i];
    const p1AtOrig = Math.hypot(ent.x1 - ix.x, ent.y1 - ix.y) < TOL;
    const p2AtOrig = Math.hypot(ent.x2 - ix.x, ent.y2 - ix.y) < TOL;

    // Find the free endpoint (not at junction)
    let freeX, freeY, freeIdx;
    if (p1AtOrig) { freeX = ent.x2; freeY = ent.y2; freeIdx = 1; }
    else if (p2AtOrig) { freeX = ent.x1; freeY = ent.y1; freeIdx = 0; }
    else continue; // both endpoints at junction — skip

    let freeT = undefined;
    let isOvershoot = false;

    // Check if free endpoint sticks past any other connected entity
    for (let j = 0; j < connectedAtJunction.length; j++) {
      if (i === j) continue;
      const other = connectedAtJunction[j];

      // Project free point onto other's line
      const dx = other.x2 - other.x1;
      const dy = other.y2 - other.y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq < 1e-10) continue;

      const otherP1At = Math.hypot(other.x1 - ix.x, other.y1 - ix.y) < TOL;
      const otherP2At = Math.hypot(other.x2 - ix.x, other.y2 - ix.y) < TOL;
      if (otherP1At === otherP2At) continue;

      freeT = ((freeX - other.x1) * dx + (freeY - other.y1) * dy) / lenSq;
      // Overshoot: free endpoint is outside the other line segment [0,1]
      isOvershoot = freeT < -0.01 || freeT > 1.01;

      if (isOvershoot) {
        console.log('[TRIM] ent', ent.id, 'freeIdx:', freeIdx,
          'freeT:', freeT?.toFixed(3), 'isOvershoot:', isOvershoot);
        const freeEpKey = freeIdx === 0 ? 'start' : 'end';
        const freeIsConnected = state.connections.some(
          c => c.lineId === ent.id && c.endpoint === freeEpKey
        );
        if (freeIsConnected) {
          console.log('[TRIM] ent', ent.id, 'free endpoint connected — skip trim');
          break; // Don't trim connected endpoint
        }
        console.log('[TRIM] ent', ent.id, '*** TRIMMED to', ix.x.toFixed(2), ix.y.toFixed(2));
        if (freeIdx === 0) { ent.x1 = ix.x; ent.y1 = ix.y; }
        else { ent.x2 = ix.x; ent.y2 = ix.y; }
        if (ent.type === 'arc' && ent.ctrl) refreshArcGeometry(ent);
        break; // trimmed, move to next entity
      }
    }
  }
}

function closeCanvasContextMenu() {
  document.getElementById('canvas-context-menu')?.remove();
}

function openCanvasContextMenu(x, y, items) {
  closeCanvasContextMenu();
  if (!items || items.length === 0) return;

  const menu = document.createElement('div');
  menu.id = 'canvas-context-menu';
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    min-width: 220px;
    background: #252526;
    border: 1px solid #3e3e42;
    border-radius: 6px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.45);
    z-index: 10002;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;

  items.forEach(item => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.label;
    btn.style.cssText = `
      text-align: left;
      background: transparent;
      border: 0;
      color: #ddd;
      padding: 8px 10px;
      border-radius: 4px;
      font: 12px/1.3 'Segoe UI', sans-serif;
      cursor: pointer;
    `;
    btn.addEventListener('mouseenter', () => { btn.style.background = '#094771'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
    btn.addEventListener('click', () => {
      closeCanvasContextMenu();
      item.action();
    });
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);

  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth - 8) menu.style.left = `${Math.max(8, x - rect.width)}px`;
  if (rect.bottom > window.innerHeight - 8) menu.style.top = `${Math.max(8, y - rect.height)}px`;
}

function drawGrid(vw, vh) {
  gridCtx.clearRect(0, 0, vw, vh);

  if (!state.gridVisible) return;

  const ez = effectiveZoom(); // px per mm

  // в"Ђв"Ђ Малі квадрати (1мм) в"Ђв"Ђ
  const smallStep = 1;
  const smallPx   = smallStep * ez;

  if (smallPx >= 3) {
    const startX = ((state.panX % smallPx) + smallPx) % smallPx;
    const startY = ((state.panY % smallPx) + smallPx) % smallPx;

    // Opacity: при smallPx=3 в†' 0, при smallPx=8 в†' 1
    const opacity = Math.min(1, (smallPx - 3) / 5);

    gridCtx.strokeStyle = `rgba(180, 180, 200, ${opacity * 0.6})`;
    gridCtx.lineWidth   = 0.5;

    gridCtx.beginPath();
    for (let x = startX; x <= vw; x += smallPx) {
      gridCtx.moveTo(Math.round(x) + 0.5, 0);
      gridCtx.lineTo(Math.round(x) + 0.5, vh);
    }
    for (let y = startY; y <= vh; y += smallPx) {
      gridCtx.moveTo(0, Math.round(y) + 0.5);
      gridCtx.lineTo(vw, Math.round(y) + 0.5);
    }
    gridCtx.stroke();
  }

  // в"Ђв"Ђ Великі квадрати (10мм) в"Ђв"Ђ
  const bigStep = 10;
  const bigPx   = bigStep * ez;

  if (bigPx >= 4) {
    const startX = ((state.panX % bigPx) + bigPx) % bigPx;
    const startY = ((state.panY % bigPx) + bigPx) % bigPx;

    gridCtx.strokeStyle = 'rgba(140, 140, 170, 0.7)';
    gridCtx.lineWidth   = 1;

    gridCtx.beginPath();
    for (let x = startX; x <= vw; x += bigPx) {
      gridCtx.moveTo(Math.round(x) + 0.5, 0);
      gridCtx.lineTo(Math.round(x) + 0.5, vh);
    }
    for (let y = startY; y <= vh; y += bigPx) {
      gridCtx.moveTo(0, Math.round(y) + 0.5);
      gridCtx.lineTo(vw, Math.round(y) + 0.5);
    }
    gridCtx.stroke();
  } else {
    // в"Ђв"Ђ Дуже зменшено: показуємо 100мм квадрати в"Ђв"Ђ
    const hugeStep = 100;
    const hugePx   = hugeStep * ez;
    if (hugePx >= 4) {
      const startX = ((state.panX % hugePx) + hugePx) % hugePx;
      const startY = ((state.panY % hugePx) + hugePx) % hugePx;

      gridCtx.strokeStyle = 'rgba(140, 140, 170, 0.7)';
      gridCtx.lineWidth   = 1;

      gridCtx.beginPath();
      for (let x = startX; x <= vw; x += hugePx) {
        gridCtx.moveTo(Math.round(x) + 0.5, 0);
        gridCtx.lineTo(Math.round(x) + 0.5, vh);
      }
      for (let y = startY; y <= vh; y += hugePx) {
        gridCtx.moveTo(0, Math.round(y) + 0.5);
        gridCtx.lineTo(vw, Math.round(y) + 0.5);
      }
      gridCtx.stroke();
    }
  }

  // в"Ђв"Ђ Осьові лінії (X=0, Y=0) в"Ђв"Ђ
  const origin = worldToSVG(0, 0);

  gridCtx.strokeStyle = 'rgba(100, 100, 140, 0.9)';
  gridCtx.lineWidth   = 1.5;
  gridCtx.beginPath();

  if (origin.x >= 0 && origin.x <= vw) {
    gridCtx.moveTo(Math.round(origin.x) + 0.5, 0);
    gridCtx.lineTo(Math.round(origin.x) + 0.5, vh);
  }
  if (origin.y >= 0 && origin.y <= vh) {
    gridCtx.moveTo(0,  Math.round(origin.y) + 0.5);
    gridCtx.lineTo(vw, Math.round(origin.y) + 0.5);
  }
  gridCtx.stroke();

  // в"Ђв"Ђ Мітка (0,0) в"Ђв"Ђ
  if (origin.x >= 0 && origin.x <= vw &&
      origin.y >= 0 && origin.y <= vh) {
    gridCtx.fillStyle = 'rgba(100,100,140,0.7)';
    gridCtx.font      = '10px sans-serif';
    gridCtx.fillText('0', origin.x + 3, origin.y - 3);
  }
}

// ═══════════════════════════════════════════════
// РЕНДЕРИНГ РАМКИ РђРКУША (ГОСТ 2.301-68)
// ═══════════════════════════════════════════════

function renderPageFrame() {
  const oldFrame = drawingSvg.querySelector('.page-frame');
  if (oldFrame) oldFrame.remove();

  if (!state.showPage) return;
  if (!state.showFrame) return;

  const fmt = PAGE_FORMATS[state.pageFormat];
  if (!fmt) return;

  let pw = fmt.w, ph = fmt.h;
  if (state.pageOrientation === 'landscape' && !fmt.verticalOnly) {
    pw = fmt.h; ph = fmt.w;
  }

  const ez = effectiveZoom();
  const g  = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.classList.add('page-frame');
  // Allow pointer events on stamp text for double-click editing\n  // g.setAttribute('pointer-events', 'none'); // REMOVED — enables stamp text editing

  // Зовнішній контур аркуша
  const outerSvg = worldToSVG(0, 0);
  const outerEnd = worldToSVG(pw, ph);

  const outerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  outerRect.setAttribute('x',            outerSvg.x);
  outerRect.setAttribute('y',            outerSvg.y);
  outerRect.setAttribute('width',        outerEnd.x - outerSvg.x);
  outerRect.setAttribute('height',       outerEnd.y - outerSvg.y);
  outerRect.setAttribute('fill',         'none');
  outerRect.setAttribute('stroke',       '#999');
  outerRect.setAttribute('stroke-width', '0.5');
  g.appendChild(outerRect);

  // Рамка за ГОСТ: 20мм зліва, 5мм Р· інших боків
  const frameX1 = FRAME_LEFT;
  const frameY1 = FRAME_OTHER;
  const frameX2 = pw - FRAME_OTHER;
  const frameY2 = ph - FRAME_OTHER;

  const fs1 = worldToSVG(frameX1, frameY1);
  const fs2 = worldToSVG(frameX2, frameY2);

  const frameRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  frameRect.setAttribute('x',            fs1.x);
  frameRect.setAttribute('y',            fs1.y);
  frameRect.setAttribute('width',        fs2.x - fs1.x);
  frameRect.setAttribute('height',       fs2.y - fs1.y);
  frameRect.setAttribute('fill',         'none');
  frameRect.setAttribute('stroke',       '#000');
  frameRect.setAttribute('stroke-width', (LINE_S_MM * ez * 2).toFixed(2));
  g.appendChild(frameRect);

  // Вставити рамку ПЕРШОЮ (під об'єктами)
  drawingSvg.insertBefore(g, drawingSvg.firstChild);
}

// ═══════════════════════════════════════════════
// МІЛІМЕТРІВКА НА РђРКУШІ
// ═══════════════════════════════════════════════

function drawPaperGrid() {
  const old = drawingSvg.querySelector('.paper-grid');
  if (old) old.remove();
  if (!state.paperGridVisible) {
    // Grid hidden by user — nothing to render
    return;
  }

  const fmt = PAGE_FORMATS[state.pageFormat];
  if (!fmt) return;

  let pw = fmt.w;
  let ph = fmt.h;
  if (state.pageOrientation === 'landscape' && !fmt.verticalOnly) {
    [pw, ph] = [ph, pw];
  }

  const ez = effectiveZoom();
  const svgNS = 'http://www.w3.org/2000/svg';

  let defs = drawingSvg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(svgNS, 'defs');
    drawingSvg.insertBefore(defs, drawingSvg.firstChild);
  }

  const oldClip = defs.querySelector('#paper-grid-clip');
  if (oldClip) oldClip.remove();

  const clipPath = document.createElementNS(svgNS, 'clipPath');
  clipPath.id = 'paper-grid-clip';

  const clipRect = document.createElementNS(svgNS, 'rect');
  const origin = worldToSVG(0, 0);
  const corner = worldToSVG(pw, ph);
  const clipW = corner.x - origin.x;
  const clipH = corner.y - origin.y;
  if (clipW <= 0 || clipH <= 0) {
    console.warn('[Grid] clipPath нульовий розмір');
    return;
  }

  clipRect.setAttribute('x', origin.x.toFixed(2));
  clipRect.setAttribute('y', origin.y.toFixed(2));
  clipRect.setAttribute('width', clipW.toFixed(2));
  clipRect.setAttribute('height', clipH.toFixed(2));
  clipPath.appendChild(clipRect);
  defs.appendChild(clipPath);

  const g = document.createElementNS(svgNS, 'g');
  g.classList.add('paper-grid');
  g.setAttribute('clip-path', 'url(#paper-grid-clip)');
  g.setAttribute('pointer-events', 'none');

  function addGridLines(stepMm, strokeColor, strokeW, opacity) {
    const stepPx = stepMm * ez;
    if (stepPx < 2) return;

    for (let x = 0; x <= pw + 0.001; x += stepMm) {
      const p1 = worldToSVG(x, 0);
      const p2 = worldToSVG(x, ph);
      const ln = document.createElementNS(svgNS, 'line');
      ln.setAttribute('x1', p1.x.toFixed(1));
      ln.setAttribute('y1', p1.y.toFixed(1));
      ln.setAttribute('x2', p2.x.toFixed(1));
      ln.setAttribute('y2', p2.y.toFixed(1));
      ln.setAttribute('stroke', strokeColor);
      ln.setAttribute('stroke-width', strokeW);
      ln.setAttribute('stroke-opacity', opacity);
      g.appendChild(ln);
    }

    for (let y = 0; y <= ph + 0.001; y += stepMm) {
      const p1 = worldToSVG(0, y);
      const p2 = worldToSVG(pw, y);
      const ln = document.createElementNS(svgNS, 'line');
      ln.setAttribute('x1', p1.x.toFixed(1));
      ln.setAttribute('y1', p1.y.toFixed(1));
      ln.setAttribute('x2', p2.x.toFixed(1));
      ln.setAttribute('y2', p2.y.toFixed(1));
      ln.setAttribute('stroke', strokeColor);
      ln.setAttribute('stroke-width', strokeW);
      ln.setAttribute('stroke-opacity', opacity);
      g.appendChild(ln);
    }
  }

  if (1 * ez >= 2) addGridLines(1, '#93c5fd', '0.8', '1.0');
  if (5 * ez >= 2) addGridLines(5, '#60a5fa', '1.0', '1.0');
  addGridLines(10, '#3b82f6', '1.2', '1.0');
  if (50 * ez >= 2) addGridLines(50, '#1d4ed8', '1.5', '1.0');

  const entitiesLayer = drawingSvg.querySelector('#entities-layer');
  if (entitiesLayer) {
    drawingSvg.insertBefore(g, entitiesLayer);
  } else {
    drawingSvg.appendChild(g);
  }
}
const STAMP_ABBR = {
  'Затверджено':           'Затв.',
  'Затвердив':             'Затв.',
  'Головний контролер':    'Р".контр.',
  'Головний конструктор':  'Р".констр.',
  'Нормоконтроль':         'Норм.',
  'Нормоконтролер':        'Норм.',
  'Технічний контроль':    'Техн.контр.',
  'Розробив':              'Розр.',
  'Розробник':             'Розр.',
  'Перевірив':             'Пер.',
  'Погодив':               'Пог.',
  'Відповідальний':        'Відп.',
};

function stampAbbreviate(text, maxChars) {
  if (!text) return '';
  const str = String(text);
  if (!maxChars || str.length <= maxChars) return str;

  if (STAMP_ABBR[str]) {
    const short = STAMP_ABBR[str];
    return short.length <= maxChars ? short : short.substring(0, maxChars - 1) + '…';
  }

  for (const full of Object.keys(STAMP_ABBR)) {
    if (str.startsWith(full)) {
      const rest = str.substring(full.length);
      const candidate = STAMP_ABBR[full] + rest;
      if (candidate.length <= maxChars) return candidate;
    }
  }

  return str.substring(0, Math.max(1, maxChars - 1)) + '…';
}

function renderStamp() {
  const oldStamp = drawingSvg.querySelector('.page-stamp');
  if (oldStamp) oldStamp.remove();

  if (!state.showStamp) return;

  const fmt = PAGE_FORMATS[state.pageFormat];
  if (!fmt) return;

  let pw = fmt.w, ph = fmt.h;
  if (state.pageOrientation === 'landscape' && !fmt.verticalOnly) {
    pw = fmt.h; ph = fmt.w;
  }

  const ez  = effectiveZoom();
  const sd  = state.stampData;
  const g   = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.classList.add('page-stamp');
  g.setAttribute('pointer-events', 'none');

  const stampW  = 185;
  const stampH  = 55;
  const stampX1 = pw  - FRAME_OTHER  - stampW;
  const stampY1 = ph  - FRAME_OTHER  - stampH;
  const stampX2 = pw  - FRAME_OTHER;
  const stampY2 = ph  - FRAME_OTHER;

  function stampLine(x1, y1, x2, y2, thick) {
    const s = worldToSVG(x1, y1);
    const e = worldToSVG(x2, y2);
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', s.x); l.setAttribute('y1', s.y);
    l.setAttribute('x2', e.x); l.setAttribute('y2', e.y);
    l.setAttribute('stroke', '#000');
    l.setAttribute('stroke-width', thick ? (LINE_S_MM * ez * 2).toFixed(2) : (LINE_S_MM * ez * 0.33).toFixed(2));
    g.appendChild(l);
  }

  // maxWidthMM: optional — when the natural text would exceed it we first
  // try to abbreviate via STAMP_ABBR, then squeeze glyphs via textLength.
  function stampText(x, y, text, fontSize, anchor, maxWidthMM) {
    const sv = worldToSVG(x, y);
    const t  = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x',           sv.x);
    t.setAttribute('y',           sv.y);
    t.setAttribute('font-family', 'Arial, sans-serif');
    t.setAttribute('font-size',   (fontSize * ez).toFixed(1));
    t.setAttribute('text-anchor', anchor || 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('fill',        '#000');
    let str = String(text || '');
    if (str && maxWidthMM && maxWidthMM > 0) {
      // Abbreviate first using the dictionary
      const maxChars = Math.max(3, Math.floor(maxWidthMM / (fontSize * 0.6)));
      str = stampAbbreviate(str, maxChars);
      // Still too long? Squeeze glyphs via textLength.
      const approxMM = str.length * fontSize * 0.6;
      if (approxMM > maxWidthMM * 0.92) {
        t.setAttribute('textLength',   (maxWidthMM * 0.92 * ez).toFixed(1));
        t.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      }
    }
    t.textContent = str;
    g.appendChild(t);
  }

  // Зовнішній контур штампу
  const ss = worldToSVG(stampX1, stampY1);
  const se = worldToSVG(stampX2, stampY2);
  const outerStamp = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  outerStamp.setAttribute('x',            ss.x);
  outerStamp.setAttribute('y',            ss.y);
  outerStamp.setAttribute('width',        se.x - ss.x);
  outerStamp.setAttribute('height',       se.y - ss.y);
  outerStamp.setAttribute('fill',         'white');
  outerStamp.setAttribute('stroke',       '#000');
  outerStamp.setAttribute('stroke-width', (LINE_S_MM * ez * 2).toFixed(2));
  g.appendChild(outerStamp);

  // Внутрішня розбивка штампу
  const rows = [0, 15, 25, 35, 45, 55];
  const cols = [0, 7, 17, 40, 55, 65, 135, 140, 157, 185];

  rows.forEach(dy => {
    if (dy === 0 || dy === 55) return;
    stampLine(stampX1, stampY1 + dy, stampX2, stampY1 + dy, false);
  });

  cols.forEach(dx => {
    if (dx === 0 || dx === 185) return;
    const colX = stampX1 + dx;
    if (dx >= 135) {
      stampLine(colX, stampY1, colX, stampY1 + 35, false);
    } else {
      stampLine(colX, stampY1, colX, stampY2, false);
    }
  });

  // Текстові підписи клітинок
  const fs = 2.0;
  stampText(stampX1 + 3.5,  stampY1 + 8,  'Змін', fs, 'middle');
  stampText(stampX1 + 12,   stampY1 + 8,  'Арк.',  fs, 'middle');
  stampText(stampX1 + 28.5, stampY1 + 8,  'в"–докум.', fs, 'middle');
  stampText(stampX1 + 47.5, stampY1 + 8,  'Підпис', fs, 'middle');
  stampText(stampX1 + 60,   stampY1 + 8,  'Дата',  fs, 'middle');

  const roles = ['Розроб.', 'Перевір.', 'Рў.контр.', 'Рќ.контр.', 'Затв.'];
  [15, 25, 35, 45, 55].forEach((dy, i) => {
    if (i < roles.length) {
      stampText(stampX1 + 3.5, stampY1 + dy + 5, roles[i], fs, 'middle');
    }
  });

  // Основні поля штампу (maxWidth забезпечує стиск довгих значень)
  const nameFs = sd.title ? Math.min(5, 70 / sd.title.length * 1.2) : 5;
  stampText(stampX1 + 65 + 35, stampY1 + 55/2 + 2, sd.title, Math.min(nameFs, 5), 'middle', 68);
  stampText(stampX1 + 65 + 35, stampY1 + 10, sd.docNumber, 3.5, 'middle', 68);
  stampText(stampX1 + 137.5, stampY1 + 20, sd.letter, 3.5, 'middle', 9);
  stampText(stampX1 + 148.5, stampY1 + 20, sd.mass, 3.5, 'middle', 15);
  stampText(stampX1 + 166,   stampY1 + 20, sd.scale, 3.5, 'middle', 16);
  stampText(stampX1 + 137.5, stampY1 + 30, sd.sheetNum, 3, 'middle', 9);
  stampText(stampX1 + 166,   stampY1 + 30, sd.sheetTotal, 3, 'middle', 16);
  stampText(stampX1 + 166,   stampY1 + 45, sd.org, 2.5, 'middle', 16);
  stampText(stampX1 + 28.5,  stampY1 + 20, sd.developer, fs, 'middle', 22);
  stampText(stampX1 + 28.5,  stampY1 + 30, sd.checker, fs, 'middle', 22);
  stampText(stampX1 + 60,    stampY1 + 20, sd.date, fs, 'middle', 9);

  drawingSvg.appendChild(g);
}

// ═══════════════════════════════════════════════
// HELPER: apply line style to SVG element
// ═══════════════════════════════════════════════

function applyLineStyle(el, ent, selected) {
  const ez = effectiveZoom();

  let strokeColor, strokeWidth, strokeDasharray;

  if (selected) {
    strokeColor     = '#0066cc';
    strokeWidth     = (LINE_S_MM * 3 * ez) * 0.5;
    strokeDasharray = 'none';
  } else {
    strokeColor = ent.color || '#000000';
    const lt = LINE_TYPES[ent.lineType] || LINE_TYPES['solid_thick'];
    strokeWidth = LINE_S_MM * ez * lt.widthFactor;

    if (lt.dasharray === 'none') {
      strokeDasharray = 'none';
    } else {
      strokeDasharray = lt.dasharray
        .split(',')
        .map(v => (parseFloat(v) * ez).toFixed(1))
        .join(',');
    }
  }

  el.setAttribute('stroke', strokeColor);
  el.setAttribute('stroke-width', strokeWidth.toFixed(2));
  el.setAttribute('fill', 'none');
  el.setAttribute('stroke-linecap', 'square');
  el.setAttribute('stroke-linejoin', 'miter');
  el.setAttribute('stroke-miterlimit', '10');
  if (strokeDasharray !== 'none') {
    el.setAttribute('stroke-dasharray', strokeDasharray);
    el.setAttribute('stroke-linecap', 'butt');
  } else {
    el.removeAttribute('stroke-dasharray');
  }
}

// ═══════════════════════════════════════════════
// ШТАМП EDITOR
// ═══════════════════════════════════════════════

function openStampEditor() {
  let modal = document.getElementById('stamp-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'stamp-modal';
  modal.style.cssText = `
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: #1e1e1e; border: 1px solid #007acc;
    border-radius: 6px; padding: 20px; z-index: 10000;
    min-width: 400px; color: #ccc; font-family: monospace;
    box-shadow: 0 8px 32px rgba(0,0,0,0.8);
  `;

  const sd = state.stampData;

  const fields = [
    { key: 'title',      label: 'Графа 1 — Найменування' },
    { key: 'docNumber',  label: 'Графа 2 — Позначення'   },
    { key: 'material',   label: 'Графа 3 — Матеріал'     },
    { key: 'letter',     label: 'Графа 4 — Літера'       },
    { key: 'mass',       label: 'Графа 5 — Маса'         },
    { key: 'scale',      label: 'Графа 6 — Масштаб'      },
    { key: 'sheetNum',   label: 'Графа 7 — Аркуш в"–'      },
    { key: 'sheetTotal', label: 'Графа 8 — Всього аркушів'},
    { key: 'org',        label: 'Графа 9 — Організація'  },
    { key: 'developer',  label: 'Розробив'               },
    { key: 'checker',    label: 'Перевірив'              },
    { key: 'date',       label: 'Дата'                   },
  ];

  modal.innerHTML = `<h3 style="margin:0 0 16px; color:#7ec8e3; font-size:14px;">
    Основний напис (штамп)</h3>`;

  fields.forEach(f => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; gap:8px; margin-bottom:8px; align-items:center;';
    row.innerHTML = `
      <label style="width:200px; font-size:11px; color:#888;">${f.label}:</label>
      <input type="text" value="${sd[f.key] || ''}"
             data-key="${f.key}"
             style="flex:1; background:#252525; border:1px solid #444;
                    color:#ccc; padding:4px 8px; border-radius:3px; font-size:12px;">
    `;
    modal.appendChild(row);
  });

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex; gap:8px; margin-top:16px; justify-content:flex-end;';
  btnRow.innerHTML = `
    <button id="stamp-cancel" style="padding:6px 16px; background:#333; border:1px solid #555;
            color:#ccc; border-radius:3px; cursor:pointer;">Скасувати</button>
    <button id="stamp-apply" style="padding:6px 16px; background:#094771; border:1px solid #007acc;
            color:#fff; border-radius:3px; cursor:pointer;">Застосувати</button>
  `;
  modal.appendChild(btnRow);
  document.body.appendChild(modal);

  document.getElementById('stamp-cancel').onclick = () => modal.remove();
  document.getElementById('stamp-apply').onclick = () => {
    modal.querySelectorAll('input[data-key]').forEach(inp => {
      sd[inp.dataset.key] = inp.value;
    });
    saveSnapshot();
    renderStamp();
    modal.remove();
    showStatus('Штамп оновлено');
  };
}

function renderEntities() {
  entitiesLayer.innerHTML='';

  // Знайти групи з'єднаних ліній і рендерити їх як <path> з miter join
  const rendered = new Set();
  const TOL = 0.5;

  for (const ent of state.entities) {
    if (!isEntityVisible(ent)) continue;
    if (rendered.has(ent.id)) continue;

    // Не-лінії/centerline рендерити звичайно
    if (ent.type !== 'line' && ent.type !== 'centerline') {
      const el = createEntitySVG(ent);
      if (el) entitiesLayer.appendChild(el);
      continue;
    }

    // Знайти ланцюжок з'єднаних ліній
    const chain = buildLineChain(ent, rendered, TOL);

    // Позначити ВСІ лінії chain як відрендерені ДО рендерингу
    chain.forEach(seg => rendered.add(seg.id));

    if (chain.length === 1) {
      // Одна лінія — рендерити як <line>
      const el = createEntitySVG(chain[0]);
      if (el) entitiesLayer.appendChild(el);
    } else {
      // Ланцюжок ліній — рендерити як <path> з miter join
      const pathEl = buildChainPath(chain, ent);
      if (pathEl) entitiesLayer.appendChild(pathEl);
    }
  }
}

// Знайти всі лінії з'єднані кінець-в-кінець
function buildLineChain(startEnt, alreadyRendered, TOL) {
  const chain = [startEnt];
  let changed = true;

  while (changed) {
    changed = false;
    const last = chain[chain.length - 1];

    // Зібрати ВСІ можливі кандидати
    const candidates = [];
    for (const other of state.entities) {
      if (alreadyRendered.has(other.id)) continue;
      if (chain.some(c => c.id === other.id)) continue;
      if (other.type !== 'line' && other.type !== 'centerline') continue;

      // Кінець останньої → початок іншої
      if (Math.hypot(last.x2 - other.x1, last.y2 - other.y1) < TOL) {
        candidates.push({ entity: other, flip: false });
      }
      // Кінець останньої → кінець іншої (треба перевернути)
      if (Math.hypot(last.x2 - other.x2, last.y2 - other.y2) < TOL) {
        candidates.push({ entity: other, flip: true });
      }
    }

    // Якщо кандидатів немає — зупинити
    if (candidates.length === 0) break;

    // Якщо кандидат 1 — взяти його
    // Якщо кандидатів >1 — взяти першого (всі вони з'єднані в тій самій точці)
    const pick = candidates[0];
    if (pick.flip) {
      chain.push({ ...pick.entity, x1: pick.entity.x2, y1: pick.entity.y2, x2: pick.entity.x1, y2: pick.entity.y1 });
    } else {
      chain.push(pick.entity);
    }
    changed = true;

    // Перевірити чи контур замкнувся (останній x2,y2 = перший x1,y1)
    const lastSeg = chain[chain.length - 1];
    const closesLoop = Math.hypot(lastSeg.x2 - chain[0].x1, lastSeg.y2 - chain[0].y1) < TOL;
    if (closesLoop) break;
  }
  return chain;
}

// Побудувати <path> з ланцюжка ліній
function buildChainPath(chain, originalEnt) {
  if (chain.length === 0) return null;
  const svgNS = 'http://www.w3.org/2000/svg';

  const sel = originalEnt.id === state.selectedId ||
              (state.selectedIds && state.selectedIds.has(originalEnt.id)) ||
              (state.boxHoverIds && state.boxHoverIds.has(originalEnt.id));

  const ez = effectiveZoom();
  let strokeColor = originalEnt.color || '#000000';
  let strokeWidth = LINE_S_MM * ez;
  let strokeDasharray = 'none';

  if (sel) {
    strokeColor = '#0066cc';
    strokeWidth = (LINE_S_MM * 3 * ez) * 0.5;
    strokeDasharray = 'none';
  } else {
    const lt = LINE_TYPES[originalEnt.lineType] || LINE_TYPES['solid_thick'];
    strokeWidth = LINE_S_MM * ez * lt.widthFactor;
    if (lt.dasharray !== 'none') {
      strokeDasharray = lt.dasharray
        .split(',')
        .map(v => (parseFloat(v) * ez).toFixed(1))
        .join(',');
    }
  }

  const s0 = worldToSVG(chain[0].x1, chain[0].y1);
  let d = `M ${s0.x.toFixed(2)} ${s0.y.toFixed(2)}`;

  // Check if loop closes BEFORE building path
  const lastSeg = chain[chain.length - 1];
  const closesLoop = Math.hypot(
    lastSeg.x2 - chain[0].x1,
    lastSeg.y2 - chain[0].y1
  ) < 1.0;

  for (let i = 0; i < chain.length; i++) {
    const seg = chain[i];
    // Skip last point if closing loop - Z will close it cleanly
    if (closesLoop && i === chain.length - 1) break;
    const s = worldToSVG(seg.x2, seg.y2);
    d += ` L ${s.x.toFixed(2)} ${s.y.toFixed(2)}`;
  }

  if (closesLoop) d += ' Z';

  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', sel ? 'rgba(0,102,204,0.05)' : 'none');
  path.setAttribute('stroke', strokeColor);
  path.setAttribute('stroke-width', strokeWidth.toFixed(2));
  path.setAttribute('stroke-linejoin', 'miter');
  path.setAttribute('stroke-miterlimit', '28');
  path.setAttribute('stroke-linecap', 'square');

  if (strokeDasharray !== 'none') {
    path.setAttribute('stroke-dasharray', strokeDasharray);
    path.setAttribute('stroke-linecap', 'butt');
  }

  path.dataset.id = originalEnt.id;
  path.dataset.type = originalEnt.type;

  return path;
}

// ═══════════════════════════════════════════════
// CREATE ENTITY SVG (renders a single entity)
// ═══════════════════════════════════════════════
function createEntitySVG(ent) {
  const sel = ent.id === state.selectedId ||
              (state.selectedIds && state.selectedIds.has(ent.id)) ||
              (state.boxHoverIds && state.boxHoverIds.has(ent.id));
  const ez  = effectiveZoom();

  // Determine line style
  let strokeColor, strokeWidth, strokeDasharray;

  if (sel) {
    strokeColor     = '#0066cc';
    strokeWidth     = (LINE_S_MM * 3 * ez) * 0.5;
    strokeDasharray = 'none';
  } else {
    strokeColor = ent.color || '#000000';
    const lt = LINE_TYPES[ent.lineType] || LINE_TYPES['solid_thick'];
    strokeWidth = LINE_S_MM * ez * lt.widthFactor;

    if (lt.dasharray === 'none') {
      strokeDasharray = 'none';
    } else {
      strokeDasharray = lt.dasharray
        .split(',')
        .map(v => (parseFloat(v) * ez).toFixed(1))
        .join(',');
    }
  }

  function applyStyle(el) {
    el.setAttribute('stroke', strokeColor);
    el.setAttribute('stroke-width', strokeWidth.toFixed(2));
    el.setAttribute('fill', sel ? 'rgba(0,102,204,0.05)' : 'none');
    el.setAttribute('stroke-linecap',  'square');
    el.setAttribute('stroke-linejoin', 'miter');
    el.setAttribute('stroke-miterlimit', '28');
    if (strokeDasharray !== 'none') {
      el.setAttribute('stroke-dasharray', strokeDasharray);
      el.setAttribute('stroke-linecap', 'butt');
    } else {
      el.removeAttribute('stroke-dasharray');
      el.setAttribute('stroke-linecap', 'square');
    }
  }

  // в"Ђв"Ђ Render by type в"Ђв"Ђ
  if (ent.type === 'line' || ent.type === 'centerline') {
    const p1 = worldToSVG(ent.x1, ent.y1);
    const p2 = worldToSVG(ent.x2, ent.y2);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p1.x.toFixed(2)); line.setAttribute('y1', p1.y.toFixed(2));
    line.setAttribute('x2', p2.x.toFixed(2)); line.setAttribute('y2', p2.y.toFixed(2));
    applyStyle(line);
    // Connected endpoint → butt, isolated endpoint → square
    const p1Connected = isEndpointConnected(ent.id, ent.x1, ent.y1);
    const p2Connected = isEndpointConnected(ent.id, ent.x2, ent.y2);
    const linecap = (p1Connected && p2Connected) ? 'butt' : 'square';
    line.setAttribute('stroke-linecap', linecap);
    line.setAttribute('stroke-linejoin', 'miter');
    line.setAttribute('stroke-miterlimit', '28');
    return line;
  }

  if (ent.type === 'rect') {
    const p1 = worldToSVG(ent.x1, ent.y1);
    const p2 = worldToSVG(ent.x2, ent.y2);
    const x = Math.min(p1.x, p2.x), y = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x), h = Math.abs(p2.y - p1.y);
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    el.setAttribute('x', x.toFixed(2)); el.setAttribute('y', y.toFixed(2));
    el.setAttribute('width', w.toFixed(2)); el.setAttribute('height', h.toFixed(2));
    applyStyle(el);
    return el;
  }

  if (ent.type === 'circle') {
    const c = worldToSVG(ent.cx, ent.cy);
    const r = ent.r * ez;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    el.setAttribute('cx', c.x.toFixed(2)); el.setAttribute('cy', c.y.toFixed(2));
    el.setAttribute('r', r.toFixed(2));
    applyStyle(el);
    return el;
  }

  if (ent.type === 'polyline') {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for (let i = 0; i < ent.points.length - 1; i++) {
      const p1 = worldToSVG(ent.points[i].x, ent.points[i].y);
      const p2 = worldToSVG(ent.points[i+1].x, ent.points[i+1].y);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', p1.x.toFixed(2)); line.setAttribute('y1', p1.y.toFixed(2));
      line.setAttribute('x2', p2.x.toFixed(2)); line.setAttribute('y2', p2.y.toFixed(2));
      applyStyle(line);
      g.appendChild(line);
    }
    return g;
  }

  if (ent.type === 'arc') {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const path = makeArcSVGPath(ent, strokeColor, strokeWidth.toFixed(2), strokeDasharray !== 'none' ? strokeDasharray : '');
    if (sel) path.setAttribute('filter', 'drop-shadow(0 0 3px #0066cc)');
    g.appendChild(path);

    // Keep the guide lines for the curve handle; the interactive markers
    // themselves are rendered separately so they stay clickable above SVG.
    if (sel && ent.ctrl && ent.x1 !== undefined) {
      const p1SVG = worldToSVG(ent.x1, ent.y1);
      const p2SVG = worldToSVG(ent.x2, ent.y2);
      const ctrlSVG = worldToSVG(ent.ctrl.x, ent.ctrl.y);

      g.appendChild(makeSVGLine(p1SVG.x, p1SVG.y, ctrlSVG.x, ctrlSVG.y, '#0066cc88', '1', '4,4'));
      g.appendChild(makeSVGLine(p2SVG.x, p2SVG.y, ctrlSVG.x, ctrlSVG.y, '#0066cc88', '1', '4,4'));
    }
    return g;
  }

  if (ent.type === 'dimension') {
    return renderDimensionEntity(ent, sel);
  }

  if (ent.type === 'hatch') {
    return renderHatch(ent);
  }

  if (ent.type === 'centerline') {
    return renderCenterline(ent, sel);
  }

  if (ent.type === 'image') {
    const p1 = worldToSVG(ent.x, ent.y);
    const p2 = worldToSVG(ent.x + ent.w, ent.y + ent.h);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.dataset.id = ent.id;

    // Рамка при виділенні
    if (sel) {
      const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      border.setAttribute('x',           p1.x.toFixed(2));
      border.setAttribute('y',           p1.y.toFixed(2));
      border.setAttribute('width',      (p2.x - p1.x).toFixed(2));
      border.setAttribute('height',     (p2.y - p1.y).toFixed(2));
      border.setAttribute('fill',       'none');
      border.setAttribute('stroke',     '#0066cc');
      border.setAttribute('stroke-width', '1.5');
      border.setAttribute('stroke-dasharray', '4,2');
      g.appendChild(border);
    }

    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttribute('x',                 p1.x.toFixed(2));
    img.setAttribute('y',                 p1.y.toFixed(2));
    img.setAttribute('width',            (p2.x - p1.x).toFixed(2));
    img.setAttribute('height',           (p2.y - p1.y).toFixed(2));
    img.setAttribute('href',             ent.src);
    img.setAttribute('opacity',          ent.opacity !== undefined ? ent.opacity : 0.5);
    img.setAttribute('preserveAspectRatio', 'none');
    g.appendChild(img);

    return g;
  }

  return null;
}

// в"Ђв"Ђ Clear text cache of all dimensions anchored to a given entity в"Ђв"Ђ
function clearDimTextCacheForEntity(entityId) {
  state.entities.forEach(dim => {
    if (dim.type !== 'dimension') return;
    if (!dim.anchoredTo) return;
    if (dim.anchoredTo.some(a => a.entityId === entityId)) {
      dim.text = '';
    }
  });
}

// в"Ђв"Ђ Get dimension display text — auto-detects radius/diameter/linear в"Ђв"Ђ
function getDimensionDisplayText(ent) {
  // If user set custom text — use it
  if (ent.text && ent.text !== '' && ent.text !== '0') return ent.text;

  if (ent.dimKind === 'radius') {
    // Find the anchored arc and get current radius
    const arc = ent.anchoredTo && ent.anchoredTo.length > 0
      ? state.entities.find(e => e.id === ent.anchoredTo[0].entityId)
      : null;
    const r = arc ? arc.r : ent.arcRadius;
    return 'R' + (Math.round((r || 0) * 10) / 10).toFixed(1);
  }

  if (ent.dimKind === 'diameter') {
    const circle = ent.anchoredTo && ent.anchoredTo.length > 0
      ? state.entities.find(e => e.id === ent.anchoredTo[0].entityId)
      : null;
    const r = circle ? circle.r : ent.arcRadius;
    return 'Ø' + (Math.round((r || 0) * 2 * 10) / 10).toFixed(1);
  }

  // Default: linear distance
  let len;
  if (ent.dimType === 'aligned') {
    len = Math.hypot(ent.x2 - ent.x1, ent.y2 - ent.y1);
  } else {
    const isHoriz = Math.abs(ent.x2 - ent.x1) >= Math.abs(ent.y2 - ent.y1);
    len = isHoriz ? Math.abs(ent.x2 - ent.x1) : Math.abs(ent.y2 - ent.y1);
  }
  return (Math.round(len * 10) / 10).toFixed(1);
}

// в"Ђв"Ђ Render dimension entity (GOST 2.307-68) — supports aligned, linear, radius, diameter в"Ђв"Ђ
function renderDimensionEntity(ent, selected) {
  console.log('[RENDER DIM] id:', ent.id, 'len:', Math.hypot(ent.x2-ent.x1, ent.y2-ent.y1).toFixed(2), 'text:', ent.text, 'dimKind:', ent.dimKind);

  const ez  = effectiveZoom();
  const g   = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.dataset.id    = ent.id;
  g.dataset.type  = 'dimension';

  // в"Ђв"Ђ Параметри ліній (ГОСТ 2.307-68) в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  const S         = LINE_S_MM * ez;
  const dimSW     = (S * 0.5).toFixed(2);       // розмірна лінія — тонка
  const extSW     = (S * 0.4).toFixed(2);       // виносна лінія — ще тонша
  const extOverMM = 1.5;
  const extOver   = extOverMM * ez;
  const dimColor  = selected ? '#0066cc' : (ent.color || '#000');
  const extColor  = selected ? '#0066cc' : (ent.color || '#000');

  // в"Ђв"Ђ Визначити вектор об'єкта в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  const dx     = ent.x2 - ent.x1;
  const dy     = ent.y2 - ent.y1;
  const entLen = Math.sqrt(dx * dx + dy * dy);
  if (entLen < 0.01) return null;

  // Одиничний вектор вздовж об'єкта
  const ux = entLen > 0.001 ? dx / entLen : 1;
  const uy = entLen > 0.001 ? dy / entLen : 0;

  // Перпендикуляр (нормаль) — напрям offset
  const nx = -uy;
  const ny =  ux;

  // в"Ђв"Ђ Точки прив'язки (на об'єкті) в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  const p1w = { x: ent.x1, y: ent.y1 };
  const p2w = { x: ent.x2, y: ent.y2 };

  // в"Ђв"Ђ Точки на розмірній лінії в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  let d1w, d2w;

  if (ent.dimType === 'aligned') {
    // ПОХИЛИЙ розмір: розмірна лінія паралельна до об'єкта
    d1w = { x: ent.x1 + nx * ent.offset, y: ent.y1 + ny * ent.offset };
    d2w = { x: ent.x2 + nx * ent.offset, y: ent.y2 + ny * ent.offset };
  } else {
    // ГОРИЗОНТАЛЬНИЙ або ВЕРТИКАЛЬНИЙ розмір
    const isHoriz = Math.abs(dx) >= Math.abs(dy);
    if (isHoriz) {
      d1w = { x: ent.x1, y: ent.y1 + ent.offset };
      d2w = { x: ent.x2, y: ent.y1 + ent.offset };
    } else {
      d1w = { x: ent.x1 + ent.offset, y: ent.y1 };
      d2w = { x: ent.x1 + ent.offset, y: ent.y2 };
    }
  }

  // в"Ђв"Ђ Конвертація РІ SVG координати в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  const p1s = worldToSVG(p1w.x, p1w.y);
  const p2s = worldToSVG(p2w.x, p2w.y);
  const d1s = worldToSVG(d1w.x, d1w.y);
  const d2s = worldToSVG(d2w.x, d2w.y);

  // в"Ђв"Ђ Вектор розмірної лінії в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  const dimDX  = d2s.x - d1s.x;
  const dimDY  = d2s.y - d1s.y;
  const dimLen = Math.sqrt(dimDX * dimDX + dimDY * dimDY);
  const dimUX = dimLen > 0.001 ? dimDX / dimLen : 1;
  const dimUY = dimLen > 0.001 ? dimDY / dimLen : 0;

  // в"Ђв"Ђ РОЗМІРНА ЛІНІЯ в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  const dimLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  dimLine.setAttribute('x1', d1s.x.toFixed(2));
  dimLine.setAttribute('y1', d1s.y.toFixed(2));
  dimLine.setAttribute('x2', d2s.x.toFixed(2));
  dimLine.setAttribute('y2', d2s.y.toFixed(2));
  dimLine.setAttribute('stroke',       dimColor);
  dimLine.setAttribute('stroke-width', dimSW);
  dimLine.setAttribute('stroke-linecap', 'butt');
  g.appendChild(dimLine);

  // в"Ђв"Ђ СТРІЛКИ (ГОСТ: куС' 15-20В°, довжина мін 2.5мм) в"Ђв"Ђв"Ђ
  if (ent.isRadius) {
    appendArrow(g, d2s.x, d2s.y,  dimUX,  dimUY, ez, dimColor);
  } else {
    appendArrow(g, d1s.x, d1s.y, -dimUX, -dimUY, ez, dimColor);
    appendArrow(g, d2s.x, d2s.y,  dimUX,  dimUY, ez, dimColor);
  }

  // в"Ђв"Ђ ВИНОСНІ ЛІНІЇ в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  function drawExtLine(pSvg, dSvg) {
    const exDX  = dSvg.x - pSvg.x;
    const exDY  = dSvg.y - pSvg.y;
    const exLen = Math.sqrt(exDX * exDX + exDY * exDY);
    if (exLen < 0.1) return;
    const exUX = exDX / exLen;
    const exUY = exDY / exLen;

    const gapMM  = 0.5;
    const gapPx  = gapMM * ez;
    const startX = pSvg.x + exUX * gapPx;
    const startY = pSvg.y + exUY * gapPx;
    const endX   = dSvg.x + exUX * extOver;
    const endY   = dSvg.y + exUY * extOver;

    const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    el.setAttribute('x1', startX.toFixed(2));
    el.setAttribute('y1', startY.toFixed(2));
    el.setAttribute('x2', endX.toFixed(2));
    el.setAttribute('y2', endY.toFixed(2));
    el.setAttribute('stroke',       extColor);
    el.setAttribute('stroke-width', extSW);
    el.setAttribute('stroke-linecap', 'butt');
    g.appendChild(el);
  }

  if (!ent.isRadius) {
    drawExtLine(p1s, d1s);
    drawExtLine(p2s, d2s);
  }

  // в"Ђв"Ђ РОЗМІРНЕ ЧИСЛО Р· фоном в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  const displayTxt = getDimensionDisplayText(ent);

  const fontSizePx  = 3.5 * ez;

  // Приблизна ширина тексту (Arial: ~0.6 * fontSize на символ)
  const charWidth   = fontSizePx * 0.62;
  const textW       = displayTxt.length * charWidth;
  const textH       = fontSizePx * 1.2;
  const textPadX    = fontSizePx * 0.4;
  const textPadY    = fontSizePx * 0.2;

  const midX = (d1s.x + d2s.x) / 2;
  const midY = (d1s.y + d2s.y) / 2;

  const textOffsetPx = 1.5 * ez;
  const perpSVGX     = -dimUY;
  const perpSVGY     =  dimUX;
  const textX = midX + perpSVGX * textOffsetPx;
  const textY = midY + perpSVGY * textOffsetPx;

  let angleDeg = Math.atan2(dimUY, dimUX) * 180 / Math.PI;
  if (angleDeg > 90 || angleDeg < -90) {
    angleDeg += 180;
  }

  // в"Ђв"Ђ Фоновий прямокутник в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  const textBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  textBg.setAttribute('x',      (textX - textW/2 - textPadX).toFixed(2));
  textBg.setAttribute('y',      (textY - textH   - textPadY).toFixed(2));
  textBg.setAttribute('width',  (textW + textPadX * 2).toFixed(2));
  textBg.setAttribute('height', (textH + textPadY * 2).toFixed(2));
  textBg.setAttribute('rx',     '1.5');
  textBg.setAttribute('fill',   '#ffffff');
  textBg.setAttribute('fill-opacity', '0.92');
  textBg.setAttribute('stroke', selected ? '#0066cc' : '#cccccc');
  textBg.setAttribute('stroke-width', '0.5');
  textBg.setAttribute('transform',
    `rotate(${angleDeg.toFixed(2)}, ${textX.toFixed(2)}, ${textY.toFixed(2)})`
  );
  g.appendChild(textBg); // ← СПОЧАТКУ фон

  // в"Ђв"Ђ Текст розміру в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x',           textX.toFixed(2));
  text.setAttribute('y',           textY.toFixed(2));
  text.setAttribute('font-family', 'Arial, sans-serif');
  text.setAttribute('font-size',   fontSizePx.toFixed(1));
  text.setAttribute('font-weight', '500');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'auto');
  // Колір тексту — темно-синій для розмірів
  text.setAttribute('fill', selected ? '#0044aa' : '#1a1a6e');
  text.setAttribute('transform',
    `rotate(${angleDeg.toFixed(2)}, ${textX.toFixed(2)}, ${textY.toFixed(2)})`
  );
  text.textContent = displayTxt;
  g.appendChild(text); // ← ПІСЛЯ фону

  // в"Ђв"Ђ Підсвічування при виділенні в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (selected) {
    [d1s, d2s].forEach(pt => {
      const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      handle.setAttribute('x',      (pt.x - 3).toFixed(2));
      handle.setAttribute('y',      (pt.y - 3).toFixed(2));
      handle.setAttribute('width',  '6');
      handle.setAttribute('height', '6');
      handle.setAttribute('fill',   '#0066cc');
      handle.setAttribute('fill-opacity', '0.3');
      handle.setAttribute('stroke', '#0066cc');
      handle.setAttribute('stroke-width', '0.8');
      g.appendChild(handle);
    });
  }

  return g;
}

// в"Ђв"Ђ GOST arrow: 15В° angle, length 2.5mm в"Ђв"Ђ
function appendArrow(g, tipX, tipY, dirUX, dirUY, ez, color) {
  const arrowLenMM = 2.5;
  const arrowHalfAngleDeg = 15;

  const arrowLen = arrowLenMM * ez;
  const arrowHalfAngle = arrowHalfAngleDeg * Math.PI / 180;

  const bx = -dirUX * arrowLen;
  const by = -dirUY * arrowLen;

  const halfWidth = arrowLen * Math.tan(arrowHalfAngle);
  const px = -dirUY * halfWidth;
  const py =  dirUX * halfWidth;

  const pts = [
    `${tipX.toFixed(2)},${tipY.toFixed(2)}`,
    `${(tipX + bx + px).toFixed(2)},${(tipY + by + py).toFixed(2)}`,
    `${(tipX + bx - px).toFixed(2)},${(tipY + by - py).toFixed(2)}`,
  ].join(' ');

  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  arrow.setAttribute('points', pts);
  arrow.setAttribute('fill',   color || '#000');
  arrow.setAttribute('stroke', 'none');
  g.appendChild(arrow);
}

// в"Ђв"Ђ Render hatch (GOST 2.306-68) в"Ђв"Ђ
function renderHatch(ent) {
  const ez   = effectiveZoom();
  const g    = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.dataset.id = ent.id;

  if (!ent.points || ent.points.length < 3) return g;

  const svgPts = ent.points.map(p => worldToSVG(p.x, p.y));

  const xs = svgPts.map(p => p.x);
  const ys = svgPts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const step    = (ent.spacing || 3) * ez;
  const angleDeg = ent.angle || 45;
  const angleRad = angleDeg * Math.PI / 180;

  const clipId = `hatch-clip-${ent.id}`;

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
  clip.setAttribute('id', clipId);
  const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  clipPath.setAttribute('points', svgPts.map(p => `${p.x},${p.y}`).join(' '));
  clip.appendChild(clipPath);
  defs.appendChild(clip);
  g.appendChild(defs);

  const linesG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  linesG.setAttribute('clip-path', `url(#${clipId})`);

  const diagLen = Math.sqrt((maxX-minX)**2 + (maxY-minY)**2);
  const cx      = (minX + maxX) / 2;
  const cy      = (minY + maxY) / 2;

  const perpX = Math.cos(angleRad + Math.PI/2);
  const perpY = Math.sin(angleRad + Math.PI/2);

  const count = Math.ceil(diagLen / step) + 2;
  const hatchColor = ent.color || '#000000';
  const hatchSW = LINE_S_MM * ez * 0.33;

  for (let i = -count; i <= count; i++) {
    const ox = cx + perpX * i * step;
    const oy = cy + perpY * i * step;

    const lx1 = ox - Math.cos(angleRad) * diagLen;
    const ly1 = oy - Math.sin(angleRad) * diagLen;
    const lx2 = ox + Math.cos(angleRad) * diagLen;
    const ly2 = oy + Math.sin(angleRad) * diagLen;

    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', lx1); l.setAttribute('y1', ly1);
    l.setAttribute('x2', lx2); l.setAttribute('y2', ly2);
    l.setAttribute('stroke',       hatchColor);
    l.setAttribute('stroke-width', hatchSW.toFixed(2));
    linesG.appendChild(l);
  }

  g.appendChild(linesG);

  const outline = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  outline.setAttribute('points', svgPts.map(p => `${p.x},${p.y}`).join(' '));
  outline.setAttribute('fill',         'none');
  outline.setAttribute('stroke',       hatchColor);
  outline.setAttribute('stroke-width', hatchSW.toFixed(2));
  g.appendChild(outline);

  return g;
}

// в"Ђв"Ђ Render centerline (GOST 2.303-68 type 5) в"Ђв"Ђ
function renderCenterline(ent, selected) {
  const ez  = effectiveZoom();

  const dx  = ent.x2 - ent.x1;
  const dy  = ent.y2 - ent.y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len < 0.001) return null;
  const ux = dx / len;
  const uy = dy / len;

  // Виходить за межі на 3мм
  const ext = 3;
  const x1e = ent.x1 - ux * ext;
  const y1e = ent.y1 - uy * ext;
  const x2e = ent.x2 + ux * ext;
  const y2e = ent.y2 + uy * ext;

  const s = worldToSVG(x1e, y1e);
  const e = worldToSVG(x2e, y2e);

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.dataset.id = ent.id;

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', s.x); line.setAttribute('y1', s.y);
  line.setAttribute('x2', e.x); line.setAttribute('y2', e.y);

  const strokeColor = selected ? '#0066cc' : (ent.color || '#000');
  const sw = LINE_S_MM * ez * 0.33;
  line.setAttribute('stroke', strokeColor);
  line.setAttribute('stroke-width', sw.toFixed(2));

  const dash = LINE_TYPES['dash_dot'].dasharray
    .split(',')
    .map(v => (parseFloat(v) * ez).toFixed(1))
    .join(',');
  line.setAttribute('stroke-dasharray', dash);
  line.setAttribute('stroke-linecap', 'butt');
  g.appendChild(line);

  return g;
}

function toolName(t){return{select:'Select',line:'Line',rect:'Rectangle',circle:'Circle',polyline:'Polyline',arc:'Arc',dimension:'Dimension'}[t]||t;}

function updateSelectionStatus() {
  if(state.selectedId===null){statusTool.textContent=`Інструмент: ${toolName(state.tool)}`;return;}
  const ent=state.entities.find(e=>e.id===state.selectedId); if(!ent) return;
  if(ent.type==='line'){const dx=ent.x2-ent.x1,dy=ent.y2-ent.y1;statusTool.textContent=`Лінія | Довжина: ${formatMM(Math.sqrt(dx*dx+dy*dy))}мм | Delete = видалити`;}
  else if(ent.type==='rect'){statusTool.textContent=`Прямокутник | ${formatMM(Math.abs(ent.x2-ent.x1))} × ${formatMM(Math.abs(ent.y2-ent.y1))}мм | Delete = видалити`;}
  else if(ent.type==='circle'){statusTool.textContent=`Коло | R: ${formatMM(ent.r)}мм | Delete = видалити`;}
  else if(ent.type==='polyline'){statusTool.textContent=`Ламана | ${ent.points.length} точок | Delete = видалити`;}
  else if(ent.type==='arc'){
    if(ent.isLine||!isFinite(ent.r)){
      const dx=ent.x2-ent.x1,dy=ent.y2-ent.y1;
      statusTool.textContent=`Дуга (пряма) | ${formatMM(Math.sqrt(dx*dx+dy*dy))}мм | Delete = видалити`;
    }else{
      let sweep=ent.endAngle-ent.startAngle;if(sweep<0)sweep+=Math.PI*2;
      statusTool.textContent=`Дуга | R: ${formatMM(ent.r)}мм КуС': ${(sweep*180/Math.PI).toFixed(1)}В° | Delete = видалити`;
    }
  }
  else if(ent.type==='dimension'){statusTool.textContent=`Розмір: ${ent._value||''} | Delete = видалити`;}
  else if(ent.type==='hatch'){statusTool.textContent=`Штриховка | ${ent.points.length} точок, куС':${ent.angle||45}В° | Delete = видалити`;}
  else if(ent.type==='centerline'){const dx=ent.x2-ent.x1,dy=ent.y2-ent.y1;statusTool.textContent=`Осьова | Довжина: ${formatMM(Math.sqrt(dx*dx+dy*dy))}мм | Delete = видалити`;}
}

// ═══════════════════════════════════════════════
// ІНСТРУМЕНТИ
// ═══════════════════════════════════════════════

function setTool(tool) {
  if(state.tool==='polyline'&&tool!=='polyline'){if(state.polylinePoints.length>=2)finishPolyline();else{state.polylinePoints=[];previewLayer.innerHTML='';}}
  // Reset hatch state
  if(state.tool==='hatch'&&tool!=='hatch'){
    if(state.hatchPoints&&state.hatchPoints.length>=3) finishHatch();
    else{state.hatchPoints=[];previewLayer.innerHTML='';}
  }
  // Reset arc and dimension state when switching tools
  if(state.tool!=='arc'){state.arcPhase=0;state.arcP1=null;state.arcDragId=null;}
  if(state.tool!=='dimension'){state.dimStep=0;state.dimP1=null;state.dimP2=null;}
  // Always reset lineStart when switching away from line tool
  if(state.tool==='line'&&tool!=='line'){state.lineStart=null;}

  state.tool=tool; state.lineStart=null; previewLayer.innerHTML='';
  [btnSelect,btnLine,btnRect,btnCircle,btnPolyline,btnArc,btnDimension,btnHatch,btnCenterline].forEach(b=>{if(b)b.classList.remove('active');});
  const bm={select:btnSelect,line:btnLine,rect:btnRect,circle:btnCircle,polyline:btnPolyline,arc:btnArc,dimension:btnDimension,hatch:btnHatch,centerline:btnCenterline};
  if(bm[tool]) bm[tool].classList.add('active');
  const nm={
    select:'Select (S)',line:'Line (L)',rect:'Rectangle (R)',circle:'Circle (C)',
    polyline:'Polyline (P) — dblclick завершити',
    arc:'Arc (A) — клік початок -> клік кінець -> тягни для вигину',
    dimension:'Dimension (D) — Point -> Point -> Offset',
    hatch:'Hatch (H) — клікай точки контуру -> dblclick завершити',
    centerline:'Centerline (X) — початок -> кінець'
  };
  statusTool.textContent='Інструмент: '+(nm[tool]||tool);
  viewport.style.cursor=tool==='select'?'default':'crosshair';

  if (tool === 'dimension') {
    showStatus('Розмір: клікніть першу точку вимірювання');
  }
}

function toggleSnap(){
  state.snapEnabled=!state.snapEnabled;
  btnSnap.classList.toggle('active',state.snapEnabled);

  // Show status in status bar
  showStatus(state.snapEnabled
    ? 'Магніт увімкнено (endpoint, midpoint, center)'
    : 'Магніт вимкнено');

  // If disabled — remove marker
  if(!state.snapEnabled){
    const marker=previewLayer.querySelector('.snap-marker');
    if(marker) marker.remove();
    state.snapPoint=null;
  }
}

function toggleGrid() {
  state.gridVisible = !state.gridVisible;
  if (btnGrid) btnGrid.classList.toggle('active', state.gridVisible);
  render();
}

function updateGridStatus() {
  const el = document.getElementById('status-grid');
  if (!el) return;
  const ez = effectiveZoom();
  let gridInfo;
  if (!state.gridVisible)      gridInfo = 'Сітка: вимк';
  else if (ez >= 3)            gridInfo = 'Сітка: 1мм / 10мм';
  else if (ez >= 0.4)          gridInfo = 'Сітка: 10мм';
  else                         gridInfo = 'Сітка: 100мм';
  el.textContent = gridInfo;
}

function finishPolyline(){
  if(state.polylinePoints.length<2){state.polylinePoints=[];previewLayer.innerHTML='';return;}
  const newPoly = {id:state.nextId++,type:'polyline',lineType:'solid_thick',points:[...state.polylinePoints]};
  state.entities.push(newPoly);
  state.polylinePoints=[]; previewLayer.innerHTML=''; saveSnapshot(); render();
  autoAnnotate(newPoly);
}

function finishHatch(){
  if(!state.hatchPoints||state.hatchPoints.length<3){state.hatchPoints=[];previewLayer.innerHTML='';return;}
  state.entities.push({
    id:state.nextId++, type:'hatch', lineType:'solid_thin',
    points:[...state.hatchPoints],
    angle:45, spacing:3, color:'#000000'
  });
  state.hatchPoints=[]; previewLayer.innerHTML=''; saveSnapshot(); render();
}

function deleteEntitiesWithLinkedDimensions(idsToDelete) {
  const TOL = 1.0;
  const extraDimIds = new Set();

  idsToDelete.forEach(id => {
    const ent = state.entities.find(e => e.id === id);
    if (!ent || ent.type === 'dimension') return;
    const snaps = getSnapPoints(ent);
    state.entities.forEach(dim => {
      if (dim.type !== 'dimension') return;
      if (idsToDelete.has(dim.id)) return;
      let linked = false;
      for (const sp of snaps) {
        if (Math.hypot(sp.x - dim.x1, sp.y - dim.y1) < TOL ||
            Math.hypot(sp.x - dim.x2, sp.y - dim.y2) < TOL) {
          linked = true;
          break;
        }
      }
      if (linked) extraDimIds.add(dim.id);
    });
  });

  const allToDelete = new Set([...idsToDelete, ...extraDimIds]);
  state.entities = state.entities.filter(e => !allToDelete.has(e.id));

  // Clean up connections for deleted entities
  state.connections = state.connections.filter(c =>
    !allToDelete.has(c.lineId) && !allToDelete.has(c.targetId)
  );

  return allToDelete.size;
}

// ═══════════════════════════════════════════════
// SAVE / LOAD
// ═══════════════════════════════════════════════

async function saveProject(){
  const activeProj = state.projects && state.projects[state.activeProjectIdx];
  const data={
    version:1,
    appName:'ToolCAD',
    created:new Date().toISOString(),
    page:{width:PAGE_W,height:PAGE_H,unit:'mm'},
    entities:state.entities.map(e=>({...e})),
    pageFormat: state.pageFormat,
    pageOrientation: state.pageOrientation,
    customPageW: state.customPageW || null,
    customPageH: state.customPageH || null,
    stampData: state.stampData || {},
    showStamp: state.showStamp !== false,
    projectName: activeProj ? activeProj.name : 'Проект',
  };
  const json = JSON.stringify(data, null, 2);
  /*
  if(window.electronAPI?.saveFile){const r=await window.electronAPI.saveFile(json);if(r.success)document.title=`ToolCAD — ${r.name}`;}
  else downloadText(json,'project.tcad','application/json');

  */
  if (window.electronAPI?.saveFile) {
    const r = await window.electronAPI.saveFile(json);
    if (r.success) {
      document.title = `ToolCAD — ${r.name}`;
    } else {
      return;
    }
  } else {
    downloadText(json, 'project.tcad', 'application/json');
  }

  // Mark active project as saved
  if (activeProj) {
    activeProj.dirty = false;
    activeProj.snap  = createProjectSnapshot();
    renderProjectTabs();
    showStatus(`Збережено: ${activeProj.name}`);
  }
}

async function loadProject(){
  if(window.electronAPI?.openFile){const r=await window.electronAPI.openFile();if(r.success&&r.content)parseAndLoad(r.content,r.name);}
  else{const i=document.createElement('input');i.type='file';i.accept='.tcad,.json';i.onchange=(e)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=(ev)=>parseAndLoad(ev.target.result,f.name);r.readAsText(f);};i.click();}
}

function parseAndLoad(jsonStr,filename){
  try{
    const data=JSON.parse(jsonStr);
    if(!data.entities||!Array.isArray(data.entities)){alert('Невірний формат файлу');return;}

    // Restore page format if present
    if (data.pageFormat) {
      state.pageFormat = data.pageFormat;
      if (data.pageOrientation) state.pageOrientation = data.pageOrientation;

      // Restore custom page size
      if (data.pageFormat === 'custom' && data.customPageW && data.customPageH) {
        state.customPageW = data.customPageW;
        state.customPageH = data.customPageH;
        PAGE_FORMATS['custom'] = {
          w: data.customPageW,
          h: data.customPageH,
          name: `Кастом ${data.customPageW}×${data.customPageH}`,
          verticalOnly: false,
        };
        // Add custom option to select if not present
        if (!selPageFormat.querySelector('[value="custom"]')) {
          const opt = document.createElement('option');
          opt.value = 'custom';
          opt.textContent = '✏ Свій...';
          selPageFormat.appendChild(opt);
        }
      }
      selPageFormat.value = state.pageFormat;

      if (btnOrientation) btnOrientation.disabled = false;
    }

    if (data.stampData && typeof data.stampData === 'object') {
      state.stampData = { ...state.stampData, ...data.stampData };
    }
    if (data.showStamp !== undefined) state.showStamp = !!data.showStamp;

    state.entities=data.entities;
    state.nextId=Math.max(0,...data.entities.map(e=>e.id))+1;
    state.selectedId=null; state.lineStart=null; state.polylinePoints=[];

    // Rebuild connections from loaded entities
    state.connections = [];
    state.entities.forEach(ent => {
      if (ent.type === 'line' || ent.type === 'centerline') {
        const conns = buildLineConnections(ent.id, ent.x1, ent.y1, ent.x2, ent.y2);
        state.connections.push(...conns);
      }
    });

    previewLayer.innerHTML=''; saveSnapshot(); render(); zoomToFit();

    // Update active project metadata from loaded file
    const projName = (data.projectName && String(data.projectName).trim()) ||
      String(filename || 'Завантажений проект').replace(/\.(json|chisel|cad|tcad)$/i, '');
    if (state.projects && state.projects[state.activeProjectIdx]) {
      state.projects[state.activeProjectIdx].name  = projName;
      state.projects[state.activeProjectIdx].dirty = false;
      state.projects[state.activeProjectIdx].snap  = createProjectSnapshot();
      renderProjectTabs();
    }
    document.title = `${projName} — ToolCAD`;
  }catch(err){alert('Помилка читання файлу: '+err.message);}
}

// ═══════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════

function downloadText(content,filename,mime){
  const b=new Blob([content],{type:mime}),u=URL.createObjectURL(b);
  const a=document.createElement('a');a.href=u;a.download=filename;a.click();URL.revokeObjectURL(u);
}

// Export options dialog — shared by PNG and SVG export
function showExportOptionsDialog(format, onConfirm) {
  const old = document.getElementById('export-options-dialog');
  if (old) old.remove();

  const dialog = document.createElement('div');
  dialog.id = 'export-options-dialog';
  dialog.style.cssText = `
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: #1e2a3a; border: 1px solid #007acc;
    border-radius: 6px; padding: 20px; z-index: 99999;
    color: #ccc; font-family: monospace; font-size: 13px;
    min-width: 280px; box-shadow: 0 8px 32px rgba(0,0,0,0.8);
  `;

  dialog.innerHTML = `
    <div style="color:#7ec8e3;font-size:14px;margin-bottom:16px;">
      Параметри експорту ${format.toUpperCase()}
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
        <input type="checkbox" id="exp-show-stamp" ${state.showStamp ? 'checked' : ''}
          style="width:14px;height:14px;accent-color:#007acc;">
        <span>Включити штамп</span>
      </label>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
        <input type="checkbox" id="exp-show-grid" ${state.paperGridVisible ? 'checked' : ''}
          style="width:14px;height:14px;accent-color:#007acc;">
        <span>Включити міліметрівку</span>
      </label>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
        <input type="checkbox" id="exp-show-page" ${state.showPage ? 'checked' : ''}
          style="width:14px;height:14px;accent-color:#007acc;">
        <span>Включити рамку аркуша</span>
      </label>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button id="exp-cancel"
        style="padding:6px 16px;background:#333;border:1px solid #555;
               color:#ccc;border-radius:3px;cursor:pointer;font-size:12px;">
        Скасувати
      </button>
      <button id="exp-confirm"
        style="padding:6px 16px;background:#094771;border:1px solid #007acc;
               color:#fff;border-radius:3px;cursor:pointer;font-size:12px;">
        Експортувати
      </button>
    </div>
  `;

  document.body.appendChild(dialog);

  document.getElementById('exp-cancel').onclick = () => dialog.remove();

  document.getElementById('exp-confirm').onclick = () => {
    const opts = {
      showStamp: document.getElementById('exp-show-stamp').checked,
      showGrid:  document.getElementById('exp-show-grid').checked,
      showPage:  document.getElementById('exp-show-page').checked,
    };
    dialog.remove();
    onConfirm(opts);
  };
}

async function exportSVG(){
  showExportOptionsDialog('svg', (opts) => {
    doExportSVG(opts);
  });
}

async function doExportSVG(opts){
  const savedStamp  = state.showStamp;
  const savedGrid   = state.paperGridVisible;
  const savedPage   = state.showPage;

  state.showStamp        = opts.showStamp;
  state.paperGridVisible = opts.showGrid;
  state.showPage         = opts.showPage;
  render();

  const fmt = PAGE_FORMATS[state.pageFormat];
  let pw = fmt.w, ph = fmt.h;
  if (state.pageOrientation === 'landscape' && !fmt.verticalOnly) {
    pw = fmt.h; ph = fmt.w;
  }

  const l=[];
  l.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  l.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}mm" height="${ph}mm" viewBox="0 0 ${pw} ${ph}">`);
  l.push(`  <desc>ToolCAD Export</desc>`);
  l.push(`  <defs>`);
  l.push(`    <clipPath id="export-clip"><rect x="0" y="0" width="${pw.toFixed(3)}" height="${ph.toFixed(3)}"/></clipPath>`);
  l.push(`  </defs>`);
  l.push(`  <rect x="0" y="0" width="${pw}" height="${ph}" fill="white" stroke="#ccc" stroke-width="0.1"/>`);

  // Рамка
  if (state.showFrame || opts.showPage) {
    const frameX1 = FRAME_LEFT;
    const frameY1 = FRAME_OTHER;
    const frameX2 = pw - FRAME_OTHER;
    const frameY2 = ph - FRAME_OTHER;
    l.push(`  <rect x="${frameX1.toFixed(3)}" y="${frameY1.toFixed(3)}" width="${(frameX2-frameX1).toFixed(3)}" height="${(frameY2-frameY1).toFixed(3)}" fill="none" stroke="#000" stroke-width="${(LINE_S_MM*2).toFixed(3)}"/>`);
  }

  // Grid
  if (opts.showGrid) {
    const gridGroup = [];
    gridGroup.push(`  <g id="grid" stroke-width="0.05">`);

    // Small grid - 1mm
    gridGroup.push(`    <g stroke="rgba(180,180,200,0.5)">`);
    for (let x = 1; x < pw; x += 1) {
      gridGroup.push(`      <line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${ph.toFixed(1)}"/>`);
    }
    for (let y = 1; y < ph; y += 1) {
      gridGroup.push(`      <line x1="0" y1="${y.toFixed(1)}" x2="${pw.toFixed(1)}" y2="${y.toFixed(1)}"/>`);
    }
    gridGroup.push(`    </g>`);

    // Big grid - 10mm
    gridGroup.push(`    <g stroke="rgba(140,140,170,0.8)" stroke-width="0.1">`);
    for (let x = 10; x < pw; x += 10) {
      gridGroup.push(`      <line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${ph.toFixed(1)}"/>`);
    }
    for (let y = 10; y < ph; y += 10) {
      gridGroup.push(`      <line x1="0" y1="${y.toFixed(1)}" x2="${pw.toFixed(1)}" y2="${y.toFixed(1)}"/>`);
    }
    gridGroup.push(`    </g>`);

    gridGroup.push(`  </g>`);
    l.push(...gridGroup);
  }

  l.push(`  <g clip-path="url(#export-clip)">`);
  // Entities
  const renderedLineIds = new Set();
  const EXPORT_CHAIN_TOL = 0.5;

  function buildExportChain(startEnt) {
    const chain = [startEnt];
    renderedLineIds.add(startEnt.id);

    // Extend forward
    let tail = startEnt;
    for (let i = 0; i < state.entities.length; i++) {
      let found = false;
      for (const other of state.entities) {
        if (renderedLineIds.has(other.id)) continue;
        if (other.type !== 'line' && other.type !== 'centerline') continue;
        if (other.lineType !== startEnt.lineType) continue;
        if (other.color !== startEnt.color) continue;
        if (Math.hypot(other.x1 - tail.x2, other.y1 - tail.y2) < EXPORT_CHAIN_TOL) {
          chain.push(other);
          renderedLineIds.add(other.id);
          tail = other;
          found = true;
          break;
        }
      }
      if (!found) break;
    }

    // Extend backward
    let head = startEnt;
    for (let i = 0; i < state.entities.length; i++) {
      let found = false;
      for (const other of state.entities) {
        if (renderedLineIds.has(other.id)) continue;
        if (other.type !== 'line' && other.type !== 'centerline') continue;
        if (other.lineType !== startEnt.lineType) continue;
        if (other.color !== startEnt.color) continue;
        if (Math.hypot(other.x2 - head.x1, other.y2 - head.y1) < EXPORT_CHAIN_TOL) {
          chain.unshift(other);
          renderedLineIds.add(other.id);
          head = other;
          found = true;
          break;
        }
      }
      if (!found) break;
    }

    return chain;
  }

  for(const ent of state.entities){
    const lt = LINE_TYPES[ent.lineType] || LINE_TYPES['solid_thick'];
    const sw = LINE_S_MM * lt.widthFactor;
    const color = ent.color || '#000';
    const dash = lt.dasharray !== 'none' ? ` stroke-dasharray="${lt.dasharray}"` : '';

    if (ent.type === 'line' || ent.type === 'centerline') {
      if (renderedLineIds.has(ent.id)) continue;

      const chain = buildExportChain(ent);

      if (chain.length === 1) {
        l.push(`  <line x1="${ent.x1.toFixed(3)}" y1="${ent.y1.toFixed(3)}" x2="${ent.x2.toFixed(3)}" y2="${ent.y2.toFixed(3)}" stroke="${color}" stroke-width="${sw.toFixed(3)}"${dash} stroke-linecap="round"/>`);
      } else {
        const lastSeg = chain[chain.length - 1];
        const closesLoop = Math.hypot(
          lastSeg.x2 - chain[0].x1,
          lastSeg.y2 - chain[0].y1
        ) < EXPORT_CHAIN_TOL;

        let d = `M ${chain[0].x1.toFixed(3)} ${chain[0].y1.toFixed(3)}`;
        for (let i = 0; i < chain.length; i++) {
          const seg = chain[i];
          if (closesLoop && i === chain.length - 1) break;
          d += ` L ${seg.x2.toFixed(3)} ${seg.y2.toFixed(3)}`;
        }
        if (closesLoop) d += ' Z';

        l.push(`  <path d="${d}" stroke="${color}" stroke-width="${sw.toFixed(3)}"${dash} fill="none" stroke-linejoin="miter" stroke-linecap="square"/>`);
      }
    }
    else if(ent.type==='rect'){
      const x=Math.min(ent.x1,ent.x2),y=Math.min(ent.y1,ent.y2),w=Math.abs(ent.x2-ent.x1),h=Math.abs(ent.y2-ent.y1);
      l.push(`  <rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${w.toFixed(3)}" height="${h.toFixed(3)}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(3)}"${dash}/>`);
    }
    else if(ent.type==='circle')
      l.push(`  <circle cx="${ent.cx.toFixed(3)}" cy="${ent.cy.toFixed(3)}" r="${ent.r.toFixed(3)}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(3)}"${dash}/>`);
    else if(ent.type==='polyline'){
      const pts=ent.points.map(p=>`${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
      l.push(`  <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(3)}"${dash}/>`);
    }
    else if(ent.type==='arc'){
      if(ent.isLine||!isFinite(ent.r)){
        l.push(`  <line x1="${ent.x1.toFixed(3)}" y1="${ent.y1.toFixed(3)}" x2="${ent.x2.toFixed(3)}" y2="${ent.y2.toFixed(3)}" stroke="${color}" stroke-width="${sw.toFixed(3)}"/>`);
      } else {
        const r=ent.r;
        const x1=ent.x1, y1=ent.y1;
        const x2=ent.x2, y2=ent.y2;
        let sweepFlag=1;
        if(ent.ctrl){
          const cross=(x2-x1)*(ent.ctrl.y-y1)-(y2-y1)*(ent.ctrl.x-x1);
          sweepFlag=cross>0?1:0;
        }
        let sweep=ent.endAngle-ent.startAngle;
        if(sweep<0) sweep+=Math.PI*2;
        const largeArc=sweep>Math.PI?1:0;
        l.push(`  <path d="M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r.toFixed(3)} ${r.toFixed(3)} 0 ${largeArc} ${sweepFlag} ${x2.toFixed(3)} ${y2.toFixed(3)}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(3)}"${dash}/>`);
      }
    }
    else if(ent.type==='dimension'){
      const dx=ent.x2-ent.x1, dy=ent.y2-ent.y1;
      const isHoriz=Math.abs(dx)>=Math.abs(dy);
      const value = ent._value || (isHoriz ? Math.abs(dx) : Math.abs(dy)).toFixed(1);
      const txtX = (ent.x1+ent.x2)/2, txtY = isHoriz ? ent.y1+ent.offset : ent.y1;
      l.push(`  <text x="${txtX.toFixed(3)}" y="${txtY.toFixed(3)}" font-size="3.5" fill="${color}" text-anchor="middle">${value}</text>`);
    }
    else if(ent.type==='hatch'){
      if(ent.points && ent.points.length >= 3){
        const pts=ent.points.map(p=>`${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
        l.push(`  <polygon points="${pts}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(3)}"/>`);
      }
    }
  }
  l.push(`  </g>`);

  // в"Ђв"Ђ Штамп в"Ђв"Ђ
  if (state.showStamp) {
    const sd  = state.stampData;
    const sX1 = pw - FRAME_OTHER - 185;
    const sY1 = ph - FRAME_OTHER - 55;
    const sX2 = pw - FRAME_OTHER;
    const sY2 = ph - FRAME_OTHER;

    const thickSW = (LINE_S_MM * 2).toFixed(3);
    const thinSW  = (LINE_S_MM * 0.33).toFixed(3);

    l.push(`  <g class="stamp">`);
    l.push(`    <rect x="${sX1.toFixed(3)}" y="${sY1.toFixed(3)}" width="185" height="55" fill="white" stroke="#000" stroke-width="${thickSW}"/>`);

    // Внутрішні горизонтальні лінії
    const rows = [15, 25, 35, 45];
    rows.forEach(dy => {
      const ly = sY1 + dy;
      l.push(`    <line x1="${sX1.toFixed(3)}" y1="${ly.toFixed(3)}" x2="${sX2.toFixed(3)}" y2="${ly.toFixed(3)}" stroke="#000" stroke-width="${thinSW}"/>`);
    });

    // Внутрішні вертикальні
    const verts = [
      { dx: 7,   hMax: 55 },
      { dx: 17,  hMax: 55 },
      { dx: 40,  hMax: 55 },
      { dx: 55,  hMax: 55 },
      { dx: 65,  hMax: 55 },
      { dx: 135, hMax: 35 },
      { dx: 140, hMax: 35 },
      { dx: 157, hMax: 35 },
    ];
    verts.forEach(v => {
      const vx = sX1 + v.dx;
      l.push(`    <line x1="${vx.toFixed(3)}" y1="${sY1.toFixed(3)}" x2="${vx.toFixed(3)}" y2="${(sY1 + v.hMax).toFixed(3)}" stroke="#000" stroke-width="${thinSW}"/>`);
    });

    function stampT(x, y, text, fontSize, anchor) {
      if (text === undefined || text === null || text === '') return;
      const esc = String(text)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      l.push(`    <text x="${x.toFixed(3)}" y="${y.toFixed(3)}" font-family="Arial, sans-serif" font-size="${fontSize}" text-anchor="${anchor || 'middle'}" fill="#000">${esc}</text>`);
    }

    const roles = ['Розроб.', 'Перевір.', 'Рў.контр.', 'Рќ.контр.', 'Затв.'];
    [15, 25, 35, 45, 55].forEach((dy, i) => {
      if (roles[i]) stampT(sX1 + 12, sY1 + dy - 3, roles[i], 2, 'middle');
    });

    stampT(sX1 + 100,   sY1 + 10,  sd.docNumber,   3.5, 'middle');
    const nameFs = sd.title ? Math.min(5, 70 / sd.title.length * 1.2) : 5;
    stampT(sX1 + 100,   sY1 + 30,  sd.title,       Math.min(nameFs, 5), 'middle');
    stampT(sX1 + 137.5, sY1 + 20,  sd.letter,      3.5, 'middle');
    stampT(sX1 + 148.5, sY1 + 20,  sd.mass,        3,   'middle');
    stampT(sX1 + 166,   sY1 + 20,  sd.scale,       3.5, 'middle');
    stampT(sX1 + 137.5, sY1 + 30,  sd.sheetNum,    3,   'middle');
    stampT(sX1 + 166,   sY1 + 30,  sd.sheetTotal,  3,   'middle');
    stampT(sX1 + 166,   sY1 + 45,  sd.org,         2.5, 'middle');
    stampT(sX1 + 28.5,  sY1 + 20,  sd.developer,   2,   'middle');
    stampT(sX1 + 28.5,  sY1 + 30,  sd.checker,     2,   'middle');
    stampT(sX1 + 60,    sY1 + 20,  sd.date,        2,   'middle');

    l.push(`  </g>`);
  }

  l.push(`</svg>`);
  if(window.electronAPI?.exportFile) await window.electronAPI.exportFile(l.join('\n'),'svg');
  else downloadText(l.join('\n'),'export.svg','image/svg+xml');

  // Restore original state
  state.showStamp        = savedStamp;
  state.paperGridVisible = savedGrid;
  state.showPage         = savedPage;
  render();
}

async function exportDXF(){
  const l=[];
  l.push('0','SECTION','2','HEADER','0','ENDSEC');
  l.push('0','SECTION','2','ENTITIES');
  for(const ent of state.entities){
    if(ent.type==='line') l.push('0','LINE','8','0','10',ent.x1.toFixed(4),'20',(-ent.y1).toFixed(4),'30','0.0','11',ent.x2.toFixed(4),'21',(-ent.y2).toFixed(4),'31','0.0');
    else if(ent.type==='rect'){const x1=Math.min(ent.x1,ent.x2),x2=Math.max(ent.x1,ent.x2),y1=Math.min(ent.y1,ent.y2),y2=Math.max(ent.y1,ent.y2);for(const[ax,ay,bx,by]of[[x1,y1,x2,y1],[x2,y1,x2,y2],[x2,y2,x1,y2],[x1,y2,x1,y1]])l.push('0','LINE','8','0','10',ax.toFixed(4),'20',(-ay).toFixed(4),'30','0.0','11',bx.toFixed(4),'21',(-by).toFixed(4),'31','0.0');}
    else if(ent.type==='circle') l.push('0','CIRCLE','8','0','10',ent.cx.toFixed(4),'20',(-ent.cy).toFixed(4),'30','0.0','40',ent.r.toFixed(4));
    else if(ent.type==='polyline'){l.push('0','POLYLINE','8','0','66','1');for(const p of ent.points)l.push('0','VERTEX','8','0','10',p.x.toFixed(4),'20',(-p.y).toFixed(4),'30','0.0');l.push('0','SEQEND');}
  }
  l.push('0','ENDSEC','0','EOF');
  if(window.electronAPI?.exportFile) await window.electronAPI.exportFile(l.join('\n'),'dxf');
  else downloadText(l.join('\n'),'export.dxf','application/dxf');
}

async function exportPNG(){
  showExportOptionsDialog('png', (opts) => {
    doExportPNG(opts);
  });
}

async function doExportPNG(opts){
  const savedStamp  = state.showStamp;
  const savedGrid   = state.paperGridVisible;
  const savedPage   = state.showPage;

  state.showStamp        = opts.showStamp;
  state.paperGridVisible = opts.showGrid;
  state.showPage         = opts.showPage;
  render();

  const fmt = PAGE_FORMATS[state.pageFormat] || PAGE_FORMATS['A4'];
  let pageW = fmt.w, pageH = fmt.h;
  if (state.pageOrientation === 'landscape' && !fmt.verticalOnly) {
    pageW = fmt.h; pageH = fmt.w;
  }
  const dpi=300,pxW=Math.round(pageW/25.4*dpi),pxH=Math.round(pageH/25.4*dpi),scale=pxW/pageW;
  const canvas=document.createElement('canvas');canvas.width=pxW;canvas.height=pxH;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,pxW,pxH);
  ctx.strokeStyle='#cccccc';ctx.lineWidth=0.5;ctx.strokeRect(0,0,pxW,pxH);

  // в"Ђв"Ђ Clip to page в"Ђв"Ђ
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, pxW, pxH);
  ctx.clip();

  // Draw grid if requested
  if (opts.showGrid) {
    // Small grid 1mm
    ctx.strokeStyle = 'rgba(180,180,200,0.5)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 1; x < pageW; x += 1) {
      const px = x * scale;
      ctx.moveTo(px, 0); ctx.lineTo(px, pageH * scale);
    }
    for (let y = 1; y < pageH; y += 1) {
      const py = y * scale;
      ctx.moveTo(0, py); ctx.lineTo(pageW * scale, py);
    }
    ctx.stroke();

    // Big grid 10mm
    ctx.strokeStyle = 'rgba(140,140,170,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 10; x < pageW; x += 10) {
      const px = x * scale;
      ctx.moveTo(px, 0); ctx.lineTo(px, pageH * scale);
    }
    for (let y = 10; y < pageH; y += 10) {
      const py = y * scale;
      ctx.moveTo(0, py); ctx.lineTo(pageW * scale, py);
    }
    ctx.stroke();
  }

  for(const ent of state.entities){
    const lt = LINE_TYPES[ent.lineType] || LINE_TYPES['solid_thick'];
    ctx.strokeStyle = ent.color || '#000000';
    ctx.lineWidth = Math.max(1, LINE_S_MM * (lt.widthFactor || 1) * scale);
    if (lt.dasharray && lt.dasharray !== 'none') {
      ctx.setLineDash(lt.dasharray.split(',').map(v => parseFloat(v) * scale));
    } else {
      ctx.setLineDash([]);
    }

    if(ent.type==='line'){ctx.beginPath();ctx.moveTo(ent.x1*scale,ent.y1*scale);ctx.lineTo(ent.x2*scale,ent.y2*scale);ctx.stroke();}
    else if(ent.type==='rect'){const x=Math.min(ent.x1,ent.x2)*scale,y=Math.min(ent.y1,ent.y2)*scale,w=Math.abs(ent.x2-ent.x1)*scale,h=Math.abs(ent.y2-ent.y1)*scale;ctx.strokeRect(x,y,w,h);}
    else if(ent.type==='circle'){ctx.beginPath();ctx.arc(ent.cx*scale,ent.cy*scale,ent.r*scale,0,Math.PI*2);ctx.stroke();}
    else if(ent.type==='polyline'&&ent.points.length>=2){ctx.beginPath();ctx.moveTo(ent.points[0].x*scale,ent.points[0].y*scale);for(let i=1;i<ent.points.length;i++)ctx.lineTo(ent.points[i].x*scale,ent.points[i].y*scale);ctx.stroke();}
    else if (ent.type === 'arc') {
      if (ent.isLine || !isFinite(ent.r)) {
        ctx.beginPath();
        ctx.moveTo(ent.x1 * scale, ent.y1 * scale);
        ctx.lineTo(ent.x2 * scale, ent.y2 * scale);
        ctx.stroke();
      } else {
        // Compute sweep direction from ctrl point (same logic as SVG renderer)
        let counterClockwise = false;
        if (ent.ctrl) {
          const crossWorld = (ent.x2 - ent.x1) * (ent.ctrl.y - ent.y1) -
                             (ent.y2 - ent.y1) * (ent.ctrl.x - ent.x1);
          // sweepFlag=0 means counter-clockwise in SVG (Y flipped)
          // In canvas (Y down): sweepFlag=0 -> counterClockwise=true
          counterClockwise = crossWorld > 0;
        }

        // startAngle and endAngle are stored in DEGREES - convert to radians
        const startRad = (ent.startAngle * Math.PI) / 180;
        const endRad   = (ent.endAngle   * Math.PI) / 180;

        ctx.beginPath();
        ctx.arc(
          ent.cx * scale,
          ent.cy * scale,
          ent.r  * scale,
          startRad,
          endRad,
          counterClockwise
        );
        ctx.stroke();
      }
    }
    else if (ent.type === 'dimension') {
      ctx.setLineDash([]);
      ctx.strokeStyle = ent.color || '#000000';
      ctx.fillStyle   = ent.color || '#000000';
      ctx.lineWidth   = Math.max(0.3, 0.2 * scale);

      const dx     = ent.x2 - ent.x1;
      const dy     = ent.y2 - ent.y1;
      const entLen = Math.hypot(dx, dy);
      if (entLen < 0.01) continue;

      const ux = dx / entLen;
      const uy = dy / entLen;
      const nx = -uy;
      const ny =  ux;

      const offset    = ent.offset || 0;
      const isHoriz   = Math.abs(dx) >= Math.abs(dy);
      const isAligned = ent.dimType === 'aligned';

      let d1w, d2w;
      if (isAligned) {
        d1w = { x: ent.x1 + nx * offset, y: ent.y1 + ny * offset };
        d2w = { x: ent.x2 + nx * offset, y: ent.y2 + ny * offset };
      } else if (isHoriz) {
        d1w = { x: ent.x1, y: ent.y1 + offset };
        d2w = { x: ent.x2, y: ent.y1 + offset };
      } else {
        d1w = { x: ent.x1 + offset, y: ent.y1 };
        d2w = { x: ent.x1 + offset, y: ent.y2 };
      }

      ctx.beginPath();
      ctx.moveTo(d1w.x * scale, d1w.y * scale);
      ctx.lineTo(d2w.x * scale, d2w.y * scale);
      ctx.stroke();

      const GAP       = 0.5;
      const OVERSHOOT = 1.5;

      function drawExtLine(px, py, dimPx, dimPy) {
        const extDx = dimPx - px;
        const extDy = dimPy - py;
        const extLen = Math.hypot(extDx, extDy);
        if (extLen < 0.01) return;

        const extUx = extDx / extLen;
        const extUy = extDy / extLen;
        const startX = px + extUx * GAP;
        const startY = py + extUy * GAP;
        const endX = dimPx + extUx * OVERSHOOT;
        const endY = dimPy + extUy * OVERSHOOT;

        ctx.beginPath();
        ctx.moveTo(startX * scale, startY * scale);
        ctx.lineTo(endX   * scale, endY   * scale);
        ctx.stroke();
      }

      drawExtLine(ent.x1, ent.y1, d1w.x, d1w.y);
      drawExtLine(ent.x2, ent.y2, d2w.x, d2w.y);

      const ARROW_LEN = 2.5;
      const ARROW_WID = 0.6;

      function drawArrow(tipX, tipY, dirUx, dirUy) {
        const baseX  = tipX - dirUx * ARROW_LEN;
        const baseY  = tipY - dirUy * ARROW_LEN;
        const wingX1 = baseX + dirUy * ARROW_WID;
        const wingY1 = baseY - dirUx * ARROW_WID;
        const wingX2 = baseX - dirUy * ARROW_WID;
        const wingY2 = baseY + dirUx * ARROW_WID;

        ctx.beginPath();
        ctx.moveTo(tipX   * scale, tipY   * scale);
        ctx.lineTo(wingX1 * scale, wingY1 * scale);
        ctx.lineTo(wingX2 * scale, wingY2 * scale);
        ctx.closePath();
        ctx.fill();
      }

      const dimDx  = d2w.x - d1w.x;
      const dimDy  = d2w.y - d1w.y;
      const dimLen = Math.hypot(dimDx, dimDy);

      if (dimLen > 0.01) {
        const dimUx = dimDx / dimLen;
        const dimUy = dimDy / dimLen;
        drawArrow(d1w.x, d1w.y,  dimUx,  dimUy);
        drawArrow(d2w.x, d2w.y, -dimUx, -dimUy);
      }

      const textMidX = (d1w.x + d2w.x) / 2;
      const textMidY = (d1w.y + d2w.y) / 2;
      const textOffX = isAligned ? nx : (isHoriz ? 0 : (offset >= 0 ? -1 : 1));
      const textOffY = isAligned ? ny : (isHoriz ? (offset >= 0 ? -1 : 1) : 0);
      const TEXT_OFFSET = 2.0;
      let displayText;
      if (ent.text && ent.text !== '' && ent.text !== '0') {
        displayText = ent.text;
      } else if (ent.dimKind === 'radius') {
        const arc = ent.anchoredTo?.length > 0
          ? state.entities.find(e => e.id === ent.anchoredTo[0].entityId)
          : null;
        const r = arc ? arc.r : (ent.arcRadius || 0);
        displayText = 'R' + (Math.round(r * 10) / 10).toFixed(1);
      } else if (ent.dimKind === 'diameter') {
        const circ = ent.anchoredTo?.length > 0
          ? state.entities.find(e => e.id === ent.anchoredTo[0].entityId)
          : null;
        const r = circ ? circ.r : (ent.arcRadius || 0);
        displayText = 'Ø' + (Math.round((circ ? circ.r * 2 : (ent.arcRadius || 0) * 2) * 10) / 10).toFixed(1);
        displayText = '\u00D8' + (Math.round(r * 2 * 10) / 10).toFixed(1);
      } else {
        const measuredLen = isAligned ? dimLen : entLen;
        displayText = (Math.round(measuredLen * 10) / 10).toFixed(1);
      }

      const fontSize = 3.5 * scale;
      ctx.font         = `${fontSize}px Arial, sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';

      const tx = (textMidX + textOffX * TEXT_OFFSET) * scale;
      const ty = (textMidY + textOffY * TEXT_OFFSET) * scale;

      const tw = ctx.measureText(displayText).width;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(tx - tw / 2 - 1, ty - fontSize / 2 - 1, tw + 2, fontSize + 2);

      ctx.fillStyle = ent.color || '#000000';
      ctx.fillText(displayText, tx, ty);
    }
    else if(ent.type==='hatch' && ent.points && ent.points.length >= 3){
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ent.points[0].x*scale, ent.points[0].y*scale);
      for(let i=1;i<ent.points.length;i++) ctx.lineTo(ent.points[i].x*scale, ent.points[i].y*scale);
      ctx.closePath();
      ctx.stroke();
      ctx.clip();
      // Fill with hatch lines
      const angle = (ent.angle || 45) * Math.PI / 180;
      const step = (ent.step || 2) * scale;
      let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      for(const p of ent.points){
        if(p.x<minX)minX=p.x; if(p.y<minY)minY=p.y;
        if(p.x>maxX)maxX=p.x; if(p.y>maxY)maxY=p.y;
      }
      const cx = (minX+maxX)/2*scale, cy=(minY+maxY)/2*scale;
      const diag = Math.hypot((maxX-minX)*scale,(maxY-minY)*scale);
      const perpX = Math.cos(angle+Math.PI/2), perpY = Math.sin(angle+Math.PI/2);
      const count = Math.ceil(diag/step)+2;
      ctx.lineWidth = Math.max(0.5, LINE_S_MM * 0.33 * scale);
      ctx.setLineDash([]);
      for(let i=-count;i<=count;i++){
        const ox = cx + perpX*i*step;
        const oy = cy + perpY*i*step;
        ctx.beginPath();
        ctx.moveTo(ox - Math.cos(angle)*diag, oy - Math.sin(angle)*diag);
        ctx.lineTo(ox + Math.cos(angle)*diag, oy + Math.sin(angle)*diag);
        ctx.stroke();
      }
      ctx.restore();
    }
    else if(ent.type==='centerline'){
      const dcX = ent.x2 - ent.x1, dcY = ent.y2 - ent.y1;
      const clen = Math.hypot(dcX, dcY);
      if (clen > 0.001) {
        const ux = dcX/clen, uy = dcY/clen;
        const ext = 3;
        ctx.setLineDash(LINE_TYPES.dash_dot.dasharray.split(',').map(v => parseFloat(v) * scale));
        ctx.beginPath();
        ctx.moveTo((ent.x1 - ux*ext)*scale, (ent.y1 - uy*ext)*scale);
        ctx.lineTo((ent.x2 + ux*ext)*scale, (ent.y2 + uy*ext)*scale);
        ctx.stroke();
      }
    }
    else if(ent.type==='image' && ent.dataUrl){
      // Skip images in export (could be added later)
    }
  }
  ctx.setLineDash([]);
  ctx.restore();

  // в"Ђв"Ђ Малювання штампу на canvas в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
  if (state.showStamp) {
    const sd = state.stampData;
    const pxPerMm = scale; // мм в†' пікселі

    const sX1 = (PAGE_FORMATS[state.pageFormat].w - FRAME_OTHER - 185) * pxPerMm;
    const sY1 = (PAGE_FORMATS[state.pageFormat].h - FRAME_OTHER - 55) * pxPerMm;
    const sW = 185 * pxPerMm;
    const sH = 55 * pxPerMm;

    // Фон штампу
    ctx.fillStyle = 'white';
    ctx.fillRect(sX1, sY1, sW, sH);

    // Рамка штампу (товста)
    ctx.strokeStyle = '#000';
    ctx.lineWidth   = LINE_S_MM * 2 * pxPerMm;
    ctx.strokeRect(sX1, sY1, sW, sH);

    // Внутрішні лінії (тонкі)
    ctx.lineWidth = LINE_S_MM * 0.33 * pxPerMm;
    ctx.strokeStyle = '#000';

    // Горизонтальні лінії
    [15, 25, 35, 45].forEach(dy => {
      const y = sY1 + dy * pxPerMm;
      ctx.beginPath();
      ctx.moveTo(sX1, y);
      ctx.lineTo(sX1 + sW, y);
      ctx.stroke();
    });

    // Вертикальні лінії
    const vLines = [
      { dx: 7, h: 55 }, { dx: 17, h: 55 }, { dx: 40, h: 55 },
      { dx: 55, h: 55 }, { dx: 65, h: 55 }, { dx: 135, h: 35 },
      { dx: 140, h: 35 }, { dx: 157, h: 35 },
    ];
    vLines.forEach(v => {
      const x = sX1 + v.dx * pxPerMm;
      const y2 = sY1 + v.h * pxPerMm;
      ctx.beginPath();
      ctx.moveTo(x, sY1);
      ctx.lineTo(x, y2);
      ctx.stroke();
    });

    // Текст
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    function pngText(xMm, yMm, text, fontSizeMm) {
      if (!text) return;
      ctx.font = `${fontSizeMm * pxPerMm}px Arial`;
      ctx.fillText(text, sX1 + xMm * pxPerMm, sY1 + yMm * pxPerMm);
    }

    // Ролі
    const roles = ['Розроб.', 'Перевір.', 'Рў.контр.', 'Рќ.контр.', 'Затв.'];
    [15, 25, 35, 45, 55].forEach((dy, i) => {
      if (roles[i]) pngText(12, dy - 3, roles[i], 2);
    });

    // Дані
    pngText(100,   10, sd.docNumber,   3.5);
    pngText(100,   30, sd.title,       Math.min(5, sd.title ? 70 / sd.title.length * 1.2 : 5));
    pngText(137.5, 20, sd.letter,      3.5);
    pngText(148.5, 20, sd.mass,        3);
    pngText(166,   20, sd.scale,       3.5);
    pngText(137.5, 30, sd.sheetNum,    3);
    pngText(166,   30, sd.sheetTotal,  3);
    pngText(166,   45, sd.org,         2.5);
    pngText(28.5,  20, sd.developer,   2);
    pngText(28.5,  30, sd.checker,     2);
    pngText(60,    20, sd.date,        2);
  }

  canvas.toBlob(async(blob)=>{
    if(!blob){alert('Помилка створення PNG');return;}
    if(window.electronAPI?.exportPNG){const buf=await blob.arrayBuffer();const r=await window.electronAPI.exportPNG(buf);if(!r.success)alert('Помилка збереження PNG');}
    else{const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='export.png';a.click();URL.revokeObjectURL(u);}

    // Restore original state
    state.showStamp        = savedStamp;
    state.paperGridVisible = savedGrid;
    state.showPage         = savedPage;
    render();
  },'image/png');
}

// ═══════════════════════════════════════════════
// EVENTS — МИШКА
// ═══════════════════════════════════════════════

viewport.addEventListener('mousemove',(e)=>{
  if (document.querySelector('#dim-edit-dialog, .dim-edit-dialog, .modal-dialog, [data-modal]')) return;
  const rawWorld = screenToWorld(e.clientX, e.clientY);
  let w=getWorkingPoint(e.clientX,e.clientY,e.shiftKey);
  if (state.tool === 'line') {
    const SNAP_TOL = 8 / effectiveZoom();
    let snapped = false;
    for (const other of state.entities) {
      if (other.type !== 'line' && other.type !== 'centerline' && other.type !== 'arc') continue;
      const candidates = [{ x: other.x1, y: other.y1 }, { x: other.x2, y: other.y2 }];
      for (const pt of candidates) {
        if (Math.hypot(pt.x - w.x, pt.y - w.y) < SNAP_TOL) {
          w = { x: pt.x, y: pt.y };
          snapped = true;
          break;
        }
      }
      if (snapped) break;
    }
  }
  if (state.tool === 'dimension') {
    if (state.dimStep === 0) statusCoords.textContent = '📐 Розмір: клікніть першу точку';
    else if (state.dimStep === 1) statusCoords.textContent = '📐 Розмір: клікніть другу точку';
    else if (state.dimStep === 2) statusCoords.textContent = '📐 Розмір: клікніть положення розмірної лінії';
  }
  statusCoords.textContent = `X: ${formatMM(w.x)}  Y: ${formatMM(w.y)} мм`;

  // 1. Arc control-point / endpoint drag (HIGHEST priority)
  if (state.isDraggingEndpoint && (e.buttons & 1)) {
    const ent = state.entities.find(en => en.id === state.dragEndpointEntId);
    if (!ent) return;

    const idx = state.dragEndpointIdx;

    // Save old position before moving
    const oldX = idx === 0 ? ent.x1 : ent.x2;
    const oldY = idx === 0 ? ent.y1 : ent.y2;

    // Use w (working point) for drag — it's already snapped
    if (idx === 0) {
      const oldMidX = (ent.x1 + ent.x2) / 2;
      const oldMidY = (ent.y1 + ent.y2) / 2;
      const ctrlOffX = ent.ctrl ? ent.ctrl.x - oldMidX : 0;
      const ctrlOffY = ent.ctrl ? ent.ctrl.y - oldMidY : 0;
      ent.x1 = w.x; ent.y1 = w.y;
      if (ent.type === 'arc' && ent.ctrl) {
        const newMidX = (ent.x1 + ent.x2) / 2;
        const newMidY = (ent.y1 + ent.y2) / 2;
        ent.ctrl = { x: newMidX + ctrlOffX, y: newMidY + ctrlOffY };
        refreshArcGeometry(ent);
      }
    } else if (idx === 1) {
      const oldMidX = (ent.x1 + ent.x2) / 2;
      const oldMidY = (ent.y1 + ent.y2) / 2;
      const ctrlOffX = ent.ctrl ? ent.ctrl.x - oldMidX : 0;
      const ctrlOffY = ent.ctrl ? ent.ctrl.y - oldMidY : 0;
      ent.x2 = w.x; ent.y2 = w.y;
      if (ent.type === 'arc' && ent.ctrl) {
        const newMidX = (ent.x1 + ent.x2) / 2;
        const newMidY = (ent.y1 + ent.y2) / 2;
        ent.ctrl = { x: newMidX + ctrlOffX, y: newMidY + ctrlOffY };
        refreshArcGeometry(ent);
      }
    } else if (idx === 2 && ent.type === 'arc') {
      ent.ctrl = { x: w.x, y: w.y };
      refreshArcGeometry(ent);
    }

    // Use connections system to drag connected endpoints together
    if (idx === 0 || idx === 1) {
      const newX = idx === 0 ? ent.x1 : ent.x2;
      const newY = idx === 0 ? ent.y1 : ent.y2;
      const epKey = idx === 0 ? 'start' : 'end';

      // Find all connections for this endpoint
      const relatedConns = state.connections.filter(
        c => c.lineId === ent.id && c.endpoint === epKey
      );

      relatedConns.forEach(conn => {
        const target = state.entities.find(e => e.id === conn.targetId);
        if (!target) return;

        // Find which endpoint of target matches old position
        if (Math.hypot(target.x1 - oldX, target.y1 - oldY) < 1.0) {
          target.x1 = newX; target.y1 = newY;
          if (target.type === 'arc' && target.ctrl) refreshArcGeometry(target);
          updateConnectedEndpoints(target.id, 'start', oldX, oldY, newX, newY, new Set([ent.id]));
        } else if (Math.hypot(target.x2 - oldX, target.y2 - oldY) < 1.0) {
          target.x2 = newX; target.y2 = newY;
          if (target.type === 'arc' && target.ctrl) refreshArcGeometry(target);
          updateConnectedEndpoints(target.id, 'end', oldX, oldY, newX, newY, new Set([ent.id]));
        }
      });
    }

    // Update ALL dimensions anchored to the dragged entity
    // Re-read CURRENT entity coordinates for each anchored point
    state.entities.forEach(dim => {
      if (dim.type !== 'dimension' || !dim.anchoredTo) return;

      let changed = false;

      dim.anchoredTo.forEach(anchor => {
        // Find the entity this anchor refers to
        const anchoredEnt = state.entities.find(e => e.id === anchor.entityId);
        if (!anchoredEnt) return;

        // Update dim point to match current entity endpoint
        if (anchor.end === 'p1') {
          dim.x1 = anchoredEnt.x1;
          dim.y1 = anchoredEnt.y1;
          changed = true;
        }
        if (anchor.end === 'p2') {
          dim.x2 = anchoredEnt.x2;
          dim.y2 = anchoredEnt.y2;
          changed = true;
        }
      });

      if (changed) dim.text = '';
    });

    render();
    return;
  }

  // 2. Dimension drag
  if (state.isDraggingDimOffset && state.dragDimId) {
    const dim = state.entities.find(d => d.id === state.dragDimId);
    if (dim) {
      dim.offsetX = w.x - (dim.x1 + dim.x2) / 2;
      dim.offsetY = w.y - (dim.y1 + dim.y2) / 2;
    }
    render();
    return;
  }

  if (state.isBoxSelecting && state.boxSelectStart) {
    const boxWorld = screenToWorld(e.clientX, e.clientY);
    state.boxSelectRect = {
      x: Math.min(state.boxSelectStart.x, boxWorld.x),
      y: Math.min(state.boxSelectStart.y, boxWorld.y),
      w: Math.abs(boxWorld.x - state.boxSelectStart.x),
      h: Math.abs(boxWorld.y - state.boxSelectStart.y),
    };

    state.boxHoverIds = new Set();
    state.entities.forEach(ent => {
      if (entityInBox(ent, state.boxSelectRect)) state.boxHoverIds.add(ent.id);
    });

    drawBoxSelectRect(state.boxSelectRect);
    render();
    return;
  }

  if (state.isDraggingDimOffset) {
    const dim = state.entities.find(en => en.id === state.dragDimId);
    if (!dim) return;

    const dx = dim.x2 - dim.x1;
    const dy = dim.y2 - dim.y1;
    const len = Math.hypot(dx, dy) || 1;

    if (dim.dimType === 'aligned') {
      const nx = -dy / len;
      const ny = dx / len;
      const mx = (dim.x1 + dim.x2) / 2;
      const my = (dim.y1 + dim.y2) / 2;
      dim.offset = (rawWorld.x - mx) * nx + (rawWorld.y - my) * ny;
    } else {
      const isHoriz = Math.abs(dx) >= Math.abs(dy);
      if (isHoriz) dim.offset = rawWorld.y - (dim.y1 + dim.y2) / 2;
      else dim.offset = rawWorld.x - (dim.x1 + dim.x2) / 2;
    }

    render();
    return;
  }

  if(state.arcPhase===2&&state.arcDragId!==null){
    // Respect object snap / Shift override while dragging the arc ctrl point
    const snapped = w;
    const ent=state.entities.find(en=>en.id===state.arcDragId);
    if(ent){
      ent.ctrl={x:snapped.x,y:snapped.y};
      const data=calcArcFromThreePoints(
        {x:ent.x1,y:ent.y1},ent.ctrl,{x:ent.x2,y:ent.y2}
      );
      ent.cx=data.cx; ent.cy=data.cy; ent.r=data.r;
      ent.startAngle=data.startAngle; ent.endAngle=data.endAngle;
      ent.isLine=data.isLine;
      render();
    }
    return;
  }

  // 2. Entity drag
  if(state.isDragging&&state.selectedId!==null && (e.buttons & 1)){
    const lastW = state.lastDragW || state.dragStartW || { x: w.x, y: w.y };
    const dx = w.x - lastW.x;
    const dy = w.y - lastW.y;
    const ent = state.entities.find(en=>en.id===state.selectedId);
    if(ent && (dx !== 0 || dy !== 0)){
      if (ent.type === 'image' && ent.locked) {
        state.lastDragW = { x: w.x, y: w.y };
        render();
        return;
      }
      moveEntity(ent, dx, dy);
      // Move connected line endpoints along with the entity
      moveConnectedEndpoints(ent.id, dx, dy);
      if (ent.type === 'arc' && ent.ctrl) refreshArcGeometry(ent);
      updateLinkedDimensions(ent, dx, dy);
      state.lastDragW = { x: w.x, y: w.y };
    }
    render(); return;
  }

  // 3. Pan
  if(state.isPanning && (e.buttons & 4)){state.panX=state.panStartPanX+(e.clientX-state.panStartX);state.panY=state.panStartPanY+(e.clientY-state.panStartY);render();return;}

  // в"Ђв"Ђ 4. Rulers cursor в"Ђв"Ђ
  const svgPos=worldToSVG(w.x,w.y);
  updateRulerCursor(svgPos.x,svgPos.y);
  if(state.tool==='select') {
    let hoveredId = null;
    for (let i = state.entities.length - 1; i >= 0; i--) {
      if (hitTest(state.entities[i], rawWorld.x, rawWorld.y)) {
        hoveredId = state.entities[i].id;
        break;
      }
    }
    if (state.hoveredId !== hoveredId) {
      state.hoveredId = hoveredId;
      render();
    }
    return;
  }

  // в"Ђв"Ђ 5. Tool previews в"Ђв"Ђ
  previewLayer.innerHTML='';

  // Always show snap marker when drawing
  if(state.snapEnabled){
    if(state.snapPoint){
      previewLayer.appendChild(showSnapMarker(svgPos.x,svgPos.y,state.snapPoint.type));
    } else {
      previewLayer.appendChild(showSnapMarker(svgPos.x,svgPos.y,'grid'));
    }
  }
  const ez=effectiveZoom();

  if (state.tool === 'line' && state.lineStart) {
    const p1 = worldToSVG(state.lineStart.x, state.lineStart.y);

    // Snap preview endpoint with same logic as click
    const rawM = screenToWorld(e.clientX, e.clientY);
    const ENDPOINT_SNAP_PX = 16;
    const ONLINE_SNAP_PX   = 10;
    const ezM      = effectiveZoom();
    const epTolM   = Math.max(ENDPOINT_SNAP_PX / ezM, 0.5);
    const onTolM   = Math.max(ONLINE_SNAP_PX   / ezM, 0.3);

    let previewPt    = { x: rawM.x, y: rawM.y };
    let bestEpDistM  = epTolM;
    let snapFound    = false;

    // Pass 1: endpoints (larger tolerance)
    for (const other of state.entities) {
      if (other.type !== 'line' && other.type !== 'centerline' && other.type !== 'arc') continue;
      const d1 = Math.hypot(other.x1 - rawM.x, other.y1 - rawM.y);
      const d2 = Math.hypot(other.x2 - rawM.x, other.y2 - rawM.y);
      if (d1 < bestEpDistM) { bestEpDistM = d1; previewPt = { x: other.x1, y: other.y1 }; snapFound = true; }
      if (d2 < bestEpDistM) { bestEpDistM = d2; previewPt = { x: other.x2, y: other.y2 }; snapFound = true; }
    }

    // Pass 2: on-line (smaller tolerance, only if no endpoint snap)
    if (!snapFound) {
      let bestOnDistM = onTolM;
      for (const other of state.entities) {
        if (other.type !== 'line' && other.type !== 'centerline') continue;
        const dx = other.x2 - other.x1;
        const dy = other.y2 - other.y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq < 1e-10) continue;
        const t = Math.max(0, Math.min(1,
          ((rawM.x - other.x1) * dx + (rawM.y - other.y1) * dy) / lenSq
        ));
        const nearX = other.x1 + t * dx;
        const nearY = other.y1 + t * dy;
        const dist = Math.hypot(nearX - rawM.x, nearY - rawM.y);
        if (dist < bestOnDistM) {
          bestOnDistM = dist;
          previewPt = { x: nearX, y: nearY };
          snapFound = true;
        }
      }
    }

    const p2 = worldToSVG(previewPt.x, previewPt.y);

    let previewLine = previewLayer.querySelector('.preview-line');
    if (!previewLine) {
      previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      previewLine.classList.add('preview-line');
      previewLine.setAttribute('stroke', '#00ff88');
      previewLine.setAttribute('stroke-width', '1');
      previewLine.setAttribute('stroke-dasharray', '4 3');
      previewLine.setAttribute('pointer-events', 'none');
      previewLayer.appendChild(previewLine);
    }
    previewLine.setAttribute('x1', p1.x);
    previewLine.setAttribute('y1', p1.y);
    previewLine.setAttribute('x2', p2.x);
    previewLine.setAttribute('y2', p2.y);

    const dx = previewPt.x - state.lineStart.x;
    const dy = previewPt.y - state.lineStart.y;
    const lineLen   = Math.sqrt(dx * dx + dy * dy);
    const lineAngle = Math.atan2(dy, dx) * 180 / Math.PI;
    statusCoords.textContent =
      `X: ${formatMM(previewPt.x)}  Y: ${formatMM(previewPt.y)} мм  |  L: ${formatMM(lineLen)} мм  ∠: ${lineAngle.toFixed(1)}°`;
  }

  // Rect preview
  if(state.tool==='rect'&&state.lineStart){
    const p1=worldToSVG(state.lineStart.x,state.lineStart.y),p2=worldToSVG(w.x,w.y);
    const rx=Math.min(p1.x,p2.x),ry=Math.min(p1.y,p2.y),rw=Math.abs(p2.x-p1.x),rh=Math.abs(p2.y-p1.y);
    const el=document.createElementNS('http://www.w3.org/2000/svg','rect');
    el.setAttribute('x',rx.toFixed(2));el.setAttribute('y',ry.toFixed(2));
    el.setAttribute('width',rw.toFixed(2));el.setAttribute('height',rh.toFixed(2));
    el.setAttribute('stroke','#0066cc');el.setAttribute('stroke-width','1.5');
    el.setAttribute('stroke-dasharray','6,4');el.setAttribute('fill','rgba(0,102,204,0.05)');
    el.setAttribute('vector-effect','non-scaling-stroke');
    previewLayer.appendChild(el);
  }
  // Circle preview
  if(state.tool==='circle'&&state.lineStart){
    const center=worldToSVG(state.lineStart.x,state.lineStart.y);
    const dx=w.x-state.lineStart.x,dy=w.y-state.lineStart.y,r=Math.sqrt(dx*dx+dy*dy)*ez;
    const el=document.createElementNS('http://www.w3.org/2000/svg','circle');
    el.setAttribute('cx',center.x.toFixed(2));el.setAttribute('cy',center.y.toFixed(2));
    el.setAttribute('r',r.toFixed(2));el.setAttribute('stroke','#0066cc');el.setAttribute('stroke-width','1.5');
    el.setAttribute('stroke-dasharray','6,4');el.setAttribute('fill','rgba(0,102,204,0.05)');
    el.setAttribute('vector-effect','non-scaling-stroke');
    previewLayer.appendChild(el);
    const c2=worldToSVG(w.x,w.y);
    previewLayer.appendChild(makeSVGLine(center.x,center.y,c2.x,c2.y,'#0066cc','1','3,3'));
  }
  // Polyline preview
  if(state.tool==='polyline'&&state.polylinePoints.length>0){
    const svgPts=state.polylinePoints.map(p=>worldToSVG(p.x,p.y)),curSVG=worldToSVG(w.x,w.y);
    for(let i=0;i<svgPts.length-1;i++) previewLayer.appendChild(makeSVGLine(svgPts[i].x,svgPts[i].y,svgPts[i+1].x,svgPts[i+1].y,'#0066cc','1.5','0'));
    const last=svgPts[svgPts.length-1];
    previewLayer.appendChild(makeSVGLine(last.x,last.y,curSVG.x,curSVG.y,'#0066cc','1.5','6,4'));
  }
  // Arc preview (phase 1)
  /*
  if(state.tool==='arc'&&state.arcPhase===1&&state.arcP1){
    const p1=worldToSVG(state.arcP1.x,state.arcP1.y);
    const cur=worldToSVG(w.x,w.y);
    previewLayer.appendChild(makeSVGLine(p1.x,p1.y,cur.x,cur.y,'#0066cc','1.5','6,4'));
    statusCoords.textContent=`Клікни кінцеву точку | X: ${w.x.toFixed(1)} Y: ${w.y.toFixed(1)} мм`;
  }
  */
  if(state.tool==='arc'&&state.arcPhase===1&&state.arcP1){
    const p1 = state.arcP1;
    const p2 = { x: w.x, y: w.y };

    const dx2 = p2.x - p1.x, dy2 = p2.y - p1.y;
    const len = Math.hypot(dx2, dy2);

    // Preview ctrl: perpendicular offset of 15% chord, min 2mm
    const perpX = -dy2 / (len || 1);
    const perpY =  dx2 / (len || 1);
    const offset = Math.max(len * 0.15, 2.0);
    const ctrl = {
      x: (p1.x + p2.x) / 2 + perpX * offset,
      y: (p1.y + p2.y) / 2 + perpY * offset,
    };

    const arcData = calcArcFromThreePoints(p1, ctrl, p2);

    // Clear previous preview
    previewLayer.innerHTML = '';

    const s1 = worldToSVG(p1.x, p1.y);
    const s2 = worldToSVG(p2.x, p2.y);

    if (!arcData || arcData.isLine) {
      const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineEl.setAttribute('x1', s1.x.toFixed(2)); lineEl.setAttribute('y1', s1.y.toFixed(2));
      lineEl.setAttribute('x2', s2.x.toFixed(2)); lineEl.setAttribute('y2', s2.y.toFixed(2));
      lineEl.setAttribute('stroke', '#0066cc');
      lineEl.setAttribute('stroke-width', '1.5');
      lineEl.setAttribute('stroke-dasharray', '6,4');
      lineEl.setAttribute('fill', 'none');
      lineEl.style.pointerEvents = 'none';
      previewLayer.appendChild(lineEl);
    } else {
      // Compute sweepFlag from ctrl in WORLD coordinates — same logic as makeArcSVGPath
      const crossWorld = (p2.x - p1.x) * (ctrl.y - p1.y) -
                         (p2.y - p1.y) * (ctrl.x - p1.x);
      const previewSweep = crossWorld > 0 ? 0 : 1;

      // largeArcFlag from sagitta vs radius
      const chordLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const sagitta  = Math.abs(
        (p2.y - p1.y) * ctrl.x - (p2.x - p1.x) * ctrl.y +
        p2.x * p1.y - p2.y * p1.x
      ) / (chordLen || 1);
      const previewLarge = sagitta > arcData.r ? 1 : 0;

      const ez    = effectiveZoom();
      const rPx   = arcData.r * ez;
      const pathD = `M ${s1.x.toFixed(2)} ${s1.y.toFixed(2)} ` +
                    `A ${rPx.toFixed(2)} ${rPx.toFixed(2)} ` +
                    `0 ${previewLarge} ${previewSweep} ` +
                    `${s2.x.toFixed(2)} ${s2.y.toFixed(2)}`;

      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', pathD);
      pathEl.setAttribute('stroke', '#0066cc');
      pathEl.setAttribute('stroke-width', '1.5');
      pathEl.setAttribute('stroke-dasharray', '6,4');
      pathEl.setAttribute('fill', 'none');
      pathEl.style.pointerEvents = 'none';
      previewLayer.appendChild(pathEl);
    }
  }
  // Dimension preview
  if(state.tool==='dimension'&&state.dimStep>0){
    const cur=w;
    if(state.dimStep===1){
      // Phase 1: user has placed P1, showing dashed line to cursor
      const p1s=worldToSVG(state.dimP1.x,state.dimP1.y);
      const p2s=worldToSVG(cur.x,cur.y);
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',p1s.x.toFixed(2));
      line.setAttribute('y1',p1s.y.toFixed(2));
      line.setAttribute('x2',p2s.x.toFixed(2));
      line.setAttribute('y2',p2s.y.toFixed(2));
      line.setAttribute('stroke','#0066cc');
      line.setAttribute('stroke-width','1');
      line.setAttribute('stroke-dasharray','6,4');
      line.setAttribute('pointer-events','none');
      previewLayer.appendChild(line);
      statusCoords.textContent=`Розмір: клікніть другу точку | X: ${cur.x.toFixed(1)} Y: ${cur.y.toFixed(1)} мм`;
    } else if(state.dimStep===2){
      // Phase 2: P1 & P2 placed, showing full dimension preview at cursor offset
      const dx = state.dimP2.x - state.dimP1.x;
      const dy = state.dimP2.y - state.dimP1.y;
      const isHoriz = Math.abs(dx) >= Math.abs(dy);

      // Compute offset from cursor (signed — may be negative)
      let offset;
      if (isHoriz) {
        offset = cur.y - state.dimP1.y;
      } else {
        offset = cur.x - state.dimP1.x;
      }
      // Enforce minimum offset magnitude (avoid zero-height preview)
      const MIN_OFFSET = 5;
      if (Math.abs(offset) < MIN_OFFSET) {
        offset = (offset >= 0 ? 1 : -1) * MIN_OFFSET;
      }

      const previewEnt = {
        id: -999,
        type: 'dimension',
        dimType: 'linear',
        x1: state.dimP1.x, y1: state.dimP1.y,
        x2: state.dimP2.x, y2: state.dimP2.y,
        offset,
        text: '',
        isDiameter: false,
        isRadius: false,
        lineType: 'solid_thin',
        color: '#0066cc',
      };
      const previewG = renderDimensionEntity(previewEnt, false);
      if (previewG) {
        previewG.classList.add('dim-preview');
        previewG.style.opacity = '0.7';
        previewG.style.pointerEvents = 'none';
        previewLayer.appendChild(previewG);
      }
      statusCoords.textContent=`Розмір: клікніть положення розмірної лінії (відступ ${formatMM(Math.abs(offset))} мм)`;
    }
  }

  // Hatch preview
  if(state.tool==='hatch'&&state.hatchPoints&&state.hatchPoints.length>0){
    const svgPts=state.hatchPoints.map(p=>worldToSVG(p.x,p.y));
    for(let i=0;i<svgPts.length-1;i++){
      previewLayer.appendChild(makeSVGLine(svgPts[i].x,svgPts[i].y,svgPts[i+1].x,svgPts[i+1].y,'#00aa44','1.5','0'));
    }
    const cur=worldToSVG(w.x,w.y);
    const last=svgPts[svgPts.length-1];
    previewLayer.appendChild(makeSVGLine(last.x,last.y,cur.x,cur.y,'#00aa44','1.5','6,4'));
  }

  // Centerline preview
  if(state.tool==='centerline'&&state.lineStart){
    const p1=worldToSVG(state.lineStart.x,state.lineStart.y);
    previewLayer.appendChild(makeSVGLine(p1.x,p1.y,svgPos.x,svgPos.y,'#aa4400','1.5','6,4'));
  }
});

viewport.addEventListener('mousedown',(e)=>{
  // TEMP DIAGNOSTIC LOG — remove after fixing dimension tool
  if(e.button===1){e.preventDefault();state.isPanning=true;state.panStartX=e.clientX;state.panStartY=e.clientY;state.panStartPanX=state.panX;state.panStartPanY=state.panY;viewport.style.cursor='grabbing';return;}
  if(e.button===0){
    closeCanvasContextMenu();
    // Use getWorkingPoint so all drawing tools (line/rect/circle/arc/polyline/
    // hatch/centerline/dimension) share consistent object + grid snap behaviour.
    const raw=screenToWorld(e.clientX,e.clientY);
    const w=getWorkingPoint(e.clientX,e.clientY,e.shiftKey);

    if(state.tool==='select'){
      const raw2=screenToWorld(e.clientX,e.clientY);

      // Shift+click — додати/прибрати Р· множинного виділення
      if(e.shiftKey){
        let primaryEnt=null;
        for(let i=state.entities.length-1;i>=0;i--){if(hitTest(state.entities[i],raw2.x,raw2.y)){primaryEnt=state.entities[i];break;}}
        if(primaryEnt){
          if(!state.selectedIds) state.selectedIds = new Set();
          if(state.selectedIds.has(primaryEnt.id)){
            state.selectedIds.delete(primaryEnt.id);
            if(state.selectedId === primaryEnt.id){
              state.selectedId = state.selectedIds.size > 0
                ? [...state.selectedIds].at(-1)
                : null;
            }
          } else {
            state.selectedIds.add(primaryEnt.id);
            state.selectedId = primaryEnt.id;
          }
          render();
          showStatus(`Виділено: ${state.selectedIds.size} об'єктів`);
        }
        return;
      }

      // Check if clicking on control point of selected arc (no snap)
      if(state.selectedId!==null){
        const selEnt=state.entities.find(en=>en.id===state.selectedId);
        if(selEnt?.type==='arc'&&selEnt.ctrl){
          const dist=Math.sqrt((raw2.x-selEnt.ctrl.x)**2+(raw2.y-selEnt.ctrl.y)**2);
          const CTRL_RADIUS=10/effectiveZoom();
          if(dist<CTRL_RADIUS){
            state.arcPhase=2;
            state.arcDragId=selEnt.id;
            state.isDragging=false;
            viewport.style.cursor='move';
            return;
          }
        }
      }

      let found=null;
      for(let i=state.entities.length-1;i>=0;i--){if(hitTest(state.entities[i],raw2.x,raw2.y)){found=state.entities[i];break;}}
      if(found){
        state.selectedId = found.id;
        state.selectedIds = new Set([found.id]);
        if (found.type === 'dimension') {
          state.isDraggingDimOffset = true;
          state.dragDimId = found.id;
          showPropsPanel(found);
          render();
          e.stopPropagation();
          return;
        }
        // Locked images: allow selection but NOT drag
        if (found.type === 'image' && found.locked) {
          showPropsPanel(found);
          render();
          return;
        }
        state.isDragging = true;
        state.arcPhase = 0;
        const rawDrag = screenToWorld(e.clientX, e.clientY);
        state.dragStartW = { x: rawDrag.x, y: rawDrag.y };
        state.lastDragW = { x: rawDrag.x, y: rawDrag.y };
        state.dragEntitySnap = deepCopyEntities([found])[0];
        viewport.style.cursor = 'grabbing';
      } else {
        state.selectedId = null;
        state.selectedIds = new Set();
        state.isDragging = false;
        state.arcPhase = 0;
        state.hoveredId = null;
        state.isBoxSelecting = true;
        state.boxSelectStart = screenToWorld(e.clientX, e.clientY);
        state.boxSelectRect = null;
        state.boxHoverIds = new Set();
        showPropsPanel(null);
        render();
        return;
      }
      showPropsPanel(found||null);
      render(); return;
    }

    function findSnapPoint(wx, wy, excludeId) {
      const SNAP_TOL = 10 / effectiveZoom();
      let best = null;
      let bestDist = SNAP_TOL;

      for (const other of state.entities) {
        if (other.id === excludeId) continue;
        if (other.type !== 'line' && other.type !== 'centerline' && other.type !== 'arc') continue;

        // Check endpoint x1/y1 ONLY
        const d1 = Math.hypot(other.x1 - wx, other.y1 - wy);
        if (d1 < bestDist) {
          bestDist = d1;
          best = { x: other.x1, y: other.y1, entId: other.id, pointType: 'endpoint' };
        }

        // Check endpoint x2/y2 ONLY
        const d2 = Math.hypot(other.x2 - wx, other.y2 - wy);
        if (d2 < bestDist) {
          bestDist = d2;
          best = { x: other.x2, y: other.y2, entId: other.id, pointType: 'endpoint' };
        }
      }

      return best; // null if nothing within tolerance
    }

    if (state.tool === 'line') {
      if (!state.lineStart) {
        // FIRST CLICK
        // Use RAW screen→world position (no pre-snap) for our own snap logic
        const raw = screenToWorld(e.clientX, e.clientY);

        // Separate tolerances: endpoints get larger snap zone than on-line
        const ENDPOINT_SNAP_PX = 16;
        const ONLINE_SNAP_PX   = 10;
        const ez       = effectiveZoom();
        const epTol    = Math.max(ENDPOINT_SNAP_PX / ez, 0.5);  // minimum 0.5mm
        const onTol    = Math.max(ONLINE_SNAP_PX   / ez, 0.3);  // minimum 0.3mm

        let startPt  = null;
        let bestEpDist = epTol;
        let snapType = null;

        // Pass 1: snap to endpoints (highest priority, larger tolerance)
        for (const other of state.entities) {
          if (other.type !== 'line' && other.type !== 'centerline' && other.type !== 'arc') continue;
          const d1 = Math.hypot(other.x1 - raw.x, other.y1 - raw.y);
          const d2 = Math.hypot(other.x2 - raw.x, other.y2 - raw.y);
          if (d1 < bestEpDist) { bestEpDist = d1; startPt = { x: other.x1, y: other.y1 }; snapType = 'endpoint'; }
          if (d2 < bestEpDist) { bestEpDist = d2; startPt = { x: other.x2, y: other.y2 }; snapType = 'endpoint'; }
        }

        // Pass 2: snap to nearest point ON line segment (only if no endpoint snap, smaller tolerance)
        if (snapType !== 'endpoint') {
          let bestOnDist = onTol;
          for (const other of state.entities) {
            if (other.type !== 'line' && other.type !== 'centerline') continue;
            const dx = other.x2 - other.x1;
            const dy = other.y2 - other.y1;
            const lenSq = dx * dx + dy * dy;
            if (lenSq < 1e-10) continue;
            const t = Math.max(0, Math.min(1,
              ((raw.x - other.x1) * dx + (raw.y - other.y1) * dy) / lenSq
            ));
            const nearX = other.x1 + t * dx;
            const nearY = other.y1 + t * dy;
            const dist = Math.hypot(nearX - raw.x, nearY - raw.y);
            if (dist < bestOnDist) {
              bestOnDist = dist;
              startPt = { x: nearX, y: nearY };
              snapType = 'online';
            }
          }
        }

        // Pass 3: fallback — grid snap OR exact position
        if (startPt === null) {
          if (state.snapEnabled) {
            const gridPt = snapToGrid(raw.x, raw.y, e.shiftKey);
            startPt = { x: gridPt.x, y: gridPt.y };
          } else {
            startPt = { x: raw.x, y: raw.y };
          }
          snapType = 'grid';
        }

        state.lineStart = startPt;
        // Snap status messages removed — too noisy during drawing
        return;
      } else {
        // SECOND CLICK — use raw position with same snap logic
        const raw = screenToWorld(e.clientX, e.clientY);

        // Separate tolerances: endpoints get larger snap zone than on-line
        const ENDPOINT_SNAP_PX = 16;
        const ONLINE_SNAP_PX   = 10;
        const ez       = effectiveZoom();
        const epTol    = Math.max(ENDPOINT_SNAP_PX / ez, 0.5);  // minimum 0.5mm
        const onTol    = Math.max(ONLINE_SNAP_PX   / ez, 0.3);  // minimum 0.3mm

        let endPt    = null;
        let bestEpDist = epTol;
        let snapType = null;

        // Pass 1: snap to endpoints (highest priority, larger tolerance)
        for (const other of state.entities) {
          if (other.type !== 'line' && other.type !== 'centerline' && other.type !== 'arc') continue;
          const d1 = Math.hypot(other.x1 - raw.x, other.y1 - raw.y);
          const d2 = Math.hypot(other.x2 - raw.x, other.y2 - raw.y);
          if (d1 < bestEpDist) { bestEpDist = d1; endPt = { x: other.x1, y: other.y1 }; snapType = 'endpoint'; }
          if (d2 < bestEpDist) { bestEpDist = d2; endPt = { x: other.x2, y: other.y2 }; snapType = 'endpoint'; }
        }

        // Pass 2: snap to point ON line (only if no endpoint snap, smaller tolerance)
        if (snapType !== 'endpoint') {
          let bestOnDist = onTol;
          for (const other of state.entities) {
            if (other.type !== 'line' && other.type !== 'centerline') continue;
            const dx = other.x2 - other.x1;
            const dy = other.y2 - other.y1;
            const lenSq = dx * dx + dy * dy;
            if (lenSq < 1e-10) continue;
            const t = Math.max(0, Math.min(1,
              ((raw.x - other.x1) * dx + (raw.y - other.y1) * dy) / lenSq
            ));
            const nearX = other.x1 + t * dx;
            const nearY = other.y1 + t * dy;
            const dist = Math.hypot(nearX - raw.x, nearY - raw.y);
            if (dist < bestOnDist) {
              bestOnDist = dist;
              endPt = { x: nearX, y: nearY };
              snapType = 'online';
            }
          }
        }

        // Pass 3: fallback — grid snap OR exact position
        if (endPt === null) {
          if (state.snapEnabled) {
            const gridPt = snapToGrid(raw.x, raw.y, e.shiftKey);
            endPt = { x: gridPt.x, y: gridPt.y };
          } else {
            endPt = { x: raw.x, y: raw.y };
          }
          snapType = 'grid';
        }

        const newLine = {
          id:          state.nextId++,
          type:        'line',
          lineType:    state.currentLineType    || 'solid_thick',
          color:       state.currentColor       || '#000000',
          strokeWidth: state.currentStrokeWidth || 0.5,
          x1: state.lineStart.x,
          y1: state.lineStart.y,
          x2: endPt.x,
          y2: endPt.y,
        };

        if (Math.hypot(newLine.x2 - newLine.x1, newLine.y2 - newLine.y1) < 0.1) {
          state.lineStart = null;
          return;
        }

        // Check for duplicate line (same endpoints in either direction)
        const exists = state.entities.some(e =>
          (e.type === 'line' || e.type === 'centerline') &&
          Math.hypot(e.x1 - newLine.x1, e.y1 - newLine.y1) < 0.01 &&
          Math.hypot(e.x2 - newLine.x2, e.y2 - newLine.y2) < 0.01
        );
        if (exists) {
          state.lineStart = null;
          return;
        }

        state.entities.push(newLine);

        // Track connections to other entities' endpoints
        const newConns = buildLineConnections(newLine.id, newLine.x1, newLine.y1, newLine.x2, newLine.y2);
        state.connections.push(...newConns);

        state.lineStart        = null;
        previewLayer.innerHTML = '';
        saveSnapshot();
        render();
        autoAnnotate(newLine);
        return;
      }
    }
    if(state.tool==='rect'){
      if(!state.lineStart) state.lineStart={x:w.x,y:w.y};
      else{
        const newRect={id:state.nextId++,type:'rect',lineType:'solid_thick',x1:state.lineStart.x,y1:state.lineStart.y,x2:w.x,y2:w.y};
        state.entities.push(newRect);
        state.lineStart=null;previewLayer.innerHTML='';saveSnapshot();render();
        autoAnnotate(newRect);
      }
    }
    if(state.tool==='circle'){
      if(!state.lineStart) state.lineStart={x:w.x,y:w.y};
      else{
        const dx=w.x-state.lineStart.x,dy=w.y-state.lineStart.y,r=Math.sqrt(dx*dx+dy*dy);
        let newCircle=null;
        if(r>0.1){
          newCircle={id:state.nextId++,type:'circle',lineType:'solid_thick',cx:state.lineStart.x,cy:state.lineStart.y,r:r};
          state.entities.push(newCircle);
        }
        state.lineStart=null;previewLayer.innerHTML='';saveSnapshot();render();
        if(newCircle) autoAnnotate(newCircle);
      }
    }
    if(state.tool==='polyline'){state.polylinePoints.push({x:w.x,y:w.y});render();}

    // Arc tool — new: click start в†' click end в†' drag control point
    if(state.tool==='arc'){
      if(state.arcPhase===0){
        // Click 1 — start point
        state.arcP1    = { x: w.x, y: w.y };
        state.arcPhase = 1;
        console.log('[Arc] P1 set:', state.arcP1);
        return;

      } else if(state.arcPhase===1){
        // Click 2 — end point в†' create arc immediately
        const p1 = state.arcP1;
        const p2 = { x: w.x, y: w.y };

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy) || 1;
        const perpX = -dy / len;
        const perpY =  dx / len;
        const offset = Math.max(len * 0.15, 2.0);
        const ctrl = {
          x: (p1.x + p2.x) / 2 + perpX * offset,
          y: (p1.y + p2.y) / 2 + perpY * offset,
        };

        // Calculate arc from 3 points
        const arcData = calcArcFromThreePoints(p1, ctrl, p2);
        if (!arcData || arcData.isLine) {
          state.entities.push({
            id: state.nextId++,
            type: 'line',
            lineType: 'solid_thick',
            x1: p1.x, y1: p1.y,
            x2: p2.x, y2: p2.y,
          });
          state.arcPhase = 0;
          state.arcP1 = null;
          previewLayer.innerHTML = '';
          saveSnapshot();
          render();
          return;
        }

        const ent = {
          id:         state.nextId++,
          type:       'arc',
          lineType:   'solid_thick',
          x1: p1.x, y1: p1.y,
          x2: p2.x, y2: p2.y,
          ctrl,
          cx:         arcData.cx,
          cy:         arcData.cy,
          r:          arcData.r,
          startAngle: arcData.startAngle,
          endAngle:   arcData.endAngle,
          sweepFlag:  arcData.sweepFlag || 0,
          isLine:     false,
        };

        state.entities.push(ent);
        saveSnapshot();

        // Enter drag mode for control point
        state.arcPhase  = 2;
        state.arcDragId = ent.id;

        previewLayer.innerHTML = '';
        render();
        console.log('[Arc] Created, entering drag mode');
        return;
      }
    }

    // Dimension tool — 3 clicks (повністю переписано)
    if (state.tool === 'dimension') {
      e.preventDefault();
      e.stopPropagation();

      console.log('[DIM CLICK] step:', state.dimStep, 'p1:', state.dimP1, 'p2:', state.dimP2, 'pos:', w);

      if (!state.dimP1) {
        state.dimP1   = { x: w.x, y: w.y };
        state.dimStep = 1;
        showStatus('📐 Клікніть другу точку');
        render();
        return;
      }

      if (!state.dimP2) {
        if (Math.hypot(w.x - state.dimP1.x, w.y - state.dimP1.y) < 0.5) {
          showStatus('❌ Клікніть в інше місце');
          return;
        }
        state.dimP2   = { x: w.x, y: w.y };
        state.dimStep = 2;
        showStatus('📐 Клікніть де розмістити лінію розмітки');
        render();
        return;
      }

      // Both points set — create dimension
      const ddx     = state.dimP2.x - state.dimP1.x;
      const ddy     = state.dimP2.y - state.dimP1.y;
      const isHoriz = Math.abs(ddx) >= Math.abs(ddy);

      const rawOffset   = isHoriz
        ? w.y - (state.dimP1.y + state.dimP2.y) / 2
        : w.x - (state.dimP1.x + state.dimP2.x) / 2;
      const MIN_OFFSET  = 6;
      const finalOffset = Math.abs(rawOffset) < MIN_OFFSET
        ? (rawOffset >= 0 ? MIN_OFFSET : -MIN_OFFSET)
        : rawOffset;

      // Build anchoredTo list
      const ANCHOR_TOL = 2.0;
      const anchors    = [];
      state.entities.forEach(ent => {
        if (ent.type === 'dimension') return;
        const snaps = typeof getSnapPoints === 'function' ? getSnapPoints(ent) : [];
        snaps.forEach(sp => {
          if (Math.hypot(sp.x - state.dimP1.x, sp.y - state.dimP1.y) < ANCHOR_TOL)
            anchors.push({ entityId: ent.id, end: 'p1' });
          if (Math.hypot(sp.x - state.dimP2.x, sp.y - state.dimP2.y) < ANCHOR_TOL)
            anchors.push({ entityId: ent.id, end: 'p2' });
        });
      });

      const newDim = {
        id:         state.nextId++,
        type:       'dimension',
        x1:         state.dimP1.x,
        y1:         state.dimP1.y,
        x2:         state.dimP2.x,
        y2:         state.dimP2.y,
        offset:     finalOffset,
        text:       '',
        color:      (state.currentColor) || '#000000',
        lineType:   'solid_thin',
        anchoredTo: anchors,
        dimKind:    'linear',
      };

      // Detect if measuring an arc
      if (anchors.length > 0) {
        const firstEnt = state.entities.find(e => e.id === anchors[0].entityId);
        if (firstEnt && firstEnt.type === 'arc' && !firstEnt.isLine) {
          newDim.dimKind   = 'radius';
          newDim.arcRadius = firstEnt.r;
        } else if (firstEnt && firstEnt.type === 'circle') {
          newDim.dimKind   = 'diameter';
          newDim.arcRadius = firstEnt.r;
        }
      }

      console.log('[DIM CREATE] newDim:', newDim);
      state.entities.push(newDim);
      saveSnapshot();

      // Reset
      state.dimP1   = null;
      state.dimP2   = null;
      state.dimStep = 0;

      previewLayer.innerHTML = '';
      render();
      showStatus('✓ Розмірку додано');
      return;
    }

    // Hatch tool — click to create hatch polygon points, dblclick to finish
    if(state.tool==='hatch'){
      if (!state.hatchPoints) state.hatchPoints = [];
      state.hatchPoints.push({x:w.x, y:w.y});
      render();
    }

    // Centerline tool — click start, click end
    if(state.tool==='centerline'){
      if(!state.lineStart) state.lineStart={x:w.x,y:w.y};
      else{
        state.entities.push({
          id:state.nextId++, type:'centerline', lineType:'dash_dot',
          x1:state.lineStart.x, y1:state.lineStart.y,
          x2:w.x, y2:w.y
        });
        state.lineStart=null;
        previewLayer.innerHTML='';
        saveSnapshot();
        render();
      }
    }
  }
});

viewport.addEventListener('mouseup',(e)=>{
  // Always reset drag states on ANY mouseup — prevents ghost drag
  if (e.button !== 0) {
    state.isDragging          = false;
    state.isDraggingEndpoint  = false;
    state.isDraggingDimOffset = false;
    state.isBoxSelecting      = false;
    viewport.style.cursor     = state.tool === 'select' ? 'default' : 'crosshair';
  }

  if(e.button===1){state.isPanning=false;viewport.style.cursor=state.tool==='select'?'default':'crosshair';}
  if(e.button===0){
    // Arc drag completion (CHECK FIRST)
    if (state.isDraggingEndpoint) {
      const endEnt = state.entities.find(en => en.id === state.dragEndpointEntId);
      const endIdx = state.dragEndpointIdx;

      if (endEnt && (endIdx === 0 || endIdx === 1)) {
        // Use current endpoint position (already set during mousemove with snap)
        const ex = endIdx === 0 ? endEnt.x1 : endEnt.x2;
        const ey = endIdx === 0 ? endEnt.y1 : endEnt.y2;

        // Final snap pass on mouseup — larger tolerance with minimum world distance
        const SNAP_PX  = 20;
        const ez2      = effectiveZoom();
        const snapTol  = Math.max(SNAP_PX / ez2, 1.0);  // minimum 1mm
        let bestDist   = snapTol;
        let snapX      = null;
        let snapY      = null;

        state.entities.forEach(other => {
          if (other.id === endEnt.id) return;
          if (other.type !== 'line' && other.type !== 'centerline' && other.type !== 'arc') return;

          const d1 = Math.hypot(other.x1 - ex, other.y1 - ey);
          const d2 = Math.hypot(other.x2 - ex, other.y2 - ey);

          if (d1 < bestDist) { bestDist = d1; snapX = other.x1; snapY = other.y1; }
          if (d2 < bestDist) { bestDist = d2; snapX = other.x2; snapY = other.y2; }
        });

        if (snapX !== null) {
          if (endIdx === 0) { endEnt.x1 = snapX; endEnt.y1 = snapY; }
          else              { endEnt.x2 = snapX; endEnt.y2 = snapY; }
          if (endEnt.type === 'arc' && endEnt.ctrl) refreshArcGeometry(endEnt);
        }
      }

      // Rebuild only the affected line connections after endpoint drag
      if (endEnt) {
        const lineIdsToRebuild = new Set();

        if (endEnt.type === 'line' || endEnt.type === 'centerline') {
          lineIdsToRebuild.add(endEnt.id);
        } else if (endIdx === 0 || endIdx === 1) {
          state.dragEndpointPrevConns.forEach(conn => lineIdsToRebuild.add(conn.lineId));

          const ex = endIdx === 0 ? endEnt.x1 : endEnt.x2;
          const ey = endIdx === 0 ? endEnt.y1 : endEnt.y2;
          state.entities.forEach(ent => {
            if (ent.type !== 'line' && ent.type !== 'centerline') return;
            if (Math.hypot(ent.x1 - ex, ent.y1 - ey) < 0.5 || Math.hypot(ent.x2 - ex, ent.y2 - ey) < 0.5) {
              lineIdsToRebuild.add(ent.id);
            }
          });
        }

        rebuildLineConnections(lineIdsToRebuild);

        // After rebuilding connections — trim all stubs at the dragged endpoint position
        if (endIdx === 0 || endIdx === 1) {
          const ex = endIdx === 0 ? endEnt.x1 : endEnt.x2;
          const ey = endIdx === 0 ? endEnt.y1 : endEnt.y2;
          trimAllStubsAtPoint({ x: ex, y: ey }, new Set([endEnt.id]));
        }
      }

      state.isDraggingEndpoint      = false;
      state.dragEndpointEntId       = null;
      state.dragEndpointIdx         = null;
      state.dragEndpointOrigX       = null;
      state.dragEndpointOrigY       = null;
      state.dragEndpointDisconnected = false;
      state.dragEndpointPrevConns   = [];
      viewport.style.cursor         = state.tool === 'select' ? 'default' : 'crosshair';

      // Final sync: re-read ALL dimension coordinates from their anchored entities
      state.entities.forEach(dim => {
        if (dim.type !== 'dimension' || !dim.anchoredTo) return;
        let changed = false;
        dim.anchoredTo.forEach(anchor => {
          const anchoredEnt = state.entities.find(e => e.id === anchor.entityId);
          if (!anchoredEnt) return;
          if (anchor.end === 'p1') { dim.x1 = anchoredEnt.x1; dim.y1 = anchoredEnt.y1; changed = true; }
          if (anchor.end === 'p2') { dim.x2 = anchoredEnt.x2; dim.y2 = anchoredEnt.y2; changed = true; }
        });
        if (changed) dim.text = '';
      });

      saveSnapshot();
      render();
      return;
    }

    if (state.isBoxSelecting) {
      state.isBoxSelecting = false;
      if (state.boxSelectRect && state.boxSelectRect.w > 2 && state.boxSelectRect.h > 2) {
        state.selectedIds = new Set();
        state.entities.forEach(ent => {
          if (entityInBox(ent, state.boxSelectRect)) state.selectedIds.add(ent.id);
        });
        if (state.selectedIds.size > 0) {
          state.selectedId = [...state.selectedIds][0];
          showStatus(`Вибрано: ${state.selectedIds.size} об'єктів`);
        }
      }
      state.boxSelectRect = null;
      state.boxSelectStart = null;
      state.boxHoverIds = new Set();
      document.getElementById('box-select-rect')?.remove();
      render();
      return;
    }

    if (state.isDraggingDimOffset) {
      state.isDraggingDimOffset = false;
      state.dragDimId = null;
      saveSnapshot();
      render();
      return;
    }

    if(state.arcPhase===2){
      const finishedArcId = state.arcDragId;
      state.arcPhase=0;
      state.arcDragId=null;
      state.arcP1=null;
      saveSnapshot();
      render();
      console.log('[Arc] Fixed');
      if (finishedArcId !== null) {
        const finishedArc = state.entities.find(e => e.id === finishedArcId);
        if (finishedArc) autoAnnotate(finishedArc);
      }
    }
    // в"Ђв"Ђ Entity drag completion в"Ђв"Ђ
    if(state.isDragging){
      state.isDragging=false;state.dragStartW=null;state.lastDragW=null;state.dragEntitySnap=null;
      viewport.style.cursor=state.tool==='select'?'default':'crosshair';
      saveSnapshot();
    }
  }
});

viewport.addEventListener('mouseleave',()=>{
  if(state.isPanning){state.isPanning=false;viewport.style.cursor=state.tool==='select'?'default':'crosshair';}
  if (state.hoveredId !== null) {
    state.hoveredId = null;
    render();
  }
  drawRulerH(); drawRulerV();
});

// ——— Line intersection helpers ———
function linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(den) < 1e-10) return false; // parallel
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

// Intersection of two INFINITE lines (not limited to segments)
// Returns null only if lines are parallel
function infiniteLinesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(den) < 1e-10) return null; // parallel
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1),
  };
}

function lineIntersectionPoint(x1, y1, x2, y2, x3, y3, x4, y4) {
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(den) < 1e-10) return null; // parallel
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null; // intersection outside segments
  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1),
  };
}

viewport.addEventListener('contextmenu', (e) => {
  if (document.querySelector('#dim-edit-dialog, .dim-edit-dialog, .modal-dialog, [data-modal]')) return;
  e.preventDefault();

  // Store RMB click position for "З'єднати сюди" feature
  const contextMenuX = e.clientX;
  const contextMenuY = e.clientY;
  const rmbWorld = screenToWorld(e.clientX, e.clientY);

  const raw = screenToWorld(e.clientX, e.clientY);
  let hitEnt = null;
  for (let i = state.entities.length - 1; i >= 0; i--) {
    if (hitTest(state.entities[i], raw.x, raw.y)) {
      hitEnt = state.entities[i];
      break;
    }
  }

  // Fallback — find nearest line to RMB click for "connect here" feature
  let nearestLineToRmb = null;
  let nearestLineDist  = 5.0; // max 5mm

  state.entities.forEach(ent => {
    if (ent.type !== 'line' && ent.type !== 'centerline') return;
    const dx    = ent.x2 - ent.x1;
    const dy    = ent.y2 - ent.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 0.001) return;
    const t = Math.max(0, Math.min(1,
      ((rmbWorld.x - ent.x1) * dx + (rmbWorld.y - ent.y1) * dy) / lenSq
    ));
    const closestX = ent.x1 + t * dx;
    const closestY = ent.y1 + t * dy;
    const dist = Math.hypot(closestX - rmbWorld.x, closestY - rmbWorld.y);
    if (dist < nearestLineDist) {
      nearestLineDist  = dist;
      nearestLineToRmb = ent;
    }
  });

  if (!hitEnt && !nearestLineToRmb) {
    closeCanvasContextMenu();
    return;
  }

  // Prefer hitEnt if valid, otherwise use nearestLineToRmb
  const ctxEnt = hitEnt || nearestLineToRmb;
  if (!ctxEnt || (ctxEnt.type !== 'line' && ctxEnt.type !== 'centerline' && ctxEnt.type !== 'arc')) {
    closeCanvasContextMenu();
    return;
  }

  e.stopPropagation();

  // Save previous selection BEFORE overwriting — needed for "connect" feature
  const prevSelectedIds = state.selectedIds ? new Set(state.selectedIds) : new Set();

  // DEBUG: log selection state
  state.selectedId = ctxEnt.id;
  state.selectedIds = new Set([ctxEnt.id]);
  showPropsPanel(ctxEnt);
  render();

  const items = [];

  // ── Розмітити декілька виділених об'єктів ──
  const multiSelected = [...prevSelectedIds]
    .map(id => state.entities.find(e => e.id === id))
    .filter(e => e && (
      e.type === 'line' || e.type === 'centerline' ||
      e.type === 'rect' || e.type === 'circle' || e.type === 'arc'
    ));

  if (multiSelected.length >= 2) {
    items.push({
      label: `📏 Розмітити виділені (${multiSelected.length})`,
      action: () => {
        saveSnapshot();

        // Show batch annotate dialog
        showBatchAnnotateDialog(multiSelected);
      }
    });
  }

  // ── Розмітити один об'єкт через RMB ──
  if (multiSelected.length <= 1 &&
      (ctxEnt.type === 'line' || ctxEnt.type === 'rect' ||
       ctxEnt.type === 'circle' || ctxEnt.type === 'arc')) {
    items.push({
      label: `📏 Розмітити`,
      action: () => { autoAnnotate(ctxEnt); }
    });
  }

  if (ctxEnt.type === 'line') {
    items.push({
      label: '〜 Зігнути в криву',
      action: () => {
        saveSnapshot();
        const midX = (ctxEnt.x1 + ctxEnt.x2) / 2;
        const midY = (ctxEnt.y1 + ctxEnt.y2) / 2;
        const dx = ctxEnt.x2 - ctxEnt.x1;
        const dy = ctxEnt.y2 - ctxEnt.y1;
        const len = Math.hypot(dx, dy) || 1;
        const offset = Math.max(len * 0.2, 2.0);
        ctxEnt.type = 'arc';
        ctxEnt.ctrl = {
          x: midX + (-dy / len) * offset,
          y: midY + (dx / len) * offset,
        };
        refreshArcGeometry(ctxEnt);
        render();
        showStatus('Тягніть помаранчеву точку для зміни кривизни');
      }
    });
  }

  if (ctxEnt.type === 'arc') {
    items.push({
      label: '— Повернути в пряму лінію',
      action: () => {
        saveSnapshot();
        ctxEnt.type = 'line';
        delete ctxEnt.ctrl;
        delete ctxEnt.cx;
        delete ctxEnt.cy;
        delete ctxEnt.r;
        delete ctxEnt.startAngle;
        delete ctxEnt.endAngle;
        delete ctxEnt.isLine;
        render();
      }
    });
  }

  // "З'єднати виділене сюди" — connect selected entities to click point on ctxEnt
  if (state.selectedIds && state.selectedIds.size > 0) {
    const selectedEnts = [...state.selectedIds]
      .map(id => state.entities.find(ent => ent.id === id))
      .filter(ent => ent && ent.id !== ctxEnt.id &&
        (ent.type === 'line' || ent.type === 'centerline' || ent.type === 'arc'));

    if (selectedEnts.length > 0) {
      items.push({
        label: "🔗 З'єднати виділене сюди",
        action: () => {
          saveSnapshot();
          const clickW = screenToWorld(contextMenuX, contextMenuY);

          selectedEnts.forEach(selEnt => {
            const d1 = Math.hypot(selEnt.x1 - clickW.x, selEnt.y1 - clickW.y);
            const d2 = Math.hypot(selEnt.x2 - clickW.x, selEnt.y2 - clickW.y);

            const dx = ctxEnt.x2 - ctxEnt.x1;
            const dy = ctxEnt.y2 - ctxEnt.y1;
            const lenSq = dx * dx + dy * dy;
            let connX = clickW.x, connY = clickW.y;

            if (lenSq > 0.001) {
              const t = Math.max(0, Math.min(1,
                ((clickW.x - ctxEnt.x1) * dx + (clickW.y - ctxEnt.y1) * dy) / lenSq
              ));
              connX = ctxEnt.x1 + t * dx;
              connY = ctxEnt.y1 + t * dy;
            }

            if (d1 <= d2) {
              selEnt.x1 = connX; selEnt.y1 = connY;
            } else {
              selEnt.x2 = connX; selEnt.y2 = connY;
            }

            if (selEnt.type === 'arc' && selEnt.ctrl) refreshArcGeometry(selEnt);

            // Trim stubs at the connection point
            trimAllStubsAtPoint(
              { x: connX, y: connY },
              new Set([selEnt.id, ctxEnt.id])
            );

            // Rebuild connections for selEnt
            state.connections = state.connections.filter(
              c => c.lineId !== selEnt.id && c.targetId !== selEnt.id
            );
            const newConnsS = buildLineConnections(
              selEnt.id, selEnt.x1, selEnt.y1, selEnt.x2, selEnt.y2
            );
            state.connections.push(...newConnsS);
          });
          render();
          showStatus("🔗 З'єднано");
        }
      });
    }
  }

  // "З'єднати кінець до лінії" — connect ONLY when selected line actually intersects target line
  const targetLine = (hitEnt && (hitEnt.type === 'line' || hitEnt.type === 'centerline'))
    ? hitEnt
    : nearestLineToRmb;

  const otherSelected = [...prevSelectedIds]
    .map(id => state.entities.find(en => en.id === id))
    .filter(en => en && en.id !== targetLine?.id &&
      (en.type === 'line' || en.type === 'centerline' || en.type === 'arc'));

  if (targetLine && otherSelected.length >= 1 &&
      (targetLine.type === 'line' || targetLine.type === 'centerline')) {

    // Check which selected lines intersect targetLine (using infinite lines)
    const intersecting = otherSelected.filter(selEnt => {
      if (selEnt.type !== 'line' && selEnt.type !== 'centerline') return false;
      // Use infinite lines — show button even if segments don't physically cross yet
      const ix = infiniteLinesIntersect(
        selEnt.x1, selEnt.y1, selEnt.x2, selEnt.y2,
        targetLine.x1, targetLine.y1, targetLine.x2, targetLine.y2
      );
      return ix !== null; // null only if parallel
    });

    if (intersecting.length >= 1) {
      items.push({
        label: `🔗 З'єднати перетин`,
        action: () => {
          saveSnapshot();

          // Phase 1: collect intersection points and process only selEnt
          const intersectionPoints = [];

          otherSelected.forEach(selEnt => {
            if (selEnt.type !== 'line' && selEnt.type !== 'centerline') return;

            const ix = infiniteLinesIntersect(
              selEnt.x1, selEnt.y1, selEnt.x2, selEnt.y2,
              targetLine.x1, targetLine.y1, targetLine.x2, targetLine.y2
            );
            if (!ix) return;

            intersectionPoints.push({ ix, selEnt });

            const TOL = 1.0;

            // ── epConnected: check if selEnt endpoint is connected to THIRD party ──
            function epConnected(px, py) {
              return state.entities.some(o => {
                if (o.id === selEnt.id) return false;
                if (o.id === targetLine.id) return false;
                if (otherSelected.some(s => s.id === o.id)) return false;
                if (o.type !== 'line' && o.type !== 'centerline' && o.type !== 'arc') return false;
                return Math.hypot(o.x1 - px, o.y1 - py) < TOL ||
                       Math.hypot(o.x2 - px, o.y2 - py) < TOL;
              });
            }

            // ── tpConnectedLocal: for targetLine trim inside Phase 1 ──
            function tpConnectedLocal(px, py) {
              return state.entities.some(o => {
                if (o.id === targetLine.id) return false;
                if (otherSelected.some(s => s.id === o.id)) return false;
                if (o.type !== 'line' && o.type !== 'centerline' && o.type !== 'arc') return false;
                return Math.hypot(o.x1 - px, o.y1 - py) < TOL ||
                       Math.hypot(o.x2 - px, o.y2 - py) < TOL;
              });
            }

            const sdx = selEnt.x2 - selEnt.x1;
            const sdy = selEnt.y2 - selEnt.y1;
            const sLen = Math.hypot(sdx, sdy) || 1;
            const tIx = ((ix.x - selEnt.x1) * sdx + (ix.y - selEnt.y1) * sdy) / (sLen * sLen);

            const p1Free = !epConnected(selEnt.x1, selEnt.y1);
            const p2Free = !epConnected(selEnt.x2, selEnt.y2);

            if (tIx < 0) {
              if (p1Free) { selEnt.x1 = ix.x; selEnt.y1 = ix.y; }
              else if (!p1Free && !p2Free) {
                const d1 = Math.hypot(selEnt.x1 - ix.x, selEnt.y1 - ix.y);
                const d2 = Math.hypot(selEnt.x2 - ix.x, selEnt.y2 - ix.y);
                if (d1 <= d2) { selEnt.x1 = ix.x; selEnt.y1 = ix.y; }
                else          { selEnt.x2 = ix.x; selEnt.y2 = ix.y; }
              }
            } else if (tIx > 1) {
              if (p2Free) { selEnt.x2 = ix.x; selEnt.y2 = ix.y; }
              else if (!p1Free && !p2Free) {
                const d1 = Math.hypot(selEnt.x1 - ix.x, selEnt.y1 - ix.y);
                const d2 = Math.hypot(selEnt.x2 - ix.x, selEnt.y2 - ix.y);
                if (d2 <= d1) { selEnt.x2 = ix.x; selEnt.y2 = ix.y; }
                else          { selEnt.x1 = ix.x; selEnt.y1 = ix.y; }
              }
            } else {
              const d1 = Math.hypot(selEnt.x1 - ix.x, selEnt.y1 - ix.y);
              const d2 = Math.hypot(selEnt.x2 - ix.x, selEnt.y2 - ix.y);
              if (d1 <= d2) { if (p1Free) { selEnt.x1 = ix.x; selEnt.y1 = ix.y; } }
              else          { if (p2Free) { selEnt.x2 = ix.x; selEnt.y2 = ix.y; } }
            }

            // ── Trim targetLine stubs at ix (before rebuild connections) ──
            const tdx2 = targetLine.x2 - targetLine.x1;
            const tdy2 = targetLine.y2 - targetLine.y1;
            const tLen2 = Math.hypot(tdx2, tdy2) || 1;
            const tParam = ((ix.x - targetLine.x1) * tdx2 + (ix.y - targetLine.y1) * tdy2) / (tLen2 * tLen2);
            const tConn1 = !tpConnectedLocal(targetLine.x1, targetLine.y1);
            const tConn2 = !tpConnectedLocal(targetLine.x2, targetLine.y2);

            console.log('[PHASE1] selEnt:', selEnt.id, 'ix:', ix.x.toFixed(2), ix.y.toFixed(2));
            console.log('[PHASE1] tParam:', tParam.toFixed(3),
              'tConn1:', tConn1, 'tConn2:', tConn2,
              'targetLine:', targetLine.x1.toFixed(2), targetLine.y1.toFixed(2),
              targetLine.x2.toFixed(2), targetLine.y2.toFixed(2));

            if (tParam <= 0.01) {
              // Перетин на початку або до початку → рухати p1
              if (tConn1) { targetLine.x1 = ix.x; targetLine.y1 = ix.y; }
            } else if (tParam >= 0.99) {
              // Перетин на кінці або після кінця → рухати p2
              if (tConn2) { targetLine.x2 = ix.x; targetLine.y2 = ix.y; }
            } else {
              // Перетин всередині → trim ближчий вільний кінець
              const d1 = Math.hypot(targetLine.x1 - ix.x, targetLine.y1 - ix.y);
              const d2 = Math.hypot(targetLine.x2 - ix.x, targetLine.y2 - ix.y);
              if (d1 <= d2 && tConn1) { targetLine.x1 = ix.x; targetLine.y1 = ix.y; }
              else if (tConn2)        { targetLine.x2 = ix.x; targetLine.y2 = ix.y; }
            }

            // Rebuild connections only for selEnt (don't touch targetLine yet)
            state.connections = state.connections.filter(
              c => c.lineId !== selEnt.id && c.targetId !== selEnt.id
            );
            const newConns = buildLineConnections(
              selEnt.id, selEnt.x1, selEnt.y1, selEnt.x2, selEnt.y2
            );
            state.connections.push(...newConns);

            trimAllStubsAtPoint(ix, new Set([selEnt.id, targetLine.id]));
          });

          // Phase 2: process targetLine ONCE after all selEnt are moved
          if (intersectionPoints.length > 0) {

            // ── tpConnected: check ALL other entities, excluding otherSelected ──
            function tpConnected(px, py) {
              return state.entities.some(o => {
                if (o.id === targetLine.id) return false;
                if (otherSelected.some(s => s.id === o.id)) return false;
                if (o.type !== 'line' && o.type !== 'centerline' && o.type !== 'arc') return false;
                return Math.hypot(o.x1 - px, o.y1 - py) < TOL ||
                       Math.hypot(o.x2 - px, o.y2 - py) < TOL;
              });
            }

            // Track which endpoints have already been moved to prevent double-move
            let p1Moved = false;
            let p2Moved = false;

            // Process each intersection point independently
            intersectionPoints.forEach(({ ix }) => {
              const tdx = targetLine.x2 - targetLine.x1;
              const tdy = targetLine.y2 - targetLine.y1;
              const tLen = Math.hypot(tdx, tdy) || 1;
              const tIx2 = ((ix.x - targetLine.x1) * tdx + (ix.y - targetLine.y1) * tdy) / (tLen * tLen);

              // Recalculate tp1Free/tp2Free for current state of targetLine
              const tp1Free = !tpConnected(targetLine.x1, targetLine.y1);
              const tp2Free = !tpConnected(targetLine.x2, targetLine.y2);

              if (tIx2 < 0) {
                // Intersection before start → move p1
                if (tp1Free && !p1Moved) {
                  targetLine.x1 = ix.x; targetLine.y1 = ix.y;
                  p1Moved = true;
                } else if (!tp1Free && !tp2Free) {
                  const d1 = Math.hypot(targetLine.x1 - ix.x, targetLine.y1 - ix.y);
                  const d2 = Math.hypot(targetLine.x2 - ix.x, targetLine.y2 - ix.y);
                  if (d1 <= d2 && !p1Moved) { targetLine.x1 = ix.x; targetLine.y1 = ix.y; p1Moved = true; }
                  else if (!p2Moved)          { targetLine.x2 = ix.x; targetLine.y2 = ix.y; p2Moved = true; }
                }
              } else if (tIx2 > 1) {
                // Intersection after end → move p2
                if (tp2Free && !p2Moved) {
                  targetLine.x2 = ix.x; targetLine.y2 = ix.y;
                  p2Moved = true;
                } else if (!tp1Free && !tp2Free) {
                  const d1 = Math.hypot(targetLine.x1 - ix.x, targetLine.y1 - ix.y);
                  const d2 = Math.hypot(targetLine.x2 - ix.x, targetLine.y2 - ix.y);
                  if (d2 <= d1 && !p2Moved) { targetLine.x2 = ix.x; targetLine.y2 = ix.y; p2Moved = true; }
                  else if (!p1Moved)          { targetLine.x1 = ix.x; targetLine.y1 = ix.y; p1Moved = true; }
                }
              } else {
                // Intersection inside → trim closer free endpoint
                const d1 = Math.hypot(targetLine.x1 - ix.x, targetLine.y1 - ix.y);
                const d2 = Math.hypot(targetLine.x2 - ix.x, targetLine.y2 - ix.y);
                if (d1 <= d2) { if (tp1Free && !p1Moved) { targetLine.x1 = ix.x; targetLine.y1 = ix.y; p1Moved = true; } }
                else          { if (tp2Free && !p2Moved) { targetLine.x2 = ix.x; targetLine.y2 = ix.y; p2Moved = true; } }
              }
            });

            // Rebuild connections for targetLine — ONCE after all ix
            state.connections = state.connections.filter(
              c => c.lineId !== targetLine.id && c.targetId !== targetLine.id
            );
            const newConnsT = buildLineConnections(
              targetLine.id, targetLine.x1, targetLine.y1, targetLine.x2, targetLine.y2
            );
            state.connections.push(...newConnsT);

            // Auto-trim all stubs at all junction points
            intersectionPoints.forEach(({ ix: iPoint }) => {
              trimAllStubsAtPoint(iPoint, new Set());
            });
          }

          render();
          showStatus(`🔗 З'єднано перетин`);
        }
      });
    }
  }

  const TOL = 0.5;
  const p1Connected = state.entities.some(other => {
    if (other.id === ctxEnt.id) return false;
    if (other.type !== 'line' && other.type !== 'centerline' && other.type !== 'arc') return false;
    return Math.hypot(other.x1 - ctxEnt.x1, other.y1 - ctxEnt.y1) < TOL ||
           Math.hypot(other.x2 - ctxEnt.x1, other.y2 - ctxEnt.y1) < TOL;
  });
  const p2Connected = state.entities.some(other => {
    if (other.id === ctxEnt.id) return false;
    if (other.type !== 'line' && other.type !== 'centerline' && other.type !== 'arc') return false;
    return Math.hypot(other.x1 - ctxEnt.x2, other.y1 - ctxEnt.y2) < TOL ||
           Math.hypot(other.x2 - ctxEnt.x2, other.y2 - ctxEnt.y2) < TOL;
  });

  if (p1Connected) {
    items.push({
      label: "Роз'єднати початок",
      action: () => {
        saveSnapshot();
        const dx = ctxEnt.x2 - ctxEnt.x1;
        const dy = ctxEnt.y2 - ctxEnt.y1;
        const len = Math.hypot(dx, dy) || 1;
        ctxEnt.x1 -= (dx / len) * 1.0;
        ctxEnt.y1 -= (dy / len) * 1.0;
        if (ctxEnt.type === 'arc' && ctxEnt.ctrl) refreshArcGeometry(ctxEnt);
        updateLinkedDimensions(ctxEnt, 0, 0);
        render();
        showStatus("Роз'єднано початок");
      }
    });
  }

  if (p2Connected) {
    items.push({
      label: "Роз'єднати кінець",
      action: () => {
        saveSnapshot();
        const dx = ctxEnt.x2 - ctxEnt.x1;
        const dy = ctxEnt.y2 - ctxEnt.y1;
        const len = Math.hypot(dx, dy) || 1;
        ctxEnt.x2 += (dx / len) * 1.0;
        ctxEnt.y2 += (dy / len) * 1.0;
        if (ctxEnt.type === 'arc' && ctxEnt.ctrl) refreshArcGeometry(ctxEnt);
        updateLinkedDimensions(ctxEnt, 0, 0);
        render();
        showStatus("Роз'єднано кінець");
      }
    });
  }

  // Show merge option ONLY when exactly 2 objects are shift-selected
  if (state.selectedIds && state.selectedIds.size === 2) {
    const selected = [...state.selectedIds]
      .map(id => state.entities.find(e => e.id === id))
      .filter(e => e && (e.type === 'line' || e.type === 'centerline' || e.type === 'arc'));

    if (selected.length === 2) {
      const [a, b] = selected;

      // Check if objects share any endpoint within 5mm — only then offer merge
      const TOL_MERGE = 5.0;
      const endpointsA = [{ x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 }];
      const endpointsB = [{ x: b.x1, y: b.y1 }, { x: b.x2, y: b.y2 }];

      let closestDist = Infinity;
      let bestAIdx = 0, bestBIdx = 0;

      endpointsA.forEach((pa, ai) => {
        endpointsB.forEach((pb, bi) => {
          const d = Math.hypot(pa.x - pb.x, pa.y - pb.y);
          if (d < closestDist) { closestDist = d; bestAIdx = ai; bestBIdx = bi; }
        });
      });

      // Only show merge if closest endpoints are within TOL_MERGE
      if (closestDist <= TOL_MERGE) {
        items.push({
          label: '🔗 Об\'єднати об\'єкти',
          action: () => {
            saveSnapshot();

            // Move b's closest endpoint exactly to a's closest endpoint
            const targetX = bestAIdx === 0 ? a.x1 : a.x2;
            const targetY = bestAIdx === 0 ? a.y1 : a.y2;

            if (bestBIdx === 0) { b.x1 = targetX; b.y1 = targetY; }
            else                { b.x2 = targetX; b.y2 = targetY; }

            // Recalculate arc if needed
            if (b.type === 'arc' && b.ctrl) {
              const d = calcArcFromThreePoints(
                { x: b.x1, y: b.y1 }, b.ctrl, { x: b.x2, y: b.y2 }
              );
              if (d && !d.isLine) {
                b.cx = d.cx; b.cy = d.cy; b.r = d.r;
                b.startAngle = d.startAngle; b.endAngle = d.endAngle;
              }
            }

            render();
            showStatus('🔗 Об\'єднано');
          }
        });
      }
      // If objects are far apart — show nothing (no merge option)
    }
  }

  // Add disconnect option if entity has connections
  addDisconnectOption(items, ctxEnt);

  openCanvasContextMenu(e.clientX, e.clientY, items);
});

// Disconnect option helper — adds "Від'єднати" if entity has connections
function addDisconnectOption(items, ctxEnt) {
  const entConns = state.connections.filter(c => c.lineId === ctxEnt.id || c.targetId === ctxEnt.id);
  if (entConns.length === 0) return;

  items.push({
    label: `✂️ Від'єднати (${entConns.length})`,
    action: () => {
      saveSnapshot();
      state.connections = state.connections.filter(c =>
        c.lineId !== ctxEnt.id && c.targetId !== ctxEnt.id
      );
      render();
      showStatus('✂️ Від\'єднано');
    }
  });
}

document.addEventListener('mousedown', (e) => {
  if (!e.target.closest('#canvas-context-menu')) closeCanvasContextMenu();
}, true);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCanvasContextMenu();
});

viewport.addEventListener('dblclick',(e)=>{
  if(state.tool==='polyline'&&state.polylinePoints.length>=2){state.polylinePoints.pop();finishPolyline();}
  if(state.tool==='hatch'&&state.hatchPoints&&state.hatchPoints.length>=3){finishHatch();}

  // Подвійний клік — редагування розміру (РІ режимі select)
  if (state.tool === 'select') {
    const raw = screenToWorld(e.clientX, e.clientY);
    let hitDim = null;
    for (let i = state.entities.length - 1; i >= 0; i--) {
      const ent = state.entities[i];
      if (ent.type !== 'dimension') continue;
      if (hitTestDimension(ent, raw.x, raw.y)) {
        hitDim = ent;
        break;
      }
    }
    if (hitDim) {
      e.preventDefault();
      e.stopPropagation();
      openDimensionEditDialog(hitDim);
    }
  }
});

// Zoom limits — MAX clamped to 20 (2000 %) because extreme zoom was
// producing SVG coordinates huge enough to freeze the renderer.
const MAX_ZOOM = 20;
const MIN_ZOOM = 0.05;
viewport.addEventListener('wheel',(e)=>{
  e.preventDefault();
  const rect=viewport.getBoundingClientRect(),vx=e.clientX-rect.left,vy=e.clientY-rect.top;
  const ez=effectiveZoom(),wx=(vx-state.panX)/ez,wy=(vy-state.panY)/ez;
  const f=e.deltaY<0?1.1:0.9; state.zoom=Math.min(MAX_ZOOM,Math.max(MIN_ZOOM,state.zoom*f));
  const ne=effectiveZoom(); state.panX=vx-wx*ne; state.panY=vy-wy*ne; render();
},{passive:false});

// ═══════════════════════════════════════════════
// EVENTS — КЛАВІАТУРА
// ═══════════════════════════════════════════════

document.addEventListener('keydown', (e) => {

  // в"Ђв"Ђ Guard: input fields в"Ђв"Ђ
  const tag = e.target.tagName.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' ||
      e.target.isContentEditable) return;

  // в"Ђв"Ђ Guard: coord input в"Ђв"Ђ
  if (state.coordInputActive) return;

  const ctrl  = e.ctrlKey || e.metaKey;
  const shift = e.shiftKey;
  const code  = e.code; // 'KeyS', 'KeyL', 'Delete', etc. — layout-independent

  console.log('[KEY]', e.key, 'code:', code, 'ctrl:', ctrl, 'shift:', shift, 'target:', tag);

  // ════════════════════════════════════════
  // CTRL / META combinations — FIRST
  // ════════════════════════════════════════
  if (ctrl) {
    e.preventDefault(); // preventDefault for ALL ctrl combos

    if (shift && code === 'KeyZ') { redo(); return; }

    switch (code) {
      case 'KeyZ': undo();              return;
      case 'KeyY': redo();              return;
      case 'KeyS': saveProject();       return;
      case 'KeyO': loadProject();       return;
      case 'KeyN': createNewProject();  return;
      case 'KeyC': copySelected();      return;
      case 'KeyV': pasteSelected();     return;
      case 'KeyD': duplicateSelected(); return;
      case 'KeyA': selectAll();         return;
    }
    // Any other Ctrl combo — ignore
    return;
  }

  // F1 — Інструкція, F11 — показати/сховати аркуш
  if (code === 'F1') {
    e.preventDefault();
    const b = document.getElementById('btn-help');
    if (b) b.click();
    return;
  }
  if (code === 'F11') {
    e.preventDefault();
    const b = document.getElementById('btn-toggle-page');
    if (b) b.click();
    return;
  }

  // ════════════════════════════════════════
  // Arrow keys
  // ════════════════════════════════════════
  if (code === 'ArrowUp'   || code === 'ArrowDown' ||
      code === 'ArrowLeft' || code === 'ArrowRight') {

    if (state.selectedId === null) return;
    e.preventDefault();

    const step = shift ? 10 : 1;
    const ent  = state.entities.find(en => en.id === state.selectedId);
    if (!ent) return;

    const dx = code === 'ArrowLeft'  ? -step
             : code === 'ArrowRight' ?  step : 0;
    const dy = code === 'ArrowUp'    ? -step
             : code === 'ArrowDown'  ?  step : 0;

    moveEntity(ent, dx, dy);
    saveSnapshot();
    render();
    showPropsPanel(ent);
    return;
  }

  // ════════════════════════════════════════
  // Delete / Backspace
  // ════════════════════════════════════════
  if (code === 'Delete' || code === 'Backspace') {
    // Видалити всі виділені об'єкти
    const toDelete = new Set();
    if (state.selectedId !== null) toDelete.add(state.selectedId);
    if (state.selectedIds) state.selectedIds.forEach(id => toDelete.add(id));

    if (toDelete.size > 0) {
      e.preventDefault();
      const totalDeleted = deleteEntitiesWithLinkedDimensions(toDelete);
      const count = totalDeleted;
      state.selectedId = null;
      state.selectedIds = new Set();
      showPropsPanel(null);
      saveSnapshot();
      render();
      showStatus(`Видалено ${count} об'єктів`);
    }
    return;
  }

  // ════════════════════════════════════════
  // Escape
  // ════════════════════════════════════════
  if (code === 'Escape') {
    if (state.tool === 'polyline' &&
        state.polylinePoints.length >= 2) {
      finishPolyline();
    } else if (state.tool === 'arc' && state.arcPhase > 0) {
      state.arcPhase  = 0;
      state.arcP1     = null;
      state.arcDragId = null;
      previewLayer.innerHTML = '';
    } else if (state.tool === 'dimension' && state.dimStep > 0) {
      state.dimStep = 0;
      state.dimP1   = null;
      state.dimP2   = null;
      previewLayer.innerHTML = '';
      showStatus('Розмір: клікніть першу точку вимірювання');
    } else if (state.tool === 'hatch' && state.hatchPoints && state.hatchPoints.length >= 3) {
      finishHatch();
    } else {
      state.lineStart      = null;
      state.dimP1          = null;
      state.dimP2          = null;
      state.dimStep        = 0;
      state.arcP1          = null;
      state.arcPhase       = 0;
      state.polylinePoints = [];
      state.hatchPoints    = [];
      previewLayer.innerHTML = '';
    }
    render();
    return;
  }

  // ════════════════════════════════════════
  // Digit input during line drawing
  // ════════════════════════════════════════
  if (state.tool === 'line' &&
      state.lineStart !== null &&
      /^Digit[0-9]$/.test(code)) {
    const digit = code.replace('Digit', '');
    showCoordInput('Довжина (мм):', digit, (length) => {
      if (length <= 0) return;
      const newLine = {
        id:   state.nextId++,
        type: 'line',
        lineType: 'solid_thick',
        x1:   state.lineStart.x,
        y1:   state.lineStart.y,
        x2:   state.lineStart.x + length,
        y2:   state.lineStart.y,
      };
      state.entities.push(newLine);
      state.lineStart = null;
      previewLayer.innerHTML = '';
      saveSnapshot();
      render();
      autoAnnotate(newLine);
    });
    return;
  }

  // ════════════════════════════════════════
  // Tool hotkeys (no Ctrl — already exited above)
  // ════════════════════════════════════════
  switch (code) {
    case 'KeyS': setTool('select');    break;
    case 'KeyL': setTool('line');      break;
    case 'KeyR': setTool('rect');      break;
    case 'KeyC': setTool('circle');    break;
    case 'KeyA': setTool('arc');       break;
    case 'KeyP': setTool('polyline');  break;
    case 'KeyD': setTool('dimension'); break;
    case 'KeyF': zoomToFit();          break;
    case 'KeyM': toggleGrid();         break;
    case 'KeyG': toggleSnap();         break;
    case 'Home':
      state.zoom = 1.0;
      state.panX = 20;
      state.panY = 20;
      render();
      break;
  }
});

// ═══════════════════════════════════════════════
// BUTTONS
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// IMAGE AS LAYOUT (фото-макет)
// ═══════════════════════════════════════════════

function addImageEntity(src, x, y) {
  const tempImg = new Image();
  tempImg.onload = () => {
    const pxToMm = 0.264583;
    let imgW = tempImg.width  * pxToMm;
    let imgH = tempImg.height * pxToMm;

    const maxMm = 200;
    if (imgW > maxMm || imgH > maxMm) {
      const scale = maxMm / Math.max(imgW, imgH);
      imgW *= scale;
      imgH *= scale;
    }

    const ent = {
      id:      state.nextId++,
      type:    'image',
      x, y,
      w:       Math.round(imgW),
      h:       Math.round(imgH),
      src,
      opacity: 0.4,
      locked:  false,
    };

    state.entities.unshift(ent);
    saveSnapshot();
    render();
    state.selectedId = ent.id;
    showPropsPanel(ent);
    showStatus(`🖼 Зображення додано (${formatMM(imgW)}×${formatMM(imgH)} мм)`);
  };
  tempImg.src = src;
}

// Drag & Drop зображень на viewport
viewport.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  viewport.style.outline = '2px dashed #007acc';
});

viewport.addEventListener('dragleave', () => {
  viewport.style.outline = '';
});

viewport.addEventListener('drop', (e) => {
  e.preventDefault();
  viewport.style.outline = '';

  const files = Array.from(e.dataTransfer.files)
    .filter(f => f.type.startsWith('image/'));

  if (files.length === 0) return;

  const dropWorld = screenToWorld(e.clientX, e.clientY);

  files.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      addImageEntity(ev.target.result, dropWorld.x + idx * 5, dropWorld.y + idx * 5);
    };
    reader.readAsDataURL(file);
  });
});

// Вставка Р· буфера обміну Ctrl+V для зображень
document.addEventListener('paste', (e) => {
  // Якщо coord input активний — не перехоплюємо
  if (state.coordInputActive) return;

  const items = Array.from(e.clipboardData?.items || []);
  const imageItem = items.find(item => item.type.startsWith('image/'));

  if (!imageItem) return;

  e.preventDefault();

  const file   = imageItem.getAsFile();
  const reader = new FileReader();
  reader.onload = (ev) => {
    const vp  = viewport.getBoundingClientRect();
    const cx  = vp.left + vp.width  / 2;
    const cy  = vp.top  + vp.height / 2;
    const pos = screenToWorld(cx, cy);
    addImageEntity(ev.target.result, pos.x - 50, pos.y - 50);
  };
  reader.readAsDataURL(file);
});

// ═══════════════════════════════════════════════
// TOOL BUTTONS
// ═══════════════════════════════════════════════
btnSelect.addEventListener('click',()=>setTool('select'));
btnLine.addEventListener('click',()=>setTool('line'));
btnRect.addEventListener('click',()=>setTool('rect'));
btnCircle.addEventListener('click',()=>setTool('circle'));
btnPolyline.addEventListener('click',()=>setTool('polyline'));
btnArc.addEventListener('click',()=>setTool('arc'));
btnDimension.addEventListener('click',()=>setTool('dimension'));
btnHatch.addEventListener('click',()=>setTool('hatch'));
btnCenterline.addEventListener('click',()=>setTool('centerline'));
btnStampEdit.addEventListener('click', ()=>openStampEditor());

// Вставка зображення
function handleImageFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 20 * 1024 * 1024) {
    showStatus('❌ Файл занадто великий (максимум 20MB)');
    return;
  }

  const reader = new FileReader();

  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    const img     = new Image();

    img.onload = () => {
      const PX_PER_MM = 3.7795;
      let wMm = img.naturalWidth  / PX_PER_MM;
      let hMm = img.naturalHeight / PX_PER_MM;

      const MAX_MM = 200;
      if (wMm > MAX_MM || hMm > MAX_MM) {
        const scale = MAX_MM / Math.max(wMm, hMm);
        wMm *= scale;
        hMm *= scale;
      }

      const centerWorld = screenToWorld(
        window.innerWidth  / 2,
        window.innerHeight / 2
      );

      const imageEnt = {
        id:       state.nextId++,
        type:     'image',
        x:        centerWorld.x - wMm / 2,
        y:        centerWorld.y - hMm / 2,
        w:        wMm,
        h:        hMm,
        src:      dataUrl,
        opacity:  1.0,
        locked:   state.imagesLocked,
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
        fileName: file.name,
      };

      state.entities.push(imageEnt);
      state.selectedId  = imageEnt.id;
      state.selectedIds = new Set([imageEnt.id]);
      saveSnapshot();
      render();
      showStatus(`🖼 Вставлено: ${file.name} (${Math.round(wMm)}×${Math.round(hMm)} мм)`);
    };

    img.onerror = () => showStatus('❌ Не вдалося завантажити зображення');
    img.src = dataUrl;
  };

  reader.onerror = () => showStatus('❌ Помилка читання файлу');
  reader.readAsDataURL(file);
}

if (btnInsertImage) {
  btnInsertImage.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    let input = document.getElementById('img-file-input');

    // Create input dynamically if missing from HTML
    if (!input) {
      input = document.createElement('input');
      input.type    = 'file';
      input.id      = 'img-file-input';
      input.accept  = 'image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/svg+xml';
      input.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;';
      document.body.appendChild(input);
      input.addEventListener('change', handleImageFileSelected);
    }

    input.value = '';
    input.click();
  });
}

// Attach to existing input if present
const imageFileInput = document.getElementById('img-file-input');
if (imageFileInput) {
  imageFileInput.addEventListener('change', handleImageFileSelected);
}

// Also handle the second button (btn-add-image) if it exists
const btnAddImage = document.getElementById('btn-add-image');
if (btnAddImage && btnAddImage !== btnInsertImage) {
  btnAddImage.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    let input = document.getElementById('img-file-input');
    if (!input) {
      input = document.createElement('input');
      input.type    = 'file';
      input.id      = 'img-file-input';
      input.accept  = 'image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/svg+xml';
      input.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;';
      document.body.appendChild(input);
      input.addEventListener('change', handleImageFileSelected);
    }

    input.value = '';
    input.click();
  });
}

// Lock/Unlock images toggle
const btnLockImages = document.getElementById('btn-lock-images');
if (btnLockImages) {
  btnLockImages.addEventListener('click', () => {
    state.imagesLocked = !state.imagesLocked;

    // Apply locked flag to ALL existing image entities
    state.entities.forEach(ent => {
      if (ent.type === 'image') {
        ent.locked = state.imagesLocked;
      }
    });

    // Update button appearance
    btnLockImages.classList.toggle('active', state.imagesLocked);

    // Update SVG icon — swap open/closed lock shackle
    const shackle = btnLockImages.querySelector('#lock-shackle');
    if (shackle) {
      shackle.setAttribute('d', state.imagesLocked
        ? 'M8 11V7a4 4 0 0 1 8 0'      // closed lock
        : 'M8 11V7a4 4 0 0 1 8 0v4'     // open lock
      );
    }

    saveSnapshot();
    render();
    showStatus(state.imagesLocked
      ? '🔒 Всі макети заблоковано'
      : '🔓 Всі макети розблоковано'
    );
  });
}

// Вмикання/вимикання штампу
if (btnStampToggle) {
  btnStampToggle.classList.toggle('active', state.showStamp);
  btnStampToggle.addEventListener('click', () => {
  state.showStamp = !state.showStamp;
  btnStampToggle.classList.toggle('active', state.showStamp);

  // Якщо вимикаємо — видалити SVG групу штампу
  if (!state.showStamp) {
    const old = drawingSvg.querySelector('.page-stamp');
    if (old) old.remove();
    showStatus('Штамп прихований');
  } else {
    showStatus('Штамп показано');
  }
  render();
  });
}

// Auto-annotate toggle
const btnAutoAnnotate = document.getElementById('btn-auto-annotate');
if (btnAutoAnnotate) {
  btnAutoAnnotate.addEventListener('click', () => {
    AUTO_ANNOTATE.enabled = !AUTO_ANNOTATE.enabled;
    btnAutoAnnotate.classList.toggle('active', AUTO_ANNOTATE.enabled);
    showStatus(AUTO_ANNOTATE.enabled
      ? 'Авто-розмітка увімкнена'
      : '⬜ Авто-розмітка вимкнена'
    );
  });
}

// Toggle page visibility
const btnTogglePage = document.getElementById('btn-toggle-page');
if (btnTogglePage) {
  btnTogglePage.addEventListener('click', () => {
    state.showPage = !state.showPage;
    btnTogglePage.classList.toggle('active', state.showPage);
    render();
    showStatus(state.showPage ? 'Аркуш показано' : '⬜ Аркуш приховано');
  });
}

// Help — інструкція
const btnHelp = document.getElementById('btn-help');

// в"Ђв"Ђ SVG іконки для інструкції в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
const HELP_SVG = {
  mouse: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2a7 7 0 0 1 7 7v8a7 7 0 0 1-14 0V9a7 7 0 0 1 7-7z"/>
    <line x1="12" y1="2"  x2="12" y2="9"/>
    <line x1="12" y1="9"  x2="8"  y2="13"/>
    <line x1="12" y1="9"  x2="16" y2="13"/>
  </svg>`,
  keyboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="6"  y1="9"  x2="6.01"  y2="9"/>
    <line x1="10" y1="9"  x2="10.01" y2="9"/>
    <line x1="14" y1="9"  x2="14.01" y2="9"/>
    <line x1="18" y1="9"  x2="18.01" y2="9"/>
    <line x1="8"  y1="13" x2="8.01"  y2="13"/>
    <line x1="12" y1="13" x2="12.01" y2="13"/>
    <line x1="16" y1="13" x2="16.01" y2="13"/>
    <line x1="7"  y1="17" x2="17" y2="17"/>
  </svg>`,
  snap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <line x1="12" y1="2"  x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="2"  y1="12" x2="6"  y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
  </svg>`,
  draw: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>`,
  select: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 3l14 9-7 1-4 7z"/>
  </svg>`,
  export: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>`,
  soon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>`,
};

if (btnHelp) {
  btnHelp.addEventListener('click', () => {
    const existing = document.getElementById('help-modal');
    if (existing) { existing.remove(); return; }

    const modal = document.createElement('div');
    modal.id = 'help-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #252526;
      border: 1px solid #3e3e42;
      border-radius: 6px;
      z-index: 10000;
      color: #cccccc;
      font-family: 'Segoe UI', system-ui, monospace;
      font-size: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.8);
      width: 520px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      user-select: none;
    `;

    // в"Ђв"Ђ Хедер в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      background: #2d2d2d;
      border-bottom: 1px solid #3e3e42;
      flex-shrink: 0;
    `;
    header.innerHTML = `
      <span style="color:#007acc;display:flex;align-items:center;width:18px;height:18px;">
        ${HELP_SVG.soon}
      </span>
      <span style="color:#cccccc;font-size:13px;font-weight:500;flex:1;">
        Інструкція
      </span>
      <button id="help-close" style="
        background: none;
        border: none;
        color: #858585;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        border-radius: 3px;
        width: 24px;
        height: 24px;
        justify-content: center;
      ">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6"  y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    // в"Ђв"Ђ Контент в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ
    const body = document.createElement('div');
    body.style.cssText = `
      overflow-y: auto;
      padding: 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    const sections = [
      {
        icon: HELP_SVG.draw,
        title: 'Малювання',
        color: '#007acc',
        items: [
          ['L', 'Лінія'],
          ['R', 'Прямокутник'],
          ['C', 'Коло'],
          ['A', 'Дуга'],
          ['P', 'Ламана лінія'],
          ['H', 'Штриховка'],
          ['D', 'Розмір'],
        ],
      },
      {
        icon: HELP_SVG.select,
        title: 'Вибір — редагування',
        color: '#4caf50',
        items: [
          ['V', 'Вибір об\'єкта'],
          ['Ctrl+A', 'Вибрати все'],
          ['Delete', 'Видалити вибране'],
          ['Ctrl+Z', 'Скасувати'],
          ['Ctrl+Y', 'Повторити'],
          ['Ctrl+D', 'Дублювати'],
          ['2×клік', 'Редагувати розмір'],
        ],
      },
      {
        icon: HELP_SVG.mouse,
        title: 'Навігація',
        color: '#ff9800',
        items: [
          ['Колесо', 'Масштаб'],
          ['ПКМ + тягти', 'Панорама'],
          ['Пробіл + тягти', 'Панорама'],
          ['F', 'По аркушу'],
          ['+  /  -', 'Збільшити / Зменшити'],
        ],
      },
      {
        icon: HELP_SVG.snap,
        title: 'Прив\'язки',
        color: '#7ec8e3',
        items: [
          ['S', 'Вмикання прив\'язки'],
          ['G', 'Сітка'],
          ['Shift', 'Примусова прив\'язка до точки'],
        ],
      },
      {
        icon: HELP_SVG.export,
        title: 'Файл — експорт',
        color: '#ce93d8',
        items: [
          ['Ctrl+S', 'Зберегти проект'],
          ['Ctrl+O', 'Відкрити проект'],
          ['Ctrl+N', 'Новий проект'],
          ['—', 'Експорт PNG / SVG / DXF'],
        ],
      },
    ];

    sections.forEach(sec => {
      const secHead = document.createElement('div');
      secHead.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px 6px;
        color: ${sec.color};
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-top: 4px;
      `;
      secHead.innerHTML = `
        <span style="width:14px;height:14px;display:flex;
                     align-items:center;flex-shrink:0;">
          ${sec.icon}
        </span>
        ${sec.title}
      `;
      body.appendChild(secHead);

      sec.items.forEach(([key, desc]) => {
        const row = document.createElement('div');
        row.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 10px;
          border-radius: 3px;
          transition: background 0.1s;
        `;
        row.innerHTML = `
          <span style="color:#858585;font-size:12px;flex:1;">${desc}</span>
          <kbd>${key}</kbd>
        `;
        row.addEventListener('mouseenter',
          () => row.style.background = '#2a2d2e');
        row.addEventListener('mouseleave',
          () => row.style.background = '');
        body.appendChild(row);
      });
    });

    // Футер
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 14px 16px;
      border-top: 1px solid #3e3e42;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #555;
      font-size: 11px;
      flex-shrink: 0;
    `;
    footer.innerHTML = `
      <span style="color:#3e3e42;width:14px;height:14px;
                   display:flex;align-items:center;">
        ${HELP_SVG.soon}
      </span>
      Детальна документація буде додана РІ наступній версії
    `;

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#help-close');
    closeBtn.onclick = () => modal.remove();
    closeBtn.onmouseenter = () => closeBtn.style.background = '#3e3e42';
    closeBtn.onmouseleave = () => closeBtn.style.background = '';

    modal.addEventListener('keydown', e => {
      if (e.code === 'Escape' || e.code === 'F1') modal.remove();
    });
    modal.setAttribute('tabindex', '-1');
    modal.focus();
  });
}

// Page format and orientation
if (selPageFormat) {
  selPageFormat.addEventListener('change', () => {
    const val = selPageFormat.value;

    if (val === 'custom') {
      openCustomPageSizeDialog();
      return;
    }

    state.pageFormat = val;
    const fmt = PAGE_FORMATS[state.pageFormat];
    if (btnOrientation) btnOrientation.disabled = false;
    saveSnapshot();
    render();
    showStatus(`Формат: ${fmt.name}`);
  });
}

// Функція діалогу кастомного розміру
function openCustomPageSizeDialog() {
  const old = document.getElementById('custom-page-dialog');
  if (old) old.remove();

  const curW = state.customPageW || 210;
  const curH = state.customPageH || 297;

  const dialog = document.createElement('div');
  dialog.id = 'custom-page-dialog';
  dialog.style.cssText = `
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: #1e1e1e; border: 1px solid #007acc;
    border-radius: 6px; padding: 20px; z-index: 10000;
    color: #ccc; font-family: monospace; font-size: 13px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.8);
    min-width: 280px;
  `;

  dialog.innerHTML = `
    <div style="color:#7ec8e3; font-size:14px; margin-bottom:16px; font-weight:bold;">
      Кастомний розмір аркуша
    </div>

    <div style="display:flex; gap:12px; margin-bottom:12px; align-items:center;">
      <label style="width:70px; color:#888; font-size:11px;">Ширина (мм):</label>
      <input id="custom-w" type="number" value="${curW}" min="50" max="5000" step="1"
        style="flex:1; background:#252525; border:1px solid #444; color:#fff;
               padding:5px 8px; border-radius:3px; font-size:13px;">
    </div>

    <div style="display:flex; gap:12px; margin-bottom:16px; align-items:center;">
      <label style="width:70px; color:#888; font-size:11px;">Висота (мм):</label>
      <input id="custom-h" type="number" value="${curH}" min="50" max="5000" step="1"
        style="flex:1; background:#252525; border:1px solid #444; color:#fff;
               padding:5px 8px; border-radius:3px; font-size:13px;">
    </div>

    <div style="margin-bottom:12px; font-size:11px; color:#666;">Швидкий вибір:</div>
    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px;">
      <button onclick="
        document.getElementById('custom-w').value=210;
        document.getElementById('custom-h').value=297;
      " style="padding:3px 8px; background:#252525; border:1px solid #444;
               color:#ccc; border-radius:3px; cursor:pointer; font-size:10px;">A4</button>
      <button onclick="
        document.getElementById('custom-w').value=297;
        document.getElementById('custom-h').value=420;
      " style="padding:3px 8px; background:#252525; border:1px solid #444;
               color:#ccc; border-radius:3px; cursor:pointer; font-size:10px;">A3</button>
      <button onclick="
        document.getElementById('custom-w').value=420;
        document.getElementById('custom-h').value=594;
      " style="padding:3px 8px; background:#252525; border:1px solid #444;
               color:#ccc; border-radius:3px; cursor:pointer; font-size:10px;">A2</button>
      <button onclick="
        document.getElementById('custom-w').value=297;
        document.getElementById('custom-h').value=210;
      " style="padding:3px 8px; background:#252525; border:1px solid #444;
               color:#ccc; border-radius:3px; cursor:pointer; font-size:10px;">A4 альб.</button>
      <button onclick="
        document.getElementById('custom-w').value=420;
        document.getElementById('custom-h').value=297;
      " style="padding:3px 8px; background:#252525; border:1px solid #444;
               color:#ccc; border-radius:3px; cursor:pointer; font-size:10px;">A3 альб.</button>
      <button onclick="
        document.getElementById('custom-w').value=500;
        document.getElementById('custom-h').value=700;
      " style="padding:3px 8px; background:#252525; border:1px solid #444;
               color:#ccc; border-radius:3px; cursor:pointer; font-size:10px;">500×700</button>
    </div>

    <div style="display:flex; gap:8px; justify-content:flex-end;">
      <button id="custom-cancel" style="padding:6px 16px; background:#333;
              border:1px solid #555; color:#ccc; border-radius:3px; cursor:pointer;">
        Скасувати
      </button>
      <button id="custom-apply" style="padding:6px 16px; background:#094771;
              border:1px solid #007acc; color:#fff; border-radius:3px; cursor:pointer;">
        Застосувати
      </button>
    </div>
  `;

  document.body.appendChild(dialog);

  document.getElementById('custom-cancel').onclick = () => {
    selPageFormat.value = state.pageFormat || 'A4';
    dialog.remove();
  };

  document.getElementById('custom-apply').onclick = () => {
    const w = parseFloat(document.getElementById('custom-w').value);
    const h = parseFloat(document.getElementById('custom-h').value);

    if (isNaN(w) || isNaN(h) || w < 50 || h < 50) {
      showStatus('❌ Невірні розміри (мінімум 50×50 мм)');
      return;
    }

    state.pageFormat  = 'custom';
    state.customPageW = w;
    state.customPageH = h;

    PAGE_FORMATS['custom'] = {
      w, h,
      name:         `Кастом ${w}×${h}`,
      verticalOnly: false,
    };

    selPageFormat.value = 'custom';
    if (btnOrientation) btnOrientation.disabled = false;
    saveSnapshot();
    render();
    showStatus(`Кастомний розмір: ${w}×${h} мм`);
    dialog.remove();
  };

  dialog.addEventListener('keydown', (e) => {
    if (e.code === 'Enter')  document.getElementById('custom-apply').click();
    if (e.code === 'Escape') document.getElementById('custom-cancel').click();
  });
  dialog.querySelector('#custom-w').focus();
}

if (btnOrientation) {
  btnOrientation.addEventListener('click', () => {
    state.pageOrientation = state.pageOrientation === 'portrait' ? 'landscape' : 'portrait';
    saveSnapshot();
    render();
    showStatus(`Орієнтація: ${state.pageOrientation === 'portrait' ? 'Вертикальна' : 'Горизонтальна'}`);
  });
}

btnMirrorX.addEventListener('click',()=>mirrorGlobal('x'));
btnMirrorY.addEventListener('click',()=>mirrorGlobal('y'));
btnSnap.addEventListener('click',toggleSnap);
if (btnGrid) btnGrid.addEventListener('click',toggleGrid);
if (btnPaperGrid) btnPaperGrid.addEventListener('click', () => {
  state.paperGridVisible = !state.paperGridVisible;
  btnPaperGrid.classList.toggle('active', state.paperGridVisible);
  render();
  showStatus(state.paperGridVisible
    ? 'Міліметрівка увімкнена'
    : 'Міліметрівка вимкнена'
  );
});

// Встановити початковий стан кнопки міліметрівки
if (btnPaperGrid) {
  btnPaperGrid.classList.toggle('active', state.paperGridVisible);
}
btnUndo.addEventListener('click',undo);
btnRedo.addEventListener('click',redo);
btnSave.addEventListener('click',saveProject);
btnOpen.addEventListener('click',loadProject);
btnExportSVG.addEventListener('click',exportSVG);
btnExportDXF.addEventListener('click',exportDXF);
btnExportPNG.addEventListener('click',exportPNG);
btnClear.addEventListener('click', () => {
  if (state.entities.length === 0) {
    showStatus('Креслення вже порожнС"');
    return;
  }
  if (document.getElementById('clear-all-dialog')) return;

  const dialog = document.createElement('div');
  dialog.id = 'clear-all-dialog';
  dialog.tabIndex = -1;
  dialog.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    background:#1e1e1e;border:1px solid #f44;border-radius:6px;
    padding:24px;z-index:10000;color:#ccc;font-family:monospace;
    font-size:13px;box-shadow:0 8px 32px rgba(0,0,0,0.85);
    text-align:center;min-width:300px;`;
  dialog.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;
                margin-bottom:14px;justify-content:center;">
      <span style="color:#f44336;width:20px;height:20px;
                   display:flex;align-items:center;flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94
                   a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9"  x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </span>
      <span style="font-size:13px;color:#cccccc;font-weight:500;">
        Очистити все?
      </span>
    </div>
    <div style="color:#666;font-size:11px;margin-bottom:20px;
                line-height:1.5;">
      Буде видалено ${state.entities.length} об'єктів.<br>
      Всі об'єкти будуть видалені Р· поточного креслення.
    </div>
    <div style="display:flex;gap:8px;justify-content:center;">
      <button id="clear-cancel"
        style="padding:7px 20px;background:#333;border:1px solid #555;
               color:#ccc;border-radius:3px;cursor:pointer;font-size:12px;
               font-family:inherit;">
        Скасувати
      </button>
      <button id="clear-confirm"
        style="display:flex;align-items:center;gap:6px;
               padding:7px 20px;background:#3a1a1a;border:1px solid #f44;
               color:#f88;border-radius:3px;cursor:pointer;font-size:12px;
               font-family:inherit;">
        <span style="width:14px;height:14px;display:flex;align-items:center;color:#f44;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/>
            <path d="M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </span>
        Очистити все
      </button>
    </div>`;
  document.body.appendChild(dialog);

  const cleanup = () => dialog.remove();
  dialog.querySelector('#clear-cancel').addEventListener('click', cleanup);
  dialog.querySelector('#clear-confirm').addEventListener('click', () => {
    state.entities     = [];
    state.selectedId   = null;
    state.selectedIds  = new Set();
    state.lineStart    = null;
    state.polylinePoints = [];
    previewLayer.innerHTML = '';
    showPropsPanel(null);
    saveSnapshot();
    render();
    showStatus('Креслення очищено');
    cleanup();
  });
  dialog.addEventListener('keydown', (ev) => {
    if (ev.code === 'Escape') cleanup();
    if (ev.code === 'Enter')  dialog.querySelector('#clear-confirm').click();
  });
  dialog.focus();
});
btnZoomFit.addEventListener('click',zoomToFit);

// ═══════════════════════════════════════════════
// MENU ACTIONS from Electron (future-proofing)
// ═══════════════════════════════════════════════
if (window.electronAPI?.onMenuAction) {
  window.electronAPI.onMenuAction((action) => {
    console.log('[Menu Action]', action);
    switch (action) {
      case 'undo':       undo();              break;
      case 'redo':       redo();              break;
      case 'copy':       copySelected();      break;
      case 'paste':      pasteSelected();     break;
      case 'duplicate':  duplicateSelected(); break;
      case 'selectAll':  selectAll();         break;
      case 'save':       saveProject();       break;
      case 'open':       loadProject();       break;
      case 'exportPDF':  exportPDF();         break;
    }
  });
}

// ═══════════════════════════════════════════════
// MIRROR / COPY
// ═══════════════════════════════════════════════

function copySelected() {
  if (state.selectedId === null) return;
  const ent = state.entities.find(e => e.id === state.selectedId);
  if (!ent) return;

  state.clipboard = deepCopyEntities([ent])[0];

  // Show confirmation in status bar
  const oldStatus = statusTool.textContent;
  statusTool.textContent = 'Скопійовано — Ctrl+V для вставки';
  setTimeout(() => { statusTool.textContent = oldStatus; }, 2000);

  console.log('[Copy]', ent.type);
}

// в"Ђв"Ђ Paste в"Ђв"Ђ
function pasteSelected() {
  if (!state.clipboard) return;

  const copy    = deepCopyEntities([state.clipboard])[0];
  copy.id       = state.nextId++;

  // Offset by 10mm so it's visible
  moveEntity(copy, 10, 10);

  state.entities.push(copy);
  state.selectedId = copy.id;

  saveSnapshot();
  render();
  showPropsPanel(copy);
  console.log('[Paste]', copy.type, 'id:', copy.id);
}

// в"Ђв"Ђ Duplicate (Ctrl+D) = Copy + Paste immediately в"Ђв"Ђ
function duplicateSelected() {
  if (state.selectedId === null) return;
  const ent = state.entities.find(e => e.id === state.selectedId);
  if (!ent) return;

  const copy = deepCopyEntities([ent])[0];
  copy.id    = state.nextId++;
  moveEntity(copy, 10, 10);

  state.entities.push(copy);
  state.selectedId = copy.id;

  saveSnapshot();
  render();
  showPropsPanel(copy);
  console.log('[Duplicate]', copy.type);
}

// в"Ђв"Ђ Select All в"Ђв"Ђ
function selectAll() {
  if (state.entities.length === 0) return;

  // Виділяємо всі об'єкти
  state.selectedIds = new Set(state.entities.map(e => e.id));

  // Для сумісності Р· існуючим кодом — selectedId = останній
  state.selectedId = state.entities[state.entities.length - 1].id;

  render();
  // Не показуємо props panel для множинного виділення
  showPropsPanel(null);
  showStatus(`Виділено ${state.entities.length} об'єктів`);
}

function mirrorGlobal(axis) {
  if (state.selectedId === null) return;
  const ent = state.entities.find(e => e.id === state.selectedId);
  if (!ent) return;

  // Modify ORIGINAL (not a copy) — move entity by mirroring
  if (axis === 'x') {
    // Mirror relative to vertical axis (X = PAGE_W / 2)
    const axisX = PAGE_W / 2;
    applyMirrorX(ent, axisX);
  } else {
    const axisY = PAGE_H / 2;
    applyMirrorY(ent, axisY);
  }

  // Do NOT add new entity — only update original
  saveSnapshot();
  render();
  showPropsPanel(ent);
}

function applyMirrorX(ent, axisX) {
  if (ent.type === 'line' || ent.type === 'rect') {
    ent.x1 = 2*axisX - ent.x1;
    ent.x2 = 2*axisX - ent.x2;
  } else if (ent.type === 'circle') {
    ent.cx = 2*axisX - ent.cx;
  } else if (ent.type === 'arc') {
    // Mirror all points
    ent.cx = 2*axisX - ent.cx;
    if (ent.x1 !== undefined) ent.x1 = 2*axisX - ent.x1;
    if (ent.x2 !== undefined) ent.x2 = 2*axisX - ent.x2;
    if (ent.ctrl) ent.ctrl.x = 2*axisX - ent.ctrl.x;

    // Recalculate angles
    const sa = Math.PI - ent.endAngle;
    const ea = Math.PI - ent.startAngle;
    ent.startAngle = sa;
    ent.endAngle   = ea;
  } else if (ent.type === 'polyline') {
    ent.points = ent.points.map(p => ({ x: 2*axisX - p.x, y: p.y }));
  } else if (ent.type === 'dimension') {
    ent.x1 = 2*axisX - ent.x1;
    ent.x2 = 2*axisX - ent.x2;
  }
}

function applyMirrorY(ent, axisY) {
  if (ent.type === 'line' || ent.type === 'rect') {
    ent.y1 = 2*axisY - ent.y1;
    ent.y2 = 2*axisY - ent.y2;
  } else if (ent.type === 'circle') {
    ent.cy = 2*axisY - ent.cy;
  } else if (ent.type === 'arc') {
    // Mirror all points
    ent.cy = 2*axisY - ent.cy;
    if (ent.y1 !== undefined) ent.y1 = 2*axisY - ent.y1;
    if (ent.y2 !== undefined) ent.y2 = 2*axisY - ent.y2;
    if (ent.ctrl) ent.ctrl.y = 2*axisY - ent.ctrl.y;

    const tmp = ent.startAngle;
    ent.startAngle = -ent.endAngle;
    ent.endAngle   = -tmp;
  } else if (ent.type === 'polyline') {
    ent.points = ent.points.map(p => ({ x: p.x, y: 2*axisY - p.y }));
  } else if (ent.type === 'dimension') {
    ent.y1 = 2*axisY - ent.y1;
    ent.y2 = 2*axisY - ent.y2;
  }
}

// ═══════════════════════════════════════════════
// ZOOM TO FIT
// ═══════════════════════════════════════════════

function zoomToFit(){
  const vw=viewport.clientWidth,vh=viewport.clientHeight,margin=40;
  const sx=(vw-margin*2)/PAGE_W,sy=(vh-margin*2)/PAGE_H;
  state.zoom=Math.min(sx,sy)/BASE_ZOOM; const ez=effectiveZoom();
  state.panX=(vw-PAGE_W*ez)/2; state.panY=(vh-PAGE_H*ez)/2; render();
}

// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════

window.addEventListener('resize',render);

// ═══════════════════════════════════════════════
// СТАРРў
// ═══════════════════════════════════════════════

// Initialize multi-project — ensure at least one project exists
(function initProjects() {
  if (!state.projects || state.projects.length === 0) {
    state.projects = [];
    state.activeProjectIdx = 0;

    const firstProj = {
      id:    Date.now(),
      name:  'Проект 1',
      dirty: false,
      snap:  createProjectSnapshot(),
    };
    state.projects.push(firstProj);
  }
  renderProjectTabs();
  const proj = state.projects[state.activeProjectIdx];
  if (proj) document.title = `${proj.name} — ToolCAD`;
})();

zoomToFit(); saveSnapshot();

// saveSnapshot() right after init marks the project dirty; reset it since this
// is the clean initial state.
if (state.projects && state.projects[state.activeProjectIdx]) {
  state.projects[state.activeProjectIdx].dirty = false;
  renderProjectTabs();
}
