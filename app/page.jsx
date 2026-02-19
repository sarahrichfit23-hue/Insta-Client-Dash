'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

// ─── BRAND ────────────────────────────────────────────────────
const C = {
  gold:'#C9A84C', goldDim:'#6b4f1a', black:'#0A0A0A', dark:'#111111',
  char:'#171717', mid:'#1E1E1E', light:'#252525', border:'#2E2E2E',
  muted:'#555555', dim:'#888888', text:'#CCCCCC', white:'#F0EDE6',
  red:'#C0392B', orange:'#D68910', blue:'#2471A3', green:'#1E8449', purple:'#7D3C98',
}

// ─── CHANNELS ─────────────────────────────────────────────────
const CHANNELS = [
  {
    id:1, key:'CH1', name:'New Arrivals', color:C.blue, colorDim:'#1a3d5c',
    tagline:'Open conversation within 48hrs', daily:'10–20 touches/day',
    touchTypes:['Welcome DM sent','Followed back','Liked recent posts','Profile noted'],
    script:`WELCOME DM (send within 24–48 hrs of their follow)

"Hey [Name]! Thanks for the follow — just checked out your page and love [SPECIFIC OBSERVATION].

Quick question — what brought you over to my corner of Instagram?"

━━━━━━━━━━━━━━━━━━━━━━
⚡ Always include ONE specific detail.
Generic = ignored. Specific = conversation.
━━━━━━━━━━━━━━━━━━━━━━
GOAL: Get a reply. That's it.
Once they reply → move to CH2.`,
  },
  {
    id:2, key:'CH2', name:'Warm Conversations', color:C.orange, colorDim:'#5a3a05',
    tagline:'Add value, build trust, open the sales window', daily:'20–30 touches/day',
    touchTypes:['Value-add message','Lead magnet offered','Lead magnet sent','Resource shared','Story reaction','Comment left','Sales window opened'],
    script:`VALUE-ADD MESSAGE
"Hey — saw this and thought of what you shared about [their struggle]. Thought it might be useful: [tip or resource]. How's it going with [their goal] this week?"

━━━━━━━━━━━━━━━━━━━━━━
LEAD MAGNET OFFER (after 2–3 exchanges)
"Do you have [topic] figured out? Given what you're working on, I think [LEAD MAGNET] would be genuinely useful. Want me to send it over?"
━━━━━━━━━━━━━━━━━━━━━━

WHEN THEY ASK "WHAT DO YOU DO?" — SALES WINDOW IS OPEN
"I work with [avatar] who are dealing with [struggle] to help them [result] in [timeframe]. Is that kind of where you are right now?"

→ Don't give pricing yet
→ Describe who you help + result
→ Check fit → confirmed fit → move to CH5`,
  },
  {
    id:3, key:'CH3', name:'Cold Activation', color:C.purple, colorDim:'#3d1a5c',
    tagline:'Send opening DM — goal is one reply', daily:'30–40 DMs/day',
    touchTypes:['Method 1 DM sent','Method 2 DM sent','Method 3 DM sent','Method 4 DM sent'],
    script:`METHOD 1 — Proof-First / Founding Member
"Hey [Name] — I'm building a [program type] and looking for 10 founding members. Founding members get [specific benefit]. In exchange, I get real feedback. Open to hearing more?"

━━━━━━━━━━━━━━━━━━━━━━

METHOD 2 — The Advice Ask
"Can I ask for your advice? I'm creating content to help [their identity] with [goal]. When it comes to [result], what's your biggest challenge?"

━━━━━━━━━━━━━━━━━━━━━━

METHOD 3 — Curiosity Opener
"Hey [Name] — came across your page and loved [SPECIFIC THING]. I work with [avatar] to help them [result]. Is that something you're actively working on?"

━━━━━━━━━━━━━━━━━━━━━━

METHOD 4 — Authority Reversal™
"Hey [Name] — been following your content and what you're doing with [specific thing] is genuinely impressive. Mostly curious — what's been your biggest challenge lately with [their topic]?"

━━━━━━━━━━━━━━━━━━━━━━
⚡ ALL METHODS: Personalize with ONE detail.
Reply received → move to CH2.`,
  },
  {
    id:4, key:'CH4', name:'Warm-Up Engagement', color:C.green, colorDim:'#0d3d1f',
    tagline:'Get on radar before the DM', daily:'15–25 profiles/day',
    touchTypes:['Liked 2–3 posts','Left genuine comment','Reacted to story','Followed','Saved for CH3 DM'],
    script:`NO DM YET — engagement only for 2–3 days first.

DAY 1–2:
→ Like 2–3 of their recent posts
→ Leave ONE genuine comment (specific, not "great post!")

DAY 2–3:
→ React to stories if they post them
→ Note what they post about for your opener

DAY 3–5:
→ Send your CH3 DM
→ It lands WARM because they recognize your name

━━━━━━━━━━━━━━━━━━━━━━
💡 Familiarity before outreach.
Not a stranger — a familiar face.
That's the difference between 5% and 30% reply rates.
━━━━━━━━━━━━━━━━━━━━━━
Ready to DM → move to CH3.`,
  },
  {
    id:5, key:'CH5', name:'Conversion Touches', color:C.red, colorDim:'#5c1a1a',
    tagline:'Diagnose → position → offer → close', daily:'5–10 touches — highest value',
    touchTypes:['Soft position sent','Soft offer sent','Objection handled','Payment plan offered','Discovery call booked','Sale closed — Tier 1','Sale closed — Tier 2','Sale closed — Tier 3','Follow-up touch 1','Follow-up touch 2','Follow-up touch 3 (final)'],
    script:`SOFT OFFER
"Based on everything you've shared about [their situation], I genuinely think [program] would be a strong fit. It's built for [avatar] dealing with exactly what you described. Here's how it works: [one sentence]. Want me to walk you through the details?"

━━━━━━━━━━━━━━━━━━━━━━

IF YES — TIER 2 (low ticket)
"[PROGRAM] is [PRICE] and includes: [1], [2], [3]. Most people see [result] within [timeframe]. Link: [LINK]"

IF YES — TIER 3 (discovery call)
"Best next step is a quick call so I can make sure it's the right fit. Calendar: [LINK]"

━━━━━━━━━━━━━━━━━━━━━━

3-TOUCH FOLLOW-UP (if they go quiet)
Touch 1 (3–5 days): "Just circling back. Totally fine if timing is off."
Touch 2 (5–7 days): "Quick check-in — still thinking about this?"
Touch 3 — FINAL: "Closing the loop for now. Door's open whenever."

━━━━━━━━━━━━━━━━━━━━━━
🔑 Closing is clarity, not pressure.`,
  },
]

const INTENT = [
  {id:'raised',  label:'Raised Hand',    emoji:'🔥', color:C.red},
  {id:'active',  label:'Active Struggle', emoji:'⚡', color:C.orange},
  {id:'passive', label:'Passive Warm',   emoji:'❄️',  color:C.blue},
]

const todayStr = () => new Date().toISOString().split('T')[0]
const fmtDate  = (d) => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'})

// ─── ROOT ─────────────────────────────────────────────────────
export default function App() {
  const [sb]      = useState(() => createClient())
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    sb.auth.getSession().then(({data:{session}}) => setSession(session))
    const {data:{subscription}} = sb.auth.onAuthStateChange((_,s) => {
      setSession(s)
      if (!s) setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [sb])

  useEffect(() => {
    if (!session) return
    sb.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({data}) => setProfile(data))
  }, [session, sb])

  if (session === undefined) return <Splash>Loading…</Splash>
  if (!session) return <LoginScreen sb={sb} />
  if (!profile) return <Splash>Loading profile…</Splash>
  if (profile.is_admin) return <AdminView sb={sb} profile={profile} />
  return <PipelineApp sb={sb} profile={profile} />
}

// ─── LOGIN ────────────────────────────────────────────────────
function LoginScreen({sb}) {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [err,   setErr]   = useState('')
  const [busy,  setBusy]  = useState(false)

  const login = async () => {
    setErr(''); setBusy(true)
    console.log('[v0] Attempting login with email:', email)
    const {data, error} = await sb.auth.signInWithPassword({email, password: pass})
    console.log('[v0] Login response:', {data, error})
    setBusy(false)
    if (error) {
      console.log('[v0] Login error:', error)
      setErr(error.message)
    }
  }

  return (
    <div style={{minHeight:'100vh',background:C.black,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:'Inter,sans-serif'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{width:'100%',maxWidth:380}}>
        <div style={{textAlign:'center',marginBottom:36}}>
 <img src="/images/nlh-logo.png" alt="NextLevel Healthpreneur" style={{width:140,height:140,marginBottom:14}} />
 <div style={{fontFamily:'Oswald,sans-serif',fontSize:30,fontWeight:700,color:C.gold,letterSpacing:'-.5px',textTransform:'uppercase'}}>Insta Client Engine</div>
 <div style={{color:C.muted,fontSize:13,marginTop:5}}>Powered by NextLevel Healthpreneur</div>
        </div>
        <div style={{background:C.char,border:`1px solid ${C.border}`,borderRadius:14,padding:26}}>
          <div style={{fontFamily:'Oswald,sans-serif',fontSize:17,fontWeight:700,color:C.white,marginBottom:18}}>Sign In</div>
          {[
            {label:'Email',val:email,set:setEmail,type:'email',ph:'you@example.com'},
            {label:'Password',val:pass,set:setPass,type:'password',ph:'••••••••'},
          ].map(f=>(
            <div key={f.label} style={{marginBottom:12}}>
              <div style={{color:C.muted,fontSize:9,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:5,fontFamily:'Oswald,sans-serif',fontWeight:700}}>{f.label}</div>
              <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder={f.ph} style={{width:'100%',background:C.mid,border:`1px solid ${C.border}`,color:C.white,padding:'9px 11px',borderRadius:7,fontSize:13,outline:'none'}}/>
            </div>
          ))}
          {err && <div style={{color:C.red,fontSize:11,marginBottom:12,padding:'7px 10px',background:C.red+'11',borderRadius:6}}>{err}</div>}
          <button onClick={login} disabled={busy} style={{width:'100%',background:busy?C.muted:C.gold,color:C.black,padding:'10px',borderRadius:7,fontSize:13,fontWeight:700,cursor:busy?'not-allowed':'pointer',fontFamily:'Oswald,sans-serif',border:'none',marginTop:4}}>
            {busy?'Signing in…':'Sign In →'}
          </button>
          <div style={{color:C.muted,fontSize:10,textAlign:'center',marginTop:12,lineHeight:1.5}}>Access is by invitation only.<br/>Contact your coach if you need credentials.</div>
        </div>
      </div>
    </div>
  )
}

// ─── ADMIN VIEW ───────────────────────────────────────────────
function AdminView({sb, profile}) {
  const [students,  setStudents]  = useState([])
  const [prospects, setProspects] = useState([])
  const [metrics,   setMetrics]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [addOpen,   setAddOpen]   = useState(false)
  const [toast,     setToast]     = useState(null)

  const pop = (msg) => { setToast(msg); setTimeout(()=>setToast(null),2500) }

  const load = useCallback(async () => {
    setLoading(true)
    const since = new Date(Date.now()-7*864e5).toISOString().split('T')[0]
    const [{data:profs},{data:pros},{data:mets}] = await Promise.all([
      sb.from('profiles').select('*').eq('is_admin',false).order('created_at'),
      sb.from('prospects').select('*'),
      sb.from('daily_metrics').select('*').gte('metric_date',since),
    ])
    setStudents(profs||[])
    setProspects(pros||[])
    setMetrics(mets||[])
    setLoading(false)
  },[sb])

  useEffect(()=>{load()},[load])

  const inviteStudent = async ({email,fullName,cohort,password}) => {
    const {error} = await sb.auth.signUp({email, password, options:{data:{full_name:fullName}}})
    if (error) { pop('Error: '+error.message); return }
    setTimeout(async()=>{
      await sb.from('profiles').update({full_name:fullName,cohort:cohort||null}).eq('email',email)
      pop(`${fullName} invited! They can now log in.`)
      setAddOpen(false)
      setTimeout(load,1200)
    },1500)
  }

  const chCounts = (uid) => CHANNELS.reduce((a,ch)=>({...a,[ch.id]:prospects.filter(p=>p.user_id===uid&&p.channel===ch.id).length}),{})

  const todayM = (uid) => metrics.find(m=>m.user_id===uid&&m.metric_date===todayStr())||{dms:0,replies:0,emails:0,offers:0,sales:0}

  const weekM = (uid) => metrics.filter(m=>m.user_id===uid).reduce((a,m)=>({
    dms:a.dms+(m.dms||0),replies:a.replies+(m.replies||0),
    emails:a.emails+(m.emails||0),offers:a.offers+(m.offers||0),sales:a.sales+(m.sales||0)
  }),{dms:0,replies:0,emails:0,offers:0,sales:0})

  const sel = selected ? students.find(s=>s.id===selected) : null

  return (
    <div style={{minHeight:'100vh',background:C.black}}>
      <GlobalStyles/>
      {toast && <Toast msg={toast}/>}
      {addOpen && <Overlay onClose={()=>setAddOpen(false)}><InviteForm onSubmit={inviteStudent} onCancel={()=>setAddOpen(false)}/></Overlay>}

      <header style={{background:C.dark,borderBottom:`1px solid ${C.border}`,padding:'0 20px',display:'flex',alignItems:'center',justifyContent:'space-between',height:56,position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {selected && <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:C.muted,fontSize:20,cursor:'pointer'}}>←</button>}
          <img src="/images/nlh-logo.png" alt="NextLevel Healthpreneur" style={{width:32,height:32}} />
          <span style={{fontFamily:'Oswald,sans-serif',color:C.gold,fontSize:18,fontWeight:700,textTransform:'uppercase'}}>Insta Client Engine</span>
          <span style={{background:C.gold,color:C.black,fontSize:11,fontWeight:800,padding:'2px 5px',borderRadius:3,fontFamily:'Oswald,sans-serif'}}>ADMIN</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setAddOpen(true)} style={{background:C.gold,color:C.black,padding:'8px 15px',borderRadius:6,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',border:'none',cursor:'pointer'}}>+ Invite Student</button>
          <button onClick={()=>sb.auth.signOut()} style={{background:'none',border:`1px solid ${C.border}`,color:C.muted,padding:'8px 13px',borderRadius:6,fontSize:13,cursor:'pointer'}}>Sign Out</button>
        </div>
      </header>

      <div style={{padding:'20px 20px 48px'}}>
        {loading ? <div style={{color:C.muted,fontSize:13,padding:40,textAlign:'center'}}>Loading…</div> :
        selected && sel ? (
          // Student detail
          <div className="fade">
            <div style={{marginBottom:18}}>
              <div style={{fontFamily:'Oswald,sans-serif',fontSize:20,color:C.white,fontWeight:700}}>{sel.full_name||sel.email}</div>
              <div style={{color:C.muted,fontSize:12}}>{sel.email}{sel.cohort?` · Cohort: ${sel.cohort}`:''}</div>
            </div>
            <SL>Pipeline</SL>
            <div style={{display:'flex',gap:9,marginBottom:18}}>
              {CHANNELS.map(ch=>(
                <div key={ch.id} style={{flex:1,background:C.char,border:`1px solid ${C.border}`,borderTop:`3px solid ${ch.color}`,borderRadius:'0 0 7px 7px',padding:'9px 6px',textAlign:'center'}}>
                  <div style={{color:ch.color,fontSize:11,fontWeight:800,fontFamily:'Oswald,sans-serif',marginBottom:3}}>{ch.key}</div>
                  <div style={{color:C.white,fontSize:24,fontWeight:700,fontFamily:'monospace'}}>{chCounts(sel.id)[ch.id]||0}</div>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
              <div><SL>Today</SL><MetricsRow m={todayM(sel.id)}/></div>
              <div><SL>This Week</SL><MetricsRow m={weekM(sel.id)}/></div>
            </div>
            <SL>All Prospects ({prospects.filter(p=>p.user_id===sel.id).length})</SL>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              {prospects.filter(p=>p.user_id===sel.id).sort((a,b)=>b.id-a.id).map(p=>{
                const ch=CHANNELS.find(c=>c.id===p.channel)
                const intent=INTENT.find(i=>i.id===p.intent)
                return (
                  <div key={p.id} style={{background:C.char,border:`1px solid ${C.border}`,borderRadius:7,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div><span style={{color:C.white,fontSize:15,fontWeight:600}}>{p.name}</span><span style={{color:C.muted,fontSize:13,marginLeft:8}}>{p.handle}</span></div>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      {intent&&<span style={{fontSize:14}}>{intent.emoji}</span>}
                      <span style={{background:ch?.color+'33',color:ch?.color,fontSize:11,fontWeight:700,padding:'2px 5px',borderRadius:3}}>{ch?.key}</span>
                      <span style={{color:C.muted,fontSize:11,fontFamily:'monospace'}}>{fmtDate(p.added_date||p.created_at)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          // Student list
          <div className="fade">
            <div style={{marginBottom:18}}>
              <div style={{fontFamily:'Oswald,sans-serif',fontSize:20,color:C.gold,fontWeight:700}}>Student Overview</div>
              <div style={{color:C.muted,fontSize:12}}>{students.length} students</div>
            </div>
            {students.length===0 && <div style={{color:C.muted,fontSize:13,padding:'32px 0',textAlign:'center'}}>No students yet. Invite your first student above.</div>}
            <div style={{display:'flex',flexDirection:'column',gap:9}}>
              {students.map(s=>{
                const counts=chCounts(s.id)
                const tm=todayM(s.id)
                const total=Object.values(counts).reduce((a,b)=>a+b,0)
                return (
                  <div key={s.id} onClick={()=>setSelected(s.id)} style={{background:C.char,border:`1px solid ${C.border}`,borderRadius:10,padding:'13px 15px',cursor:'pointer',transition:'border-color .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9}}>
                      <div>
                        <span style={{color:C.white,fontWeight:600,fontSize:16,fontFamily:'Oswald,sans-serif'}}>{s.full_name||s.email}</span>
                        {s.cohort&&<span style={{color:C.muted,fontSize:13,marginLeft:8}}>Cohort {s.cohort}</span>}
                      </div>
                      <div style={{display:'flex',gap:12,alignItems:'center'}}>
                        <span style={{color:C.muted,fontSize:13}}>{total} prospects</span>
                        <span style={{color:tm.dms>0?C.gold:C.muted,fontSize:13}}>Today: {tm.dms} DMs · {tm.sales} sales</span>
                        <span style={{color:C.gold,fontSize:16}}>→</span>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:5}}>
                      {CHANNELS.map(ch=>(
                        <div key={ch.id} style={{flex:1,textAlign:'center',background:C.mid,borderRadius:4,padding:'4px 0',borderTop:`2px solid ${ch.color}`}}>
                          <div style={{color:ch.color,fontSize:10,fontWeight:700,fontFamily:'Oswald,sans-serif'}}>{ch.key}</div>
                          <div style={{color:C.white,fontSize:16,fontWeight:700,fontFamily:'monospace'}}>{counts[ch.id]||0}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── STUDENT PIPELINE APP ─────────────────────────────────────
function PipelineApp({sb, profile}) {
  const [prospects, setProspects] = useState([])
  const [touches,   setTouches]   = useState([])
  const [metrics,   setMetrics]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [view,      setView]      = useState('pipeline')
  const [focusId,   setFocusId]   = useState(null)
  const [addOpen,   setAddOpen]   = useState(false)
  const [touchFor,  setTouchFor]  = useState(null)
  const [scriptCh,  setScriptCh]  = useState(null)
  const [filterCh,  setFilterCh]  = useState(null)
  const [filterInt, setFilterInt] = useState(null)
  const [q,         setQ]         = useState('')
  const [toast,     setToast]     = useState(null)
  const [confirmDel,setConfirmDel]= useState(null)
  const [saving,    setSaving]    = useState(false)

  const pop = (msg) => { setToast(msg); setTimeout(()=>setToast(null),2400) }
  const uid = profile.id

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [{data:pros},{data:tchs},{data:met}] = await Promise.all([
      sb.from('prospects').select('*').eq('user_id',uid).order('created_at'),
      sb.from('touches').select('*').eq('user_id',uid).order('touch_date'),
      sb.from('daily_metrics').select('*').eq('user_id',uid).eq('metric_date',todayStr()).single(),
    ])
    setProspects(pros||[])
    setTouches(tchs||[])
    setMetrics(met||{dms:0,replies:0,emails:0,offers:0,sales:0})
    setLoading(false)
  },[sb,uid])

  useEffect(()=>{loadAll()},[loadAll])

  const addProspect = async (f) => {
    setSaving(true)
    const {data,error} = await sb.from('prospects').insert({
      user_id:uid, name:f.name.trim(), handle:f.handle.trim(),
      source:f.source||'', notes:f.notes||'',
      channel:+f.channel||3, intent:f.intent||null, added_date:todayStr(),
    }).select().single()
    setSaving(false)
    if (error) { pop('Error: '+error.message); return }
    setProspects(p=>[...p,data])
    pop(`${f.name} added to ${CHANNELS.find(c=>c.id==(+f.channel||3))?.key}`)
    setAddOpen(false)
  }

  const moveProspect = async (id, ch) => {
    const prev = prospects.find(p=>p.id===id)
    if (!prev) return
    setProspects(ps=>ps.map(p=>p.id===id?{...p,channel:ch}:p))
    await sb.from('prospects').update({channel:ch}).eq('id',id)
    const touch = {prospect_id:id,user_id:uid,touch_type:`Moved ${CHANNELS.find(c=>c.id===prev.channel)?.key} → ${CHANNELS.find(c=>c.id===ch)?.key}`,touch_date:todayStr()}
    const {data:td} = await sb.from('touches').insert(touch).select().single()
    if (td) setTouches(ts=>[...ts,td])
    pop(`→ ${CHANNELS.find(c=>c.id===ch)?.key}`)
  }

  const setIntent = async (id, intent) => {
    setProspects(ps=>ps.map(p=>p.id===id?{...p,intent}:p))
    await sb.from('prospects').update({intent}).eq('id',id)
  }

  const patchProspect = async (id, fields) => {
    setProspects(ps=>ps.map(p=>p.id===id?{...p,...fields}:p))
    await sb.from('prospects').update(fields).eq('id',id)
  }

  const logTouch = async (id, type, note) => {
    const touch = {prospect_id:id,user_id:uid,touch_type:type,note:note||'',touch_date:todayStr()}
    const {data,error} = await sb.from('touches').insert(touch).select().single()
    if (error) { pop('Error saving touch'); return }
    setTouches(ts=>[...ts,data])
    pop('Touch logged ✓')
    setTouchFor(null)
  }

  const deleteProspect = async (id) => {
    const name = prospects.find(p=>p.id===id)?.name
    await sb.from('touches').delete().eq('prospect_id',id)
    await sb.from('prospects').delete().eq('id',id)
    setProspects(ps=>ps.filter(p=>p.id!==id))
    setTouches(ts=>ts.filter(t=>t.prospect_id!==id))
    setView('pipeline'); setFocusId(null); setConfirmDel(null)
    pop(`${name} removed`)
  }

  const bumpMetric = async (k, delta) => {
    const cur = metrics||{dms:0,replies:0,emails:0,offers:0,sales:0}
    const next = {...cur,[k]:Math.max(0,(cur[k]||0)+delta)}
    setMetrics(next)
    await sb.from('daily_metrics').upsert({
      user_id:uid, metric_date:todayStr(),
      dms:next.dms, replies:next.replies, emails:next.emails, offers:next.offers, sales:next.sales,
    },{onConflict:'user_id,metric_date'})
  }

  if (loading) return <Splash>Loading your pipeline…</Splash>

  const today    = metrics||{dms:0,replies:0,emails:0,offers:0,sales:0}
  const chCount  = id => prospects.filter(p=>p.channel===id).length
  const pTouches = pid => touches.filter(t=>t.prospect_id===pid)
  const focused  = prospects.find(p=>p.id===focusId)

  const visible = prospects.filter(p => {
    if (filterCh  && p.channel!==filterCh)  return false
    if (filterInt && p.intent!==filterInt)   return false
    if (q && !p.name.toLowerCase().includes(q.toLowerCase()) && !p.handle.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  return (
    <div style={{minHeight:'100vh',background:C.black}}>
      <GlobalStyles/>
      {toast && <Toast msg={toast}/>}

      {confirmDel && (
        <Overlay onClose={()=>setConfirmDel(null)}>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'Oswald,sans-serif',fontSize:17,color:C.white,fontWeight:700,marginBottom:8}}>Remove Prospect?</div>
            <div style={{color:C.muted,fontSize:12,marginBottom:20}}>Permanently deletes {prospects.find(p=>p.id===confirmDel)?.name} and all touch history.</div>
            <div style={{display:'flex',gap:8}}>
              <GhostBtn full onClick={()=>setConfirmDel(null)}>Cancel</GhostBtn>
              <GoldBtn full onClick={()=>deleteProspect(confirmDel)} style={{background:C.red,color:C.white}}>Remove</GoldBtn>
            </div>
          </div>
        </Overlay>
      )}

      {/* HEADER */}
      <header style={{background:C.dark,borderBottom:`1px solid ${C.border}`,padding:'0 18px',display:'flex',alignItems:'center',justifyContent:'space-between',height:54,position:'sticky',top:0,zIndex:200}}>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          {view!=='pipeline'&&<button onClick={()=>setView('pipeline')} style={{background:'none',border:'none',color:C.muted,fontSize:24,cursor:'pointer',padding:'0 3px'}}>←</button>}
          <img src="/images/nlh-logo.png" alt="NextLevel Healthpreneur" style={{width:36,height:36}} />
          <span style={{fontFamily:'Oswald,sans-serif',color:C.gold,fontSize:19,fontWeight:700,textTransform:'uppercase'}}>Insta Client Engine</span>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {['pipeline','daily'].map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{background:view===v?C.gold:'none',color:view===v?C.black:C.muted,padding:'8px 15px',borderRadius:6,fontSize:13,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',border:`1px solid ${view===v?C.gold:C.border}`,cursor:'pointer',fontFamily:'Oswald,sans-serif',transition:'all .15s'}}>
                {v}
              </button>
            ))}
            <button onClick={()=>setAddOpen(true)} style={{background:C.gold,color:C.black,padding:'9px 16px',borderRadius:6,fontSize:13,fontWeight:800,fontFamily:'Oswald,sans-serif',border:'none',cursor:'pointer',marginLeft:3}}>＋ Add</button>
            <button onClick={()=>sb.auth.signOut()} title="Sign out" style={{background:'none',border:`1px solid ${C.border}`,color:C.muted,padding:'8px 13px',borderRadius:6,fontSize:14,cursor:'pointer'}}>↪</button>
        </div>
      </header>

      {/* ═══ PIPELINE ═══ */}
      {view==='pipeline' && (
        <div style={{padding:'16px 16px 48px'}} className="fade">
          {/* Metrics bar */}
          <div style={{display:'flex',gap:7,marginBottom:16,flexWrap:'wrap'}}>
            {[{k:'dms',l:'DMs',i:'✉',t:60},{k:'replies',l:'Replies',i:'↩',t:20},{k:'emails',l:'Emails',i:'◎',t:5},{k:'offers',l:'Offers',i:'◇',t:5},{k:'sales',l:'Sales',i:'★',t:1}].map(m=>{
              const v=today[m.k]||0,pct=Math.min(100,(v/m.t)*100),hit=v>=m.t
              return (
                <div key={m.k} style={{flex:'1 1 110px',background:C.char,border:`1px solid ${C.border}`,borderRadius:8,padding:'9px 11px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                    <span style={{color:C.muted,fontSize:8,textTransform:'uppercase',letterSpacing:'.3px'}}>{m.i} {m.l}</span>
                    <div style={{display:'flex',gap:2}}>
                      <button onClick={()=>bumpMetric(m.k,-1)} style={{background:C.light,color:C.text,width:17,height:17,borderRadius:2,fontSize:12,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>−</button>
                      <button onClick={()=>bumpMetric(m.k,1)} style={{background:C.gold,color:C.black,width:17,height:17,borderRadius:2,fontSize:10,fontWeight:700,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>+</button>
                    </div>
                  </div>
                  <div style={{fontFamily:'monospace',fontSize:20,fontWeight:700,color:hit?C.gold:C.white,lineHeight:1}}>{v}<span style={{fontSize:9,color:C.muted}}>/{m.t}</span></div>
                  <div style={{marginTop:5,height:2,background:C.border,borderRadius:2}}><div style={{width:`${pct}%`,height:'100%',background:hit?C.gold:C.blue,borderRadius:2,transition:'width .3s'}}/></div>
                </div>
              )
            })}
          </div>

          {/* Filters */}
          <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" style={{background:C.char,border:`1px solid ${C.border}`,color:C.text,padding:'8px 14px',borderRadius:5,fontSize:15,width:180,outline:'none'}}/>
            {CHANNELS.map(ch=>(
              <button key={ch.id} onClick={()=>setFilterCh(filterCh===ch.id?null:ch.id)} style={{background:filterCh===ch.id?ch.color:C.char,color:filterCh===ch.id?C.black:C.dim,border:`1px solid ${filterCh===ch.id?ch.color:C.border}`,padding:'7px 11px',borderRadius:5,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Oswald,sans-serif',transition:'all .12s'}}>
                {ch.key}
              </button>
            ))}
            {INTENT.map(i=>(
              <button key={i.id} onClick={()=>setFilterInt(filterInt===i.id?null:i.id)} style={{background:filterInt===i.id?i.color+'33':C.char,color:filterInt===i.id?i.color:C.dim,border:`1px solid ${filterInt===i.id?i.color:C.border}`,padding:'7px 11px',borderRadius:5,fontSize:15,cursor:'pointer',transition:'all .12s'}}>{i.emoji}</button>
            ))}
            {(filterCh||filterInt||q)&&<button onClick={()=>{setFilterCh(null);setFilterInt(null);setQ('')}} style={{background:'none',border:'none',color:C.muted,fontSize:13,cursor:'pointer',textDecoration:'underline'}}>Clear</button>}
            <span style={{marginLeft:'auto',color:C.muted,fontSize:14}}>{visible.length}/{prospects.length}</span>
          </div>

          {/* Kanban */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
            {CHANNELS.map(ch=>{
              const cards=visible.filter(p=>p.channel===ch.id)
              const open=scriptCh===ch.id
              return (
                <div key={ch.id} style={{background:C.char,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
                  <div style={{background:C.mid,padding:'12px 12px',borderBottom:`2px solid ${ch.color}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{background:ch.color,color:C.black,fontSize:13,fontWeight:800,padding:'3px 7px',borderRadius:3,fontFamily:'Oswald,sans-serif'}}>{ch.key}</span>
                        <span style={{color:C.white,fontSize:17,fontWeight:600,fontFamily:'Oswald,sans-serif'}}>{ch.name}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <span style={{color:C.gold,fontWeight:700,fontSize:22,fontFamily:'monospace'}}>{chCount(ch.id)}</span>
                        <button onClick={()=>setScriptCh(open?null:ch.id)} style={{background:open?C.gold:C.light,color:open?C.black:C.muted,width:26,height:26,borderRadius:3,fontSize:14,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .12s'}}>📋</button>
                      </div>
                    </div>
                    <div style={{color:C.muted,fontSize:13,lineHeight:1.4}}>{ch.tagline}</div>
                    <div style={{color:ch.color,fontSize:13,marginTop:2,opacity:.8}}>{ch.daily}</div>
                  </div>

                  {open && (
                    <div style={{background:'#0b0d12',borderBottom:`1px solid ${C.border}`,padding:'12px 12px',maxHeight:280,overflowY:'auto'}} className="fade">
                      <div style={{color:ch.color,fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.4px',marginBottom:8,fontFamily:'Oswald,sans-serif'}}>Script</div>
                      <pre style={{color:'#6a7a8a',fontSize:14,whiteSpace:'pre-wrap',lineHeight:1.7,fontFamily:'monospace'}}>{ch.script}</pre>
                    </div>
                  )}

                  <div style={{padding:8,display:'flex',flexDirection:'column',gap:7}}>
                    {cards.length===0&&<div style={{color:C.muted,fontSize:14,textAlign:'center',padding:'14px 0',opacity:.35}}>Empty</div>}
                    {cards.map(p=>{
                      const intentCfg=INTENT.find(i=>i.id===p.intent)
                      const pts=pTouches(p.id)
                      const last=pts.length?pts[pts.length-1]:null
                      return (
                        <div key={p.id} onClick={()=>{setFocusId(p.id);setView('detail')}}
                          style={{background:C.mid,border:`1px solid ${C.border}`,borderRadius:7,padding:'11px 12px',cursor:'pointer',transition:'border-color .12s,transform .1s'}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor=ch.color;e.currentTarget.style.transform='translateY(-1px)'}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform='translateY(0)'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{color:C.white,fontWeight:600,fontSize:16,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                              <div style={{color:C.muted,fontSize:14}}>{p.handle}</div>
                            </div>
                            {intentCfg&&<span style={{fontSize:16,marginLeft:2}}>{intentCfg.emoji}</span>}
                          </div>
                          {last&&<div style={{color:C.muted,fontSize:13,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{last.touch_type} · {fmtDate(last.touch_date)}</div>}
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{color:C.muted,fontSize:13}}>{pts.length} touches</span>
                            <div style={{display:'flex',gap:3}}>
                              {ch.id>1&&<button onClick={e=>{e.stopPropagation();moveProspect(p.id,ch.id-1)}} style={{background:C.light,color:C.dim,width:24,height:24,borderRadius:3,fontSize:13,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>}
                              {ch.id<5&&<button onClick={e=>{e.stopPropagation();moveProspect(p.id,ch.id+1)}} style={{background:ch.colorDim,color:ch.color,width:24,height:24,borderRadius:3,fontSize:13,fontWeight:700,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>→</button>}
                              <button onClick={e=>{e.stopPropagation();setTouchFor(p.id)}} style={{background:C.goldDim,color:C.gold,width:24,height:24,borderRadius:3,fontSize:15,fontWeight:700,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ DAILY ═══ */}
      {view==='daily' && (
        <div style={{padding:'20px 20px 48px',maxWidth:740,margin:'0 auto'}} className="fade">
          <div style={{fontFamily:'Oswald,sans-serif',fontSize:22,color:C.gold,fontWeight:700,marginBottom:2}}>Daily Workflow</div>
          <div style={{color:C.muted,fontSize:11,marginBottom:22}}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>

          <SL>60-Minute Power Hour</SL>
          {[
            {time:'0–5 min', task:'Review & Plan', color:C.muted, d:"Check overnight replies. Update channel statuses. Pick today's CH3 targets."},
            {time:'5–20 min', task:'CH5 First — Hot Leads', color:C.red, d:"Closest-to-closing conversations first. Soft offers, objections, closes."},
            {time:'20–35 min', task:'CH2 Warm Conversations', color:C.orange, d:"Add value, keep relationships moving. Target: 20–30 touches."},
            {time:'35–55 min', task:'CH3 Cold Outreach', color:C.purple, d:"Send 20–30 opening DMs. Personalize each. No copy-paste."},
            {time:'55–60 min', task:'Track Your Numbers', color:C.gold, d:"Log DMs, replies, emails, offers, sales below."},
          ].map((s,i)=>(
            <div key={i} style={{display:'flex',gap:11,marginBottom:8}}>
              <div style={{width:60,flexShrink:0,color:s.color,fontFamily:'monospace',fontSize:8,paddingTop:10,textAlign:'right'}}>{s.time}</div>
              <div style={{flex:1,background:C.char,border:`1px solid ${s.color}33`,borderLeft:`3px solid ${s.color}`,borderRadius:'0 7px 7px 0',padding:'8px 11px'}}>
                <div style={{color:C.white,fontWeight:600,fontSize:12,fontFamily:'Oswald,sans-serif'}}>{s.task}</div>
                <div style={{color:C.muted,fontSize:10,marginTop:2,lineHeight:1.5}}>{s.d}</div>
              </div>
            </div>
          ))}

          <div style={{marginTop:22,marginBottom:8}}><SL>Today's Numbers</SL></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:20}}>
            {[{k:'dms',l:'DMs',i:'✉',t:60},{k:'replies',l:'Replies',i:'↩',t:20},{k:'emails',l:'Emails',i:'◎',t:5},{k:'offers',l:'Offers',i:'◇',t:5},{k:'sales',l:'Sales',i:'★',t:1}].map(m=>{
              const v=today[m.k]||0,hit=v>=m.t
              return (
                <div key={m.k} style={{background:C.char,border:`1px solid ${C.border}`,borderRadius:8,padding:'11px 7px',textAlign:'center'}}>
                  <div style={{color:C.muted,fontSize:7,textTransform:'uppercase',letterSpacing:'.4px',marginBottom:5}}>{m.i} {m.l}</div>
                  <div style={{fontFamily:'monospace',fontSize:26,fontWeight:700,color:hit?C.gold:C.white,lineHeight:1}}>{v}</div>
                  <div style={{color:C.muted,fontSize:7,marginBottom:8}}>/{m.t}</div>
                  <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                    <button onClick={()=>bumpMetric(m.k,-1)} style={{background:C.light,color:C.text,width:22,height:22,borderRadius:4,fontSize:13,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                    <button onClick={()=>bumpMetric(m.k,1)} style={{background:C.gold,color:C.black,width:22,height:22,borderRadius:4,fontSize:11,fontWeight:700,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                  </div>
                </div>
              )
            })}
          </div>

          <SL>Pipeline Snapshot</SL>
          <div style={{display:'flex',gap:7}}>
            {CHANNELS.map(ch=>(
              <div key={ch.id} style={{flex:1,background:C.char,border:`1px solid ${C.border}`,borderTop:`3px solid ${ch.color}`,borderRadius:'0 0 6px 6px',padding:'8px 5px',textAlign:'center'}}>
                <div style={{color:ch.color,fontSize:7,fontWeight:800,fontFamily:'Oswald,sans-serif',marginBottom:2}}>{ch.key}</div>
                <div style={{color:C.white,fontSize:18,fontWeight:700,fontFamily:'monospace'}}>{chCount(ch.id)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ DETAIL ═══ */}
      {view==='detail' && focused && (()=>{
        const p=focused,ch=CHANNELS.find(c=>c.id===p.channel),pts=pTouches(p.id)
        return (
          <div style={{padding:'20px',maxWidth:640,margin:'0 auto'}} className="fade">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
              <div>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:20,color:C.white,fontWeight:700}}>{p.name}</div>
                <div style={{color:C.muted,fontSize:11}}>{p.handle}{p.source?` · via ${p.source}`:''}</div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>setTouchFor(p.id)} style={{background:C.gold,color:C.black,padding:'6px 12px',borderRadius:6,fontSize:10,fontWeight:700,fontFamily:'Oswald,sans-serif',border:'none',cursor:'pointer'}}>+ Touch</button>
                <button onClick={()=>setConfirmDel(p.id)} style={{background:C.red+'22',color:C.red,padding:'6px 9px',borderRadius:6,fontSize:10,border:'none',cursor:'pointer'}}>✕</button>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              <div style={{background:C.char,border:`1px solid ${C.border}`,borderRadius:8,padding:12}}>
                <SL small>Channel</SL>
                <div style={{display:'flex',flexWrap:'wrap',gap:3,marginBottom:6}}>
                  {CHANNELS.map(c=>(
                    <button key={c.id} onClick={()=>moveProspect(p.id,c.id)} style={{background:p.channel===c.id?c.color:C.light,color:p.channel===c.id?C.black:C.dim,padding:'3px 6px',borderRadius:3,fontSize:8,fontWeight:700,fontFamily:'Oswald,sans-serif',border:'none',cursor:'pointer',transition:'all .12s'}}>{c.key}</button>
                  ))}
                </div>
                <div style={{color:ch.color,fontSize:10,fontWeight:600,fontFamily:'Oswald,sans-serif'}}>{ch.name}</div>
                <div style={{color:C.muted,fontSize:8,marginTop:1,lineHeight:1.4}}>{ch.tagline}</div>
              </div>
              <div style={{background:C.char,border:`1px solid ${C.border}`,borderRadius:8,padding:12}}>
                <SL small>Intent Level</SL>
                {INTENT.map(i=>(
                  <button key={i.id} onClick={()=>setIntent(p.id,i.id)} style={{display:'block',width:'100%',background:p.intent===i.id?i.color+'22':C.light,color:p.intent===i.id?i.color:C.dim,border:`1px solid ${p.intent===i.id?i.color:'transparent'}`,padding:'5px 7px',borderRadius:4,fontSize:10,textAlign:'left',cursor:'pointer',marginBottom:3,fontWeight:p.intent===i.id?600:400,transition:'all .12s'}}>{i.emoji} {i.label}</button>
                ))}
              </div>
            </div>

            <div style={{background:'#0b0d12',border:`1px solid ${ch.color}33`,borderLeft:`3px solid ${ch.color}`,borderRadius:'0 8px 8px 0',padding:'11px 13px',marginBottom:14}}>
              <div style={{color:ch.color,fontSize:7,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:7,fontFamily:'Oswald,sans-serif'}}>📋 Script — {ch.name}</div>
              <pre style={{color:'#6a7a8a',fontSize:8,whiteSpace:'pre-wrap',lineHeight:1.7,fontFamily:'monospace'}}>{ch.script}</pre>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginBottom:14}}>
              <div>
                <SL small>Notes</SL>
                <textarea value={p.notes||''} onChange={e=>patchProspect(p.id,{notes:e.target.value})} placeholder="Pain points, what they said…" style={{width:'100%',background:C.char,border:`1px solid ${C.border}`,color:C.text,padding:'6px 8px',borderRadius:5,fontSize:10,resize:'vertical',minHeight:70,lineHeight:1.55,outline:'none'}}/>
              </div>
              <div>
                <SL small>Email Collected</SL>
                <input value={p.email||''} onChange={e=>patchProspect(p.id,{email:e.target.value})} placeholder="email@example.com" style={{width:'100%',background:C.char,border:`1px solid ${C.border}`,color:C.text,padding:'6px 8px',borderRadius:5,fontSize:10,marginBottom:7,display:'block',outline:'none'}}/>
                <SL small>Source</SL>
                <input value={p.source||''} onChange={e=>patchProspect(p.id,{source:e.target.value})} placeholder="Where found…" style={{width:'100%',background:C.char,border:`1px solid ${C.border}`,color:C.text,padding:'6px 8px',borderRadius:5,fontSize:10,display:'block',outline:'none'}}/>
              </div>
            </div>

            <SL small>Touch History ({pts.length})</SL>
            {pts.length===0&&<div style={{color:C.muted,fontSize:10,opacity:.5,padding:'6px 0'}}>No touches logged yet.</div>}
            <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:280,overflowY:'auto'}}>
              {[...pts].reverse().map((t,i)=>(
                <div key={i} style={{background:C.char,border:`1px solid ${C.border}`,borderRadius:5,padding:'5px 9px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <span style={{color:C.text,fontSize:11}}>{t.touch_type}</span>
                    {t.note&&<div style={{color:C.muted,fontSize:9,marginTop:1}}>{t.note}</div>}
                  </div>
                  <span style={{color:C.muted,fontSize:8,whiteSpace:'nowrap',marginLeft:8,fontFamily:'monospace'}}>{fmtDate(t.touch_date)}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {addOpen&&<Overlay onClose={()=>setAddOpen(false)}><AddForm onSubmit={addProspect} onCancel={()=>setAddOpen(false)} saving={saving}/></Overlay>}
      {touchFor&&<Overlay onClose={()=>setTouchFor(null)}><TouchForm prospect={prospects.find(p=>p.id===touchFor)} onSubmit={(type,note)=>logTouch(touchFor,type,note)} onCancel={()=>setTouchFor(null)}/></Overlay>}
    </div>
  )
}

// ─── SHARED UI ─────────────���─���────────────────────────────────
function GlobalStyles() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{background:${C.black};color:${C.text};font-family:'Inter',sans-serif;min-height:100vh}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-track{background:${C.dark}}
    ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
    button{cursor:pointer;border:none;font-family:'Inter',sans-serif}
    input,textarea{font-family:'Inter',sans-serif;outline:none}
    .fade{animation:fade .2s ease}
    @keyframes fade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
  `}</style>
}

function Splash({children}) {
  return <div style={{minHeight:'100vh',background:C.black,display:'flex',alignItems:'center',justifyContent:'center',color:C.muted,fontSize:13,fontFamily:'Inter,sans-serif'}}><style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${C.black}}`}</style>{children}</div>
}

function Toast({msg}) {
  return <div style={{position:'fixed',top:14,right:14,zIndex:9999,background:C.gold,color:C.black,padding:'7px 14px',borderRadius:6,fontSize:11,fontWeight:700,fontFamily:'Oswald,sans-serif',boxShadow:'0 4px 20px rgba(0,0,0,.5)',animation:'fade .2s ease'}}>{msg}</div>
}

function Overlay({children,onClose}) {
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.82)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:14}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.char,border:`1px solid ${C.border}`,borderRadius:12,padding:20,width:'100%',maxWidth:440,maxHeight:'90vh',overflowY:'auto'}} className="fade">{children}</div>
    </div>
  )
}

function SL({children,small}) {
  return <div style={{color:C.muted,fontSize:small?7:8,textTransform:'uppercase',letterSpacing:'.5px',fontWeight:700,marginBottom:small?4:8,fontFamily:'Oswald,sans-serif'}}>{children}</div>
}

function GoldBtn({children,onClick,full,style:s={}}) {
  return <button onClick={onClick} style={{flex:full?1:undefined,background:C.gold,color:C.black,border:'none',padding:'8px 11px',borderRadius:6,fontSize:11,fontWeight:700,fontFamily:'Oswald,sans-serif',width:full?'100%':undefined,cursor:'pointer',...s}}>{children}</button>
}

function GhostBtn({children,onClick,full}) {
  return <button onClick={onClick} style={{flex:full?1:undefined,background:C.mid,color:C.text,border:`1px solid ${C.border}`,padding:'8px 11px',borderRadius:6,fontSize:11,fontFamily:'Inter,sans-serif',width:full?'100%':undefined,cursor:'pointer'}}>{children}</button>
}

function MetricsRow({m}) {
  return (
    <div style={{display:'flex',gap:5}}>
      {[['DMs',m.dms],['Replies',m.replies],['Emails',m.emails],['Offers',m.offers],['Sales',m.sales]].map(([l,v])=>(
        <div key={l} style={{flex:1,background:C.mid,border:`1px solid ${C.border}`,borderRadius:5,padding:'6px 3px',textAlign:'center'}}>
          <div style={{color:C.muted,fontSize:7,marginBottom:2}}>{l}</div>
          <div style={{color:C.white,fontSize:14,fontWeight:700,fontFamily:'monospace'}}>{v||0}</div>
        </div>
      ))}
    </div>
  )
}

function AddForm({onSubmit,onCancel,saving}) {
  const [f,setF]=useState({name:'',handle:'',source:'',notes:'',channel:'3',intent:''})
  const set=(k,v)=>setF(p=>({...p,[k]:v}))
  const ok=f.name.trim()&&f.handle.trim()
  return (
    <>
      <div style={{fontFamily:'Oswald,sans-serif',fontSize:17,color:C.gold,fontWeight:700,marginBottom:14}}>Add Prospect</div>
      {[{k:'name',l:'Full Name *',ph:'Jane Smith'},{k:'handle',l:'Handle *',ph:'@janesmith'},{k:'source',l:'Where Found',ph:'hashtag, referral…'}].map(row=>(
        <div key={row.k} style={{marginBottom:10}}>
          <SL small>{row.l}</SL>
          <input value={f[row.k]} onChange={e=>set(row.k,e.target.value)} placeholder={row.ph} style={{width:'100%',background:C.mid,border:`1px solid ${C.border}`,color:C.white,padding:'7px 9px',borderRadius:6,fontSize:12}}/>
        </div>
      ))}
      <div style={{marginBottom:10}}>
        <SL small>Starting Channel</SL>
        <div style={{display:'flex',gap:3}}>
          {CHANNELS.map(ch=>(
            <button key={ch.id} onClick={()=>set('channel',String(ch.id))} style={{flex:1,background:f.channel===String(ch.id)?ch.color:C.mid,color:f.channel===String(ch.id)?C.black:C.dim,border:`1px solid ${f.channel===String(ch.id)?ch.color:C.border}`,padding:'5px 0',borderRadius:4,fontSize:8,fontWeight:700,fontFamily:'Oswald,sans-serif',cursor:'pointer',transition:'all .12s'}}>{ch.key}</button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:10}}>
        <SL small>Intent Level</SL>
        <div style={{display:'flex',gap:3}}>
          {INTENT.map(i=>(
            <button key={i.id} onClick={()=>set('intent',i.id)} style={{flex:1,background:f.intent===i.id?i.color+'33':C.mid,color:f.intent===i.id?i.color:C.dim,border:`1px solid ${f.intent===i.id?i.color:C.border}`,padding:'5px 0',borderRadius:4,fontSize:10,fontWeight:600,cursor:'pointer',transition:'all .12s'}}>{i.emoji}</button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <SL small>Notes</SL>
        <textarea value={f.notes} onChange={e=>set('notes',e.target.value)} placeholder="Pain points, bio detail, what they're working on…" style={{width:'100%',background:C.mid,border:`1px solid ${C.border}`,color:C.white,padding:'7px 9px',borderRadius:6,fontSize:11,resize:'vertical',minHeight:60,lineHeight:1.5}}/>
      </div>
      <div style={{display:'flex',gap:7}}>
        <GhostBtn full onClick={onCancel}>Cancel</GhostBtn>
        <GoldBtn full onClick={()=>ok&&!saving&&onSubmit(f)} style={{background:ok&&!saving?C.gold:'#333',color:ok&&!saving?C.black:C.muted,cursor:ok&&!saving?'pointer':'not-allowed'}}>{saving?'Saving…':'Add to Pipeline'}</GoldBtn>
      </div>
    </>
  )
}

function TouchForm({prospect,onSubmit,onCancel}) {
  const [type,setType]=useState('')
  const [note,setNote]=useState('')
  const ch=CHANNELS.find(c=>c.id===(prospect?.channel||3))
  const types=[...new Set([...(ch?.touchTypes||[]),'Value-add message','Lead magnet sent','Soft offer sent','Objection handled','Discovery call booked','Sale closed','Follow-up touch','Story reaction','Comment left','Liked posts'])]
  return (
    <>
      <div style={{fontFamily:'Oswald,sans-serif',fontSize:17,color:C.gold,fontWeight:700,marginBottom:4}}>Log Touch</div>
      <div style={{color:C.muted,fontSize:10,marginBottom:12}}>{prospect?.name} · <span style={{color:ch?.color}}>{ch?.name}</span></div>
      <SL small>Touch Type</SL>
      <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:12}}>
        {types.map(t=>(
          <button key={t} onClick={()=>setType(t)} style={{background:type===t?C.gold:C.mid,color:type===t?C.black:C.dim,border:`1px solid ${type===t?C.gold:C.border}`,padding:'3px 7px',borderRadius:3,fontSize:9,fontWeight:type===t?700:400,cursor:'pointer',transition:'all .1s'}}>{t}</button>
        ))}
      </div>
      <div style={{marginBottom:14}}>
        <SL small>Note (optional)</SL>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="What happened? What did they say?" style={{width:'100%',background:C.mid,border:`1px solid ${C.border}`,color:C.white,padding:'7px 9px',borderRadius:6,fontSize:11,resize:'vertical',minHeight:60,lineHeight:1.5}}/>
      </div>
      <div style={{display:'flex',gap:7}}>
        <GhostBtn full onClick={onCancel}>Cancel</GhostBtn>
        <GoldBtn full onClick={()=>type&&onSubmit(type,note)} style={{background:type?C.gold:'#333',color:type?C.black:C.muted,cursor:type?'pointer':'not-allowed'}}>Log Touch</GoldBtn>
      </div>
    </>
  )
}

function InviteForm({onSubmit,onCancel}) {
  const [f,setF]=useState({email:'',fullName:'',cohort:'',password:''})
  const set=(k,v)=>setF(p=>({...p,[k]:v}))
  const ok=f.email.trim()&&f.fullName.trim()&&f.password.length>=6
  return (
    <>
      <div style={{fontFamily:'Oswald,sans-serif',fontSize:17,color:C.gold,fontWeight:700,marginBottom:14}}>Invite Student</div>
      {[{k:'fullName',l:'Full Name *',ph:'Jane Smith'},{k:'email',l:'Email *',ph:'jane@example.com',t:'email'},{k:'password',l:'Temp Password *',ph:'Min 6 characters',t:'password'},{k:'cohort',l:'Cohort (optional)',ph:'Spring 2025…'}].map(row=>(
        <div key={row.k} style={{marginBottom:10}}>
          <SL small>{row.l}</SL>
          <input type={row.t||'text'} value={f[row.k]} onChange={e=>set(row.k,e.target.value)} placeholder={row.ph} style={{width:'100%',background:C.mid,border:`1px solid ${C.border}`,color:C.white,padding:'7px 9px',borderRadius:6,fontSize:12}}/>
        </div>
      ))}
      <div style={{color:C.muted,fontSize:9,marginBottom:14,lineHeight:1.5}}>Student logs in with this email + password. Ask them to change their password after first login.</div>
      <div style={{display:'flex',gap:7}}>
        <GhostBtn full onClick={onCancel}>Cancel</GhostBtn>
        <GoldBtn full onClick={()=>ok&&onSubmit(f)} style={{background:ok?C.gold:'#333',color:ok?C.black:C.muted,cursor:ok?'pointer':'not-allowed'}}>Create Account</GoldBtn>
      </div>
    </>
  )
}
