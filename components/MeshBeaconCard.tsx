'use client';

import { useState } from 'react';
import { usePassageStore } from '@/lib/store';
import type { Destination } from '@/lib/types';

interface MeshBeaconCardProps {
  dest: Destination;
}

interface PingResult {
  ms: number;
  hops: number;
  at: string;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(100, n));
}

export default function MeshBeaconCard({ dest }: MeshBeaconCardProps) {
  const armedMap = usePassageStore(s => s.meshBeaconArmed);
  const setArmed = usePassageStore(s => s.setMeshBeaconArmed);

  const armed = armedMap[dest.id] ?? false;
  const beacon = dest.meshBeacon;

  const [pinging, setPinging] = useState(false);
  const [lastPing, setLastPing] = useState<PingResult | null>(null);
  const [sosArming, setSosArming] = useState(false);

  const sendPing = async () => {
    if (pinging) return;
    setPinging(true);
    setLastPing(null);
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));
    // Simulate latency that scales with hop count and inverse coverage.
    const baseMs = 80 + beacon.hopsToSAR * 90 + Math.round((100 - beacon.coverage) * 1.5);
    const jitter = Math.round(Math.random() * 60);
    setLastPing({
      ms: baseMs + jitter,
      hops: beacon.hopsToSAR,
      at: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    });
    setPinging(false);
  };

  const coveragePct = clamp01(beacon.coverage);
  const statusLabel = armed ? 'ARMED' : 'STANDBY';
  const statusColor = armed ? 'text-success' : 'text-faint';
  const statusBorder = armed ? 'border-success-border' : 'border-ghost';

  return (
    <div className="border border-ghost bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 text-[0.5625rem] uppercase tracking-[0.16em] text-faint">
            Cross-traveler safety
          </div>
          <div className="text-base text-fg">Mesh beacon</div>
          <div className="mt-1 text-[0.6875rem] text-dim">
            Devices form a self-healing network in remote zones — if you fall, the closest
            stranger&apos;s wearable knows before SAR does.
          </div>
        </div>
        <div
          className={`shrink-0 border ${statusBorder} px-2 py-1 text-[0.5625rem] uppercase tracking-[0.14em] ${statusColor}`}
        >
          {statusLabel}
        </div>
      </div>

      {/* Live metrics grid */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="border border-ghost bg-bg p-3">
          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">Density</div>
          <div className="mt-0.5 text-base text-fg">{beacon.density}</div>
          <div className="text-[0.625rem] text-faint">in mesh range</div>
        </div>
        <div className="border border-ghost bg-bg p-3">
          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">Hops to SAR</div>
          <div className="mt-0.5 text-base text-fg">{beacon.hopsToSAR}</div>
          <div className="text-[0.625rem] text-faint">network jumps</div>
        </div>
        <div className="border border-ghost bg-bg p-3">
          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">Coverage</div>
          <div className="mt-0.5 text-base text-fg">{coveragePct}%</div>
          <div className="relative mt-1 h-px bg-ghost">
            <div
              className="absolute left-0 top-0 h-px bg-fg"
              style={{ width: `${coveragePct}%` }}
            />
          </div>
        </div>
        <div className="border border-ghost bg-bg p-3">
          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">Last ping</div>
          <div className="mt-0.5 text-base text-fg">{beacon.lastPing}</div>
          <div className="text-[0.625rem] text-faint">{beacon.knownTravelers} known</div>
        </div>
      </div>

      {/* Hop chain visualization */}
      <div className="mb-4 border border-ghost bg-bg p-3">
        <div className="mb-2 text-[0.5625rem] uppercase tracking-[0.14em] text-faint">
          Path to SAR ops
        </div>
        <div className="flex items-center gap-2 overflow-x-auto text-[0.625rem] tracking-[0.06em] text-sub">
          <span className="border border-fg px-2 py-1 text-fg">YOU</span>
          <span className="text-faint">───</span>
          <span className="border border-ghost px-2 py-1">+{beacon.knownTravelers} TRAVELERS</span>
          <span className="text-faint">───</span>
          <span className="border border-ghost px-2 py-1">RELAY</span>
          <span className="text-faint">───</span>
          <span className="border border-ghost px-2 py-1">SAR OPS</span>
        </div>
        <div className="mt-2 text-[0.625rem] italic text-faint">
          Nearest relay: {beacon.nearestRelay}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setArmed(dest.id, !armed)}
          className={`cursor-pointer border px-3 py-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] ${
            armed ? 'border-fg bg-fg text-bg' : 'border-ghost bg-transparent text-dim'
          }`}
        >
          {armed ? 'Disarm beacon' : 'Arm beacon'}
        </button>
        <button
          type="button"
          onClick={sendPing}
          disabled={pinging}
          className="cursor-pointer border border-ghost bg-transparent px-3 py-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-dim disabled:cursor-wait"
        >
          {pinging ? 'Pinging...' : 'Test ping'}
        </button>
        <button
          type="button"
          onClick={() => setSosArming(v => !v)}
          className={`cursor-pointer border px-3 py-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] ${
            sosArming
              ? 'border-danger-border bg-danger text-bg'
              : 'border-danger-border bg-transparent text-danger'
          }`}
        >
          {sosArming ? 'SOS armed — tap again to send' : 'Arm SOS'}
        </button>
      </div>

      {lastPing && (
        <div className="mt-3 border border-ghost bg-bg p-3 font-mono text-[0.6875rem] text-sub">
          PONG · {lastPing.ms}ms · {lastPing.hops} hops · {lastPing.at}
        </div>
      )}

      <div className="mt-4 text-[0.625rem] italic text-faint">
        Protocol: {beacon.protocol}. Devices passively forward beacon traffic without disclosing
        identity until SOS is sent.
      </div>
    </div>
  );
}
