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
  closed: '#6B7280',    // dark gray
  archived: '#D1D5DB',  // light gray
}

// ─── STATUS CONFIG ────────────────────────────────────────────
const STATUSES = [
  { id: 'cold', label: 'Cold', color: C.cold },
  { id: 'warm', label: 'Warm', color: C.warm },
  { id: 'hot', label: 'Hot', color: C.hot },
  { id: 'offer_sent', label: 'Offer Sent', color: C.offerSent },
  { id: 'closed', label: 'Closed', color: C.closed },
  { id: 'archived', label: 'Archived', color: C.archived },
]

const WHERE_FOUND_OPTIONS = [
  'They followed me',
  'Found via hashtag',
  'Competitor followers',
  'Engagement mining',
  'Referral',
  'Already talking',
]

// ─── HELPERS ──────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10)
const daysSince = (dateStr) => {
  if (!dateStr) return 999
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now - d) / (1000 * 60 * 60 * 24))
}
const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── STATUS PILL ──────────────────────────────────────────────
function StatusPill({ status, small = false }) {
  const s = STATUSES.find(st => st.id === status) || STATUSES[0]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: small ? '2px 8px' : '4px 12px',
      borderRadius: 999,
      fontSize: small ? 11 : 12,
      fontWeight: 600,
      background: s.color + '15',
      color: s.color,
      textTransform: 'capitalize',
    }}>
      {s.label}
    </span>
  )
}

// ─── BUTTON COMPONENTS ────────────────────────────────────────
function PrimaryButton({ children, onClick, disabled, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: C.gold,
        color: C.white,
        border: 'none',
        padding: '10px 20px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        color: C.gold,
        border: `1px solid ${C.gold}`,
        padding: '10px 20px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function IconButton({ children, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: C.gray100,
        color: C.gray600,
        border: 'none',
        padding: '8px 12px',
        borderRadius: 6,
        fontSize: 13,
        cursor: 'pointer',
        transition: 'all 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
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
      {/* Logo */}
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

      {/* Nav Links */}
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
              transition: 'all 0.15s',
            }}
          >
            {p}
          </button>
        ))}
      </nav>

      {/* Right side: AI counter + Add button */}
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
            fontWeight: 400,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>
    </header>
  )
}

// ─── ADD PROSPECT MODAL ───────────────────────────────────────
function AddProspectModal({ isOpen, onClose, onSave, onGenerateOpener }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [handle, setHandle] = useState('')
  const [whereFound, setWhereFound] = useState('')
  const [status, setStatus] = useState('cold')
  const [contextNote, setContextNote] = useState('')
  const [notes, setNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedScript, setGeneratedScript] = useState('')

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setHandle('')
    setWhereFound('')
    setStatus('cold')
    setContextNote('')
    setNotes('')
    setGeneratedScript('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSave = () => {
    if (!firstName.trim() || !handle.trim()) return
    onSave({
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      handle: handle.trim().replace(/^@/, ''),
      source: whereFound,
      status,
      contextNote,
      notes,
    })
    handleClose()
  }

  const handleGenerateOpener = async () => {
    setGenerating(true)
    try {
      const script = await onGenerateOpener({
        name: firstName,
        handle: handle.replace(/^@/, ''),
        contextNote,
        status,
      })
      setGeneratedScript(script)
    } catch (e) {
      setGeneratedScript('Could not generate script. Try again.')
    }
    setGenerating(false)
  }

  const getContextLabel = () => {
    switch (status) {
      case 'cold': return 'What caught your attention? Note a specific post, bio detail, or comment for your opener.'
      case 'warm': return "What's the relationship so far? How do you know them?"
      case 'hot': return 'What buying signal did you see?'
      default: return 'Additional context'
    }
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
        maxWidth: 520,
        maxHeight: '90vh',
        overflow: 'auto',
        padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.black }}>Add Prospect</h2>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: C.gray400 }}>&times;</button>
        </div>

        {/* Name fields */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>First Name *</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Jane"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${C.gray200}`,
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Doe"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${C.gray200}`,
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Handle */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Instagram Handle *</label>
          <input
            type="text"
            value={handle}
            onChange={e => setHandle(e.target.value.startsWith('@') ? e.target.value : '@' + e.target.value.replace(/^@/, ''))}
            placeholder="@handle"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${C.gray200}`,
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>

        {/* Where Found */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 8 }}>Where Found</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {WHERE_FOUND_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setWhereFound(whereFound === opt ? '' : opt)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: whereFound === opt ? `2px solid ${C.gold}` : `1px solid ${C.gray200}`,
                  background: whereFound === opt ? C.gold + '10' : C.white,
                  color: whereFound === opt ? C.gold : C.gray600,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: whereFound === opt ? 600 : 400,
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Starting Status */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 8 }}>Starting Status</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['cold', 'warm', 'hot'].map(s => {
              const st = STATUSES.find(x => x.id === s)
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: status === s ? `2px solid ${st.color}` : `1px solid ${C.gray200}`,
                    background: status === s ? st.color + '15' : C.white,
                    color: status === s ? st.color : C.gray500,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {st.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Context Note (conditional) */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>{getContextLabel()}</label>
          <textarea
            value={contextNote}
            onChange={e => setContextNote(e.target.value)}
            placeholder="Be specific - this helps with personalization..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${C.gray200}`,
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
          {status === 'cold' && (
            <button
              onClick={handleGenerateOpener}
              disabled={generating || !contextNote.trim()}
              style={{
                marginTop: 8,
                background: 'transparent',
                border: `1px solid ${C.gold}`,
                color: C.gold,
                padding: '8px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: generating ? 'wait' : 'pointer',
                opacity: generating || !contextNote.trim() ? 0.6 : 1,
              }}
            >
              {generating ? 'Generating...' : 'Generate opener script'}
            </button>
          )}
          {generatedScript && (
            <div style={{
              marginTop: 12,
              padding: 12,
              background: C.gray50,
              borderRadius: 8,
              border: `1px solid ${C.gold}`,
            }}>
              <div style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginBottom: 6 }}>GENERATED SCRIPT</div>
              <div style={{ fontSize: 13, color: C.black, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{generatedScript}</div>
              <button
                onClick={() => navigator.clipboard.writeText(generatedScript)}
                style={{
                  marginTop: 8,
                  background: C.gold,
                  color: C.white,
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
            </div>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anything else to remember..."
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${C.gray200}`,
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <SecondaryButton onClick={handleClose} style={{ flex: 1 }}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={!firstName.trim() || !handle.trim()} style={{ flex: 1 }}>
            Add to Pipeline
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

// ─── PROSPECT SIDE PANEL ──────────────────────────────────────
function ProspectPanel({ prospect, touches, onClose, onLogTouch, onUpdateStatus, onSaveNotes, onGenerateScript }) {
  const [notes, setNotes] = useState(prospect?.notes || '')
  const [generating, setGenerating] = useState(false)
  const [generatedScript, setGeneratedScript] = useState('')
  
  useEffect(() => {
    setNotes(prospect?.notes || '')
    setGeneratedScript('')
  }, [prospect?.id])

  if (!prospect) return null

  const prospectTouches = touches.filter(t => t.prospect_id === prospect.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const touchCount = prospectTouches.length

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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 420,
      background: C.white,
      boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
      zIndex: 150,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${C.gray200}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.black }}>{prospect.name}</h2>
          <a
            href={`https://instagram.com/${prospect.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: C.gold, fontSize: 14, textDecoration: 'none' }}
          >
            @{prospect.handle}
          </a>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: C.gray400 }}>&times;</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* Status */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.gray500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {STATUSES.filter(s => s.id !== 'archived').map(s => (
              <button
                key={s.id}
                onClick={() => onUpdateStatus(prospect.id, s.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: prospect.status === s.id ? `2px solid ${s.color}` : `1px solid ${C.gray200}`,
                  background: prospect.status === s.id ? s.color + '15' : C.white,
                  color: prospect.status === s.id ? s.color : C.gray500,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: C.gray500, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Where Found</div>
            <div style={{ fontSize: 14, color: C.black }}>{prospect.source || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.gray500, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Date Added</div>
            <div style={{ fontSize: 14, color: C.black }}>{formatDate(prospect.added_date)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.gray500, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Last Touched</div>
            <div style={{ fontSize: 14, color: C.black }}>{formatDate(prospect.last_touched_at)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.gray500, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Touch Count</div>
            <div style={{ fontSize: 14, color: C.black }}>{touchCount}</div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.gray500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={() => onSaveNotes(prospect.id, notes)}
            rows={3}
            placeholder="Add notes about this prospect..."
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${C.gray200}`,
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* AI Script */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={handleGenerateScript}
            disabled={generating}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: C.gold + '15',
              border: `1px solid ${C.gold}`,
              borderRadius: 8,
              color: C.gold,
              fontSize: 14,
              fontWeight: 600,
              cursor: generating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {generating ? 'Generating...' : 'Get AI Script Suggestion'}
          </button>
          {generatedScript && (
            <div style={{
              marginTop: 12,
              padding: 12,
              background: C.gray50,
              borderRadius: 8,
              border: `1px solid ${C.gold}`,
            }}>
              <div style={{ fontSize: 13, color: C.black, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{generatedScript}</div>
              <button
                onClick={() => navigator.clipboard.writeText(generatedScript)}
                style={{
                  marginTop: 8,
                  background: C.gold,
                  color: C.white,
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
            </div>
          )}
        </div>

        {/* Touch History */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Touch History</label>
            <button
              onClick={() => onLogTouch(prospect.id)}
              style={{
                background: C.gold,
                color: C.white,
                border: 'none',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Log Touch
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {prospectTouches.length === 0 ? (
              <div style={{ color: C.gray400, fontSize: 13, fontStyle: 'italic' }}>No touches logged yet</div>
            ) : (
              prospectTouches.map(t => (
                <div key={t.id} style={{
                  padding: 12,
                  background: C.gray50,
                  borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.black }}>{t.touch_type || 'Touch'}</span>
                    <span style={{ fontSize: 11, color: C.gray500 }}>{formatDate(t.touch_date)}</span>
                  </div>
                  {t.note && <div style={{ fontSize: 13, color: C.gray600, marginTop: 4 }}>{t.note}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Archive button */}
      <div style={{ padding: 16, borderTop: `1px solid ${C.gray200}` }}>
        <button
          onClick={() => onUpdateStatus(prospect.id, 'archived')}
          style={{
            width: '100%',
            padding: '10px 16px',
            background: 'transparent',
            border: `1px solid ${C.gray300}`,
            borderRadius: 8,
            color: C.gray500,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Archive Prospect
        </button>
      </div>
    </div>
  )
}

// ─── DAILY PAGE ───────────────────────────────────────────────
function DailyPage({ prospects, touches, todayTouches, onQuickLog, onOpenProspect, onKeepWorking, onGraduate, onArchive }) {
  // Get prospects needing a touch today (sorted by longest since last contact)
  const workingList = prospects
    .filter(p => p.status !== 'archived' && p.status !== 'closed')
    .sort((a, b) => daysSince(b.last_touched_at) - daysSince(a.last_touched_at))

  // Needs attention: not touched in 7+ days
  const needsAttention = prospects.filter(p => 
    p.status !== 'archived' && 
    p.status !== 'closed' && 
    daysSince(p.last_touched_at) >= 7
  )

  return (
    <div style={{ padding: '32px 48px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Motivational prompt */}
      <div style={{
        background: C.black,
        color: C.white,
        padding: '16px 24px',
        borderRadius: 12,
        marginBottom: 32,
        fontSize: 16,
        fontWeight: 500,
      }}>
        100 touches. That's the job. Everything else is noise.
      </div>

      {/* Daily touch counter */}
      <div style={{
        background: C.gray50,
        borderRadius: 12,
        padding: 24,
        marginBottom: 32,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.gray600 }}>Today's Touches</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: C.gold }}>{todayTouches} / 100</span>
        </div>
        <div style={{
          height: 8,
          background: C.gray200,
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.min(todayTouches, 100)}%`,
            height: '100%',
            background: todayTouches >= 100 ? '#10B981' : C.gold,
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Working list table */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.black, marginBottom: 16 }}>Today's Working List</h2>
        <div style={{
          background: C.white,
          border: `1px solid ${C.gray200}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.gray50 }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase' }}>Handle</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase' }}>Last Touched</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase' }}>Touches</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase' }}></th>
              </tr>
            </thead>
            <tbody>
              {workingList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: C.gray400 }}>
                    No prospects yet. Click + to add your first one.
                  </td>
                </tr>
              ) : (
                workingList.map(p => {
                  const touchCount = touches.filter(t => t.prospect_id === p.id).length
                  const days = daysSince(p.last_touched_at)
                  return (
                    <tr key={p.id} style={{ borderTop: `1px solid ${C.gray100}` }}>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => onOpenProspect(p)}
                          style={{ background: 'none', border: 'none', padding: 0, fontSize: 14, fontWeight: 500, color: C.black, cursor: 'pointer', textAlign: 'left' }}
                        >
                          {p.name}
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: C.gray600 }}>@{p.handle}</td>
                      <td style={{ padding: '12px 16px' }}><StatusPill status={p.status} small /></td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: days >= 7 ? C.hot : C.gray600 }}>
                        {p.last_touched_at ? `${days}d ago` : 'Never'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, color: C.gray600 }}>{touchCount}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => onQuickLog(p.id)}
                          style={{
                            background: C.gold,
                            color: C.white,
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Quick-log
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

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.black, marginBottom: 8 }}>Needs Attention</h2>
          <p style={{ fontSize: 14, color: C.gray500, marginBottom: 16 }}>These prospects haven't been touched in 7+ days</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {needsAttention.map(p => (
              <div key={p.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                background: C.gray50,
                borderRadius: 10,
                border: `1px solid ${C.gray200}`,
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: C.black }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: C.gray500 }}>@{p.handle} — Last touched {daysSince(p.last_touched_at)}d ago</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <IconButton onClick={() => onKeepWorking(p.id)}>Keep Working</IconButton>
                  <IconButton onClick={() => onGraduate(p.id)}>Graduate</IconButton>
                  <IconButton onClick={() => onArchive(p.id)} style={{ color: C.gray400 }}>Archive</IconButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PIPELINE PAGE ────────────────────────────────────────────
function PipelinePage({ prospects, touches, onOpenProspect, onUpdateStatus, viewMode, setViewMode, showArchived, setShowArchived, filters, setFilters }) {
  const [sortBy, setSortBy] = useState('last_touched_at')
  const [sortDir, setSortDir] = useState('desc')

  // Filter prospects
  let filtered = prospects.filter(p => {
    if (!showArchived && p.status === 'archived') return false
    if (filters.status && p.status !== filters.status) return false
    if (filters.source && p.source !== filters.source) return false
    return true
  })

  // Sort
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
    <div style={{ padding: '32px 48px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.black, margin: 0 }}>Pipeline</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '8px 16px',
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
              padding: '8px 16px',
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={filters.status || ''}
          onChange={e => setFilters({ ...filters, status: e.target.value || null })}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: `1px solid ${C.gray200}`,
            fontSize: 13,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">All Statuses</option>
          {STATUSES.filter(s => s.id !== 'archived').map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <select
          value={filters.source || ''}
          onChange={e => setFilters({ ...filters, source: e.target.value || null })}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: `1px solid ${C.gray200}`,
            fontSize: 13,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">All Sources</option>
          {WHERE_FOUND_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.gray600, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={e => setShowArchived(e.target.checked)}
            style={{ accentColor: C.gold }}
          />
          Show archived
        </label>
      </div>

      {viewMode === 'table' ? (
        /* Table View */
        <div style={{
          background: C.white,
          border: `1px solid ${C.gray200}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.gray50 }}>
                <th onClick={() => handleSort('name')} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', cursor: 'pointer' }}>
                  Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase' }}>Handle</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase' }}>Where Found</th>
                <th onClick={() => handleSort('last_touched_at')} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', cursor: 'pointer' }}>
                  Last Touched {sortBy === 'last_touched_at' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('added_date')} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', cursor: 'pointer' }}>
                  Date Added {sortBy === 'added_date' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: C.gray400 }}>
                    No prospects found
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const days = daysSince(p.last_touched_at)
                  const needsTouch = days >= 10
                  return (
                    <tr key={p.id} style={{ borderTop: `1px solid ${C.gray100}` }}>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => onOpenProspect(p)}
                          style={{ background: 'none', border: 'none', padding: 0, fontSize: 14, fontWeight: 500, color: C.black, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          {p.name}
                          {needsTouch && (
                            <span style={{
                              background: C.hot,
                              color: C.white,
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontWeight: 600,
                            }}>
                              needs touch
                            </span>
                          )}
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: C.gray600 }}>@{p.handle}</td>
                      <td style={{ padding: '12px 16px' }}><StatusPill status={p.status} small /></td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.gray600 }}>{p.source || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: needsTouch ? C.hot : C.gray600 }}>
                        {p.last_touched_at ? formatDate(p.last_touched_at) : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.gray600 }}>{formatDate(p.added_date)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.gray500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.notes || '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban View */
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
          {STATUSES.filter(s => s.id !== 'archived').map(status => {
            const columnProspects = filtered.filter(p => p.status === status.id)
            return (
              <div key={status.id} style={{
                minWidth: 280,
                flex: 1,
                background: C.gray50,
                borderRadius: 12,
                padding: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: status.color,
                  }} />
                  <span style={{ fontWeight: 600, color: C.black }}>{status.label}</span>
                  <span style={{ fontSize: 12, color: C.gray500 }}>({columnProspects.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {columnProspects.map(p => {
                    const touchCount = touches.filter(t => t.prospect_id === p.id).length
                    return (
                      <div
                        key={p.id}
                        onClick={() => onOpenProspect(p)}
                        style={{
                          background: C.white,
                          borderRadius: 8,
                          padding: 12,
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          border: `1px solid ${C.gray200}`,
                        }}
                      >
                        <div style={{ fontWeight: 600, color: C.black, marginBottom: 4 }}>{p.name}</div>
                        <div style={{ fontSize: 13, color: C.gray500, marginBottom: 8 }}>@{p.handle}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.gray400 }}>
                          <span>{formatDate(p.last_touched_at)}</span>
                          <span>{touchCount} touches</span>
                        </div>
                      </div>
                    )
                  })}
                  {columnProspects.length === 0 && (
                    <div style={{ color: C.gray400, fontSize: 13, fontStyle: 'italic', textAlign: 'center', padding: 16 }}>
                      No prospects
                    </div>
                  )}
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
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const methodCards = [
    {
      title: 'Cold Outreach',
      color: C.cold,
      summary: 'Start conversations with new prospects. Use curiosity openers, authority reversals, or genuine human openers. Goal: get one reply.',
      tips: [
        'Personalize every message with a specific detail',
        'Ask for advice, not permission to pitch',
        'Keep it under 3 sentences',
      ],
    },
    {
      title: 'Warm Conversations',
      color: C.warm,
      summary: 'Build trust and add value. Use the 3-step reply formula: Validate, Add Value, Ask One Question. No pitching yet.',
      tips: [
        'One question per message maximum',
        'Mirror their language back to them',
        'Position softly after 3-5 exchanges',
      ],
    },
    {
      title: 'Hot Conversion',
      color: C.hot,
      summary: 'Diagnose their situation, position your offer, make it optional. Use their exact words to reference their pain.',
      tips: [
        '"Would it be weird if..." is your soft offer opener',
        'Address objections with the 4-step formula',
        'Never follow up more than once per week',
      ],
    },
  ]

  const handleSendChat = async () => {
    if (!chatInput.trim() || isLoading) return
    
    const userMessage = { role: 'user', content: chatInput.trim() }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsLoading(true)

    try {
      const response = await onAskCoach(chatInput.trim())
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' }])
    }
    setIsLoading(false)
  }

  return (
    <div style={{ padding: '32px 48px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Method Quick Reference */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.black, marginBottom: 20 }}>Method Quick Reference</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {methodCards.map(card => (
            <div key={card.title} style={{
              background: C.white,
              border: `1px solid ${C.gray200}`,
              borderRadius: 12,
              padding: 24,
              borderTop: `4px solid ${card.color}`,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: card.color, margin: '0 0 12px' }}>{card.title}</h3>
              <p style={{ fontSize: 14, color: C.gray600, lineHeight: 1.6, margin: '0 0 16px' }}>{card.summary}</p>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {card.tips.map((tip, i) => (
                  <li key={i} style={{ fontSize: 13, color: C.gray500, marginBottom: 6 }}>{tip}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Coach Sarah AI */}
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.black, marginBottom: 8 }}>Coach Sarah AI</h2>
        <p style={{ fontSize: 14, color: C.gray500, marginBottom: 20 }}>Ask for script help, objection handling, or what to say next.</p>
        
        <div style={{
          background: C.gray50,
          border: `1px solid ${C.gray200}`,
          borderRadius: 12,
          height: 400,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Chat messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            {chatMessages.length === 0 ? (
              <div style={{ color: C.gray400, textAlign: 'center', paddingTop: 80 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>S</div>
                <div>Ask me anything about the ICE methodology</div>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 16,
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: msg.role === 'user' ? C.gold : C.white,
                    color: msg.role === 'user' ? C.white : C.black,
                    border: msg.role === 'user' ? 'none' : `1px solid ${C.gray200}`,
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: C.white,
                  border: `1px solid ${C.gray200}`,
                  color: C.gray500,
                }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div style={{ padding: 16, borderTop: `1px solid ${C.gray200}`, display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              placeholder="Ask Coach Sarah..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: `1px solid ${C.gray200}`,
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
            <PrimaryButton onClick={handleSendChat} disabled={!chatInput.trim() || isLoading}>
              Send
            </PrimaryButton>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [sb] = useState(() => createClient())
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('daily')
  
  // Data
  const [prospects, setProspects] = useState([])
  const [touches, setTouches] = useState([])
  const [aiUsage, setAiUsage] = useState({ used: 0, limit: 10 })
  
  // UI State
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState(null)
  const [pipelineViewMode, setPipelineViewMode] = useState('table')
  const [showArchived, setShowArchived] = useState(false)
  const [filters, setFilters] = useState({ status: null, source: null })
  const [toast, setToast] = useState(null)

  const uid = session?.user?.id

  // Auth check
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [sb])

  // Load data
  const loadData = useCallback(async () => {
    if (!uid) return
    const [{ data: pros }, { data: tchs }] = await Promise.all([
      sb.from('prospects').select('*').eq('user_id', uid).order('created_at'),
      sb.from('touches').select('*').eq('user_id', uid).order('touch_date'),
    ])
    setProspects(pros || [])
    setTouches(tchs || [])
  }, [sb, uid])

  useEffect(() => {
    if (uid) loadData()
  }, [uid, loadData])

  // Toast helper
  const pop = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // Today's touches count
  const todayTouches = touches.filter(t => t.touch_date === todayStr()).length

  // ─── ACTIONS ────────────────────────────────────────────────

  const handleAddProspect = async (data) => {
    const { data: newProspect, error } = await sb.from('prospects').insert({
      user_id: uid,
      name: data.name,
      handle: data.handle,
      source: data.source,
      status: data.status,
      notes: [data.contextNote, data.notes].filter(Boolean).join('\n\n'),
      added_date: todayStr(),
      last_touched_at: todayStr(),
    }).select().single()

    if (error) {
      pop('Error adding prospect')
      return
    }

    setProspects(prev => [...prev, newProspect])
    pop('Prospect added')
  }

  const handleQuickLog = async (prospectId) => {
    const { data: touch, error } = await sb.from('touches').insert({
      prospect_id: prospectId,
      user_id: uid,
      touch_type: 'Quick touch',
      touch_date: todayStr(),
    }).select().single()

    if (error) {
      pop('Error logging touch')
      return
    }

    // Update last_touched_at
    await sb.from('prospects').update({ last_touched_at: new Date().toISOString() }).eq('id', prospectId)

    setTouches(prev => [...prev, touch])
    setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, last_touched_at: new Date().toISOString() } : p))
    pop('Touch logged')
  }

  const handleLogTouch = async (prospectId) => {
    await handleQuickLog(prospectId)
  }

  const handleUpdateStatus = async (prospectId, newStatus) => {
    await sb.from('prospects').update({ status: newStatus }).eq('id', prospectId)
    setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, status: newStatus } : p))
    if (selectedProspect?.id === prospectId) {
      setSelectedProspect(prev => ({ ...prev, status: newStatus }))
    }
    pop('Status updated')
  }

  const handleSaveNotes = async (prospectId, notes) => {
    await sb.from('prospects').update({ notes }).eq('id', prospectId)
    setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, notes } : p))
  }

  const handleKeepWorking = async (prospectId) => {
    await handleQuickLog(prospectId)
  }

  const handleGraduate = async (prospectId) => {
    const prospect = prospects.find(p => p.id === prospectId)
    if (!prospect) return
    
    // Graduate to next status
    const statusOrder = ['cold', 'warm', 'hot', 'offer_sent', 'closed']
    const currentIdx = statusOrder.indexOf(prospect.status)
    const nextStatus = statusOrder[Math.min(currentIdx + 1, statusOrder.length - 1)]
    
    await handleUpdateStatus(prospectId, nextStatus)
  }

  const handleArchive = async (prospectId) => {
    await handleUpdateStatus(prospectId, 'archived')
  }

  const handleGenerateOpener = async ({ name, handle, contextNote, status }) => {
    const res = await fetch('/api/first-touch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uid,
        prospectName: name,
        handle,
        intel: { contextNote },
        channel: status === 'cold' ? 3 : status === 'warm' ? 2 : 5,
      }),
    })
    
    if (!res.ok) throw new Error('Failed to generate')
    const data = await res.json()
    return data.script
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

    if (!res.ok) throw new Error('Failed to generate')
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
    return data.suggestion || data.script || 'I can help you with scripts, objection handling, and outreach strategy. What would you like to know?'
  }

  // ─── AUTH UI ────────────────────────────────────────────────
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

  // ─── MAIN RENDER ────────────────────────────────────────────
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
          onKeepWorking={handleKeepWorking}
          onGraduate={handleGraduate}
          onArchive={handleArchive}
        />
      )}

      {page === 'pipeline' && (
        <PipelinePage
          prospects={prospects}
          touches={touches}
          onOpenProspect={setSelectedProspect}
          onUpdateStatus={handleUpdateStatus}
          viewMode={pipelineViewMode}
          setViewMode={setPipelineViewMode}
          showArchived={showArchived}
          setShowArchived={setShowArchived}
          filters={filters}
          setFilters={setFilters}
        />
      )}

      {page === 'guide' && (
        <GuidePage onAskCoach={handleAskCoach} />
      )}

      {/* Add Modal */}
      <AddProspectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddProspect}
        onGenerateOpener={handleGenerateOpener}
      />

      {/* Side Panel */}
      <ProspectPanel
        prospect={selectedProspect}
        touches={touches}
        onClose={() => setSelectedProspect(null)}
        onLogTouch={handleLogTouch}
        onUpdateStatus={handleUpdateStatus}
        onSaveNotes={handleSaveNotes}
        onGenerateScript={handleGenerateScript}
      />

      {/* Toast */}
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
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `1px solid ${C.gray200}`,
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.gray600, marginBottom: 4 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `1px solid ${C.gray200}`,
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: 12, background: '#FEE2E2', borderRadius: 8, color: '#DC2626', fontSize: 13 }}>
              {error}
            </div>
          )}

          <PrimaryButton
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', marginBottom: 16 }}
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </PrimaryButton>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              color: C.gold,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </form>
      </div>
    </div>
  )
}
