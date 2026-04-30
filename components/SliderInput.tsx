'use client';

import { c, MONO } from '@/lib/data';

interface SliderInputProps {
  value: number;
  onChange: (v: number) => void;
  label: string;
  desc: string;
  low: string;
  high: string;
  icon: string;
}

export default function SliderInput({ value, onChange, label, desc, low, high, icon }: SliderInputProps) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 14, color: c.fg }}>{icon} {label}</span>
        <span style={{ fontSize: 26, fontFamily: MONO, color: c.fg }}>{value}</span>
      </div>
      <div style={{ fontSize: 12, color: c.faint, marginBottom: 14, lineHeight: 1.5 }}>{desc}</div>
      <div style={{ position: "relative", height: 32, display: "flex", alignItems: "center" }}>
        <input
          type="range" min="1" max="10" value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          style={{ width: "100%", appearance: "none", background: "transparent", cursor: "pointer", height: 32 }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: c.faint, letterSpacing: "0.05em" }}>{low}</span>
        <span style={{ fontSize: 10, color: c.faint, letterSpacing: "0.05em" }}>{high}</span>
      </div>
    </div>
  );
}
