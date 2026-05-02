import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      colors: {
        bg: 'var(--c-bg)',
        fg: 'var(--c-fg)',
        dim: 'var(--c-dim)',
        faint: 'var(--c-faint)',
        ghost: 'var(--c-ghost)',
        sub: 'var(--c-sub)',
        surface: 'var(--c-surface)',
        'surface-2': 'var(--c-surface-2)',
        danger: 'var(--c-danger)',
        'danger-border': 'var(--c-danger-border)',
        warn: 'var(--c-warn)',
        'warn-border': 'var(--c-warn-border)',
        success: 'var(--c-success)',
        'success-border': 'var(--c-success-border)',
        active: 'var(--c-active)',
        scrim: 'var(--c-scrim)',
        'scrim-soft': 'var(--c-scrim-soft)',

        // Legacy shadcn/Next aliases — kept for completeness.
        background: 'var(--c-bg)',
        foreground: 'var(--c-fg)',
      },
    },
  },
  plugins: [],
};

export default config;
