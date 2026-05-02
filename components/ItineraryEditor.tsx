'use client';

import { useState } from 'react';
import { usePassageStore } from '@/lib/store';
import type { Destination, ItineraryDay, ItineraryStyle } from '@/lib/types';

interface ItineraryEditorProps {
  dest: Destination;
}

const STYLE_LABELS: Record<ItineraryStyle, string> = {
  classic: 'Classic',
  adventure: 'Adventure',
  relaxed: 'Relaxed',
};

const STYLE_DESCS: Record<ItineraryStyle, string> = {
  classic: 'The default route. Balanced pace.',
  adventure: 'High-effort: treks, passes, multi-day routes.',
  relaxed: 'Slow days. More food, less hiking.',
};

const INPUT =
  'w-full border border-ghost bg-surface px-3 py-2.5 font-mono text-[0.8125rem] text-fg outline-none';

const GHOST_BTN =
  'cursor-pointer border border-ghost bg-transparent px-3 py-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-dim';

const PRIMARY_BTN =
  'cursor-pointer border-0 bg-fg px-3.5 py-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-bg';

const SMALL_BTN =
  'cursor-pointer border border-ghost bg-transparent px-2 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-faint';

export default function ItineraryEditor({ dest }: ItineraryEditorProps) {
  const customItineraries = usePassageStore(s => s.customItineraries);
  const itineraryStyle = usePassageStore(s => s.itineraryStyle);
  const setItinerary = usePassageStore(s => s.setItinerary);
  const clearItinerary = usePassageStore(s => s.clearItinerary);
  const setItineraryStyle = usePassageStore(s => s.setItineraryStyle);
  const updateItineraryDay = usePassageStore(s => s.updateItineraryDay);
  const addItineraryDay = usePassageStore(s => s.addItineraryDay);
  const removeItineraryDay = usePassageStore(s => s.removeItineraryDay);

  const variants = dest.travelPlan.itineraryVariants;
  const baseStyle = itineraryStyle[dest.id] ?? 'classic';
  const baseFromStyle = variants?.[baseStyle] ?? dest.travelPlan.itinerary;
  const days = customItineraries[dest.id] ?? baseFromStyle;

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const isCustom = customItineraries[dest.id] !== undefined;

  const applyStyle = (style: ItineraryStyle) => {
    setItineraryStyle(dest.id, style);
    if (variants && variants[style]) setItinerary(dest.id, variants[style]);
    else clearItinerary(dest.id);
  };

  const regenerate = () => {
    const order: ItineraryStyle[] = ['classic', 'adventure', 'relaxed'];
    const nextStyle = order[(order.indexOf(baseStyle) + 1) % order.length];
    applyStyle(nextStyle);
  };

  const startEdit = (idx: number, day: ItineraryDay) => {
    if (!isCustom) setItinerary(dest.id, days);
    setEditingIdx(idx);
    setEditTitle(day.title);
    setEditDesc(day.desc);
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    updateItineraryDay(dest.id, editingIdx, {
      title: editTitle.trim(),
      desc: editDesc.trim(),
    });
    setEditingIdx(null);
  };

  const startAdd = () => {
    if (!isCustom) setItinerary(dest.id, days);
    setAdding(true);
    setNewTitle('');
    setNewDesc('');
  };

  const saveAdd = () => {
    const title = newTitle.trim() || 'New day';
    const desc = newDesc.trim() || 'Plan something here.';
    addItineraryDay(dest.id, { day: days.length + 1, title, desc });
    setAdding(false);
  };

  const remove = (idx: number) => {
    if (!isCustom) setItinerary(dest.id, days);
    removeItineraryDay(dest.id, idx);
  };

  return (
    <div>
      <div className="mb-2.5 text-[0.5625rem] uppercase tracking-[0.16em] text-faint">
        Itinerary style
      </div>
      <div className="mb-2 grid grid-cols-3 gap-1.5">
        {(Object.keys(STYLE_LABELS) as ItineraryStyle[]).map(style => {
          const active = baseStyle === style;
          return (
            <button
              key={style}
              type="button"
              onClick={() => applyStyle(style)}
              className={`cursor-pointer border px-2 py-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.08em] transition-all ${
                active ? 'border-fg bg-active text-fg' : 'border-ghost bg-transparent text-dim'
              }`}
            >
              {STYLE_LABELS[style]}
            </button>
          );
        })}
      </div>
      <div className="mb-[18px] text-[0.6875rem] text-faint">{STYLE_DESCS[baseStyle]}</div>

      <div className="mb-[22px] flex flex-wrap gap-2">
        <button type="button" onClick={regenerate} className={PRIMARY_BTN}>
          ↻ Regenerate
        </button>
        <button type="button" onClick={startAdd} className={GHOST_BTN}>
          + Add day
        </button>
        {isCustom && (
          <button type="button" onClick={() => clearItinerary(dest.id)} className={GHOST_BTN}>
            Reset to default
          </button>
        )}
      </div>

      <div>
        {days.map((day, i) => {
          const isEditing = editingIdx === i;
          return (
            <div
              key={i}
              className={`relative mb-[18px] border-l pl-5 ${
                isEditing ? 'border-fg' : 'border-ghost'
              }`}
            >
              <div
                className={`absolute -left-1 top-0 h-[7px] w-[7px] rounded-full ${
                  isEditing ? 'bg-fg' : 'bg-ghost'
                }`}
              />
              <div className="mb-1.5 flex items-start justify-between">
                <div className="text-[0.5625rem] tracking-[0.1em] text-faint">DAY {day.day}</div>
                {!isEditing && (
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => startEdit(i, day)} className={SMALL_BTN}>
                      Edit
                    </button>
                    {days.length > 1 && (
                      <button type="button" onClick={() => remove(i)} className={SMALL_BTN}>
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
              {isEditing ? (
                <div className="mt-1.5">
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Title"
                    className={`${INPUT} mb-2`}
                  />
                  <textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    placeholder="What happens this day?"
                    rows={3}
                    className={`${INPUT} min-h-[70px] resize-y`}
                  />
                  <div className="mt-2.5 flex gap-2">
                    <button type="button" onClick={saveEdit} className={PRIMARY_BTN}>
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingIdx(null)} className={GHOST_BTN}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-1.5 text-[0.9375rem]">{day.title}</div>
                  <div className="text-[0.8125rem] leading-relaxed text-dim">{day.desc}</div>
                </>
              )}
            </div>
          );
        })}

        {adding && (
          <div className="relative mb-[18px] border-l border-dashed border-fg pl-5">
            <div className="absolute -left-1 top-0 h-[7px] w-[7px] rounded-full border border-fg bg-bg" />
            <div className="mb-1.5 text-[0.5625rem] tracking-[0.1em] text-faint">NEW DAY</div>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Day title"
              className={`${INPUT} mb-2`}
            />
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="What's the plan?"
              rows={3}
              className={`${INPUT} min-h-[70px] resize-y`}
            />
            <div className="mt-2.5 flex gap-2">
              <button type="button" onClick={saveAdd} className={PRIMARY_BTN}>
                Add day
              </button>
              <button type="button" onClick={() => setAdding(false)} className={GHOST_BTN}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {isCustom && (
        <div className="mt-[18px] text-[0.625rem] italic text-faint">
          You&apos;re working with a custom itinerary. Reset to revert to {STYLE_LABELS[baseStyle]}.
        </div>
      )}
    </div>
  );
}
