'use client';

interface TopBarProps {
  title?: string;
  right?: string;
  onBack?: () => void;
}

export default function TopBar({ title, right, onBack }: TopBarProps) {
  return (
    <div className="sticky top-0 z-[100] flex items-center justify-between border-b border-ghost bg-bg px-6 py-4">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[0.8125rem] text-dim"
        >
          ← back
        </button>
      ) : (
        <div className="font-mono text-xs uppercase tracking-[0.15em] text-fg">{title}</div>
      )}
      {right && <div className="font-mono text-[0.6875rem] text-faint">{right}</div>}
    </div>
  );
}
