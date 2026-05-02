'use client';

interface SliderInputProps {
  value: number;
  onChange: (v: number) => void;
  label: string;
  desc: string;
  low: string;
  high: string;
  icon: string;
}

export default function SliderInput({
  value,
  onChange,
  label,
  desc,
  low,
  high,
  icon,
}: SliderInputProps) {
  return (
    <div className="mb-8">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm text-fg">
          {icon} {label}
        </span>
        <span className="font-mono text-2xl text-fg">{value}</span>
      </div>
      <p className="mb-3.5 text-xs leading-snug text-faint">{desc}</p>
      <div className="relative flex h-8 items-center">
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="h-8 w-full cursor-pointer appearance-none bg-transparent"
        />
      </div>
      <div className="mt-1 flex justify-between text-[0.625rem] tracking-wider text-faint">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
