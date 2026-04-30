'use client';

import { useState } from 'react';
import { c, MONO } from '@/lib/data';
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

export default function ItineraryEditor({ dest }: ItineraryEditorProps) {
  const customItineraries = usePassageStore(s => s.customItineraries);
  const itineraryStyle    = usePassageStore(s => s.itineraryStyle);
  const setItinerary      = usePassageStore(s => s.setItinerary);
  const clearItinerary    = usePassageStore(s => s.clearItinerary);
  const setItineraryStyle = usePassageStore(s => s.setItineraryStyle);
  const updateItineraryDay = usePassageStore(s => s.updateItineraryDay);
  const addItineraryDay    = usePassageStore(s => s.addItineraryDay);
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
    if (variants && variants[style]) {
      // overwrite working copy with chosen variant
      setItinerary(dest.id, variants[style]);
    } else {
      clearItinerary(dest.id);
    }
  };

  const regenerate = () => {
    // Cycle through styles: classic → adventure → relaxed → classic
    const order: ItineraryStyle[] = ['classic', 'adventure', 'relaxed'];
    const nextStyle = order[(order.indexOf(baseStyle) + 1) % order.length];
    applyStyle(nextStyle);
  };

  const startEdit = (idx: number, day: ItineraryDay) => {
    // Take a snapshot in store before edits if we haven't yet
    if (!isCustom) setItinerary(dest.id, days);
    setEditingIdx(idx);
    setEditTitle(day.title);
    setEditDesc(day.desc);
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    updateItineraryDay(dest.id, editingIdx, { title: editTitle.trim(), desc: editDesc.trim() });
    setEditingIdx(null);
  };

  const cancelEdit = () => setEditingIdx(null);

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

  const cancelAdd = () => setAdding(false);

  const remove = (idx: number) => {
    if (!isCustom) setItinerary(dest.id, days);
    removeItineraryDay(dest.id, idx);
  };

  const resetCustom = () => clearItinerary(dest.id);

  const inputStyle: React.CSSProperties = {
    width: '100%', background: c.surface, border: `1px solid ${c.ghost}`,
    color: c.fg, fontFamily: MONO, fontSize: '0.8125rem',
    padding: '10px 12px', outline: 'none',
  };

  const ghostBtn: React.CSSProperties = {
    background: 'none', border: `1px solid ${c.ghost}`, color: c.dim,
    fontFamily: MONO, fontSize: '0.625rem', letterSpacing: '0.1em',
    textTransform: 'uppercase', padding: '8px 12px', cursor: 'pointer',
  };

  const primaryBtn: React.CSSProperties = {
    background: c.fg, border: 'none', color: c.bg,
    fontFamily: MONO, fontSize: '0.625rem', letterSpacing: '0.1em',
    textTransform: 'uppercase', padding: '8px 14px', cursor: 'pointer',
  };

  return (
    <div>
      {/* Style selector */}
      <div style={{ fontSize: '0.5625rem', letterSpacing: '0.16em', color: c.faint, marginBottom: 10, textTransform: 'uppercase' }}>
        Itinerary style
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
        {(Object.keys(STYLE_LABELS) as ItineraryStyle[]).map(style => {
          const active = baseStyle === style;
          return (
            <button
              key={style}
              onClick={() => applyStyle(style)}
              style={{
                background: active ? '#111' : 'none',
                border: `1px solid ${active ? c.fg : c.ghost}`,
                color: active ? c.fg : c.dim,
                fontFamily: MONO, fontSize: '0.6875rem',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '10px 8px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {STYLE_LABELS[style]}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: '0.6875rem', color: c.faint, marginBottom: 18 }}>
        {STYLE_DESCS[baseStyle]}
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        <button onClick={regenerate} style={primaryBtn}>↻ Regenerate</button>
        <button onClick={startAdd} style={ghostBtn}>+ Add day</button>
        {isCustom && (
          <button onClick={resetCustom} style={ghostBtn}>Reset to default</button>
        )}
      </div>

      {/* Day list */}
      <div>
        {days.map((day, i) => {
          const isEditing = editingIdx === i;
          return (
            <div
              key={i}
              style={{
                marginBottom: 18, paddingLeft: 20,
                borderLeft: `1px solid ${isEditing ? c.fg : c.ghost}`,
                position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute', left: -4, top: 0, width: 7, height: 7,
                borderRadius: '50%', background: isEditing ? c.fg : c.ghost,
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                <div style={{ fontSize: '0.5625rem', color: c.faint, letterSpacing: '0.1em' }}>DAY {day.day}</div>
                {!isEditing && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => startEdit(i, day)}
                      style={{ background: 'none', border: `1px solid ${c.ghost}`, color: c.faint, fontFamily: MONO, fontSize: '0.5625rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 8px', cursor: 'pointer' }}
                    >Edit</button>
                    {days.length > 1 && (
                      <button
                        onClick={() => remove(i)}
                        style={{ background: 'none', border: `1px solid ${c.ghost}`, color: c.faint, fontFamily: MONO, fontSize: '0.5625rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 8px', cursor: 'pointer' }}
                      >Delete</button>
                    )}
                  </div>
                )}
              </div>
              {isEditing ? (
                <div style={{ marginTop: 6 }}>
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Title"
                    style={{ ...inputStyle, marginBottom: 8 }}
                  />
                  <textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    placeholder="What happens this day?"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={saveEdit} style={primaryBtn}>Save</button>
                    <button onClick={cancelEdit} style={ghostBtn}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '0.9375rem', marginBottom: 6 }}>{day.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: c.dim, lineHeight: 1.6 }}>{day.desc}</div>
                </>
              )}
            </div>
          );
        })}

        {/* Add new day form */}
        {adding && (
          <div style={{ marginBottom: 18, paddingLeft: 20, borderLeft: `1px dashed ${c.fg}`, position: 'relative' }}>
            <div style={{ position: 'absolute', left: -4, top: 0, width: 7, height: 7, borderRadius: '50%', border: `1px solid ${c.fg}`, background: c.bg }} />
            <div style={{ fontSize: '0.5625rem', color: c.faint, letterSpacing: '0.1em', marginBottom: 6 }}>NEW DAY</div>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Day title"
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="What's the plan?"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={saveAdd} style={primaryBtn}>Add day</button>
              <button onClick={cancelAdd} style={ghostBtn}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {isCustom && (
        <div style={{ marginTop: 18, fontSize: '0.625rem', color: c.faint, fontStyle: 'italic' }}>
          You're working with a custom itinerary. Reset to revert to {STYLE_LABELS[baseStyle]}.
        </div>
      )}
    </div>
  );
}
