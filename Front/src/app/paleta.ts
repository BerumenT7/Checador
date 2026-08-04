// ─────────────────────────────────────────────────────────────────────────────
// Paleta de colores — sistema de modo claro / oscuro
// Colores tomados del dashboard "SIETE Inventory" (LiveInventoryReport)
// Nota: se usa .ts en lugar de .js porque este proyecto Angular no tiene
// habilitado "allowJs" en tsconfig.json; el contenido es JS puro válido.
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark';

export interface Palette {
  bg: string;
  bgCard: string;
  bgElevated: string;
  bgDeep: string;
  border: string;
  text: string;
  textMid: string;
  textMuted: string;
  accent: string;
  success: string;
  successBg: string;
  error: string;
  errorBg: string;
  warning: string;
  purple: string;
}

export const PALETTE: Record<ThemeMode, Palette> = {
  light: {
    bg: '#F0F4F5',
    bgCard: '#FFFFFF',
    bgElevated: '#F7FAFB',
    bgDeep: '#E4ECED',
    border: '#D4E0E2',
    text: '#0D2426',
    textMid: '#3D6166',
    textMuted: '#8BBCC2',
    accent: '#00838A',
    success: '#0B7A45',
    successBg: '#ECFAF4',
    error: '#C0392B',
    errorBg: '#FEF0EE',
    warning: '#C0842B',
    purple: '#7A4FD6',
  },
  dark: {
    bg: '#0F1A1B',
    bgCard: '#182526',
    bgElevated: '#0F2526',
    bgDeep: '#071220',
    border: '#1E3A3E',
    text: '#E8F2F3',
    textMid: '#8BBCC2',
    textMuted: '#3D6166',
    accent: '#00A89D',
    success: '#4ECDC4',
    successBg: '#0B2E22',
    error: '#FF6B6B',
    errorBg: '#2E0F0B',
    warning: '#E0A045',
    purple: '#B06AFF',
  },
};

const STORAGE_KEY = 'checador-theme';

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

/** Aplica la paleta como variables CSS en :root (document.documentElement). */
export function applyTheme(mode: ThemeMode): void {
  const p = PALETTE[mode];
  const root = document.documentElement.style;

  root.setProperty('--bg', p.bg);
  root.setProperty('--bg-card', p.bgCard);
  root.setProperty('--bg-elevated', p.bgElevated);
  root.setProperty('--bg-deep', p.bgDeep);
  root.setProperty('--border', p.border);
  root.setProperty('--text', p.text);
  root.setProperty('--text-mid', p.textMid);
  root.setProperty('--text-muted', p.textMuted);
  root.setProperty('--accent', p.accent);
  root.setProperty('--success', p.success);
  root.setProperty('--success-bg', p.successBg);
  root.setProperty('--error', p.error);
  root.setProperty('--error-bg', p.errorBg);
  root.setProperty('--warning', p.warning);
  root.setProperty('--purple', p.purple);

  // Variantes RGB para usar con rgba(var(--x-rgb), alpha)
  root.setProperty('--text-rgb', hexToRgb(p.text));
  root.setProperty('--accent-rgb', hexToRgb(p.accent));
  root.setProperty('--success-rgb', hexToRgb(p.success));
  root.setProperty('--error-rgb', hexToRgb(p.error));
  root.setProperty('--warning-rgb', hexToRgb(p.warning));
  root.setProperty('--purple-rgb', hexToRgb(p.purple));

  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem(STORAGE_KEY, mode);
}

/** Lee el modo guardado, o preferencia del sistema, o "dark" por default. */
export function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (stored === 'light' || stored === 'dark') return stored;
  const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
}

/** Inicializa el tema al arrancar la app. */
export function initTheme(): ThemeMode {
  const mode = getStoredTheme();
  applyTheme(mode);
  return mode;
}

/** Alterna entre claro/oscuro y devuelve el nuevo modo. */
export function toggleTheme(current: ThemeMode): ThemeMode {
  const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
