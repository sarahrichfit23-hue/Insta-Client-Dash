'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'

// ─── BRAND COLORS ─────────────────────────────────────────────
const C = {
  gold: '#C9932A',
  goldLight: '#E5B84A',
  black: '#1A1A1A',
  white: '#FFFFFF',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EBEBEB',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  border: '#E0E0E0',
  // Status colors
  cold: '#2196F3',
  warm: '#FF9800',
  hot: '#F44336',
  offerSent: '#4CAF50',
  closed: '#9E9E9E',
}

// ─── CONFIG ───────────────────────────────────────────────────
const STATUSES = [
  { id: 'cold', label: 'Cold', color: C.cold },
  { id: 'warm', label: 'Warm', color: C.warm },
  { id: 'hot', label: 'Hot', color: C.hot },
  { id: 'offer_sent', label: 'Offer Sent', color: C.offerSent },
  { id: 'closed', label: 'Closed', color: C.closed },
]

const PLATFORMS = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'Reddit', 'Skool', 'Other']
const WHERE_FOUND = ['They followed me', 'Found via hashtag', 'Competitor followers', 'Engagement mining', 'Referral', 'Already talking']
const SIGNAL_TAGS = ['Raised Hand', 'Active Struggle', 'Solution Shopper', 'None']
const CALL_OPTIONS = ['No', 'Yes — Scheduled', 'Yes — Completed']

// ─── HELPERS ──────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10)
const daysSince = (d) => d ? Math.floor((new Date() - new Date(d)) / 86400000) : 999
const formatHandle = (h) => h ? `@${h.replace(/^@+/, '')}` : ''

// ─── NOTION-STYLE TABLE CELL ──────────────────────────────────
const cellStyle = {
  padding: '6px 10px',
  borderRight: `1px solid ${C.border}`,
  borderBottom: `1px solid ${C.border}`,
  fontSize: 13,
  color: C.black,
  verticalAlign: 'middle',
  height: 36,
}

const headerStyle = {
  padding: '8px 10px',
  borderRight: `1px solid ${C.border}`,
  borderBottom: `1px solid ${C.border}`,
  fontSize: 11,
  fontWeight: 500,
  color: C.gray500,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  textAlign: 'left',
  background: C.white,
  whiteSpace: 'nowrap',
}

// ─── INLINE TEXT INPUT ────────────────────────────────────────
function TextCell({ value, placeholder, onChange, style = {} }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value || '')
  const inputRef = useRef(null)

  useEffect(() => { setVal(value || '') }, [value])
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus() }, [editing])

  const save = () => {
    setEditing(false)
    if (val !== value) onChange(val)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={e => e.key === 'Enter' && save()}
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          fontSize: 13,
          color: C.black,
          padding: 0,
          margin: 0,
          outline: 'none',
          ...style,
        }}
      />
    )
  }

  return (
    <div
      onClick={() => setEditing(true)}
      style={{
        cursor: 'text',
        color: value ? C.black : C.gray400,
        minHeight: 20,
        ...style,
      }}
    >
      {value || placeholder || '—'}
    </div>
  )
}

// ─── INLINE DROPDOWN ──────────────────────────────────────────
function DropdownCell({ value, options, onChange, placeholder, colorMap }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const color = colorMap?.[value]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: 0,
          fontSize: 13,
          color: value ? (color || C.black) : C.gray400,
          cursor: 'pointer',
          textAlign: 'left',
          gap: 4,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder || '—'}
        </span>
        <span style={{ color: C.gray400, fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100,
          minWidth: 140,
          maxHeight: 200,
          overflow: 'auto',
        }}>
          {options.map(o => (
            <div
              key={o}
              onClick={() => { onChange(o); setOpen(false) }}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                color: colorMap?.[o] || C.black,
                cursor: 'pointer',
                background: value === o ? C.gray100 : 'transparent',
              }}
              onMouseEnter={e => e.target.style.background = C.gray100}
              onMouseLeave={e => e.target.style.background = value === o ? C.gray100 : 'transparent'}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ADD MODAL ────────────────────────────────────────────────
function AddModal({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [platform, setPlatform] = useState('Instagram')
  const [whereFound, setWhereFound] = useState('')
  const [status, setStatus] = useState('cold')
  const [signal, setSignal] = useState('None')
  const [nextAction, setNextAction] = useState('')
  const [notes, setNotes] = useState('')

  const save = () => {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      handle: handle.replace(/^@+/, ''),
      platform,
      where_found: whereFound,
      status,
      signal_tag: signal,
      next_action: nextAction,
      notes,
      added_date: todayStr(),
      last_touched_at: todayStr(),
    })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: C.white, borderRadius: 12, padding: 24, width: 400, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Add Prospect</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: C.gray400 }}>&times;</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 14 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Handle</label>
              <input value={handle} onChange={e => setHandle(e.target.value)} placeholder="@handle" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 14 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Platform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 14 }}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Where Found</label>
              <select value={whereFound} onChange={e => setWhereFound(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 14 }}>
                <option value="">Select...</option>
                {WHERE_FOUND.map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 14 }}>
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Signal Tag</label>
            <select value={signal} onChange={e => setSignal(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 14 }}>
              {SIGNAL_TAGS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Next Action</label>
            <input value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="Send opener" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Context..." rows={2} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 6, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, border: `1px solid ${C.gray300}`, borderRadius: 6, background: C.white, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={!name.trim()} style={{ flex: 1, padding: 12, border: 'none', borderRadius: 6, background: C.gold, color: C.white, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: name.trim() ? 1 : 0.5 }}>Add</button>
        </div>
      </div>
    </div>
  )
}

// ─── SIDE PANEL ───────────────────────────────────────────────
function SidePanel({ prospect, touches, onClose, onUpdate, onLogTouch }) {
  const [notes, setNotes] = useState(prospect?.notes || '')
  const [generating, setGenerating] = useState(false)
  const [script, setScript] = useState('')

  useEffect(() => {
    if (prospect) {
      setNotes(prospect.notes || '')
      setScript('')
    }
  }, [prospect])

  if (!prospect) return null

  const pTouches = touches.filter(t => t.prospect_id === prospect.id).sort((a, b) => new Date(b.touch_date) - new Date(a.touch_date))

  const saveNotes = () => {
    if (notes !== prospect.notes) onUpdate(prospect.id, { notes })
  }

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectName: prospect.name, status: prospect.status, notes: prospect.notes })
      })
      const data = await res.json()
      setScript(data.suggestion || 'Could not generate.')
    } catch {
      setScript('Error generating script.')
    }
    setGenerating(false)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 150 }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 340, background: C.white, boxShadow: '-2px 0 12px rgba(0,0,0,0.1)', zIndex: 160, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.black }}>{prospect.name}</div>
            <div style={{ fontSize: 13, color: C.gray500 }}>{formatHandle(prospect.handle)} {prospect.platform && `• ${prospect.platform}`}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.gray400 }}>&times;</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: C.gray500, marginBottom: 6, textTransform: 'uppercase' }}>Status</label>
            <select value={prospect.status} onChange={e => onUpdate(prospect.id, { status: e.target.value })} style={{ padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13 }}>
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: C.gray500, marginBottom: 6, textTransform: 'uppercase' }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes} rows={3} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <button onClick={generate} disabled={generating} style={{ width: '100%', padding: '10px', background: 'transparent', border: `1px solid ${C.gold}`, borderRadius: 6, color: C.gold, fontSize: 13, fontWeight: 500, cursor: generating ? 'wait' : 'pointer' }}>
              {generating ? 'Generating...' : 'Suggest next message'}
            </button>
            {script && (
              <div style={{ marginTop: 10, padding: 12, background: C.gray50, borderRadius: 6, border: `1px solid ${C.gold}` }}>
                <div style={{ fontSize: 13, color: C.black, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{script}</div>
                <button onClick={() => navigator.clipboard.writeText(script)} style={{ marginTop: 8, background: C.gold, color: C.white, border: 'none', padding: '6px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Copy</button>
              </div>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: C.gray500, textTransform: 'uppercase' }}>Touch History ({pTouches.length})</label>
              <button onClick={() => onLogTouch(prospect.id)} style={{ background: C.gold, color: C.white, border: 'none', padding: '5px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>+ Log</button>
            </div>
            {pTouches.length === 0 ? (
              <div style={{ color: C.gray400, fontSize: 13, fontStyle: 'italic' }}>No touches yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pTouches.slice(0, 10).map(t => (
                  <div key={t.id} style={{ padding: 8, background: C.gray50, borderRadius: 4 }}>
                    <div style={{ fontSize: 11, color: C.gray500 }}>{new Date(t.touch_date).toLocaleDateString()}</div>
                    {t.note && <div style={{ fontSize: 13, color: C.black, marginTop: 2 }}>{t.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── DAILY PAGE ───────────────────────────────────────────────
function DailyPage({ prospects, touches, todayTouches, onUpdate, onLogTouch, onOpenPanel }) {
  const [attentionOpen, setAttentionOpen] = useState(false)

  const workingList = prospects.filter(p => p.status !== 'archived' && p.status !== 'closed').sort((a, b) => daysSince(b.last_touched_at) - daysSince(a.last_touched_at))
  const needsAttention = workingList.filter(p => daysSince(p.last_touched_at) >= 7)

  const statusColors = Object.fromEntries(STATUSES.map(s => [s.label, s.color]))

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: C.black }}>Today's Working List</div>
        <div style={{ fontSize: 14, color: C.gray600 }}>Touches today: <span style={{ color: C.gold, fontWeight: 600 }}>{todayTouches}</span> / 100</div>
      </div>

      {/* Main Table */}
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
            <thead>
              <tr>
                <th style={{ ...headerStyle, width: 130 }}>Name</th>
                <th style={{ ...headerStyle, width: 100 }}>Handle</th>
                <th style={{ ...headerStyle, width: 90 }}>Platform</th>
                <th style={{ ...headerStyle, width: 130 }}>Where Found</th>
                <th style={{ ...headerStyle, width: 80 }}>Status</th>
                <th style={{ ...headerStyle, width: 110 }}>Signal Tag</th>
                <th style={{ ...headerStyle, width: 120 }}>Next Action</th>
                <th style={{ ...headerStyle, width: 90 }}>Call Booked</th>
                <th style={{ ...headerStyle, width: 180, borderRight: 'none' }}>Notes</th>
                <th style={{ ...headerStyle, width: 50, borderRight: 'none', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {workingList.map(p => (
                <tr key={p.id} style={{ background: C.white }} onMouseEnter={e => e.currentTarget.style.background = C.gray50} onMouseLeave={e => e.currentTarget.style.background = C.white}>
                  <td style={cellStyle}>
                    <button onClick={() => onOpenPanel(p)} style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 500, color: C.gold, cursor: 'pointer', textAlign: 'left' }}>
                      {p.name}
                    </button>
                  </td>
                  <td style={cellStyle}>
                    <TextCell value={formatHandle(p.handle)} placeholder="@handle" onChange={v => onUpdate(p.id, { handle: v.replace(/^@+/, '') })} />
                  </td>
                  <td style={cellStyle}>
                    <DropdownCell value={p.platform} options={PLATFORMS} placeholder="Platform" onChange={v => onUpdate(p.id, { platform: v })} />
                  </td>
                  <td style={cellStyle}>
                    <DropdownCell value={p.where_found} options={WHERE_FOUND} placeholder="Where found" onChange={v => onUpdate(p.id, { where_found: v })} />
                  </td>
                  <td style={cellStyle}>
                    <DropdownCell value={STATUSES.find(s => s.id === p.status)?.label || p.status} options={STATUSES.map(s => s.label)} placeholder="Status" colorMap={statusColors} onChange={v => onUpdate(p.id, { status: STATUSES.find(s => s.label === v)?.id || v })} />
                  </td>
                  <td style={cellStyle}>
                    <DropdownCell value={p.signal_tag} options={SIGNAL_TAGS} placeholder="Signal" onChange={v => onUpdate(p.id, { signal_tag: v })} />
                  </td>
                  <td style={cellStyle}>
                    <TextCell value={p.next_action} placeholder="Next step" onChange={v => onUpdate(p.id, { next_action: v })} />
                  </td>
                  <td style={cellStyle}>
                    <DropdownCell value={p.call_booked} options={CALL_OPTIONS} placeholder="—" onChange={v => onUpdate(p.id, { call_booked: v })} />
                  </td>
                  <td style={{ ...cellStyle, borderRight: 'none' }}>
                    <TextCell value={p.notes} placeholder="Notes..." onChange={v => onUpdate(p.id, { notes: v })} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} />
                  </td>
                  <td style={{ ...cellStyle, borderRight: 'none', textAlign: 'center' }}>
                    <button onClick={() => onLogTouch(p.id)} style={{ background: C.gold, color: C.white, border: 'none', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Log</button>
                  </td>
                </tr>
              ))}
              {workingList.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ ...cellStyle, textAlign: 'center', color: C.gray400, padding: 30, borderRight: 'none' }}>No prospects yet. Click + to add.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <button onClick={() => setAttentionOpen(!attentionOpen)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: C.white, border: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: C.black }}>Needs Attention <span style={{ color: C.gray500, fontWeight: 400 }}>{needsAttention.length}</span></span>
            <span style={{ fontSize: 12, color: C.gray500 }}>{attentionOpen ? '▲ collapse' : '▼ expand'}</span>
          </button>
          {attentionOpen && (
            <div style={{ borderTop: `1px solid ${C.border}` }}>
              {needsAttention.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${C.gray100}` }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.black }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: C.gray500, marginLeft: 8 }}>{daysSince(p.last_touched_at)}d since last touch</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => onLogTouch(p.id)} style={{ background: C.gold, color: C.white, border: 'none', padding: '5px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Keep Working</button>
                    <button onClick={() => onUpdate(p.id, { status: 'archived' })} style={{ background: 'transparent', color: C.gray500, border: `1px solid ${C.gray300}`, padding: '5px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Archive</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PIPELINE PAGE ────────────────────────────────────────────
function PipelinePage({ prospects, onUpdate, onOpenPanel }) {
  const [view, setView] = useState('table')
  const [filter, setFilter] = useState('all')

  const filtered = prospects.filter(p => {
    if (p.status === 'archived') return false
    if (filter === 'all') return true
    return p.status === filter
  })

  const statusColors = Object.fromEntries(STATUSES.map(s => [s.label, s.color]))

  if (view === 'kanban') {
    return (
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Pipeline</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setView('table')} style={{ padding: '6px 12px', border: `1px solid ${view === 'table' ? C.gold : C.gray300}`, borderRadius: 4, background: view === 'table' ? C.gold : C.white, color: view === 'table' ? C.white : C.gray600, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Table</button>
            <button onClick={() => setView('kanban')} style={{ padding: '6px 12px', border: `1px solid ${view === 'kanban' ? C.gold : C.gray300}`, borderRadius: 4, background: view === 'kanban' ? C.gold : C.white, color: view === 'kanban' ? C.white : C.gray600, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Kanban</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 20 }}>
          {STATUSES.filter(s => s.id !== 'archived').map(status => {
            const cards = prospects.filter(p => p.status === status.id)
            return (
              <div key={status.id} style={{ minWidth: 260, flex: '0 0 260px' }}>
                <div style={{ padding: '10px 12px', background: C.gray100, borderRadius: '6px 6px 0 0', borderBottom: `3px solid ${status.color}` }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.black }}>{status.label}</span>
                  <span style={{ fontSize: 12, color: C.gray500, marginLeft: 6 }}>{cards.length}</span>
                </div>
                <div style={{ background: C.gray50, padding: 8, borderRadius: '0 0 6px 6px', minHeight: 200 }}>
                  {cards.map(p => (
                    <div key={p.id} onClick={() => onOpenPanel(p)} style={{ background: C.white, borderRadius: 4, padding: 10, marginBottom: 8, cursor: 'pointer', border: `1px solid ${C.gray200}` }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.black }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.gray500 }}>{formatHandle(p.handle)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Pipeline</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${C.gray300}`, borderRadius: 4, fontSize: 12 }}>
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button onClick={() => setView('table')} style={{ padding: '6px 12px', border: `1px solid ${view === 'table' ? C.gold : C.gray300}`, borderRadius: 4, background: view === 'table' ? C.gold : C.white, color: view === 'table' ? C.white : C.gray600, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Table</button>
          <button onClick={() => setView('kanban')} style={{ padding: '6px 12px', border: `1px solid ${view === 'kanban' ? C.gold : C.gray300}`, borderRadius: 4, background: view === 'kanban' ? C.gold : C.white, color: view === 'kanban' ? C.white : C.gray600, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Kanban</button>
        </div>
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, width: 150 }}>Name</th>
              <th style={{ ...headerStyle, width: 100 }}>Handle</th>
              <th style={{ ...headerStyle, width: 90 }}>Platform</th>
              <th style={{ ...headerStyle, width: 90 }}>Status</th>
              <th style={{ ...headerStyle, width: 110 }}>Signal Tag</th>
              <th style={{ ...headerStyle, borderRight: 'none' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ background: C.white }} onMouseEnter={e => e.currentTarget.style.background = C.gray50} onMouseLeave={e => e.currentTarget.style.background = C.white}>
                <td style={cellStyle}>
                  <button onClick={() => onOpenPanel(p)} style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 500, color: C.gold, cursor: 'pointer' }}>{p.name}</button>
                </td>
                <td style={cellStyle}>{formatHandle(p.handle)}</td>
                <td style={cellStyle}>{p.platform || '—'}</td>
                <td style={cellStyle}>
                  <DropdownCell value={STATUSES.find(s => s.id === p.status)?.label} options={STATUSES.map(s => s.label)} colorMap={statusColors} onChange={v => onUpdate(p.id, { status: STATUSES.find(s => s.label === v)?.id })} />
                </td>
                <td style={cellStyle}>{p.signal_tag || '—'}</td>
                <td style={{ ...cellStyle, borderRight: 'none' }}>{p.notes || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ ...cellStyle, textAlign: 'center', color: C.gray400, padding: 30, borderRight: 'none' }}>No prospects</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── GUIDE PAGE ───────────────────────────────────────────────
function GuidePage() {
  return (
    <div style={{ padding: '20px 24px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Quick Reference</div>
      <div style={{ display: 'grid', gap: 16 }}>
        {[
          { title: 'Cold Status', desc: 'New prospect. Goal: Open a conversation within 48hrs. Use Curiosity Opener or Genuine Human Opener.' },
          { title: 'Warm Status', desc: 'Engaged. Goal: Build trust, add value, keep them talking. Use 3-Step Reply Formula.' },
          { title: 'Hot Status', desc: 'High intent signals. Goal: Open the sales door with Soft Positioning.' },
          { title: 'Offer Sent', desc: 'Waiting for decision. Goal: Follow up strategically. Handle objections with 4-step formula.' },
          { title: 'Daily Target', desc: '100 touches per day. Quality over quantity. Every touch should move the conversation forward.' },
        ].map(c => (
          <div key={c.title} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.black, marginBottom: 6 }}>{c.title}</div>
            <div style={{ fontSize: 13, color: C.gray600, lineHeight: 1.5 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function Home() {
  const [sb] = useState(() => createClient())
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('daily')
  const [prospects, setProspects] = useState([])
  const [touches, setTouches] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState(null)

  const uid = session?.user?.id

  // Auth
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [sb])

  // Load data
  useEffect(() => {
    if (!uid) { setLoading(false); return }
    const load = async () => {
      const [{ data: p }, { data: t }] = await Promise.all([
        sb.from('prospects').select('*').eq('user_id', uid),
        sb.from('touches').select('*').eq('user_id', uid),
      ])
      setProspects(p || [])
      setTouches(t || [])
      setLoading(false)
    }
    load()
  }, [sb, uid])

  const todayTouches = touches.filter(t => t.touch_date === todayStr()).length

  const handleUpdate = async (id, updates) => {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    await sb.from('prospects').update(updates).eq('id', id)
  }

  const handleAdd = async (data) => {
    const { data: newP } = await sb.from('prospects').insert([{ ...data, user_id: uid }]).select().single()
    if (newP) setProspects(prev => [...prev, newP])
  }

  const handleLogTouch = async (prospectId) => {
    const today = todayStr()
    const { data: newT } = await sb.from('touches').insert([{ user_id: uid, prospect_id: prospectId, touch_date: today }]).select().single()
    if (newT) setTouches(prev => [...prev, newT])
    await sb.from('prospects').update({ last_touched_at: today }).eq('id', prospectId)
    setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, last_touched_at: today } : p))
  }

  // Auth screen
  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: C.gray50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: C.white, padding: 40, borderRadius: 12, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.black, marginBottom: 8 }}>Insta Client Engine</div>
          <div style={{ fontSize: 14, color: C.gray500, marginBottom: 24 }}>Sign in to access your dashboard</div>
          <button onClick={() => sb.auth.signInWithOAuth({ provider: 'google' })} style={{ background: C.gold, color: C.white, border: 'none', padding: '12px 32px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Sign in with Google</button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gray500 }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: C.gray50 }}>
      {/* Nav */}
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.black }}>ICE</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['daily', 'pipeline', 'guide'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '8px 16px', background: view === v ? C.gold : 'transparent', color: view === v ? C.white : C.gray600, border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>{v}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setShowAdd(true)} style={{ background: C.gold, color: C.white, border: 'none', width: 32, height: 32, borderRadius: 6, fontSize: 18, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          <button onClick={() => sb.auth.signOut()} style={{ background: 'none', border: 'none', fontSize: 13, color: C.gray500, cursor: 'pointer' }}>Sign out</button>
        </div>
      </nav>

      {/* Content */}
      {view === 'daily' && <DailyPage prospects={prospects} touches={touches} todayTouches={todayTouches} onUpdate={handleUpdate} onLogTouch={handleLogTouch} onOpenPanel={setSelectedProspect} />}
      {view === 'pipeline' && <PipelinePage prospects={prospects} onUpdate={handleUpdate} onOpenPanel={setSelectedProspect} />}
      {view === 'guide' && <GuidePage />}

      {/* Modals */}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {selectedProspect && <SidePanel prospect={selectedProspect} touches={touches} onClose={() => setSelectedProspect(null)} onUpdate={handleUpdate} onLogTouch={handleLogTouch} />}
    </div>
  )
}
