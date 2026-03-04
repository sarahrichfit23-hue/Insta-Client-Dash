'use client'
import { useState, useEffect, useCallback } from 'react'

// ─── BRAND COLORS ─────────────────────────────────────────────
const C = {
  gold:'#F6BD60', goldDim:'#e0a94e', black:'#1E1E1E', dark:'#2a2a2a',
  card:'#2a2a2a', cardInner:'#ffffff', border:'#3a3a3a',
  muted:'#888888', dim:'#aaaaaa', text:'#1a1a1a', white:'#ffffff',
  red:'#C0392B', orange:'#D68910', blue:'#2471A3', green:'#1E8449', purple:'#7D3C98',
}

const CHANNELS = [
  { id:1, key:'CH1', name:'New Arrivals', color:C.blue },
  { id:2, key:'CH2', name:'Warm Convos', color:C.orange },
  { id:3, key:'CH3', name:'Cold Outreach', color:C.purple },
  { id:4, key:'CH4', name:'Nurture', color:C.green },
  { id:5, key:'CH5', name:'Hot Leads', color:C.red },
]

const INTENT = [
  { id:'hot', emoji:'🔥', label:'Hot', color:C.red },
  { id:'warm', emoji:'⚡', label:'Warm', color:C.orange },
  { id:'cold', emoji:'❄️', label:'Cold', color:C.blue },
]

const CHANNEL_ACTIONS = {
  1: "Your move: Send welcome DM within 24–48hrs of their follow. Reference something specific from their profile above. Goal is one reply — nothing more.",
  2: "Your move: Add value. Reference something they said last time. Ask one question that goes one level deeper. Do not mention your offer yet.",
  3: "Your move: This person needs CH4 engagement first. Like 2–3 posts, leave one genuine comment, react to a story. Come back in 3–5 days for the Curiosity Opener.",
  4: "Your move: Engage their content today — like, comment, react. No DM yet. After 3–5 touches move them to CH3 and send your Curiosity Opener.",
  5: "Your move: Diagnose → position → soft offer. Use their exact words from your notes. Reference their stated problem. Make the offer feel like the obvious next step.",
}

const ARCHIVE_REASONS = [
  { id: 'not_fit', label: 'Not a fit' },
  { id: 'bad_timing', label: 'Bad timing — follow up later' },
  { id: 'no_response', label: 'No response after multiple touches' },
  { id: 'other', label: 'Other' },
]

export default function ProspectDrawer({ 
  prospect, 
  touches = [],
  onClose, 
  onMoveChannel, 
  onLogTouch,
  onUpdateProspect,
  onOpenAI,
  onWon,
  onArchive,
  userId,
  sb,
  dailyMetrics,
  onUpdateMetrics
}) {
  const [tab, setTab] = useState('intel')
  const [notes, setNotes] = useState([])
  const [intel, setIntel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [markAsDm, setMarkAsDm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(null)
  const [showChannelPicker, setShowChannelPicker] = useState(false)
  const [showArchiveOptions, setShowArchiveOptions] = useState(false)
  const [wonCelebration, setWonCelebration] = useState(false)
  const [archiveConfirm, setArchiveConfirm] = useState(null)

  const p = prospect
  const ch = CHANNELS.find(c => c.id === p?.channel) || CHANNELS[0]
  const intentCfg = INTENT.find(i => i.id === p?.intent)

  // Fetch notes and intel
  const fetchData = useCallback(async () => {
    if (!p?.id || !sb) return
    setLoading(true)
    try {
      const [notesRes, intelRes] = await Promise.all([
        sb.from('prospect_notes').select('*').eq('prospect_id', p.id).order('created_at', { ascending: false }),
        sb.from('prospect_intel').select('*').eq('prospect_id', p.id).single()
      ])
      setNotes(notesRes.data || [])
      setIntel(intelRes.data || { where_found: p.source || '', bio_notes: '', content_themes: '', pain_signals: '', fit_score: null })
    } catch (err) {
      console.error('[v0] Error fetching drawer data:', err)
    } finally {
      setLoading(false)
    }
  }, [p?.id, sb, p?.source])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Save intel field
  const saveIntel = async (field, value) => {
    if (!sb || !p?.id) return
    setSaving(true)
    const payload = { [field]: value, prospect_id: p.id, user_id: userId }
    
    if (intel?.id) {
      await sb.from('prospect_intel').update({ [field]: value }).eq('id', intel.id)
    } else {
      const { data } = await sb.from('prospect_intel').insert(payload).select().single()
      setIntel(data)
    }
    setIntel(prev => ({ ...prev, [field]: value }))
    showSaved()
    setSaving(false)
  }

  const showSaved = () => {
    setSavedMsg('Saved ✓')
    setTimeout(() => setSavedMsg(null), 1500)
  }

  // Add note
  const addNote = async (type, incrementTouch = false) => {
    if (!noteText.trim() || !sb) return
    setSaving(true)
    
    const { data: newNote } = await sb.from('prospect_notes').insert({
      prospect_id: p.id,
      user_id: userId,
      note_text: noteText.trim(),
      note_type: type,
      channel_at_time: p.channel
    }).select().single()
    
    if (newNote) {
      setNotes(prev => [newNote, ...prev])
    }
    
    // Increment touch if logging a touch
    if (incrementTouch) {
      onLogTouch?.(p.id, noteText.trim(), type)
    }
    
    // Update daily DM counter if checked
    if (markAsDm && onUpdateMetrics && dailyMetrics) {
      onUpdateMetrics({ ...dailyMetrics, dms: (dailyMetrics.dms || 0) + 1 })
    }
    
    setNoteText('')
    setMarkAsDm(false)
    showSaved()
    setSaving(false)
  }

  // Quick touch (no note)
  const quickTouch = async () => {
    setSaving(true)
    await onLogTouch?.(p.id, 'Quick touch logged', 'conversation')
    await sb?.from('prospects').update({ last_contacted_at: new Date().toISOString() }).eq('id', p.id)
    showSaved()
    setSaving(false)
  }

  // Move channel with auto-logging
  const handleMoveChannel = async (newChannel) => {
    if (newChannel === p.channel) return
    const oldChannel = p.channel
    
    // Log the channel move
    await sb?.from('prospect_notes').insert({
      prospect_id: p.id,
      user_id: userId,
      note_text: `Moved from CH${oldChannel} to CH${newChannel}`,
      note_type: 'channel_move',
      channel_at_time: newChannel
    })
    
    onMoveChannel?.(p.id, newChannel)
    setShowChannelPicker(false)
    fetchData() // Refresh notes
  }

  // Mark as won
  const handleWon = async () => {
    setWonCelebration(true)
    await onWon?.(p.id)
    
    // Increment sales counter
    if (onUpdateMetrics && dailyMetrics) {
      onUpdateMetrics({ ...dailyMetrics, sales: (dailyMetrics.sales || 0) + 1 })
    }
    
    setTimeout(() => {
      onClose?.()
    }, 3000)
  }

  // Archive
  const handleArchive = async (reason) => {
    await onArchive?.(p.id, reason)
    setArchiveConfirm(reason)
    setTimeout(() => {
      onClose?.()
    }, 2000)
  }

  // Get AI scripts from notes
  const aiScripts = notes.filter(n => n.note_type === 'ai_generated')
  
  // Get conversation notes for AI pre-fill
  const conversationNotes = notes.filter(n => n.note_type === 'conversation').slice(0, 3)

  // Calculate stats
  const touchCount = touches.length
  const lastTouch = touches.length > 0 ? touches[touches.length - 1] : null
  const daysSinceContact = lastTouch ? Math.floor((Date.now() - new Date(lastTouch.touch_date).getTime()) / (1000 * 60 * 60 * 24)) : null
  const addedDate = p?.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null

  if (!p) return null

  // Won celebration state
  if (wonCelebration) {
    return (
      <>
        <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.2)',zIndex:900,transition:'opacity .2s'}} />
        <div style={{position:'fixed',top:0,right:0,bottom:0,width:'100%',maxWidth:420,background:C.dark,zIndex:901,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32}}>
          <div style={{fontSize:64,marginBottom:16}}>🎉</div>
          <div style={{fontFamily:'Oswald,sans-serif',fontSize:24,color:C.gold,fontWeight:700,textAlign:'center',marginBottom:8}}>{p.name} is now a client.</div>
          <div style={{color:C.muted,fontSize:15,textAlign:'center'}}>Go do great work for them.</div>
        </div>
      </>
    )
  }

  // Archive confirmation
  if (archiveConfirm) {
    return (
      <>
        <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.2)',zIndex:900}} />
        <div style={{position:'fixed',top:0,right:0,bottom:0,width:'100%',maxWidth:420,background:C.dark,zIndex:901,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32}}>
          <div style={{color:C.muted,fontSize:15,textAlign:'center'}}>{p.name} archived. You can find them in your archived list if timing changes later.</div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose} 
        style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.2)',zIndex:900,transition:'opacity .2s'}} 
      />
      
      {/* Drawer */}
      <div style={{
        position:'fixed',top:0,right:0,bottom:0,width:'100%',maxWidth:420,
        background:C.dark,zIndex:901,display:'flex',flexDirection:'column',
        animation:'slideInRight .2s ease',boxShadow:'-4px 0 24px rgba(0,0,0,0.3)'
      }}>
        
        {/* HEADER - Fixed */}
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:22,color:C.white,fontWeight:700}}>{p.name}</div>
                {p.handle && (
                  <a href={`https://instagram.com/${p.handle.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{color:C.muted,fontSize:14}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
              </div>
              {p.handle && <div style={{color:C.muted,fontSize:14}}>{p.handle}</div>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{background:ch.color+'22',color:ch.color,padding:'4px 10px',borderRadius:6,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif'}}>{ch.key}</span>
              {intentCfg && <span title={intentCfg.label} style={{fontSize:18}}>{intentCfg.emoji}</span>}
              <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,fontSize:22,cursor:'pointer',padding:4}}>×</button>
            </div>
          </div>
          {/* Stats bar */}
          <div style={{color:C.dim,fontSize:12}}>
            {touchCount} touches · {daysSinceContact !== null ? (daysSinceContact === 0 ? 'Contacted today' : `Last contacted ${daysSinceContact}d ago`) : 'Not yet contacted'} · Added {addedDate || 'recently'}
          </div>
        </div>

        {/* TABS */}
        <div style={{display:'flex',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          {['intel','activity'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1,padding:'12px 16px',background:'none',border:'none',
              color:tab===t?C.gold:C.muted,fontSize:14,fontWeight:600,fontFamily:'Oswald,sans-serif',
              textTransform:'uppercase',letterSpacing:'.5px',cursor:'pointer',
              borderBottom:tab===t?`2px solid ${C.gold}`:'2px solid transparent',
              marginBottom:-1
            }}>{t}</button>
          ))}
        </div>

        {/* TAB CONTENT - Scrollable */}
        <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
          {loading ? (
            <div style={{color:C.muted,textAlign:'center',padding:32}}>Loading...</div>
          ) : tab === 'intel' ? (
            <>
              {/* Profile Intel */}
              <div style={{marginBottom:20}}>
                <div style={{color:C.gold,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>Profile Intel</div>
                <div style={{background:'#242424',borderRadius:10,padding:14}}>
                  {[
                    { key: 'where_found', label: 'Where found', placeholder: '+ Add where you found them' },
                    { key: 'content_themes', label: 'What they post about', placeholder: '+ Add content themes' },
                    { key: 'bio_notes', label: 'Bio keywords / notes', placeholder: '+ Add bio notes' },
                    { key: 'pain_signals', label: 'Pain signals observed', placeholder: '+ Add pain signals' },
                  ].map(field => (
                    <div key={field.key} style={{marginBottom:12}}>
                      <div style={{color:C.dim,fontSize:11,marginBottom:4}}>{field.label}</div>
                      <input
                        value={intel?.[field.key] || ''}
                        onChange={e => setIntel(prev => ({ ...prev, [field.key]: e.target.value }))}
                        onBlur={e => saveIntel(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        style={{width:'100%',background:'transparent',border:'none',color:intel?.[field.key]?C.white:C.dim,fontSize:14,outline:'none',padding:'4px 0'}}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Scripts */}
              <div style={{marginBottom:20}}>
                <div style={{color:C.gold,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>Previously Generated AI Scripts</div>
                {aiScripts.length === 0 ? (
                  <div style={{color:C.dim,fontSize:13,fontStyle:'italic',padding:'8px 0'}}>
                    No AI scripts generated for this prospect yet. Use {"'"}Ask Coach Sarah AI{"'"} below when you{"'"}re ready.
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {aiScripts.map(script => {
                      const scriptCh = CHANNELS.find(c => c.id === script.channel_at_time)
                      return (
                        <div key={script.id} style={{background:'#242424',borderRadius:8,padding:12}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              {scriptCh && <span style={{background:scriptCh.color+'22',color:scriptCh.color,padding:'2px 6px',borderRadius:4,fontSize:10,fontWeight:700}}>{scriptCh.key}</span>}
                              <span style={{color:C.dim,fontSize:11}}>{new Date(script.created_at).toLocaleDateString()}</span>
                            </div>
                            <button onClick={() => {navigator.clipboard.writeText(script.note_text)}} style={{background:C.gold,color:C.black,border:'none',padding:'4px 8px',borderRadius:4,fontSize:11,fontWeight:600,cursor:'pointer'}}>Copy</button>
                          </div>
                          <div style={{color:C.gold,fontSize:13,lineHeight:1.5,maxHeight:100,overflowY:'auto'}}>{script.note_text}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Next Recommended Action */}
              <div>
                <div style={{color:C.gold,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>Next Recommended Action</div>
                <div style={{background:'#242424',borderLeft:`3px solid ${C.gold}`,borderRadius:'0 8px 8px 0',padding:14}}>
                  <div style={{color:C.white,fontSize:14,lineHeight:1.6}}>{CHANNEL_ACTIONS[p.channel]}</div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Quick Note Entry */}
              <div style={{marginBottom:20}}>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="What just happened? What did they say? What did you send? Log it here."
                  style={{width:'100%',background:'#242424',border:'none',color:C.white,padding:12,borderRadius:8,fontSize:14,resize:'none',minHeight:80,outline:'none',lineHeight:1.5}}
                />
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <button 
                    onClick={() => addNote('conversation', true)} 
                    disabled={!noteText.trim() || saving}
                    style={{flex:1,background:C.gold,color:C.black,border:'none',padding:'10px 14px',borderRadius:8,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',cursor:noteText.trim()?'pointer':'not-allowed',opacity:noteText.trim()?1:0.5}}
                  >+ Log Touch</button>
                  <button 
                    onClick={() => addNote('observation', false)} 
                    disabled={!noteText.trim() || saving}
                    style={{flex:1,background:'transparent',color:C.white,border:`1px solid ${C.border}`,padding:'10px 14px',borderRadius:8,fontSize:13,fontWeight:600,cursor:noteText.trim()?'pointer':'not-allowed',opacity:noteText.trim()?1:0.5}}
                  >Save Note</button>
                </div>
                <label style={{display:'flex',alignItems:'center',gap:8,marginTop:10,color:C.dim,fontSize:12,cursor:'pointer'}}>
                  <input type="checkbox" checked={markAsDm} onChange={e => setMarkAsDm(e.target.checked)} style={{accentColor:C.gold}} />
                  {"Mark as today's DM"}
                </label>
              </div>

              {/* Activity Feed */}
              <div style={{color:C.gold,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>Activity</div>
              {notes.length === 0 ? (
                <div style={{color:C.dim,fontSize:13,fontStyle:'italic',lineHeight:1.6,padding:'8px 0'}}>
                  Nothing logged yet. After your first touch with {p.name}, come back and log what happened. The more you track, the better your AI suggestions get.
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {notes.map((note, idx) => {
                    const noteCh = CHANNELS.find(c => c.id === note.channel_at_time)
                    const isConvo = note.note_type === 'conversation'
                    const isObservation = note.note_type === 'observation'
                    const isAI = note.note_type === 'ai_generated'
                    const isMove = note.note_type === 'channel_move' || note.note_type === 'system'
                    
                    // Count conversation touches
                    const touchNum = isConvo ? notes.filter((n, i) => n.note_type === 'conversation' && i >= idx).length : null
                    
                    return (
                      <div key={note.id} style={{
                        background: isMove ? 'transparent' : '#242424',
                        borderRadius: isMove ? 0 : 8,
                        padding: isMove ? '4px 0' : 12,
                        borderLeft: isMove ? 'none' : isAI ? `2px solid ${C.gold}` : 'none'
                      }}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:isMove?0:4}}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            {isObservation && <span style={{fontSize:12}}>👁</span>}
                            {isAI && <span style={{color:C.gold,fontSize:11,fontWeight:600}}>✦ AI Script</span>}
                            {isMove && <span style={{color:C.dim,fontSize:12}}>→</span>}
                            {isConvo && noteCh && <span style={{background:noteCh.color+'22',color:noteCh.color,padding:'2px 6px',borderRadius:4,fontSize:10,fontWeight:700}}>{noteCh.key}</span>}
                            {isConvo && touchNum && <span style={{color:C.muted,fontSize:11}}>Touch #{touchNum}</span>}
                          </div>
                          <span style={{color:C.dim,fontSize:11}}>{new Date(note.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric' })}</span>
                        </div>
                        <div style={{
                          color: isAI ? C.gold : isObservation ? C.muted : isMove ? C.dim : C.white,
                          fontSize: isMove ? 12 : 13,
                          fontStyle: isMove ? 'italic' : 'normal',
                          lineHeight: 1.5
                        }}>{note.note_text}</div>
                        {isAI && (
                          <button onClick={() => navigator.clipboard.writeText(note.note_text)} style={{marginTop:8,background:C.gold,color:C.black,border:'none',padding:'4px 10px',borderRadius:4,fontSize:11,fontWeight:600,cursor:'pointer'}}>Copy</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Saved indicator */}
        {savedMsg && (
          <div style={{position:'absolute',top:80,right:20,background:'#333',color:C.dim,padding:'6px 12px',borderRadius:6,fontSize:12}}>{savedMsg}</div>
        )}

        {/* BOTTOM ACTION BAR */}
        <div style={{padding:'12px 20px',borderTop:`1px solid ${C.border}`,flexShrink:0}}>
          <div style={{color:C.dim,fontSize:11,fontStyle:'italic',marginBottom:10,textAlign:'center'}}>
            Stuck on what to say next? The AI is here — but your instincts are faster.
          </div>
          <div style={{display:'flex',gap:8}}>
            {/* Move Channel */}
            <div style={{position:'relative'}}>
              <button onClick={() => setShowChannelPicker(!showChannelPicker)} style={{background:'#242424',color:C.white,border:'none',padding:'10px 12px',borderRadius:8,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                <span>↔</span> Move
              </button>
              {showChannelPicker && (
                <div style={{position:'absolute',bottom:'100%',left:0,background:'#2a2a2a',borderRadius:8,padding:8,marginBottom:4,boxShadow:'0 4px 16px rgba(0,0,0,0.3)',display:'flex',gap:4}}>
                  {CHANNELS.map(c => (
                    <button key={c.id} onClick={() => handleMoveChannel(c.id)} style={{
                      background: p.channel === c.id ? c.color : '#3a3a3a',
                      color: p.channel === c.id ? '#fff' : C.muted,
                      border:'none',padding:'6px 10px',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer'
                    }}>{c.key}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Touch */}
            <button onClick={quickTouch} disabled={saving} style={{background:'#242424',color:C.white,border:'none',padding:'10px 12px',borderRadius:8,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
              <span>+1</span> Touch
            </button>

            {/* AI */}
            <button onClick={() => onOpenAI?.(p.id, p.channel, conversationNotes.map(n => n.note_text).join('\n\n'))} style={{background:'#242424',color:C.white,border:'none',padding:'10px 12px',borderRadius:8,fontSize:12,cursor:'pointer',flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
              <span>✦</span> Ask Coach Sarah AI
            </button>

            {/* Won / Archive */}
            <div style={{position:'relative'}}>
              <button onClick={() => setShowArchiveOptions(!showArchiveOptions)} style={{background:'#242424',color:C.white,border:'none',padding:'10px 12px',borderRadius:8,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                <span>✓</span>
              </button>
              {showArchiveOptions && (
                <div style={{position:'absolute',bottom:'100%',right:0,background:'#2a2a2a',borderRadius:8,padding:8,marginBottom:4,boxShadow:'0 4px 16px rgba(0,0,0,0.3)',minWidth:180}}>
                  <button onClick={handleWon} style={{display:'block',width:'100%',background:C.green+'22',color:C.green,border:'none',padding:'10px 12px',borderRadius:6,fontSize:13,fontWeight:600,cursor:'pointer',marginBottom:6,textAlign:'left'}}>Mark as Won 🎉</button>
                  <div style={{color:C.dim,fontSize:11,marginBottom:6,paddingLeft:4}}>Archive as:</div>
                  {ARCHIVE_REASONS.map(r => (
                    <button key={r.id} onClick={() => handleArchive(r.id)} style={{display:'block',width:'100%',background:'transparent',color:C.muted,border:'none',padding:'8px 12px',borderRadius:4,fontSize:12,cursor:'pointer',textAlign:'left'}}>{r.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
