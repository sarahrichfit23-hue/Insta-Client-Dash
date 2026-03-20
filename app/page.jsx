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
  gray200: '#E5E5E5',
  gray300: '#D4D4D4',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  // Status colors
  cold: '#3B82F6',      // blue
  warm: '#F59E0B',      // amber
  hot: '#EF4444',       // coral/red
  offerSent: '#10B981', // green
  closed: '#6B7280',    // gray
}

// ─── STATUS CONFIG ────────────────────────────────────────────
const STATUSES = [
  { id: 'cold', label: 'Cold', color: C.cold },
  { id: 'warm', label: 'Warm', color: C.warm },
  { id: 'hot', label: 'Hot', color: C.hot },
  { id: 'offer_sent', label: 'Offer Sent', color: C.offerSent },
  { id: 'closed', label: 'Closed', color: C.closed },
]

const PLATFORMS = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'Reddit', 'Skool', 'Other']
const WHERE_FOUND_OPTIONS = ['They followed me', 'Found via hashtag', 'Competitor followers', 'Engagement mining', 'Referral', 'Already talking']
const SIGNAL_TAGS = ['Raised Hand', 'Active Struggle', 'Solution Shopper', 'None']
const CALL_BOOKED_OPTIONS = ['No', 'Yes — Scheduled', 'Yes — Completed']

// ─── HELPERS ──────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10)
const daysSince = (dateStr) => {
  if (!dateStr) return 999
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now - d) / (1000 * 60 * 60 * 24))
}
const formatDaysAgo = (dateStr) => {
  if (!dateStr) return '—'
  const days = daysSince(dateStr)
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}
const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
const formatHandle = (handle) => {
  if (!handle) return ''
  const clean = handle.replace(/^@+/, '')
  return clean ? `@${clean}` : ''
}

// ─── INLINE DROPDOWN COMPONENT ────────────────────────────────
function InlineDropdown({ value, options, onChange, getLabel, getColor, placeholder }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayLabel = getLabel ? getLabel(value) : value
  const displayColor = getColor ? getColor(value) : null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: displayColor ? `${displayColor}15` : 'transparent',
          border: 'none',
          padding: displayColor ? '4px 10px' : '4px 8px',
          borderRadius: displayColor ? 999 : 4,
          fontSize: 13,
          color: displayColor || (value ? C.black : C.gray400),
          cursor: 'pointer',
          textAlign: 'left',
          minWidth: 60,
          fontWeight: displayColor ? 600 : 400,
        }}
      >
        {displayLabel || placeholder || '—'}
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 4,
          background: C.white,
          border: `1px solid ${C.gray200}`,
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 100,
          minWidth: 160,
          maxHeight: 240,
          overflow: 'auto',
        }}>
          {options.map((opt, i) => {
            const optLabel = getLabel ? getLabel(opt) : opt
            const optColor = getColor ? getColor(opt) : null
            return (
              <button
                key={i}
                onClick={() => { onChange(opt); setIsOpen(false) }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  background: value === opt ? C.gray50 : 'transparent',
                  textAlign: 'left',
                  fontSize: 13,
                  color: optColor || C.black,
                  cursor: 'pointer',
                  fontWeight: optColor ? 600 : 400,
                }}
              >
                {optLabel}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── INLINE TEXT INPUT COMPONENT ──────────────────────────────
function InlineTextInput({ value, onChange, placeholder, style = {} }) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value || '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setTempValue(value || '')
  }, [value])

  const handleSave = () => {
    setIsEditing(false)
    if (tempValue !== value) {
      onChange(tempValue)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setTempValue(value || '')
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '4px 8px',
          border: `1px solid ${C.gold}`,
          borderRadius: 4,
          fontSize: 13,
          outline: 'none',
          background: C.white,
          ...style,
        }}
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      style={{
        padding: '4px 8px',
        borderRadius: 4,
        fontSize: 13,
        color: value ? C.black : C.gray400,
        cursor: 'text',
        minHeight: 28,
        display: 'flex',
        alignItems: 'center',
        ...style,
      }}
    >
      {value || placeholder || '—'}
    </div>
  )
}

// ─── STATUS PILL ──────────────────────────────────────────────
function StatusPill({ status }) {
  const s = STATUSES.find(st => st.id === status) || STATUSES[0]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      background: s.color + '15',
      color: s.color,
    }}>
      {s.label}
    </span>
  )
}

// ─── NAV BAR ──────────────────────────────────────────────────
function NavBar({ page, setPage, onAddClick, aiCallsUsed, aiCallsLimit }) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: C.black,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 32,
          height: 32,
          background: C.gold,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 16,
          color: C.black,
        }}>
          IC
        </div>
        <span style={{ color: C.white, fontWeight: 700, fontSize: 16 }}>Insta Client Engine</span>
      </div>

      <nav style={{ display: 'flex', gap: 4 }}>
        {['daily', 'pipeline', 'guide'].map(p => (
          <button
            key={p}
            onClick={() => setPage(p)}
            style={{
              background: page === p ? C.gold : 'transparent',
              color: page === p ? C.black : C.white,
              border: 'none',
              padding: '8px 20px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {p}
          </button>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ color: C.gray400, fontSize: 12 }}>
          AI: {aiCallsUsed}/{aiCallsLimit}
        </div>
        <button
          onClick={onAddClick}
          style={{
            background: C.gold,
            color: C.black,
            border: 'none',
            width: 36,
            height: 36,
            borderRadius: 8,
            fontSize: 24,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>
    </header>
  )
}

// ─── ADD PROSPECT MODAL ───────────────────────────────────────
function AddProspectModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [platform, setPlatform] = useState('Instagram')
  const [whereFound, setWhereFound] = useState('')
  const [status, setStatus] = useState('cold')
  const [signalTag, setSignalTag] = useState('None')
  const [nextAction, setNextAction] = useState('')
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    setName('')
    setHandle('')
    setPlatform('Instagram')
    setWhereFound('')
    setStatus('cold')
    setSignalTag('None')
    setNextAction('')
    setNotes('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      handle: handle.replace(/^@+/, '').trim(),
      platform,
      source: whereFound,
      status,
      signal_tag: signalTag,
      next_action: nextAction,
      notes,
    })
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: 20,
    }}>
      <div style={{
        background: C.white,
        borderRadius: 16,
        width: '100%',
        maxWidth: 480,
        maxHeight: '90vh',
        overflow: 'auto',
        padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.black }}>Add Prospect</h2>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: C.gray400 }}>&times;</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Doe"
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 14, outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Handle</label>
              <input
                type="text"
                value={handle}
                onChange={e => {
                  const val = e.target.value
                  setHandle(val.startsWith('@') ? val : (val ? '@' + val.replace(/^@+/, '') : ''))
                }}
                placeholder="@handle"
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Platform</label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 14, outline: 'none', cursor: 'pointer' }}
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Where Found</label>
              <select
                value={whereFound}
                onChange={e => setWhereFound(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 14, outline: 'none', cursor: 'pointer' }}
              >
                <option value="">Select...</option>
                {WHERE_FOUND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Starting Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 14, outline: 'none', cursor: 'pointer' }}
              >
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Signal Tag</label>
            <select
              value={signalTag}
              onChange={e => setSignalTag(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 14, outline: 'none', cursor: 'pointer' }}
            >
              {SIGNAL_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Next Action</label>
            <input
              type="text"
              value={nextAction}
              onChange={e => setNextAction(e.target.value)}
              placeholder="Send welcome DM"
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 14, outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add context..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <button
            onClick={handleClose}
            style={{ flex: 1, padding: '12px', border: `1px solid ${C.gray200}`, borderRadius: 8, background: C.white, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: C.gray600 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 8, background: C.gold, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: C.white, opacity: name.trim() ? 1 : 0.5 }}
          >
            Add Prospect
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PROSPECT SIDE PANEL ──────────────────────────────────────
function ProspectPanel({ prospect, touches, onClose, onUpdate, onLogTouch, onGenerateScript }) {
  const [notes, setNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedScript, setGeneratedScript] = useState('')

  useEffect(() => {
    if (prospect) {
      setNotes(prospect.notes || '')
      setGeneratedScript('')
    }
  }, [prospect])

  if (!prospect) return null

  const prospectTouches = touches.filter(t => t.prospect_id === prospect.id).sort((a, b) => new Date(b.touch_date) - new Date(a.touch_date))

  const handleGenerateScript = async () => {
    setGenerating(true)
    try {
      const script = await onGenerateScript(prospect)
      setGeneratedScript(script)
    } catch (e) {
      setGeneratedScript('Could not generate script.')
    }
    setGenerating(false)
  }

  const handleSaveNotes = () => {
    if (notes !== prospect.notes) {
      onUpdate(prospect.id, { notes })
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 150,
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: 380,
        background: C.white,
        boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
        zIndex: 160,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: 20, borderBottom: `1px solid ${C.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.black }}>{prospect.name}</h2>
            <div style={{ fontSize: 14, color: C.gray500, marginTop: 4 }}>{formatHandle(prospect.handle)} {prospect.platform && `• ${prospect.platform}`}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: C.gray400 }}>&times;</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {/* Status */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.gray500, marginBottom: 6, textTransform: 'uppercase' }}>Status</label>
            <select
              value={prospect.status}
              onChange={e => onUpdate(prospect.id, { status: e.target.value })}
              style={{ padding: '8px 12px', border: `1px solid ${C.gray200}`, borderRadius: 6, fontSize: 14, outline: 'none', cursor: 'pointer' }}
            >
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          {/* Signal Tag */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.gray500, marginBottom: 6, textTransform: 'uppercase' }}>Signal Tag</label>
            <select
              value={prospect.signal_tag || 'None'}
              onChange={e => onUpdate(prospect.id, { signal_tag: e.target.value })}
              style={{ padding: '8px 12px', border: `1px solid ${C.gray200}`, borderRadius: 6, fontSize: 14, outline: 'none', cursor: 'pointer' }}
            >
              {SIGNAL_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Next Action */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.gray500, marginBottom: 6, textTransform: 'uppercase' }}>Next Action</label>
            <input
              type="text"
              value={prospect.next_action || ''}
              onChange={e => onUpdate(prospect.id, { next_action: e.target.value })}
              placeholder="What's the next step?"
              style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.gray200}`, borderRadius: 6, fontSize: 14, outline: 'none' }}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.gray500, marginBottom: 6, textTransform: 'uppercase' }}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="Add notes..."
              rows={4}
              style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.gray200}`, borderRadius: 6, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* AI Script */}
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={handleGenerateScript}
              disabled={generating}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                border: `1px solid ${C.gold}`,
                borderRadius: 8,
                color: C.gold,
                fontSize: 14,
                fontWeight: 600,
                cursor: generating ? 'wait' : 'pointer',
                opacity: generating ? 0.6 : 1,
              }}
            >
              {generating ? 'Generating...' : 'Suggest next message'}
            </button>
            {generatedScript && (
              <div style={{ marginTop: 12, padding: 12, background: C.gray50, borderRadius: 8, border: `1px solid ${C.gold}` }}>
                <div style={{ fontSize: 13, color: C.black, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{generatedScript}</div>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedScript)}
                  style={{ marginTop: 8, background: C.gold, color: C.white, border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Copy
                </button>
              </div>
            )}
          </div>

          {/* Touch History */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase' }}>Touch History ({prospectTouches.length})</label>
              <button
                onClick={() => onLogTouch(prospect.id)}
                style={{ background: C.gold, color: C.white, border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                + Log Touch
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {prospectTouches.length === 0 ? (
                <div style={{ color: C.gray400, fontSize: 13, fontStyle: 'italic' }}>No touches logged yet</div>
              ) : (
                prospectTouches.map(t => (
                  <div key={t.id} style={{ padding: 10, background: C.gray50, borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: C.gray500 }}>{formatDate(t.touch_date)}</div>
                    {t.note && <div style={{ fontSize: 13, color: C.black, marginTop: 4 }}>{t.note}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── DAILY PAGE (EDITABLE TABLE) ──────────────────────────────
function DailyPage({ prospects, touches, todayTouches, onQuickLog, onOpenProspect, onUpdate, onAddRow }) {
  const [needsAttentionOpen, setNeedsAttentionOpen] = useState(false)
  const tableRef = useRef(null)

  // All active prospects sorted by last touched (oldest first = needs attention)
  const workingList = prospects
    .filter(p => p.status !== 'archived' && p.status !== 'closed')
    .sort((a, b) => daysSince(b.last_touched_at) - daysSince(a.last_touched_at))

  // Needs attention: not touched in 7+ days
  const needsAttention = prospects.filter(p =>
    p.status !== 'archived' &&
    p.status !== 'closed' &&
    daysSince(p.last_touched_at) >= 7
  )

  const getStatusLabel = (id) => STATUSES.find(s => s.id === id)?.label || id
  const getStatusColor = (id) => STATUSES.find(s => s.id === id)?.color || null

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Motivational prompt */}
      <div style={{
        background: C.black,
        color: C.white,
        padding: '14px 20px',
        borderRadius: 10,
        marginBottom: 24,
        fontSize: 15,
        fontWeight: 500,
      }}>
        100 touches. That's the job. Everything else is noise.
      </div>

      {/* Daily touch counter */}
      <div style={{
        background: C.gray50,
        borderRadius: 10,
        padding: 20,
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.gray600 }}>Today's Touches</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.gold }}>{todayTouches} / 100</span>
        </div>
        <div style={{ height: 6, background: C.gray200, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(todayTouches, 100)}%`,
            height: '100%',
            background: todayTouches >= 100 ? '#10B981' : C.gold,
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Editable Table */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          background: C.white,
          border: `1px solid ${C.gray200}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }} ref={tableRef}>
            <table style={{ width: '100%', minWidth: 1200, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.gray50, position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', borderBottom: `1px solid ${C.gray200}`, width: 140 }}>Name</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', borderBottom: `1px solid ${C.gray200}`, width: 120 }}>Handle</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', borderBottom: `1px solid ${C.gray200}`, width: 100 }}>Platform</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', borderBottom: `1px solid ${C.gray200}`, width: 140 }}>Where Found</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', borderBottom: `1px solid ${C.gray200}`, width: 100 }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', borderBottom: `1px solid ${C.gray200}`, width: 120 }}>Signal Tag</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', borderBottom: `1px solid ${C.gray200}`, width: 140 }}>Next Action</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', borderBottom: `1px solid ${C.gray200}`, width: 110 }}>Call Booked</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', borderBottom: `1px solid ${C.gray200}`, width: 80 }}>Last Touched</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', borderBottom: `1px solid ${C.gray200}`, width: 80 }}>Date Added</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', borderBottom: `1px solid ${C.gray200}`, width: 60 }}>Touches</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', borderBottom: `1px solid ${C.gray200}`, minWidth: 160 }}>Notes</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', borderBottom: `1px solid ${C.gray200}`, width: 80 }}>Quick-log</th>
                </tr>
              </thead>
              <tbody>
                {workingList.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ padding: 40, textAlign: 'center', color: C.gray400 }}>
                      No prospects yet. Click + to add your first one.
                    </td>
                  </tr>
                ) : (
                  workingList.map(p => {
                    const touchCount = touches.filter(t => t.prospect_id === p.id).length
                    const days = daysSince(p.last_touched_at)
                    return (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${C.gray100}` }}>
                        {/* Name - clickable to open panel */}
                        <td style={{ padding: '8px 12px' }}>
                          <button
                            onClick={() => onOpenProspect(p)}
                            style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 500, color: C.gold, cursor: 'pointer', textAlign: 'left', textDecoration: 'underline' }}
                          >
                            {p.name}
                          </button>
                        </td>
                        {/* Handle */}
                        <td style={{ padding: '8px 12px' }}>
                          <InlineTextInput
                            value={formatHandle(p.handle)}
                            onChange={(val) => onUpdate(p.id, { handle: val.replace(/^@+/, '') })}
                            placeholder="@handle"
                          />
                        </td>
                        {/* Platform */}
                        <td style={{ padding: '8px 12px' }}>
                          <InlineDropdown
                            value={p.platform || 'Instagram'}
                            options={PLATFORMS}
                            onChange={(val) => onUpdate(p.id, { platform: val })}
                          />
                        </td>
                        {/* Where Found */}
                        <td style={{ padding: '8px 12px' }}>
                          <InlineDropdown
                            value={p.source}
                            options={WHERE_FOUND_OPTIONS}
                            onChange={(val) => onUpdate(p.id, { source: val })}
                            placeholder="Select..."
                          />
                        </td>
                        {/* Status */}
                        <td style={{ padding: '8px 12px' }}>
                          <InlineDropdown
                            value={p.status}
                            options={STATUSES.map(s => s.id)}
                            onChange={(val) => onUpdate(p.id, { status: val })}
                            getLabel={getStatusLabel}
                            getColor={getStatusColor}
                          />
                        </td>
                        {/* Signal Tag */}
                        <td style={{ padding: '8px 12px' }}>
                          <InlineDropdown
                            value={p.signal_tag || 'None'}
                            options={SIGNAL_TAGS}
                            onChange={(val) => onUpdate(p.id, { signal_tag: val })}
                          />
                        </td>
                        {/* Next Action */}
                        <td style={{ padding: '8px 12px' }}>
                          <InlineTextInput
                            value={p.next_action || ''}
                            onChange={(val) => onUpdate(p.id, { next_action: val })}
                            placeholder="Next step..."
                          />
                        </td>
                        {/* Call Booked */}
                        <td style={{ padding: '8px 12px' }}>
                          <InlineDropdown
                            value={p.call_booked || 'No'}
                            options={CALL_BOOKED_OPTIONS}
                            onChange={(val) => onUpdate(p.id, { call_booked: val })}
                          />
                        </td>
                        {/* Last Touched */}
                        <td style={{ padding: '8px 12px', fontSize: 12, color: days >= 7 ? C.hot : C.gray500 }}>
                          {formatDaysAgo(p.last_touched_at)}
                        </td>
                        {/* Date Added */}
                        <td style={{ padding: '8px 12px', fontSize: 12, color: C.gray500 }}>
                          {formatDate(p.added_date || p.created_at)}
                        </td>
                        {/* Touch Count */}
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 13, color: C.gray600 }}>
                          {touchCount}
                        </td>
                        {/* Notes */}
                        <td style={{ padding: '8px 12px' }}>
                          <InlineTextInput
                            value={p.notes || ''}
                            onChange={(val) => onUpdate(p.id, { notes: val })}
                            placeholder="Add note..."
                            style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          />
                        </td>
                        {/* Quick-log */}
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            onClick={() => onQuickLog(p.id)}
                            style={{
                              background: C.gold,
                              color: C.white,
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: 5,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Log
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add row button */}
        <button
          onClick={onAddRow}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: 8,
            background: C.gray50,
            border: `1px dashed ${C.gray300}`,
            borderRadius: 8,
            color: C.gray500,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          + Add row
        </button>
      </div>

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <div style={{
          background: C.white,
          border: `1px solid ${C.gray200}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setNeedsAttentionOpen(!needsAttentionOpen)}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: C.gray50,
              border: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: C.black }}>
              Needs Attention ({needsAttention.length})
            </span>
            <span style={{ color: C.gray500 }}>{needsAttentionOpen ? '▲' : '▼'}</span>
          </button>
          {needsAttentionOpen && (
            <div style={{ padding: 16 }}>
              <p style={{ fontSize: 13, color: C.gray500, marginTop: 0, marginBottom: 16 }}>These prospects haven't been touched in 7+ days</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {needsAttention.map(p => (
                  <div key={p.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    background: C.gray50,
                    borderRadius: 8,
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, color: C.black, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.gray500 }}>{formatHandle(p.handle)} — {formatDaysAgo(p.last_touched_at)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => onQuickLog(p.id)}
                        style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.gray200}`, background: C.white, fontSize: 12, cursor: 'pointer', color: C.gray600 }}
                      >
                        Keep Working
                      </button>
                      <button
                        onClick={() => {
                          const statusOrder = ['cold', 'warm', 'hot', 'offer_sent', 'closed']
                          const currentIdx = statusOrder.indexOf(p.status)
                          const nextStatus = statusOrder[Math.min(currentIdx + 1, statusOrder.length - 1)]
                          onUpdate(p.id, { status: nextStatus })
                        }}
                        style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.gold}`, background: C.white, fontSize: 12, cursor: 'pointer', color: C.gold }}
                      >
                        Promote Status
                      </button>
                      <button
                        onClick={() => onUpdate(p.id, { status: 'archived' })}
                        style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.gray300}`, background: C.white, fontSize: 12, cursor: 'pointer', color: C.gray500 }}
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PIPELINE PAGE ────────────────────────────────────────────
function PipelinePage({ prospects, touches, onOpenProspect, onUpdate }) {
  const [viewMode, setViewMode] = useState('table')
  const [sortBy, setSortBy] = useState('last_touched_at')
  const [sortDir, setSortDir] = useState('desc')
  const [showArchived, setShowArchived] = useState(false)

  let filtered = prospects.filter(p => showArchived || p.status !== 'archived')

  filtered = [...filtered].sort((a, b) => {
    let av = a[sortBy]
    let bv = b[sortBy]
    if (sortBy === 'name') {
      av = (av || '').toLowerCase()
      bv = (bv || '').toLowerCase()
    }
    if (sortBy.includes('date') || sortBy.includes('_at')) {
      av = new Date(av || 0).getTime()
      bv = new Date(bv || 0).getTime()
    }
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('desc')
    }
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.black, margin: 0 }}>Pipeline</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.gray600, cursor: 'pointer', marginRight: 16 }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              style={{ accentColor: C.gold }}
            />
            Show archived
          </label>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: `1px solid ${C.gray200}`,
              background: viewMode === 'table' ? C.gold : C.white,
              color: viewMode === 'table' ? C.white : C.gray600,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: `1px solid ${C.gray200}`,
              background: viewMode === 'kanban' ? C.gold : C.white,
              color: viewMode === 'kanban' ? C.white : C.gray600,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Kanban
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.gray50 }}>
                <th onClick={() => handleSort('name')} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', cursor: 'pointer' }}>
                  Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase' }}>Handle</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase' }}>Status</th>
                <th onClick={() => handleSort('last_touched_at')} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', cursor: 'pointer' }}>
                  Last Touched {sortBy === 'last_touched_at' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.gray100}` }}>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => onOpenProspect(p)} style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 500, color: C.gold, cursor: 'pointer', textDecoration: 'underline' }}>
                      {p.name}
                    </button>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: C.gray600 }}>{formatHandle(p.handle)}</td>
                  <td style={{ padding: '10px 14px' }}><StatusPill status={p.status} /></td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: C.gray500 }}>{formatDaysAgo(p.last_touched_at)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: C.gray500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
          {STATUSES.filter(s => s.id !== 'archived' || showArchived).map(status => {
            const statusProspects = filtered.filter(p => p.status === status.id)
            return (
              <div key={status.id} style={{ minWidth: 260, flex: 1, maxWidth: 320 }}>
                <div style={{ padding: '10px 14px', background: status.color + '15', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: status.color }}>{status.label}</span>
                  <span style={{ fontSize: 12, color: C.gray500 }}>{statusProspects.length}</span>
                </div>
                <div style={{ background: C.gray50, borderRadius: '0 0 8px 8px', padding: 8, minHeight: 200 }}>
                  {statusProspects.map(p => (
                    <div
                      key={p.id}
                      onClick={() => onOpenProspect(p)}
                      style={{ background: C.white, padding: 12, borderRadius: 6, marginBottom: 8, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.black }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.gray500 }}>{formatHandle(p.handle)}</div>
                      {p.next_action && <div style={{ fontSize: 11, color: C.gold, marginTop: 4 }}>{p.next_action}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── GUIDE PAGE ───────────────────────────────────────────────
function GuidePage({ onAskCoach }) {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!message.trim() || loading) return
    const userMsg = message.trim()
    setMessage('')
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const response = await onAskCoach(userMsg)
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }])
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble responding. Try again.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.black, marginBottom: 20 }}>Coach Sarah</h1>
      
      {/* Method Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { title: 'Curiosity Opener', desc: 'Start cold conversations with a question that invites their expertise' },
          { title: '3-Step Reply', desc: 'Validate, add value, ask one question' },
          { title: 'Soft Positioning', desc: 'Bridge their problem to your expertise naturally' },
          { title: 'Objection Handling', desc: 'Acknowledge, clarify, address, re-close' },
        ].map(card => (
          <div key={card.title} style={{ padding: 16, background: C.gray50, borderRadius: 10, border: `1px solid ${C.gray200}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.black, marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: 13, color: C.gray600 }}>{card.desc}</div>
          </div>
        ))}
      </div>

      {/* Chat */}
      <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: `1px solid ${C.gray200}`, background: C.gray50 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.black }}>Ask Coach Sarah</div>
          <div style={{ fontSize: 12, color: C.gray500 }}>Get help with scripts, objections, and strategy</div>
        </div>
        <div style={{ height: 300, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chatHistory.length === 0 && (
            <div style={{ color: C.gray400, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 60 }}>
              Ask me anything about outreach, scripts, or closing...
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: msg.role === 'user' ? C.gold : C.gray100,
                color: msg.role === 'user' ? C.white : C.black,
                fontSize: 13,
                lineHeight: 1.5,
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', padding: '10px 14px', background: C.gray100, borderRadius: 10, fontSize: 13, color: C.gray500 }}>
              Thinking...
            </div>
          )}
        </div>
        <div style={{ padding: 12, borderTop: `1px solid ${C.gray200}`, display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your question..."
            style={{ flex: 1, padding: '10px 12px', border: `1px solid ${C.gray200}`, borderRadius: 6, fontSize: 14, outline: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || loading}
            style={{
              padding: '10px 20px',
              background: C.gold,
              color: C.white,
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: !message.trim() || loading ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const sb = createClient()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('daily')
  const [prospects, setProspects] = useState([])
  const [touches, setTouches] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState(null)
  const [toast, setToast] = useState(null)
  const [aiUsage, setAiUsage] = useState({ used: 0, limit: 20 })

  const uid = session?.user?.id

  // Auth listener
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [sb])

  // Load data
  const loadData = useCallback(async () => {
    if (!uid) return
    const [{ data: pros }, { data: tchs }] = await Promise.all([
      sb.from('prospects').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      sb.from('touches').select('*').eq('user_id', uid).order('touch_date', { ascending: false }),
    ])
    setProspects(pros || [])
    setTouches(tchs || [])
  }, [sb, uid])

  useEffect(() => {
    if (uid) loadData()
  }, [uid, loadData])

  // Today's touches
  const todayTouches = touches.filter(t => t.touch_date?.startsWith(todayStr())).length

  // Handlers
  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  const handleAddProspect = async (data) => {
    const { error, data: newProspect } = await sb.from('prospects').insert({
      user_id: uid,
      name: data.name,
      handle: data.handle,
      platform: data.platform || 'Instagram',
      source: data.source,
      status: data.status || 'cold',
      signal_tag: data.signal_tag,
      next_action: data.next_action,
      notes: data.notes,
      added_date: todayStr(),
    }).select().single()

    if (!error && newProspect) {
      setProspects(prev => [newProspect, ...prev])
      showToast('Prospect added!')
    }
  }

  const handleUpdateProspect = async (id, updates) => {
    const { error } = await sb.from('prospects').update(updates).eq('id', id)
    if (!error) {
      setProspects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    }
  }

  const handleQuickLog = async (prospectId) => {
    const { error, data: touch } = await sb.from('touches').insert({
      user_id: uid,
      prospect_id: prospectId,
      touch_type: 'Quick log',
      touch_date: todayStr(),
    }).select().single()

    if (!error && touch) {
      setTouches(prev => [touch, ...prev])
      await sb.from('prospects').update({ last_touched_at: new Date().toISOString() }).eq('id', prospectId)
      setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, last_touched_at: new Date().toISOString() } : p))
      showToast('Touch logged!')
    }
  }

  const handleLogTouch = async (prospectId) => {
    await handleQuickLog(prospectId)
  }

  const handleGenerateScript = async (prospect) => {
    const res = await fetch('/api/ai-suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uid,
        prospectId: prospect.id,
        prospectName: prospect.name,
        channel: prospect.status === 'cold' ? 3 : prospect.status === 'warm' ? 2 : 5,
        intel: { notes: prospect.notes },
        conversationHistory: prospect.notes || '',
        requestType: 'next_message',
      }),
    })
    if (!res.ok) throw new Error('Failed')
    const data = await res.json()
    return data.suggestion || data.script
  }

  const handleAskCoach = async (message) => {
    const res = await fetch('/api/ai-suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uid,
        prospectId: null,
        prospectName: 'General',
        channel: 1,
        intel: {},
        conversationHistory: message,
        requestType: 'coach_help',
      }),
    })
    if (!res.ok) throw new Error('Failed')
    const data = await res.json()
    return data.suggestion || data.script || 'I can help you with scripts and strategy. What would you like to know?'
  }

  // Auth UI
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.white }}>
        <div style={{ color: C.gold, fontSize: 18 }}>Loading...</div>
      </div>
    )
  }

  if (!session) {
    return <AuthPage sb={sb} />
  }

  return (
    <div style={{ minHeight: '100vh', background: C.white }}>
      <NavBar
        page={page}
        setPage={setPage}
        onAddClick={() => setShowAddModal(true)}
        aiCallsUsed={aiUsage.used}
        aiCallsLimit={aiUsage.limit}
      />

      {page === 'daily' && (
        <DailyPage
          prospects={prospects}
          touches={touches}
          todayTouches={todayTouches}
          onQuickLog={handleQuickLog}
          onOpenProspect={setSelectedProspect}
          onUpdate={handleUpdateProspect}
          onAddRow={() => setShowAddModal(true)}
        />
      )}

      {page === 'pipeline' && (
        <PipelinePage
          prospects={prospects}
          touches={touches}
          onOpenProspect={setSelectedProspect}
          onUpdate={handleUpdateProspect}
        />
      )}

      {page === 'guide' && (
        <GuidePage onAskCoach={handleAskCoach} />
      )}

      <AddProspectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddProspect}
      />

      <ProspectPanel
        prospect={selectedProspect}
        touches={touches}
        onClose={() => setSelectedProspect(null)}
        onUpdate={handleUpdateProspect}
        onLogTouch={handleLogTouch}
        onGenerateScript={handleGenerateScript}
      />

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: C.black,
          color: C.white,
          padding: '12px 24px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          zIndex: 300,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── AUTH PAGE ────────────────────────────────────────────────
function AuthPage({ sb }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await sb.auth.signUp({ email, password })
        if (error) throw error
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: C.black,
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: C.white,
        borderRadius: 16,
        padding: 40,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48,
            height: 48,
            background: C.gold,
            borderRadius: 12,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 20,
            color: C.black,
            marginBottom: 16,
          }}>
            IC
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.black }}>Insta Client Engine</h1>
          <p style={{ margin: '8px 0 0', color: C.gray500, fontSize: 14 }}>
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px 14px', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 14, outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '12px 14px', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 14, outline: 'none' }}
            />
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: 12, background: '#FEE2E2', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: C.gold, color: C.white, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ width: '100%', background: 'none', border: 'none', color: C.gold, fontSize: 14, cursor: 'pointer' }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </form>
      </div>
    </div>
  )
}
