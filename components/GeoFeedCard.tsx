'use client';

import { useMemo, useState } from 'react';
import { usePassageStore } from '@/lib/store';
import type { Destination, GeoEvent, GeoEventKind, GeoEventSeverity } from '@/lib/types';

interface GeoFeedCardProps {
  dest: Destination;
}

type FilterMode = 'all' | 'critical' | 'predicted';

const KIND_GLYPH: Record<GeoEventKind, string> = {
  seismic: '◤',
  civil: '◇',
  weather: '∿',
  health: '+',
  transport: '⇄',
};

const KIND_LABEL: Record<GeoEventKind, string> = {
  seismic: 'Seismic',
  civil: 'Civil',
  weather: 'Weather',
  health: 'Health',
  transport: 'Transport',
};

const SEVERITY_BG: Record<GeoEventSeverity, string> = {
  WATCH: 'bg-faint',
  ADVISORY: 'bg-warn',
  CRITICAL: 'bg-danger',
};

const SEVERITY_TEXT: Record<GeoEventSeverity, string> = {
  WATCH: 'text-faint',
  ADVISORY: 'text-warn',
  CRITICAL: 'text-danger',
};

const SEVERITY_BORDER: Record<GeoEventSeverity, string> = {
  WATCH: 'border-ghost',
  ADVISORY: 'border-warn-border',
  CRITICAL: 'border-danger-border',
};

function applyFilter(events: GeoEvent[], mode: FilterMode): GeoEvent[] {
  if (mode === 'critical') return events.filter(e => e.severity === 'CRITICAL');
  if (mode === 'predicted') return events.filter(e => Boolean(e.predictedWindow));
  return events;
}

export default function GeoFeedCard({ dest }: GeoFeedCardProps) {
  const autoMap = usePassageStore(s => s.geoAutoReroute);
  const setAuto = usePassageStore(s => s.setGeoAutoReroute);

  const auto = autoMap[dest.id] ?? true;
  const events = dest.geoEvents;

  const [filter, setFilter] = useState<FilterMode>('all');
  const [logOpen, setLogOpen] = useState(false);

  const filtered = useMemo(() => applyFilter(events, filter), [events, filter]);
  const rerouteLog = useMemo(
    () =>
      events
        .filter(e => Boolean(e.autoAction))
        .map(e => ({ id: e.id, title: e.title, action: e.autoAction! })),
    [events],
  );
  const criticalCount = events.filter(e => e.severity === 'CRITICAL').length;

  const FILTER_BUTTONS: { mode: FilterMode; label: string }[] = [
    { mode: 'all', label: `All · ${events.length}` },
    { mode: 'critical', label: `Critical · ${criticalCount}` },
    { mode: 'predicted', label: 'Predicted' },
  ];

  return (
    <div className="border border-ghost bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 text-[0.5625rem] uppercase tracking-[0.16em] text-faint">
            Live destination feed
          </div>
          <div className="text-base text-fg">Real-time geo feed</div>
          <div className="mt-1 text-[0.6875rem] text-dim">
            Earthquake, protest, curfew, weather predictions. App reroutes preemptively.
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[0.5625rem] uppercase tracking-[0.14em] text-faint">Synced</div>
          <div className="text-[0.6875rem] text-sub">14s ago</div>
        </div>
      </div>

      {/* Filter chips + auto toggle */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTER_BUTTONS.map(b => {
            const active = filter === b.mode;
            return (
              <button
                key={b.mode}
                type="button"
                onClick={() => setFilter(b.mode)}
                className={`cursor-pointer border px-2.5 py-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.1em] ${
                  active ? 'border-fg bg-active text-fg' : 'border-ghost bg-transparent text-dim'
                }`}
              >
                {b.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setAuto(dest.id, !auto)}
          className={`cursor-pointer border px-3 py-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.1em] ${
            auto ? 'border-fg bg-fg text-bg' : 'border-ghost bg-transparent text-dim'
          }`}
        >
          Auto-reroute · {auto ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Event list */}
      <div className="mb-4">
        {filtered.length === 0 ? (
          <div className="border border-ghost bg-bg p-4 text-[0.6875rem] italic text-faint">
            No events match this filter.
          </div>
        ) : (
          filtered.map(e => (
            <div
              key={e.id}
              className={`relative mb-2 border ${SEVERITY_BORDER[e.severity]} bg-bg pl-3`}
            >
              <div
                aria-hidden
                className={`absolute left-0 top-0 h-full w-[3px] ${SEVERITY_BG[e.severity]}`}
              />
              <div className="p-3">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[0.6875rem] text-faint">
                      {KIND_GLYPH[e.kind]}
                    </span>
                    <span
                      className={`text-[0.5625rem] uppercase tracking-[0.14em] ${SEVERITY_TEXT[e.severity]}`}
                    >
                      {e.severity} · {KIND_LABEL[e.kind]}
                    </span>
                  </div>
                  <span className="text-[0.5625rem] tracking-[0.06em] text-faint">
                    {e.timestamp}
                  </span>
                </div>
                <div className="mb-1 text-[0.8125rem] leading-snug text-fg">{e.title}</div>
                <div className="text-[0.75rem] leading-relaxed text-dim">{e.desc}</div>
                {e.predictedWindow && (
                  <div className="mt-2 text-[0.625rem] italic text-faint">
                    Forecast: {e.predictedWindow}
                  </div>
                )}
                {e.autoAction && (
                  <div className="mt-2 border-l-2 border-fg bg-active px-2 py-1 text-[0.625rem] text-sub">
                    Auto-action: {e.autoAction}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reroute log */}
      {rerouteLog.length > 0 && (
        <div className="border border-ghost bg-bg">
          <button
            type="button"
            onClick={() => setLogOpen(v => !v)}
            className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-2.5 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-fg"
          >
            <span>
              Auto-reroute log · {rerouteLog.length} action{rerouteLog.length === 1 ? '' : 's'}
            </span>
            <span className="text-faint">{logOpen ? '−' : '+'}</span>
          </button>
          {logOpen && (
            <div className="border-t border-ghost px-3 py-2">
              {rerouteLog.map(item => (
                <div key={item.id} className="border-b border-ghost py-2 last:border-b-0">
                  <div className="text-[0.6875rem] text-sub">{item.title}</div>
                  <div className="text-[0.625rem] italic text-faint">→ {item.action}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-[0.625rem] italic text-faint">
        Sources: USGS · NOAA · ACLED · WHO · local-government feeds. Updates every 30 seconds while
        a trip is active.
      </div>
    </div>
  );
}
