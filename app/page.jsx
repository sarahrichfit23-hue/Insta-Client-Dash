'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

// ─── BRAND ────────────────────────────────────────────────────
const C = {
  gold:'#F6BD60', goldDim:'#e0a94e', black:'#1E1E1E', dark:'#2a2a2a',
  card:'#2a2a2a', cardInner:'#ffffff', border:'#3a3a3a',
  muted:'#888888', dim:'#aaaaaa', text:'#1a1a1a', white:'#ffffff',
  bg:'#F6BD60',
  shadow:'0 8px 24px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)',
  shadow3d:'0 12px 32px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
  red:'#C0392B', orange:'#D68910', blue:'#2471A3', green:'#1E8449', purple:'#7D3C98',
}

// ─── CHANNEL TOOLTIPS ──────────────────────────────────────────
const CHANNEL_TIPS = {
  1: "Someone just followed you. Message within 24-48hrs. Goal: start a conversation — nothing more.",
  2: "They replied. Now add value and build trust. Don't pitch yet. Move here from CH1 once they've responded.",
  3: "People you haven't messaged yet. Send a personalized Curiosity Opener. Goal: get one reply.",
  4: "Not ready to DM yet. Like, comment, react to their content for 3-5 days. No DM until they know your face.",
  5: "Hot leads only. Diagnose their situation, position your offer, close. This is where clients are won.",
}

// ─── EMPTY COLUMN NUDGES ───────────────────────────────────────
const EMPTY_NUDGES = {
  1: "No new followers yet — or add someone who just followed you.",
  2: "No warm conversations yet. Move a CH1 prospect here once they reply.",
  3: "This is where you start. Add your cold targets here first.",
  4: "Add people you want to warm up before you DM them.",
  5: "No hot leads yet. Keep working CH2 — they'll graduate here.",
}

// ─── CHANNELS ─────────────────────────────────────────────────
const CHANNELS = [
  {
    id:1, key:'CH1', name:'New Arrivals', color:C.blue, colorDim:'#1a3d5c',
    tagline:'Open conversation within 48hrs', daily:'10-20 touches/day',
    touchTypes:['Welcome DM sent','Followed back','Liked recent posts','Profile noted'],
    script:`WELCOME DM (send within 24-48 hrs of their follow)

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
    tagline:'Add value, build trust, open the sales window', daily:'20-30 touches/day',
    touchTypes:['Value-add message','Lead magnet offered','Lead magnet sent','Resource shared','Story reaction','Comment left','Sales window opened'],
    script:`VALUE-ADD MESSAGE
"Hey — saw this and thought of what you shared about [their struggle]. Thought it might be useful: [tip or resource]. How's it going with [their goal] this week?"

━━━━━━━━━━━━━━━━━━━━━━
LEAD MAGNET OFFER (after 2-3 exchanges)
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
    tagline:'Send opening DM — goal is one reply', daily:'30-40 DMs/day',
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

METHOD 4 — Authority Reversal
"Hey [Name] — been following your content and what you're doing with [specific thing] is genuinely impressive. Mostly curious — what's been your biggest challenge lately with [their topic]?"

━━━━━━━━━━━━━━━━━━━━━━
⚡ ALL METHODS: Personalize with ONE detail.
Reply received → move to CH2.`,
  },
  {
    id:4, key:'CH4', name:'Warm-Up Engagement', color:C.green, colorDim:'#0d3d1f',
    tagline:'Get on radar before the DM', daily:'15-25 profiles/day',
    touchTypes:['Liked 2-3 posts','Left genuine comment','Reacted to story','Followed','Saved for CH3 DM'],
    script:`NO DM YET — engagement only for 2-3 days first.

DAY 1-2:
→ Like 2-3 of their recent posts
→ Leave ONE genuine comment (specific, not "great post!")

DAY 2-3:
→ React to stories if they post them
→ Note what they post about for your opener

DAY 3-5:
→ Send your CH3 DM
→ It lands WARM because they recognize your name

━━━━━━━━━━━━━━━━━━━━━━
Familiarity before outreach.
Not a stranger — a familiar face.
That's the difference between 5% and 30% reply rates.
━━━━━━━━━━━━━━━━━━━━━━
Ready to DM → move to CH3.`,
  },
  {
    id:5, key:'CH5', name:'Conversion Touches', color:C.red, colorDim:'#5c1a1a',
    tagline:'Diagnose → position → offer → close', daily:'5-10 touches — highest value',
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
Touch 1 (3-5 days): "Just circling back. Totally fine if timing is off."
Touch 2 (5-7 days): "Quick check-in — still thinking about this?"
Touch 3 — FINAL: "Closing the loop for now. Door's open whenever."

━━━━━━━━━━━━━━━━━━━━━━
Closing is clarity, not pressure.`,
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
    
    const handleBeforeUnload = () => {
      sb.auth.signOut()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [sb])

  const [coachProfile, setCoachProfile] = useState(undefined)

  useEffect(() => {
    if (!session) return
    sb.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({data}) => setProfile(data))
  }, [session, sb])

  // Load coach profile for wizard check (only for non-admin users)
  useEffect(() => {
    if (!profile || profile.is_admin) return
    sb.from('coach_profiles').select('*').eq('user_id', profile.id).single()
      .then(({data, error}) => {
        if (error && error.code === 'PGRST116') {
          // No profile exists yet - they need to complete wizard
          setCoachProfile(null)
        } else {
          setCoachProfile(data)
        }
      })
  }, [profile, sb])

  const handleWizardComplete = (completedProfile) => {
    setCoachProfile(completedProfile)
  }

  if (session === undefined) return <Splash>Loading...</Splash>
  if (!session) return <LoginScreen sb={sb} />
  if (!profile) return <Splash>Loading profile...</Splash>
  if (profile.is_admin) return <AdminView sb={sb} profile={profile} />
  if (coachProfile === undefined) return <Splash>Loading...</Splash>
  if (!coachProfile || !coachProfile.wizard_completed) return <OnboardingWizard sb={sb} profile={profile} existingData={coachProfile} onComplete={handleWizardComplete} />
  return <PipelineApp sb={sb} profile={profile} coachProfile={coachProfile} />
}

// ─── LOGIN ────────────────────────────────────────────────────
function LoginScreen({sb}) {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [err,   setErr]   = useState('')
  const [busy,  setBusy]  = useState(false)

  const login = async () => {
    setErr(''); setBusy(true)
    const {error} = await sb.auth.signInWithPassword({email, password: pass})
    setBusy(false)
    if (error) setErr(error.message)
  }

  return (
    <div style={{minHeight:'100vh',background:C.gold,display:'flex',alignItems:'center',justifyContent:'center',padding:24,fontFamily:'Inter,sans-serif'}}>
      <GlobalStyles/>
      <div style={{width:'100%',maxWidth:420}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <img src="/images/nlh-logo.png" alt="NextLevel Healthpreneur" style={{width:160,height:160,marginBottom:16}} />
          <div style={{fontFamily:'Oswald,sans-serif',fontSize:36,fontWeight:700,color:C.black,letterSpacing:'-1px',textTransform:'uppercase'}}>Insta Client Engine</div>
          <div style={{color:C.dark,fontSize:16,marginTop:6,opacity:0.7}}>Powered by NextLevel Healthpreneur</div>
        </div>
        <div style={{background:C.card,borderRadius:18,padding:32,boxShadow:C.shadow3d}}>
          <div style={{background:C.cardInner,borderRadius:12,padding:28}}>
            <div style={{fontFamily:'Oswald,sans-serif',fontSize:22,fontWeight:700,color:C.text,marginBottom:22}}>Sign In</div>
            {[
              {label:'Email',val:email,set:setEmail,type:'email',ph:'you@example.com'},
              {label:'Password',val:pass,set:setPass,type:'password',ph:'••••••••'},
            ].map(f=>(
              <div key={f.label} style={{marginBottom:16}}>
                <div style={{color:C.muted,fontSize:13,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6,fontFamily:'Oswald,sans-serif',fontWeight:700}}>{f.label}</div>
                <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder={f.ph} style={{width:'100%',background:'#f5f5f5',border:'1px solid #e0e0e0',color:C.text,padding:'13px 15px',borderRadius:10,fontSize:16,outline:'none'}}/>
              </div>
            ))}
            {err && <div style={{color:C.red,fontSize:14,marginBottom:14,padding:'10px 14px',background:C.red+'11',borderRadius:8}}>{err}</div>}
            <button onClick={login} disabled={busy} style={{width:'100%',background:busy?C.muted:C.black,color:C.white,padding:'14px',borderRadius:10,fontSize:16,fontWeight:700,cursor:busy?'not-allowed':'pointer',fontFamily:'Oswald,sans-serif',border:'none',marginTop:4,boxShadow:'0 4px 12px rgba(0,0,0,0.2)'}}>
              {busy?'Signing in...':'Sign In'}
            </button>
            <div style={{color:C.muted,fontSize:14,textAlign:'center',marginTop:16,lineHeight:1.5}}>Access is by invitation only.<br/>Contact your coach if you need credentials.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ONBOARDING WIZARD ────────────────────────────────────────
function OnboardingWizard({sb, profile, existingData, onComplete}) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [skipLeadMagnet, setSkipLeadMagnet] = useState(false)
  const [skipOffer, setSkipOffer] = useState(false)
  const [skipStory, setSkipStory] = useState(false)
  const [data, setData] = useState({
    niche_who: existingData?.niche_who || '',
    niche_problem: existingData?.niche_problem || '',
    niche_result: existingData?.niche_result || '',
    lead_magnet_name: existingData?.lead_magnet_name || '',
    lead_magnet_description: existingData?.lead_magnet_description || '',
    lead_magnet_delivery: existingData?.lead_magnet_delivery || [],
    offer_name: existingData?.offer_name || '',
    offer_description: existingData?.offer_description || '',
    offer_price: existingData?.offer_price || '',
    offer_sales_method: existingData?.offer_sales_method || '',
    coach_story: existingData?.coach_story || '',
    coach_result_example: existingData?.coach_result_example || '',
  })

  const set = (key, val) => setData(d => ({...d, [key]: val}))

  // Step validation - skipped sections are always valid
  const step1Valid = data.niche_who.trim() && data.niche_problem.trim() && data.niche_result.trim()
  const step2Valid = skipLeadMagnet || data.lead_magnet_delivery.includes('not_sure') || (data.lead_magnet_name.trim() && data.lead_magnet_description.trim() && data.lead_magnet_delivery.length > 0)
  const step3Valid = skipOffer || (data.offer_name.trim() && data.offer_description.trim() && data.offer_price.trim() && data.offer_sales_method)
  const step4Valid = skipStory || (data.coach_story.trim() && data.coach_result_example.trim())

  const canProceed = (step === 1 && step1Valid) || (step === 2 && step2Valid) || (step === 3 && step3Valid) || (step === 4 && step4Valid)

  const handleFinish = async () => {
    setSaving(true)
    const payload = { ...data, user_id: profile.id, wizard_completed: true }
    
    let result
    if (existingData?.id) {
      result = await sb.from('coach_profiles').update(payload).eq('id', existingData.id).select().single()
    } else {
      result = await sb.from('coach_profiles').insert(payload).select().single()
    }
    
    setSaving(false)
    if (result.error) {
      alert('Error saving profile: ' + result.error.message)
      return
    }
    onComplete(result.data)
  }

  // Assembled dream client sentence
  const dreamClient = data.niche_who && data.niche_problem && data.niche_result
    ? `I help ${data.niche_who} who are struggling with ${data.niche_problem} so they can ${data.niche_result}.`
    : ''

  return (
    <div style={{minHeight:'100vh',background:C.black,fontFamily:'Inter,sans-serif'}}>
      <GlobalStyles/>
      
      {/* Header */}
      <div style={{textAlign:'center',padding:'24px 20px 0'}}>
        <div style={{fontFamily:'Oswald,sans-serif',fontSize:18,color:C.gold,fontWeight:700,textTransform:'uppercase',letterSpacing:'1px'}}>Insta Client Engine</div>
        <div style={{color:C.muted,fontSize:13,marginTop:4}}>Coach Setup</div>
        <div style={{color:C.dim,fontSize:14,marginTop:8,fontStyle:'italic'}}>"This takes 5 minutes. It makes everything in the app 10x more useful."</div>
      </div>

      {/* Progress Bar */}
      <div style={{padding:'20px 24px',maxWidth:600,margin:'0 auto'}}>
        <div style={{display:'flex',gap:8}}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{flex:1,height:6,borderRadius:3,background:s<=step?C.gold:'#3a3a3a',transition:'background .2s'}} />
          ))}
        </div>
        <div style={{color:C.muted,fontSize:13,textAlign:'center',marginTop:8}}>Step {step} of 4</div>
      </div>

      {/* Step Content */}
      <div style={{maxWidth:560,margin:'0 auto',padding:'0 20px 40px'}}>
        
        {/* STEP 1: YOUR NICHE */}
        {step === 1 && (
          <div className="fade">
            <div style={{fontFamily:'Oswald,sans-serif',fontSize:28,color:C.white,fontWeight:700,marginBottom:8}}>Who do you help?</div>
            <div style={{color:C.muted,fontSize:15,marginBottom:24,lineHeight:1.5}}>Three fields. Be specific — vague answers = vague AI suggestions.</div>
            
            <div style={{marginBottom:20}}>
              <label style={{display:'block',color:C.gold,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:8}}>I work with...</label>
              <input value={data.niche_who} onChange={e=>set('niche_who',e.target.value.slice(0,100))} placeholder="e.g. new health coaches, postpartum moms, men over 50, burned-out nurses" style={{width:'100%',background:'#2a2a2a',border:'2px solid #3a3a3a',color:C.white,padding:'14px 16px',borderRadius:10,fontSize:15}}/>
              <div style={{color:C.dim,fontSize:12,textAlign:'right',marginTop:4}}>{data.niche_who.length}/100</div>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block',color:C.gold,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:8}}>Who are struggling with...</label>
              <input value={data.niche_problem} onChange={e=>set('niche_problem',e.target.value.slice(0,150))} placeholder="e.g. getting their first paying clients, losing weight after baby, low energy and no motivation" style={{width:'100%',background:'#2a2a2a',border:'2px solid #3a3a3a',color:C.white,padding:'14px 16px',borderRadius:10,fontSize:15}}/>
              <div style={{color:C.dim,fontSize:12,textAlign:'right',marginTop:4}}>{data.niche_problem.length}/150</div>
            </div>

            <div style={{marginBottom:24}}>
              <label style={{display:'block',color:C.gold,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:8}}>And want to...</label>
              <input value={data.niche_result} onChange={e=>set('niche_result',e.target.value.slice(0,150))} placeholder="e.g. build a full-time coaching business, lose 20lbs without giving up their life, feel like themselves again" style={{width:'100%',background:'#2a2a2a',border:'2px solid #3a3a3a',color:C.white,padding:'14px 16px',borderRadius:10,fontSize:15}}/>
              <div style={{color:C.dim,fontSize:12,textAlign:'right',marginTop:4}}>{data.niche_result.length}/150</div>
            </div>

            {/* Live Preview */}
            {dreamClient && (
              <div style={{background:'#1a1a1a',border:`2px solid ${C.gold}`,borderRadius:12,padding:'16px 18px',marginBottom:24}}>
                <div style={{color:C.gold,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:8}}>Your dream client in one sentence:</div>
                <div style={{color:C.white,fontSize:16,lineHeight:1.6,fontStyle:'italic'}}>"{dreamClient}"</div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: YOUR LEAD MAGNET */}
        {step === 2 && (
          <div className="fade">
            <div style={{fontFamily:'Oswald,sans-serif',fontSize:28,color:C.white,fontWeight:700,marginBottom:8}}>{"What's your free offer?"}</div>
            <div style={{color:C.muted,fontSize:15,marginBottom:24,lineHeight:1.5}}>Your lead magnet is the first thing prospects get from you. The AI needs to know this so it can reference it at the right moment in conversations.</div>
            
            {/* Skip toggle */}
            <label style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,cursor:'pointer',padding:'12px 16px',background:skipLeadMagnet?'#2a2a2a':'transparent',border:`2px solid ${skipLeadMagnet?C.gold:'#3a3a3a'}`,borderRadius:10,transition:'all .15s'}}>
              <input type="checkbox" checked={skipLeadMagnet} onChange={e=>setSkipLeadMagnet(e.target.checked)} style={{width:18,height:18,accentColor:C.gold}}/>
              <span style={{color:skipLeadMagnet?C.gold:C.muted,fontSize:14}}>{"I don't have one yet / Not sure"}</span>
            </label>
            
            {skipLeadMagnet && (
              <div style={{background:'#2a2a2a',borderLeft:`3px solid ${C.gold}`,padding:'12px 16px',borderRadius:'0 8px 8px 0',marginBottom:20}}>
                <div style={{color:C.muted,fontSize:14,lineHeight:1.6}}>{"No problem — you need one, but we'll work with what you have for now. You can add this in Settings once you've created it. Your AI suggestions will focus on direct conversation in the meantime."}</div>
              </div>
            )}
            
            <div style={{marginBottom:20,opacity:skipLeadMagnet?0.4:1,pointerEvents:skipLeadMagnet?'none':'auto',transition:'opacity .2s'}}>
              <label style={{display:'block',color:C.gold,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:8}}>Lead magnet name</label>
              <input value={data.lead_magnet_name} onChange={e=>set('lead_magnet_name',e.target.value)} placeholder="e.g. The 5-Day Clean Eating Kickstart, Free Client Attraction Checklist" style={{width:'100%',background:'#2a2a2a',border:'2px solid #3a3a3a',color:C.white,padding:'14px 16px',borderRadius:10,fontSize:15}}/>
            </div>

            <div style={{marginBottom:20,opacity:skipLeadMagnet?0.4:1,pointerEvents:skipLeadMagnet?'none':'auto',transition:'opacity .2s'}}>
              <label style={{display:'block',color:C.gold,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:8}}>What does it do for them?</label>
              <textarea value={data.lead_magnet_description} onChange={e=>set('lead_magnet_description',e.target.value.slice(0,200))} placeholder="e.g. Shows new health coaches how to get their first 3 clients without posting every day" style={{width:'100%',background:'#2a2a2a',border:'2px solid #3a3a3a',color:C.white,padding:'14px 16px',borderRadius:10,fontSize:15,resize:'vertical',minHeight:80}}/>
              <div style={{color:C.dim,fontSize:12,textAlign:'right',marginTop:4}}>{data.lead_magnet_description.length}/200</div>
            </div>

            <div style={{marginBottom:20,opacity:skipLeadMagnet?0.4:1,pointerEvents:skipLeadMagnet?'none':'auto',transition:'opacity .2s'}}>
              <label style={{display:'block',color:C.gold,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:8}}>How do they get it? <span style={{fontWeight:400,textTransform:'none',color:C.muted}}>(select all that apply)</span></label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[
                  {id:'dm',label:'DM me for it'},
                  {id:'link_in_bio',label:'Link in bio'},
                  {id:'email_optin',label:'Email opt-in'},
                ].map(opt => {
                  const isSelected = Array.isArray(data.lead_magnet_delivery) && data.lead_magnet_delivery.includes(opt.id)
                  const isDisabled = Array.isArray(data.lead_magnet_delivery) && data.lead_magnet_delivery.includes('not_sure')
                  return (
                    <button key={opt.id} onClick={()=>{
                      if(isDisabled) return
                      const current = Array.isArray(data.lead_magnet_delivery) ? data.lead_magnet_delivery : []
                      if(isSelected) {
                        set('lead_magnet_delivery', current.filter(x => x !== opt.id))
                      } else {
                        set('lead_magnet_delivery', [...current.filter(x => x !== 'not_sure'), opt.id])
                      }
                    }} style={{
                      background: isSelected ? C.gold+'22' : '#2a2a2a',
                      border: `2px solid ${isSelected ? C.gold : '#3a3a3a'}`,
                      color: isSelected ? C.gold : C.white,
                      padding:'12px 14px',borderRadius:10,fontSize:14,cursor:isDisabled?'not-allowed':'pointer',transition:'all .15s',
                      opacity: isDisabled ? 0.4 : 1
                    }}>{opt.label}</button>
                  )
                })}
                {/* Not sure yet option */}
                {(() => {
                  const isNotSure = Array.isArray(data.lead_magnet_delivery) && data.lead_magnet_delivery.includes('not_sure')
                  return (
                    <button onClick={()=>{
                      if(isNotSure) {
                        set('lead_magnet_delivery', [])
                      } else {
                        set('lead_magnet_delivery', ['not_sure'])
                      }
                    }} style={{
                      background: isNotSure ? C.gold+'22' : '#2a2a2a',
                      border: `2px solid ${isNotSure ? C.gold : '#3a3a3a'}`,
                      color: isNotSure ? C.gold : C.white,
                      padding:'12px 14px',borderRadius:10,fontSize:14,cursor:'pointer',transition:'all .15s'
                    }}>Not sure yet</button>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: YOUR CORE OFFER */}
        {step === 3 && (
          <div className="fade">
            <div style={{fontFamily:'Oswald,sans-serif',fontSize:28,color:C.white,fontWeight:700,marginBottom:8}}>What do you sell?</div>
            <div style={{color:C.muted,fontSize:15,marginBottom:24,lineHeight:1.5}}>This is what the pipeline is ultimately building toward. The AI will never pitch this directly — but knowing it helps craft conversations that naturally lead here.</div>
            
            {/* Skip toggle */}
            <label style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,cursor:'pointer',padding:'12px 16px',background:skipOffer?'#2a2a2a':'transparent',border:`2px solid ${skipOffer?C.gold:'#3a3a3a'}`,borderRadius:10,transition:'all .15s'}}>
              <input type="checkbox" checked={skipOffer} onChange={e=>setSkipOffer(e.target.checked)} style={{width:18,height:18,accentColor:C.gold}}/>
              <span style={{color:skipOffer?C.gold:C.muted,fontSize:14}}>{"I don't have this yet / Still figuring it out"}</span>
            </label>
            
            {skipOffer && (
              <div style={{background:'#2a2a2a',borderLeft:`3px solid ${C.gold}`,padding:'12px 16px',borderRadius:'0 8px 8px 0',marginBottom:20}}>
                <div style={{color:C.muted,fontSize:14,lineHeight:1.6}}>{"Got it. You can still use the pipeline to start conversations and build relationships — just skip any CH5 suggestions until your offer is ready. Add this in Settings when you're set."}</div>
              </div>
            )}
            
            <div style={{marginBottom:20,opacity:skipOffer?0.4:1,pointerEvents:skipOffer?'none':'auto',transition:'opacity .2s'}}>
              <label style={{display:'block',color:C.gold,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:8}}>Program or offer name</label>
              <input value={data.offer_name} onChange={e=>set('offer_name',e.target.value)} placeholder="e.g. The 12-Week Body Reset, 1:1 Business Coaching Intensive" style={{width:'100%',background:'#2a2a2a',border:'2px solid #3a3a3a',color:C.white,padding:'14px 16px',borderRadius:10,fontSize:15}}/>
            </div>

            <div style={{marginBottom:20,opacity:skipOffer?0.4:1,pointerEvents:skipOffer?'none':'auto',transition:'opacity .2s'}}>
              <label style={{display:'block',color:C.gold,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:8}}>What does it deliver?</label>
              <textarea value={data.offer_description} onChange={e=>set('offer_description',e.target.value.slice(0,250))} placeholder="e.g. 12 weeks of 1:1 coaching + weekly calls + custom meal plan — clients lose 15–25lbs and build sustainable habits" style={{width:'100%',background:'#2a2a2a',border:'2px solid #3a3a3a',color:C.white,padding:'14px 16px',borderRadius:10,fontSize:15,resize:'vertical',minHeight:80}}/>
              <div style={{color:C.dim,fontSize:12,textAlign:'right',marginTop:4}}>{data.offer_description.length}/250</div>
            </div>

            <div style={{marginBottom:20,opacity:skipOffer?0.4:1,pointerEvents:skipOffer?'none':'auto',transition:'opacity .2s'}}>
              <label style={{display:'block',color:C.gold,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:8}}>Investment</label>
              <input value={data.offer_price} onChange={e=>set('offer_price',e.target.value)} placeholder="e.g. $2,500 / $497/month / $997" style={{width:'100%',background:'#2a2a2a',border:'2px solid #3a3a3a',color:C.white,padding:'14px 16px',borderRadius:10,fontSize:15}}/>
              <div style={{color:C.dim,fontSize:13,marginTop:6}}>This helps the AI calibrate conversation depth — a $200 offer needs fewer touches than a $3,000 program.</div>
            </div>

            <div style={{marginBottom:20,opacity:skipOffer?0.4:1,pointerEvents:skipOffer?'none':'auto',transition:'opacity .2s'}}>
              <label style={{display:'block',color:C.gold,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:8}}>How do you sell it?</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[
                  {id:'discovery_call',label:'Discovery call'},
                  {id:'direct_dm',label:'Direct DM close'},
                  {id:'application',label:'Application'},
                  {id:'sales_page',label:'Sales page'},
                ].map(opt => (
                  <button key={opt.id} onClick={()=>set('offer_sales_method',opt.id)} style={{
                    background: data.offer_sales_method===opt.id ? C.gold+'22' : '#2a2a2a',
                    border: `2px solid ${data.offer_sales_method===opt.id ? C.gold : '#3a3a3a'}`,
                    color: data.offer_sales_method===opt.id ? C.gold : C.white,
                    padding:'12px 14px',borderRadius:10,fontSize:14,cursor:'pointer',transition:'all .15s'
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: YOUR STORY */}
        {step === 4 && (
          <div className="fade">
            <div style={{fontFamily:'Oswald,sans-serif',fontSize:28,color:C.white,fontWeight:700,marginBottom:8}}>Why do you do this work?</div>
            <div style={{color:C.muted,fontSize:15,marginBottom:8,lineHeight:1.5}}>The best openers and positioning messages are rooted in your real story. Give the AI something true to work with.</div>
            
            {/* Skip link - subtle, reluctant to click */}
            {!skipStory && (
              <div style={{marginBottom:20}}>
                <span onClick={()=>setSkipStory(true)} style={{color:C.dim,fontSize:13,cursor:'pointer',textDecoration:'underline',opacity:0.7}}>Skip for now</span>
              </div>
            )}
            
            {skipStory && (
              <div style={{background:'#2a2a2a',borderLeft:`3px solid ${C.gold}`,padding:'12px 16px',borderRadius:'0 8px 8px 0',marginBottom:20}}>
                <div style={{color:C.muted,fontSize:14,lineHeight:1.6}}>{"Understood — but come back to this. The more the AI knows about your real story, the better your scripts will sound like YOU and not like everyone else."}</div>
                <span onClick={()=>setSkipStory(false)} style={{color:C.gold,fontSize:13,cursor:'pointer',textDecoration:'underline',marginTop:8,display:'inline-block'}}>Actually, I want to fill this out</span>
              </div>
            )}
            
            <div style={{marginBottom:20,opacity:skipStory?0.4:1,pointerEvents:skipStory?'none':'auto',transition:'opacity .2s'}}>
              <label style={{display:'block',color:C.gold,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:8}}>Your quick origin story</label>
              <textarea value={data.coach_story} onChange={e=>set('coach_story',e.target.value.slice(0,400))} placeholder="e.g. I was a personal trainer for 8 years before I figured out how to get clients consistently. Once I cracked it, I knew I had to teach other coaches the same system." style={{width:'100%',background:'#2a2a2a',border:'2px solid #3a3a3a',color:C.white,padding:'14px 16px',borderRadius:10,fontSize:15,resize:'vertical',minHeight:120}}/>
              <div style={{color:C.dim,fontSize:12,textAlign:'right',marginTop:4}}>{data.coach_story.length}/400</div>
            </div>

            <div style={{marginBottom:24,opacity:skipStory?0.4:1,pointerEvents:skipStory?'none':'auto',transition:'opacity .2s'}}>
              <label style={{display:'block',color:C.gold,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:8}}>One result you have gotten for a client (real and specific)</label>
              <textarea value={data.coach_result_example} onChange={e=>set('coach_result_example',e.target.value.slice(0,200))} placeholder="e.g. Helped a postpartum mom lose 22lbs in 14 weeks while working full time and raising two kids under 5" style={{width:'100%',background:'#2a2a2a',border:'2px solid #3a3a3a',color:C.white,padding:'14px 16px',borderRadius:10,fontSize:15,resize:'vertical',minHeight:80}}/>
              <div style={{color:C.dim,fontSize:12,textAlign:'right',marginTop:4}}>{data.coach_result_example.length}/200</div>
            </div>

            {!skipStory && (
              <div style={{background:'#2a2a2a',borderLeft:`3px solid ${C.gold}`,padding:'14px 16px',borderRadius:'0 8px 8px 0',marginBottom:20}}>
                <div style={{color:C.muted,fontSize:14,lineHeight:1.6}}>The AI will never fabricate results or put words in your mouth. It uses your story to add authenticity context — not to make claims.</div>
              </div>
            )}
          </div>
        )}

        {/* COMPLETION SCREEN */}
        {step === 5 && (
          <div className="fade" style={{textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:16}}>&#10003;</div>
            <div style={{fontFamily:'Oswald,sans-serif',fontSize:32,color:C.white,fontWeight:700,marginBottom:12}}>{"You're all set. Let's get to work."}</div>
            
            <div style={{background:'#2a2a2a',borderRadius:14,padding:'20px 24px',marginTop:24,marginBottom:24,textAlign:'left'}}>
              <div style={{color:C.gold,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:12}}>Your Profile Summary</div>
              
              <div style={{marginBottom:14}}>
                <div style={{color:C.dim,fontSize:12,textTransform:'uppercase',marginBottom:4}}>Dream Client</div>
                <div style={{color:C.white,fontSize:15,lineHeight:1.5,fontStyle:'italic'}}>"{dreamClient}"</div>
              </div>
              
              <div style={{marginBottom:14}}>
                <div style={{color:C.dim,fontSize:12,textTransform:'uppercase',marginBottom:4}}>Lead Magnet</div>
                <div style={{color:C.white,fontSize:15}}>{data.lead_magnet_name || '(None yet)'}</div>
              </div>
              
              <div>
                <div style={{color:C.dim,fontSize:12,textTransform:'uppercase',marginBottom:4}}>Core Offer</div>
                <div style={{color:C.white,fontSize:15}}>{data.offer_name} — {data.offer_price}</div>
              </div>
            </div>

            <div style={{color:C.muted,fontSize:14,lineHeight:1.6,marginBottom:28}}>Every AI suggestion in this dashboard is now personalized to your niche, your offer, and your story. You can update any of this in Settings at any time.</div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{display:'flex',gap:12,marginTop:24}}>
          {step > 1 && step < 5 && (
            <button onClick={()=>setStep(s=>s-1)} style={{flex:1,background:'transparent',border:`2px solid ${C.gold}`,color:C.gold,padding:'14px 20px',borderRadius:10,fontSize:16,fontWeight:700,fontFamily:'Oswald,sans-serif',cursor:'pointer'}}>Back</button>
          )}
          
          {step < 4 && (
            <button onClick={()=>setStep(s=>s+1)} disabled={!canProceed} style={{
              flex:1,background:canProceed?C.gold:'#3a3a3a',color:canProceed?C.black:'#666',
              padding:'14px 20px',borderRadius:10,fontSize:16,fontWeight:700,fontFamily:'Oswald,sans-serif',border:'none',
              cursor:canProceed?'pointer':'not-allowed',boxShadow:canProceed?'0 4px 16px rgba(246,189,96,0.3)':'none'
            }}>Next</button>
          )}
          
          {step === 4 && (
            <button onClick={()=>setStep(5)} disabled={!canProceed} style={{
              flex:1,background:canProceed?C.gold:'#3a3a3a',color:canProceed?C.black:'#666',
              padding:'14px 20px',borderRadius:10,fontSize:16,fontWeight:700,fontFamily:'Oswald,sans-serif',border:'none',
              cursor:canProceed?'pointer':'not-allowed',boxShadow:canProceed?'0 4px 16px rgba(246,189,96,0.3)':'none'
            }}>Review & Finish</button>
          )}
          
          {step === 5 && (
            <button onClick={handleFinish} disabled={saving} style={{
              flex:1,background:saving?'#3a3a3a':C.gold,color:saving?'#666':C.black,
              padding:'16px 20px',borderRadius:10,fontSize:18,fontWeight:700,fontFamily:'Oswald,sans-serif',border:'none',
              cursor:saving?'not-allowed':'pointer',boxShadow:saving?'none':'0 4px 16px rgba(246,189,96,0.3)'
            }}>{saving ? 'Saving...' : 'Launch My Dashboard'}</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── SETTINGS VIEW ────────────────────────────────────────────
function SettingsView({sb, profile, coachProfile}) {
  const [data, setData] = useState({
    niche_who: coachProfile?.niche_who || '',
    niche_problem: coachProfile?.niche_problem || '',
    niche_result: coachProfile?.niche_result || '',
    lead_magnet_name: coachProfile?.lead_magnet_name || '',
    lead_magnet_description: coachProfile?.lead_magnet_description || '',
    lead_magnet_delivery: coachProfile?.lead_magnet_delivery || '',
    offer_name: coachProfile?.offer_name || '',
    offer_description: coachProfile?.offer_description || '',
    offer_price: coachProfile?.offer_price || '',
    offer_sales_method: coachProfile?.offer_sales_method || '',
    coach_story: coachProfile?.coach_story || '',
    coach_result_example: coachProfile?.coach_result_example || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = (key, val) => { setData(d => ({...d, [key]: val})); setSaved(false) }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await sb.from('coach_profiles').update(data).eq('user_id', profile.id)
    setSaving(false)
    if (error) {
      alert('Error saving: ' + error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const dreamClient = data.niche_who && data.niche_problem && data.niche_result
    ? `I help ${data.niche_who} who are struggling with ${data.niche_problem} so they can ${data.niche_result}.`
    : ''

  return (
    <div style={{padding:'24px 18px 60px',maxWidth:640,margin:'0 auto'}} className="fade">
      <div style={{fontFamily:'Oswald,sans-serif',fontSize:28,color:C.black,fontWeight:700,marginBottom:6}}>Coach Profile</div>
      <div style={{color:C.dark,fontSize:15,marginBottom:24,opacity:0.7}}>Update your profile to personalize AI suggestions</div>

      {/* Niche Section */}
      <div style={{background:C.card,borderRadius:14,padding:18,boxShadow:C.shadow3d,marginBottom:20}}>
        <div style={{background:C.cardInner,borderRadius:10,padding:18}}>
          <div style={{fontFamily:'Oswald,sans-serif',fontSize:18,color:C.text,fontWeight:700,marginBottom:14,borderBottom:`2px solid ${C.gold}`,paddingBottom:8}}>Your Niche</div>
          
          <div style={{marginBottom:14}}>
            <label style={{display:'block',color:C.muted,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.3px',marginBottom:6}}>I work with...</label>
            <input value={data.niche_who} onChange={e=>set('niche_who',e.target.value.slice(0,100))} placeholder="e.g. new health coaches, postpartum moms" style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'11px 14px',borderRadius:8,fontSize:14}}/>
          </div>

          <div style={{marginBottom:14}}>
            <label style={{display:'block',color:C.muted,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.3px',marginBottom:6}}>Who are struggling with...</label>
            <input value={data.niche_problem} onChange={e=>set('niche_problem',e.target.value.slice(0,150))} placeholder="e.g. getting their first paying clients" style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'11px 14px',borderRadius:8,fontSize:14}}/>
          </div>

          <div style={{marginBottom:14}}>
            <label style={{display:'block',color:C.muted,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.3px',marginBottom:6}}>And want to...</label>
            <input value={data.niche_result} onChange={e=>set('niche_result',e.target.value.slice(0,150))} placeholder="e.g. build a full-time coaching business" style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'11px 14px',borderRadius:8,fontSize:14}}/>
          </div>

          {dreamClient && (
            <div style={{background:C.gold+'15',border:`2px solid ${C.gold}`,borderRadius:8,padding:'10px 14px'}}>
              <div style={{color:C.muted,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.3px',marginBottom:4}}>Dream Client</div>
              <div style={{color:C.text,fontSize:14,lineHeight:1.5,fontStyle:'italic'}}>"{dreamClient}"</div>
            </div>
          )}
        </div>
      </div>

      {/* Lead Magnet Section */}
      <div style={{background:C.card,borderRadius:14,padding:18,boxShadow:C.shadow3d,marginBottom:20}}>
        <div style={{background:C.cardInner,borderRadius:10,padding:18}}>
          <div style={{fontFamily:'Oswald,sans-serif',fontSize:18,color:C.text,fontWeight:700,marginBottom:14,borderBottom:`2px solid ${C.gold}`,paddingBottom:8}}>Lead Magnet</div>
          
          <div style={{marginBottom:14}}>
            <label style={{display:'block',color:C.muted,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.3px',marginBottom:6}}>Name</label>
            <input value={data.lead_magnet_name} onChange={e=>set('lead_magnet_name',e.target.value)} placeholder="e.g. The 5-Day Clean Eating Kickstart" style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'11px 14px',borderRadius:8,fontSize:14}}/>
          </div>

          <div style={{marginBottom:14}}>
            <label style={{display:'block',color:C.muted,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.3px',marginBottom:6}}>Description</label>
            <textarea value={data.lead_magnet_description} onChange={e=>set('lead_magnet_description',e.target.value.slice(0,200))} placeholder="What does it do for them?" style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'11px 14px',borderRadius:8,fontSize:14,resize:'vertical',minHeight:60}}/>
          </div>

          <div>
            <label style={{display:'block',color:C.muted,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.3px',marginBottom:6}}>Delivery Method</label>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[{id:'dm',label:'DM'},{id:'link_in_bio',label:'Link in bio'},{id:'email_optin',label:'Email'},{id:'none',label:'None'}].map(opt => (
                <button key={opt.id} onClick={()=>set('lead_magnet_delivery',opt.id)} style={{
                  background: data.lead_magnet_delivery===opt.id ? C.gold : '#f5f5f5',
                  color: data.lead_magnet_delivery===opt.id ? C.black : C.text,
                  border: `2px solid ${data.lead_magnet_delivery===opt.id ? C.gold : '#e0e0e0'}`,
                  padding:'8px 14px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'
                }}>{opt.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Core Offer Section */}
      <div style={{background:C.card,borderRadius:14,padding:18,boxShadow:C.shadow3d,marginBottom:20}}>
        <div style={{background:C.cardInner,borderRadius:10,padding:18}}>
          <div style={{fontFamily:'Oswald,sans-serif',fontSize:18,color:C.text,fontWeight:700,marginBottom:14,borderBottom:`2px solid ${C.gold}`,paddingBottom:8}}>Core Offer</div>
          
          <div style={{marginBottom:14}}>
            <label style={{display:'block',color:C.muted,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.3px',marginBottom:6}}>Program Name</label>
            <input value={data.offer_name} onChange={e=>set('offer_name',e.target.value)} placeholder="e.g. The 12-Week Body Reset" style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'11px 14px',borderRadius:8,fontSize:14}}/>
          </div>

          <div style={{marginBottom:14}}>
            <label style={{display:'block',color:C.muted,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.3px',marginBottom:6}}>Description</label>
            <textarea value={data.offer_description} onChange={e=>set('offer_description',e.target.value.slice(0,250))} placeholder="What does it deliver?" style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'11px 14px',borderRadius:8,fontSize:14,resize:'vertical',minHeight:60}}/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
            <div>
              <label style={{display:'block',color:C.muted,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.3px',marginBottom:6}}>Investment</label>
              <input value={data.offer_price} onChange={e=>set('offer_price',e.target.value)} placeholder="e.g. $2,500" style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'11px 14px',borderRadius:8,fontSize:14}}/>
            </div>
            <div>
              <label style={{display:'block',color:C.muted,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.3px',marginBottom:6}}>Sales Method</label>
              <select value={data.offer_sales_method} onChange={e=>set('offer_sales_method',e.target.value)} style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'11px 14px',borderRadius:8,fontSize:14}}>
                <option value="">Select...</option>
                <option value="discovery_call">Discovery Call</option>
                <option value="direct_dm">Direct DM Close</option>
                <option value="application">Application</option>
                <option value="sales_page">Sales Page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div style={{background:C.card,borderRadius:14,padding:18,boxShadow:C.shadow3d,marginBottom:24}}>
        <div style={{background:C.cardInner,borderRadius:10,padding:18}}>
          <div style={{fontFamily:'Oswald,sans-serif',fontSize:18,color:C.text,fontWeight:700,marginBottom:14,borderBottom:`2px solid ${C.gold}`,paddingBottom:8}}>Your Story</div>
          
          <div style={{marginBottom:14}}>
            <label style={{display:'block',color:C.muted,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.3px',marginBottom:6}}>Origin Story</label>
            <textarea value={data.coach_story} onChange={e=>set('coach_story',e.target.value.slice(0,400))} placeholder="Why do you do this work?" style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'11px 14px',borderRadius:8,fontSize:14,resize:'vertical',minHeight:80}}/>
            <div style={{color:C.dim,fontSize:11,textAlign:'right',marginTop:4}}>{data.coach_story.length}/400</div>
          </div>

          <div>
            <label style={{display:'block',color:C.muted,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',textTransform:'uppercase',letterSpacing:'.3px',marginBottom:6}}>A Real Client Result</label>
            <textarea value={data.coach_result_example} onChange={e=>set('coach_result_example',e.target.value.slice(0,200))} placeholder="e.g. Helped a postpartum mom lose 22lbs in 14 weeks..." style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'11px 14px',borderRadius:8,fontSize:14,resize:'vertical',minHeight:60}}/>
            <div style={{color:C.dim,fontSize:11,textAlign:'right',marginTop:4}}>{data.coach_result_example.length}/200</div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button onClick={handleSave} disabled={saving} style={{
        width:'100%',background:saved?'#27AE60':saving?C.muted:C.black,color:C.white,
        padding:'14px',borderRadius:10,fontSize:16,fontWeight:700,fontFamily:'Oswald,sans-serif',
        border:'none',cursor:saving?'not-allowed':'pointer',boxShadow:'0 4px 12px rgba(0,0,0,0.2)',transition:'all .2s'
      }}>
        {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
      </button>

      <div style={{color:C.muted,fontSize:13,textAlign:'center',marginTop:14,lineHeight:1.5}}>Changes affect all future AI suggestions immediately.</div>
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
    <div style={{minHeight:'100vh',background:C.gold}}>
      <GlobalStyles/>
      {toast && <Toast msg={toast}/>}
      {addOpen && <Overlay onClose={()=>setAddOpen(false)}><InviteForm onSubmit={inviteStudent} onCancel={()=>setAddOpen(false)}/></Overlay>}

      <header style={{background:C.card,padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:64,position:'sticky',top:0,zIndex:100,boxShadow:'0 4px 16px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {selected && <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:C.white,fontSize:24,cursor:'pointer'}}>←</button>}
          <img src="/images/nlh-logo.png" alt="NextLevel Healthpreneur" style={{width:38,height:38}} />
          <span style={{fontFamily:'Oswald,sans-serif',color:C.gold,fontSize:22,fontWeight:700,textTransform:'uppercase'}}>Insta Client Engine</span>
          <span style={{background:C.gold,color:C.black,fontSize:13,fontWeight:800,padding:'4px 10px',borderRadius:6,fontFamily:'Oswald,sans-serif'}}>ADMIN</span>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={()=>setAddOpen(true)} style={{background:C.gold,color:C.black,padding:'10px 18px',borderRadius:10,fontSize:15,fontWeight:700,fontFamily:'Oswald,sans-serif',border:'none',cursor:'pointer',boxShadow:'0 2px 8px rgba(232,185,49,0.4)'}}>+ Invite Student</button>
          <button onClick={()=>sb.auth.signOut()} style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:C.white,padding:'10px 16px',borderRadius:10,fontSize:15,cursor:'pointer'}}>Sign Out</button>
        </div>
      </header>

      <div style={{padding:'24px 24px 48px'}}>
        {loading ? <div style={{color:C.dark,fontSize:16,padding:40,textAlign:'center'}}>Loading...</div> :
        selected && sel ? (
          <div className="fade">
            <div style={{marginBottom:20}}>
              <div style={{fontFamily:'Oswald,sans-serif',fontSize:26,color:C.black,fontWeight:700}}>{sel.full_name||sel.email}</div>
              <div style={{color:C.dark,fontSize:15,opacity:0.7}}>{sel.email}{sel.cohort?` · Cohort: ${sel.cohort}`:''}</div>
            </div>
            <SL>Pipeline</SL>
            <div style={{display:'flex',gap:10,marginBottom:20}}>
              {CHANNELS.map(ch=>(
                <div key={ch.id} style={{flex:1,background:C.card,borderRadius:12,padding:'12px 8px',textAlign:'center',boxShadow:C.shadow3d}}>
                  <div style={{background:C.cardInner,borderRadius:8,padding:'10px 6px',borderTop:`3px solid ${ch.color}`}}>
                    <div style={{color:ch.color,fontSize:14,fontWeight:800,fontFamily:'Oswald,sans-serif',marginBottom:4}}>{ch.key}</div>
                    <div style={{color:C.text,fontSize:28,fontWeight:700,fontFamily:'monospace'}}>{chCounts(sel.id)[ch.id]||0}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:22}}>
              <div><SL>Today</SL><MetricsRow m={todayM(sel.id)}/></div>
              <div><SL>This Week</SL><MetricsRow m={weekM(sel.id)}/></div>
            </div>
            <SL>All Prospects ({prospects.filter(p=>p.user_id===sel.id).length})</SL>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {prospects.filter(p=>p.user_id===sel.id).sort((a,b)=>b.id-a.id).map(p=>{
                const ch=CHANNELS.find(c=>c.id===p.channel)
                const intent=INTENT.find(i=>i.id===p.intent)
                return (
                  <div key={p.id} style={{background:C.card,borderRadius:10,padding:4,boxShadow:C.shadow}}>
                    <div style={{background:C.cardInner,borderRadius:8,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div><span style={{color:C.text,fontSize:17,fontWeight:600}}>{p.name}</span><span style={{color:C.muted,fontSize:15,marginLeft:10}}>{p.handle}</span></div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        {intent&&<span style={{fontSize:16}}>{intent.emoji}</span>}
                        <span style={{background:ch?.color+'22',color:ch?.color,fontSize:13,fontWeight:700,padding:'3px 8px',borderRadius:6}}>{ch?.key}</span>
                        <span style={{color:C.muted,fontSize:13,fontFamily:'monospace'}}>{fmtDate(p.added_date||p.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="fade">
            <div style={{marginBottom:20}}>
              <div style={{fontFamily:'Oswald,sans-serif',fontSize:26,color:C.black,fontWeight:700}}>Student Overview</div>
              <div style={{color:C.dark,fontSize:15,opacity:0.7}}>{students.length} students</div>
            </div>
            {students.length===0 && <div style={{color:C.dark,fontSize:16,padding:'40px 0',textAlign:'center',opacity:0.6}}>No students yet. Invite your first student above.</div>}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {students.map(s=>{
                const counts=chCounts(s.id)
                const tm=todayM(s.id)
                const total=Object.values(counts).reduce((a,b)=>a+b,0)
                return (
                  <div key={s.id} onClick={()=>setSelected(s.id)} style={{background:C.card,borderRadius:14,padding:5,cursor:'pointer',transition:'all .15s',boxShadow:C.shadow3d}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 16px 48px rgba(0,0,0,0.35)'}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=C.shadow3d}}>
                    <div style={{background:C.cardInner,borderRadius:10,padding:'16px 18px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                        <div>
                          <span style={{color:C.text,fontWeight:600,fontSize:19,fontFamily:'Oswald,sans-serif'}}>{s.full_name||s.email}</span>
                          {s.cohort&&<span style={{color:C.muted,fontSize:15,marginLeft:10}}>Cohort {s.cohort}</span>}
                        </div>
                        <div style={{display:'flex',gap:14,alignItems:'center'}}>
                          <span style={{color:C.muted,fontSize:15}}>{total} prospects</span>
                          <span style={{color:tm.dms>0?'#b8941a':C.muted,fontSize:15}}>Today: {tm.dms} DMs · {tm.sales} sales</span>
                          <span style={{color:C.gold,fontSize:20,fontWeight:700}}>→</span>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:6}}>
                        {CHANNELS.map(ch=>(
                          <div key={ch.id} style={{flex:1,textAlign:'center',background:'#f5f5f5',borderRadius:8,padding:'6px 0',borderTop:`3px solid ${ch.color}`}}>
                            <div style={{color:ch.color,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif'}}>{ch.key}</div>
                            <div style={{color:C.text,fontSize:19,fontWeight:700,fontFamily:'monospace'}}>{counts[ch.id]||0}</div>
                          </div>
                        ))}
                      </div>
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
function PipelineApp({sb, profile, coachProfile}) {
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
  const [aiFor,     setAiFor]     = useState(null)
  const [welcomeDismissed, setWelcomeDismissed] = useState(true)
  const [hoveredTip, setHoveredTip] = useState(null)
  
  // AI Usage tracking state
  const [aiUsage, setAiUsage] = useState({ callsToday: 0, callsLimit: 50, callsRemaining: 50 })
  const [aiScripts, setAiScripts] = useState([])
  const [aiWarningToast, setAiWarningToast] = useState(false)
  const [aiLimitModal, setAiLimitModal] = useState(false)
  const [aiScriptsModal, setAiScriptsModal] = useState(false)
  const [aiInfoPopover, setAiInfoPopover] = useState(false)
  
  const uid = profile.id
  const pop = (msg) => { setToast(msg); setTimeout(()=>setToast(null),2400) }

  // Check localStorage for welcome banner dismissal
  useEffect(() => {
    const dismissed = localStorage.getItem('iceWelcomeDismissed')
    setWelcomeDismissed(!!dismissed)
  }, [])
  const dismissWelcome = () => {
    localStorage.setItem('iceWelcomeDismissed', 'true')
    setWelcomeDismissed(true)
  }
  
  // Fetch AI usage stats
  const fetchAiUsage = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai-usage?userId=${uid}`)
      const data = await res.json()
      if (res.ok) {
        setAiUsage({
          callsToday: data.callsToday || 0,
          callsLimit: data.callsLimit || 50,
          callsRemaining: data.callsRemaining ?? 50
        })
        setAiScripts(data.scripts || [])
      }
    } catch (err) {
      console.error('[v0] Failed to fetch AI usage:', err)
    }
  }, [uid])
  
  useEffect(() => {
    fetchAiUsage()
  }, [fetchAiUsage])
  
  // Handle AI usage update from API response
  const handleAiUsageUpdate = (usageData) => {
    if (!usageData) return
    setAiUsage({
      callsToday: usageData.callsToday || 0,
      callsLimit: usageData.callsLimit || 50,
      callsRemaining: Math.max(0, (usageData.callsLimit || 50) - (usageData.callsToday || 0))
    })
    // Show 75% warning toast if flagged
    if (usageData.showWarning) {
      setAiWarningToast(true)
      setTimeout(() => setAiWarningToast(false), 6000)
    }
    // Refresh scripts list
    fetchAiUsage()
  }

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
    pop('Touch logged')
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

  if (loading) return <Splash>Loading your pipeline...</Splash>

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
    <div style={{minHeight:'100vh',background:C.gold}}>
      <GlobalStyles/>
      {toast && <Toast msg={toast}/>}
      
      {/* AI 75% Warning Toast */}
      {aiWarningToast && (
        <div style={{position:'fixed',bottom:20,right:20,background:'#2a2a2a',borderLeft:`4px solid ${C.gold}`,borderRadius:'0 10px 10px 0',padding:'16px 20px',maxWidth:360,zIndex:600,boxShadow:'0 8px 32px rgba(0,0,0,0.3)',animation:'slideIn .3s ease'}}>
          <button onClick={()=>setAiWarningToast(false)} style={{position:'absolute',top:8,right:10,background:'none',border:'none',color:C.muted,fontSize:18,cursor:'pointer'}}>×</button>
          <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
            <span style={{color:C.gold,fontSize:20}}>⚡</span>
            <div>
              <div style={{color:C.white,fontSize:14,fontWeight:600,marginBottom:6}}>{"Heads up — you've used 75% of today's AI suggestions."}</div>
              <div style={{color:C.muted,fontSize:13,lineHeight:1.5}}>{"That's totally fine. Just a reminder that the real work happens in the DMs, not in here. Your scripts are ready — go send them."}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Limit Reached Modal */}
      {aiLimitModal && (
        <Overlay onClose={()=>setAiLimitModal(false)}>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'Oswald,sans-serif',fontSize:22,color:C.text,fontWeight:700,marginBottom:14}}>{"You've maxed out today's AI suggestions. Honestly? Good."}</div>
            <div style={{color:C.muted,fontSize:15,lineHeight:1.7,marginBottom:8,textAlign:'left'}}>
              {"50 AI-assisted ideas in one day means you've been putting in the work — and that's the whole point."}
            </div>
            <div style={{color:C.muted,fontSize:15,lineHeight:1.7,marginBottom:8,textAlign:'left'}}>
              {"Here's the thing: the coaches who get clients fastest aren't the ones who craft the perfect message. They're the ones who send more messages. Your scripts from today are already good enough."}
            </div>
            <div style={{color:C.text,fontSize:16,fontWeight:600,marginBottom:20,textAlign:'left'}}>Go send them.</div>
            <div style={{color:C.muted,fontSize:14,marginBottom:20,textAlign:'left'}}>{"Your AI suggestions reset tomorrow at midnight. The pipeline doesn't wait."}</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <GoldBtn full onClick={()=>{setAiLimitModal(false);setView('pipeline')}} style={{background:C.gold,color:C.black}}>{"Go Work My Pipeline →"}</GoldBtn>
              <button onClick={()=>{setAiLimitModal(false);setAiScriptsModal(true)}} style={{background:'none',border:'none',color:C.muted,fontSize:13,cursor:'pointer',textDecoration:'underline'}}>{"View today's generated scripts"}</button>
            </div>
          </div>
        </Overlay>
      )}
      
      {/* Today's AI Scripts Modal */}
      {aiScriptsModal && (
        <Overlay onClose={()=>setAiScriptsModal(false)}>
          <div style={{maxHeight:'70vh',overflowY:'auto'}}>
            <div style={{fontFamily:'Oswald,sans-serif',fontSize:20,color:C.text,fontWeight:700,marginBottom:14}}>{"Today's AI Scripts"}</div>
            {aiScripts.length === 0 ? (
              <div style={{color:C.muted,fontSize:14,textAlign:'center',padding:'20px 0'}}>No scripts generated today yet.</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {aiScripts.map((script, idx) => {
                  const ch = CHANNELS.find(c => c.id === script.channel)
                  return (
                    <div key={script.id || idx} style={{background:'#f5f5f5',borderRadius:10,padding:14,border:'1px solid #e0e0e0'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          {script.prospect_name && <span style={{color:C.text,fontSize:14,fontWeight:600}}>{script.prospect_name}</span>}
                          {script.prospect_handle && <span style={{color:C.muted,fontSize:13}}>{script.prospect_handle}</span>}
                          {ch && <span style={{background:ch.color+'22',color:ch.color,fontSize:11,fontWeight:700,padding:'2px 6px',borderRadius:4}}>{ch.key}</span>}
                        </div>
                        <span style={{color:C.dim,fontSize:11}}>{new Date(script.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                      <div style={{color:C.text,fontSize:13,lineHeight:1.6,whiteSpace:'pre-wrap',maxHeight:150,overflowY:'auto'}}>{script.generated_output}</div>
                      <button onClick={()=>{navigator.clipboard.writeText(script.generated_output);pop('Copied!')}} style={{marginTop:10,background:C.black,color:C.white,border:'none',padding:'6px 12px',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>Copy</button>
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{marginTop:16}}>
              <GhostBtn full onClick={()=>setAiScriptsModal(false)}>Close</GhostBtn>
            </div>
          </div>
        </Overlay>
      )}
      
      {/* AI Info Popover */}
      {aiInfoPopover && (
        <div onClick={()=>setAiInfoPopover(false)} style={{position:'fixed',inset:0,zIndex:550}}>
          <div onClick={e=>e.stopPropagation()} style={{position:'fixed',top:70,right:180,background:'#2a2a2a',borderRadius:12,padding:20,maxWidth:340,boxShadow:'0 12px 40px rgba(0,0,0,0.4)',zIndex:551}}>
            <div style={{fontFamily:'Oswald,sans-serif',fontSize:16,color:C.white,fontWeight:700,marginBottom:14}}>Your 50 daily AI calls — what counts and what doesn{"'"}t</div>
            
            <div style={{borderBottom:`1px solid ${C.gold}33`,paddingBottom:12,marginBottom:12}}>
              <div style={{color:C.gold,fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.3px',marginBottom:8}}>Uses an AI call (counts toward your 50)</div>
              <div style={{color:C.muted,fontSize:13,lineHeight:1.7}}>
                <div>✦ Generate First Touch Script (when adding a prospect)</div>
                <div>✦ Coach Sarah AI Suggestion (on any prospect card)</div>
              </div>
            </div>
            
            <div style={{marginBottom:14}}>
              <div style={{color:'#27AE60',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.3px',marginBottom:8}}>Never uses AI calls (always free)</div>
              <div style={{color:C.muted,fontSize:13,lineHeight:1.7}}>
                <div>✓ Viewing channel scripts and the Script Library</div>
                <div>✓ The Guide page</div>
                <div>✓ Daily Workflow and Power Hour tracker</div>
                <div>✓ Moving prospects between channels</div>
                <div>✓ Tracking your daily numbers</div>
                <div>✓ The "Where does this person go?" channel helper</div>
                <div>✓ Everything else in the dashboard</div>
              </div>
            </div>
            
            <div style={{color:C.dim,fontSize:11,lineHeight:1.5,borderTop:`1px solid #3a3a3a`,paddingTop:10}}>
              {"AI calls reset every day at midnight. The core pipeline system never requires AI — it's here to help when you're stuck, not to replace your judgment."}
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <Overlay onClose={()=>setConfirmDel(null)}>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'Oswald,sans-serif',fontSize:20,color:C.text,fontWeight:700,marginBottom:10}}>Remove Prospect?</div>
            <div style={{color:C.muted,fontSize:15,marginBottom:22}}>Permanently deletes {prospects.find(p=>p.id===confirmDel)?.name} and all touch history.</div>
            <div style={{display:'flex',gap:10}}>
              <GhostBtn full onClick={()=>setConfirmDel(null)}>Cancel</GhostBtn>
              <GoldBtn full onClick={()=>deleteProspect(confirmDel)} style={{background:C.red,color:C.white}}>Remove</GoldBtn>
            </div>
          </div>
        </Overlay>
      )}

      {/* HEADER */}
      <header style={{background:C.card,padding:'0 20px',display:'flex',alignItems:'center',justifyContent:'space-between',height:64,position:'sticky',top:0,zIndex:200,boxShadow:'0 4px 16px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {(view!=='pipeline')&&<button onClick={()=>setView('pipeline')} style={{background:'none',border:'none',color:C.white,fontSize:26,cursor:'pointer',padding:'0 3px'}}>←</button>}
          <img src="/images/nlh-logo.png" alt="NextLevel Healthpreneur" style={{width:38,height:38}} />
          <span style={{fontFamily:'Oswald,sans-serif',color:C.gold,fontSize:22,fontWeight:700,textTransform:'uppercase'}}>Insta Client Engine</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {/* AI Usage Counter - subtle, left of nav buttons */}
          <div style={{display:'flex',alignItems:'center',gap:6,marginRight:8,position:'relative'}}>
            <span style={{
              color: aiUsage.callsRemaining === 0 ? '#C0392B88' : aiUsage.callsRemaining <= 12 ? C.gold : C.muted,
              fontSize:14
            }}>⚡</span>
            <span style={{
              color: aiUsage.callsRemaining === 0 ? '#C0392B88' : aiUsage.callsRemaining <= 12 ? C.gold : C.muted,
              fontSize:12
            }}>
              {aiUsage.callsRemaining === 0 ? 'AI calls used for today' : `${aiUsage.callsRemaining} AI calls left today`}
            </span>
            {aiUsage.callsToday > 0 && (
              <button onClick={()=>setAiScriptsModal(true)} title="View today's scripts" style={{background:'none',border:'none',color:C.muted,fontSize:12,cursor:'pointer',padding:'2px 4px'}}>📋</button>
            )}
            <button onClick={()=>setAiInfoPopover(!aiInfoPopover)} title="What uses AI calls?" style={{background:'none',border:'none',color:C.dim,fontSize:11,cursor:'pointer',padding:'2px 4px',textDecoration:'underline'}}>?</button>
          </div>
          
          {['pipeline','daily','guide','settings'].map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{background:view===v?C.gold:'rgba(255,255,255,0.1)',color:view===v?C.black:C.white,padding:'10px 18px',borderRadius:10,fontSize:15,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',border:view===v?'none':'1px solid rgba(255,255,255,0.2)',cursor:'pointer',fontFamily:'Oswald,sans-serif',transition:'all .15s',boxShadow:view===v?'0 2px 8px rgba(246,189,96,0.4)':'none'}}>
                {v}
              </button>
            ))}
            <button onClick={()=>setAddOpen(true)} style={{background:C.gold,color:C.black,padding:'10px 18px',borderRadius:10,fontSize:15,fontWeight:800,fontFamily:'Oswald,sans-serif',border:'none',cursor:'pointer',marginLeft:4,boxShadow:'0 2px 8px rgba(232,185,49,0.4)'}}>+ Add</button>
            <button onClick={()=>sb.auth.signOut()} title="Sign out" style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:C.white,padding:'10px 14px',borderRadius:10,fontSize:16,cursor:'pointer'}}>↪</button>
        </div>
      </header>

      {/* PIPELINE */}
      {view==='pipeline' && (
        <div style={{padding:'18px 18px 48px'}} className="fade">
          {/* Welcome Banner - only shows when pipeline is empty and not dismissed */}
          {prospects.length===0 && !welcomeDismissed && (
            <div style={{background:C.card,borderLeft:`4px solid ${C.gold}`,borderRadius:'0 10px 10px 0',padding:'14px 18px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
              <div style={{color:C.white,fontSize:15,lineHeight:1.6}}>
                <span style={{fontSize:18,marginRight:6}}>👋</span>
                <strong>Welcome to your Pipeline.</strong> Your first move: add a prospect to CH3 (Cold Activation) or CH1 (New Arrivals). Not sure where someone goes? Check the <span style={{color:C.gold,cursor:'pointer',textDecoration:'underline'}} onClick={()=>setView('guide')}>Guide</span> or click the <span style={{color:C.gold}}>?</span> on any column.
              </div>
              <button onClick={dismissWelcome} style={{background:'none',border:'none',color:C.muted,fontSize:18,cursor:'pointer',padding:0,lineHeight:1}}>×</button>
            </div>
          )}

          {/* Metrics bar with progress indicators */}
          <div style={{display:'flex',gap:8,marginBottom:18,flexWrap:'wrap'}}>
            {[{k:'dms',l:'DMs',i:'✉',t:60},{k:'replies',l:'Replies',i:'↩',t:20},{k:'emails',l:'Emails',i:'◎',t:5},{k:'offers',l:'Offers',i:'◇',t:5},{k:'sales',l:'Sales',i:'★',t:1}].map(m=>{
              const v=today[m.k]||0,pct=Math.min(100,(v/m.t)*100),hit=v>=m.t
              // Progress status colors: grey=0%, yellow=1-49%, blue=50-79%, green=80-100%
              const statusColor = pct===0 ? '#aaa' : pct<50 ? '#D4AC0D' : pct<80 ? C.blue : '#27AE60'
              return (
                <div key={m.k} style={{flex:'1 1 120px',background:C.card,borderRadius:12,padding:4,boxShadow:C.shadow3d}}>
                  <div style={{background:C.cardInner,borderRadius:9,padding:'12px 14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <span style={{color:C.muted,fontSize:13,textTransform:'uppercase',letterSpacing:'.3px',fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
                        {m.i} {m.l}
                        <span style={{width:8,height:8,borderRadius:'50%',background:statusColor,display:'inline-block'}}/>
                        {hit && <span style={{color:C.gold,fontSize:14}}>⭐</span>}
                      </span>
                      <div style={{display:'flex',gap:4}}>
                        <button onClick={()=>bumpMetric(m.k,-1)} style={{background:'#f0f0f0',color:C.text,width:26,height:26,borderRadius:8,fontSize:16,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                        <button onClick={()=>bumpMetric(m.k,1)} style={{background:C.gold,color:C.black,width:26,height:26,borderRadius:8,fontSize:14,fontWeight:700,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(232,185,49,0.3)'}}>+</button>
                      </div>
                    </div>
                    <div style={{fontFamily:'monospace',fontSize:26,fontWeight:700,color:hit?'#b8941a':C.text,lineHeight:1}}>{v}<span style={{fontSize:13,color:C.muted}}>/{m.t}</span></div>
                    <div style={{marginTop:8,height:4,background:'#f0f0f0',borderRadius:4}}><div style={{width:`${pct}%`,height:'100%',background:hit?C.gold:statusColor,borderRadius:4,transition:'width .3s'}}/></div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Filters */}
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search..." style={{background:C.white,border:'2px solid #d4d4d4',color:C.text,padding:'10px 16px',borderRadius:10,fontSize:16,width:200,outline:'none'}}/>
            {CHANNELS.map(ch=>(
              <button key={ch.id} onClick={()=>setFilterCh(filterCh===ch.id?null:ch.id)} style={{background:filterCh===ch.id?ch.color:C.white,color:filterCh===ch.id?'#fff':C.text,border:`2px solid ${filterCh===ch.id?ch.color:'#d4d4d4'}`,padding:'9px 14px',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'Oswald,sans-serif',transition:'all .15s',boxShadow:filterCh===ch.id?'0 2px 8px rgba(0,0,0,0.15)':'none'}}>
                {ch.key}
              </button>
            ))}
            {INTENT.map(i=>(
              <button key={i.id} onClick={()=>setFilterInt(filterInt===i.id?null:i.id)} style={{background:filterInt===i.id?i.color+'22':C.white,color:filterInt===i.id?i.color:C.dim,border:`2px solid ${filterInt===i.id?i.color:'#d4d4d4'}`,padding:'9px 14px',borderRadius:10,fontSize:18,cursor:'pointer',transition:'all .15s'}}>{i.emoji}</button>
            ))}
            {(filterCh||filterInt||q)&&<button onClick={()=>{setFilterCh(null);setFilterInt(null);setQ('')}} style={{background:'none',border:'none',color:C.dark,fontSize:15,cursor:'pointer',textDecoration:'underline'}}>Clear</button>}
            <span style={{marginLeft:'auto',color:C.dark,fontSize:16,fontWeight:600}}>{visible.length}/{prospects.length}</span>
          </div>

          {/* Kanban */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
            {CHANNELS.map(ch=>{
              const cards=visible.filter(p=>p.channel===ch.id)
              const open=scriptCh===ch.id
              return (
                <div key={ch.id} style={{background:C.card,borderRadius:16,overflow:'hidden',boxShadow:C.shadow3d}}>
                  <div style={{background:C.cardInner,margin:4,marginBottom:0,borderRadius:'12px 12px 0 0',padding:'14px 14px',borderBottom:`3px solid ${ch.color}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,position:'relative'}}>
                        <span style={{background:ch.color,color:'#fff',fontSize:14,fontWeight:800,padding:'4px 10px',borderRadius:6,fontFamily:'Oswald,sans-serif'}}>{ch.key}</span>
                        <span style={{color:C.text,fontSize:18,fontWeight:600,fontFamily:'Oswald,sans-serif'}}>{ch.name}</span>
                        {/* Tooltip trigger */}
                        <span 
                          onMouseEnter={()=>setHoveredTip(ch.id)} 
                          onMouseLeave={()=>setHoveredTip(null)}
                          onClick={()=>setHoveredTip(hoveredTip===ch.id?null:ch.id)}
                          style={{width:18,height:18,borderRadius:'50%',background:'#e0e0e0',color:C.muted,fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>?</span>
                        {/* Tooltip */}
                        {hoveredTip===ch.id && (
                          <div style={{position:'absolute',top:'100%',left:0,marginTop:8,background:C.card,border:`2px solid ${C.gold}`,borderRadius:10,padding:'10px 14px',color:C.white,fontSize:13,lineHeight:1.5,maxWidth:240,zIndex:100,boxShadow:'0 4px 12px rgba(0,0,0,0.3)'}}>
                            <div style={{position:'absolute',top:-8,left:20,width:0,height:0,borderLeft:'8px solid transparent',borderRight:'8px solid transparent',borderBottom:`8px solid ${C.gold}`}}/>
                            {CHANNEL_TIPS[ch.id]}
                          </div>
                        )}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <span style={{color:C.text,fontWeight:700,fontSize:24,fontFamily:'monospace'}}>{chCount(ch.id)}</span>
                        <button onClick={()=>setScriptCh(open?null:ch.id)} style={{background:open?C.gold:'#f0f0f0',color:open?C.black:C.muted,width:28,height:28,borderRadius:8,fontSize:15,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .12s'}} title="Toggle Script">📋</button>
                      </div>
                    </div>
                    <div style={{color:C.muted,fontSize:15,lineHeight:1.4}}>{ch.tagline}</div>
                    <div style={{color:ch.color,fontSize:15,marginTop:3,fontWeight:600}}>{ch.daily}</div>
                  </div>

                  {open && (
                    <div style={{background:'#fafafa',margin:'0 4px',borderBottom:'1px solid #e0e0e0',padding:'14px 14px',maxHeight:300,overflowY:'auto'}} className="fade">
                      <div style={{color:ch.color,fontSize:13,fontWeight:700,textTransform:'uppercase',letterSpacing:'.4px',marginBottom:10,fontFamily:'Oswald,sans-serif'}}>Script</div>
                      <pre style={{color:'#4a5568',fontSize:14,whiteSpace:'pre-wrap',lineHeight:1.7,fontFamily:'monospace'}}>{ch.script}</pre>
                    </div>
                  )}

                  <div style={{padding:'8px 4px 4px',display:'flex',flexDirection:'column',gap:4}}>
                    {cards.length===0&&(
                      <div style={{color:C.white,fontSize:14,textAlign:'center',padding:'16px 10px',opacity:.5,lineHeight:1.5}}>
                        {EMPTY_NUDGES[ch.id]}
                      </div>
                    )}
                    {cards.map(p=>{
                      const intentCfg=INTENT.find(i=>i.id===p.intent)
                      const pts=pTouches(p.id)
                      const last=pts.length?pts[pts.length-1]:null
                      return (
                        <div key={p.id} onClick={()=>{setFocusId(p.id);setView('detail')}}
                          style={{background:C.cardInner,borderRadius:10,padding:'12px 14px',cursor:'pointer',transition:'all .15s',margin:'0 0 2px',boxShadow:'0 1px 4px rgba(0,0,0,0.1)'}}
                          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,0.2)'}}
                          onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.1)'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{color:C.text,fontWeight:600,fontSize:17,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                              <div style={{color:C.muted,fontSize:15}}>{p.handle}</div>
                            </div>
                            {intentCfg&&<span style={{fontSize:18,marginLeft:2}}>{intentCfg.emoji}</span>}
                          </div>
                          {last&&<div style={{color:C.muted,fontSize:14,marginBottom:5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{last.touch_type} · {fmtDate(last.touch_date)}</div>}
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{color:C.muted,fontSize:14}}>{pts.length} touches</span>
                            <div style={{display:'flex',gap:4}}>
                              {ch.id>1&&<button onClick={e=>{e.stopPropagation();moveProspect(p.id,ch.id-1)}} style={{background:'#f0f0f0',color:C.text,width:28,height:28,borderRadius:8,fontSize:15,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>}
                              {ch.id<5&&<button onClick={e=>{e.stopPropagation();moveProspect(p.id,ch.id+1)}} style={{background:ch.color+'22',color:ch.color,width:28,height:28,borderRadius:8,fontSize:15,fontWeight:700,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>→</button>}
                              <button onClick={e=>{e.stopPropagation();setTouchFor(p.id)}} style={{background:C.gold,color:C.black,width:28,height:28,borderRadius:8,fontSize:17,fontWeight:700,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(232,185,49,0.3)'}}>+</button>
                            </div>
                          </div>
                          {/* AI suggestion text link - demoted, only appears after touch info */}
                          <div style={{marginTop:8,paddingTop:6,borderTop:'1px solid #f0f0f0'}}>
                            <span 
                              onClick={e=>{e.stopPropagation();setAiFor({id:p.id,channel:ch.id})}} 
                              style={{color:C.dim,fontSize:12,cursor:'pointer',transition:'color .15s'}}
                              onMouseEnter={e=>e.currentTarget.style.color=C.gold}
                              onMouseLeave={e=>e.currentTarget.style.color=C.dim}
                            >
                              {"Need a next move? → Ask Coach Sarah AI"}
                            </span>
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

      {/* DAILY */}
      {view==='daily' && (
        <div style={{padding:'24px 24px 48px',maxWidth:780,margin:'0 auto'}} className="fade">
          <div style={{fontFamily:'Oswald,sans-serif',fontSize:28,color:C.black,fontWeight:700,marginBottom:4}}>Daily Workflow</div>
          <div style={{color:C.dark,fontSize:15,marginBottom:24,opacity:0.7}}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>

          <SL>60-Minute Power Hour</SL>
          {[
            {time:'0-5 min', task:'Review & Plan', color:C.muted, d:"Check overnight replies. Update channel statuses. Pick today's CH3 targets."},
            {time:'5-20 min', task:'CH5 First — Hot Leads', color:C.red, d:"Closest-to-closing conversations first. Soft offers, objections, closes."},
            {time:'20-35 min', task:'CH2 Warm Conversations', color:C.orange, d:"Add value, keep relationships moving. Target: 20-30 touches."},
            {time:'35-55 min', task:'CH3 Cold Outreach', color:C.purple, d:"Send 20-30 opening DMs. Personalize each. No copy-paste."},
            {time:'55-60 min', task:'Track Your Numbers', color:C.gold, d:"Log DMs, replies, emails, offers, sales below."},
          ].map((s,i)=>(
            <div key={i} style={{display:'flex',gap:12,marginBottom:10}}>
              <div style={{width:70,flexShrink:0,color:s.color,fontFamily:'monospace',fontSize:12,paddingTop:14,textAlign:'right',fontWeight:600}}>{s.time}</div>
              <div style={{flex:1,background:C.card,borderRadius:12,padding:4,boxShadow:C.shadow}}>
                <div style={{background:C.cardInner,borderRadius:9,borderLeft:`4px solid ${s.color}`,padding:'12px 16px'}}>
                  <div style={{color:C.text,fontWeight:600,fontSize:16,fontFamily:'Oswald,sans-serif'}}>{s.task}</div>
                  <div style={{color:C.muted,fontSize:14,marginTop:3,lineHeight:1.5}}>{s.d}</div>
                </div>
              </div>
            </div>
          ))}

          <div style={{marginTop:26,marginBottom:10}}><SL>{"Today's Numbers"}</SL></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:24}}>
            {[{k:'dms',l:'DMs',i:'✉',t:60},{k:'replies',l:'Replies',i:'↩',t:20},{k:'emails',l:'Emails',i:'◎',t:5},{k:'offers',l:'Offers',i:'◇',t:5},{k:'sales',l:'Sales',i:'★',t:1}].map(m=>{
              const v=today[m.k]||0,hit=v>=m.t
              return (
                <div key={m.k} style={{background:C.card,borderRadius:12,padding:4,boxShadow:C.shadow3d}}>
                  <div style={{background:C.cardInner,borderRadius:9,padding:'14px 10px',textAlign:'center'}}>
                    <div style={{color:C.muted,fontSize:12,textTransform:'uppercase',letterSpacing:'.4px',marginBottom:6,fontWeight:600}}>{m.i} {m.l}</div>
                    <div style={{fontFamily:'monospace',fontSize:32,fontWeight:700,color:hit?'#b8941a':C.text,lineHeight:1}}>{v}</div>
                    <div style={{color:C.muted,fontSize:11,marginBottom:10}}>/{m.t}</div>
                    <div style={{display:'flex',gap:5,justifyContent:'center'}}>
                      <button onClick={()=>bumpMetric(m.k,-1)} style={{background:'#f0f0f0',color:C.text,width:28,height:28,borderRadius:8,fontSize:16,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                      <button onClick={()=>bumpMetric(m.k,1)} style={{background:C.gold,color:C.black,width:28,height:28,borderRadius:8,fontSize:14,fontWeight:700,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(232,185,49,0.3)'}}>+</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <SL>Pipeline Snapshot</SL>
          <div style={{display:'flex',gap:8}}>
            {CHANNELS.map(ch=>(
              <div key={ch.id} style={{flex:1,background:C.card,borderRadius:12,padding:4,boxShadow:C.shadow3d}}>
                <div style={{background:C.cardInner,borderRadius:9,borderTop:`4px solid ${ch.color}`,padding:'12px 8px',textAlign:'center'}}>
                  <div style={{color:ch.color,fontSize:12,fontWeight:800,fontFamily:'Oswald,sans-serif',marginBottom:3}}>{ch.key}</div>
                  <div style={{color:C.text,fontSize:22,fontWeight:700,fontFamily:'monospace'}}>{chCount(ch.id)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GUIDE */}
      {view==='guide' && (
        <div style={{padding:'24px 18px 60px',maxWidth:860,margin:'0 auto'}} className="fade">
          <div style={{fontFamily:'Oswald,sans-serif',fontSize:32,color:C.black,fontWeight:700,marginBottom:6}}>How The Pipeline Works</div>
          <div style={{fontFamily:'Oswald,sans-serif',fontSize:20,color:C.dark,fontWeight:500,marginBottom:20,opacity:0.7}}>Your Plain English Guide</div>

          <div style={{background:C.card,borderRadius:16,padding:22,boxShadow:C.shadow3d,marginBottom:28}}>
            <div style={{background:C.cardInner,borderRadius:10,padding:20}}>
              <p style={{color:C.text,fontSize:17,lineHeight:1.7}}>
                This dashboard is your client-getting machine. Every person you talk to on Instagram belongs in one of 5 channels.
                Your only job is to figure out which channel they're in — then do the next right thing. That's it. No guessing. No winging it.
              </p>
            </div>
          </div>

          {/* CH1 */}
          <div style={{background:C.card,borderRadius:16,padding:20,boxShadow:C.shadow3d,marginBottom:22}}>
            <div style={{background:C.cardInner,borderRadius:10,padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <span style={{background:C.blue,color:'#fff',fontSize:15,fontWeight:800,padding:'5px 12px',borderRadius:8,fontFamily:'Oswald,sans-serif'}}>CH1</span>
                <span style={{fontFamily:'Oswald,sans-serif',fontSize:22,fontWeight:700,color:C.text}}>New Arrivals</span>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Who Goes Here</div>
                <p style={{color:C.text,fontSize:16,lineHeight:1.6}}>Someone just followed you or you just followed them — first contact hasn't happened yet.</p>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Your Goal</div>
                <p style={{color:C.text,fontSize:16,lineHeight:1.6}}>Open a conversation. That's it. One genuine message to start the relationship.</p>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>What You Say</div>
                <pre style={{background:'#f5f3ee',border:'1px solid #e8e4db',borderRadius:10,padding:16,fontSize:15,whiteSpace:'pre-wrap',lineHeight:1.6,fontFamily:'monospace',color:C.text,overflowX:'auto'}}>
{`"Hey [Name]! Thanks for the follow — just checked out your page and love [SPECIFIC OBSERVATION].

Quick question — what brought you over to my corner of Instagram?"`}
                </pre>
              </div>
              <div style={{background:C.blue+'15',border:`1px solid ${C.blue}33`,borderRadius:10,padding:14}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.blue,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>What Happens Next</div>
                <p style={{color:C.text,fontSize:15,lineHeight:1.6}}>If they reply: move to CH2. If no reply after 48hrs: move to CH4 to warm them up.</p>
              </div>
            </div>
          </div>

          {/* CH2 */}
          <div style={{background:C.card,borderRadius:16,padding:20,boxShadow:C.shadow3d,marginBottom:22}}>
            <div style={{background:C.cardInner,borderRadius:10,padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <span style={{background:C.orange,color:'#fff',fontSize:15,fontWeight:800,padding:'5px 12px',borderRadius:8,fontFamily:'Oswald,sans-serif'}}>CH2</span>
                <span style={{fontFamily:'Oswald,sans-serif',fontSize:22,fontWeight:700,color:C.text}}>Warm Conversations</span>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Who Goes Here</div>
                <p style={{color:C.text,fontSize:16,lineHeight:1.6}}>They're talking to you. A real conversation is happening — they've replied at least once.</p>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Your Goal</div>
                <p style={{color:C.text,fontSize:16,lineHeight:1.6}}>Add value and build trust until you can open the sales window. No pitching yet.</p>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>What You Say</div>
                <pre style={{background:'#f5f3ee',border:'1px solid #e8e4db',borderRadius:10,padding:16,fontSize:15,whiteSpace:'pre-wrap',lineHeight:1.6,fontFamily:'monospace',color:C.text,overflowX:'auto'}}>
{`VALUE-ADD: "Hey — saw this and thought of what you shared about [their struggle]. Thought it might be useful: [tip or resource]. How's it going with [their goal] this week?"

LEAD MAGNET (after 2-3 exchanges): "Do you have [topic] figured out? Given what you're working on, I think [LEAD MAGNET] would be genuinely useful. Want me to send it over?"

WHEN THEY ASK WHAT YOU DO: "I work with [avatar] who are dealing with [struggle] to help them [result] in [timeframe]. Is that kind of where you are right now?"`}
                </pre>
              </div>
              <div style={{background:C.orange+'15',border:`1px solid ${C.orange}33`,borderRadius:10,padding:14}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.orange,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>What Happens Next</div>
                <p style={{color:C.text,fontSize:15,lineHeight:1.6}}>If engagement goes 3-5+ exchanges deep: move to CH5. If they go cold: move to CH4.</p>
              </div>
            </div>
          </div>

          {/* CH3 */}
          <div style={{background:C.card,borderRadius:16,padding:20,boxShadow:C.shadow3d,marginBottom:22}}>
            <div style={{background:C.cardInner,borderRadius:10,padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <span style={{background:C.purple,color:'#fff',fontSize:15,fontWeight:800,padding:'5px 12px',borderRadius:8,fontFamily:'Oswald,sans-serif'}}>CH3</span>
                <span style={{fontFamily:'Oswald,sans-serif',fontSize:22,fontWeight:700,color:C.text}}>Cold Activation</span>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Who Goes Here</div>
                <p style={{color:C.text,fontSize:16,lineHeight:1.6}}>{'New targets who don\'t follow you yet. You found them through hashtags, comments, or referrals.'}</p>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Your Goal</div>
                <p style={{color:C.text,fontSize:16,lineHeight:1.6}}>Get one reply. Send a personalized curiosity opener that makes them want to respond.</p>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>What You Say</div>
                <pre style={{background:'#f5f3ee',border:'1px solid #e8e4db',borderRadius:10,padding:16,fontSize:15,whiteSpace:'pre-wrap',lineHeight:1.6,fontFamily:'monospace',color:C.text,overflowX:'auto'}}>
{`COLD DM: "Hey [Name]! I came across your page through [HOW YOU FOUND THEM] and love what you're doing with [SPECIFIC DETAIL].

I'm curious — [GENUINE QUESTION ABOUT THEIR WORK/CONTENT]?"

Keep it short. Keep it specific. No pitching.`}
                </pre>
              </div>
              <div style={{background:C.purple+'15',border:`1px solid ${C.purple}33`,borderRadius:10,padding:14}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.purple,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>What Happens Next</div>
                <p style={{color:C.text,fontSize:15,lineHeight:1.6}}>If they reply: move to CH1 or CH2 depending on warmth. If no reply: stay in CH3 for 2-3 follow-up engagements.</p>
              </div>
            </div>
          </div>

          {/* CH4 */}
          <div style={{background:C.card,borderRadius:16,padding:20,boxShadow:C.shadow3d,marginBottom:22}}>
            <div style={{background:C.cardInner,borderRadius:10,padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <span style={{background:C.green,color:'#fff',fontSize:15,fontWeight:800,padding:'5px 12px',borderRadius:8,fontFamily:'Oswald,sans-serif'}}>CH4</span>
                <span style={{fontFamily:'Oswald,sans-serif',fontSize:22,fontWeight:700,color:C.text}}>Warm-Up Engagement</span>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Who Goes Here</div>
                <p style={{color:C.text,fontSize:16,lineHeight:1.6}}>{"People you haven't DM'd yet, or who've gone cold. They need warming up before you reach out."}</p>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Your Goal</div>
                <p style={{color:C.text,fontSize:16,lineHeight:1.6}}>Get on their radar. No DMs yet — just genuine engagement with their content.</p>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>What You Do</div>
                <pre style={{background:'#f5f3ee',border:'1px solid #e8e4db',borderRadius:10,padding:16,fontSize:15,whiteSpace:'pre-wrap',lineHeight:1.6,fontFamily:'monospace',color:C.text,overflowX:'auto'}}>
{`1. Like 2-3 of their recent posts
2. Leave one genuine, thoughtful comment
3. React to their stories
4. NO DM yet — just get on their radar

Do this for 3-5 days before reaching out.`}
                </pre>
              </div>
              <div style={{background:C.green+'15',border:`1px solid ${C.green}33`,borderRadius:10,padding:14}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.green,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>What Happens Next</div>
                <p style={{color:C.text,fontSize:15,lineHeight:1.6}}>After 3-5 touches: move to CH3 (cold DM) or CH1 if they follow back.</p>
              </div>
            </div>
          </div>

          {/* CH5 */}
          <div style={{background:C.card,borderRadius:16,padding:20,boxShadow:C.shadow3d,marginBottom:28}}>
            <div style={{background:C.cardInner,borderRadius:10,padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <span style={{background:C.red,color:'#fff',fontSize:15,fontWeight:800,padding:'5px 12px',borderRadius:8,fontFamily:'Oswald,sans-serif'}}>CH5</span>
                <span style={{fontFamily:'Oswald,sans-serif',fontSize:22,fontWeight:700,color:C.text}}>Conversion Touches</span>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Who Goes Here</div>
                <p style={{color:C.text,fontSize:16,lineHeight:1.6}}>Hot leads. These people have shown real interest — they've engaged deeply and the sales window is open.</p>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Your Goal</div>
                <p style={{color:C.text,fontSize:16,lineHeight:1.6}}>Diagnose their situation, position your offer, and close. This is where the sale happens.</p>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>What You Say</div>
                <pre style={{background:'#f5f3ee',border:'1px solid #e8e4db',borderRadius:10,padding:16,fontSize:15,whiteSpace:'pre-wrap',lineHeight:1.6,fontFamily:'monospace',color:C.text,overflowX:'auto'}}>
{`DIAGNOSE: "Based on everything you've shared about [their situation], I genuinely think [your offer] would be a great fit. Here's why..."

POSITION: "What I do is help [avatar] go from [current state] to [desired result] in [timeframe]."

CLOSE: "Would it make sense to hop on a quick call so I can walk you through how it works?"

OBJECTION HANDLING: Stay curious. Ask questions. Don't push — pull.`}
                </pre>
              </div>
              <div style={{background:C.red+'15',border:`1px solid ${C.red}33`,borderRadius:10,padding:14}}>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,color:C.red,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>What Happens Next</div>
                <p style={{color:C.text,fontSize:15,lineHeight:1.6}}>Closed = celebrate + archive. Objection = stay in CH5 and handle. Ghost = one follow-up then back to CH2.</p>
              </div>
            </div>
          </div>

          {/* Golden Rule */}
          <div style={{background:C.card,borderRadius:16,padding:20,boxShadow:C.shadow3d}}>
            <div style={{background:C.gold,borderRadius:10,padding:24,textAlign:'center'}}>
              <div style={{fontFamily:'Oswald,sans-serif',fontSize:24,fontWeight:700,color:C.black,textTransform:'uppercase',letterSpacing:'1px',marginBottom:12}}>The Golden Rule of the Pipeline</div>
              <p style={{color:C.black,fontSize:18,lineHeight:1.7,maxWidth:600,margin:'0 auto',fontWeight:500}}>
                Never pitch from CH1, CH3, or CH4. Those channels exist to earn the right to have the CH5 conversation.
                Skip the relationship-building and you skip the sale.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {view==='settings' && (
        <SettingsView sb={sb} profile={profile} coachProfile={coachProfile} />
      )}

      {/* DETAIL */}
      {view==='detail' && focused && (()=>{
        const p=focused,ch=CHANNELS.find(c=>c.id===p.channel),pts=pTouches(p.id)
        return (
          <div style={{padding:'24px',maxWidth:680,margin:'0 auto'}} className="fade">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
              <div>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:26,color:C.black,fontWeight:700}}>{p.name}</div>
                <div style={{color:C.dark,fontSize:15,opacity:0.7}}>{p.handle}{p.source?` · via ${p.source}`:''}</div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span 
                  onClick={()=>setAiFor({id:p.id,channel:p.channel})} 
                  style={{color:C.dim,fontSize:13,cursor:'pointer',transition:'color .15s',marginRight:8}}
                  onMouseEnter={e=>e.currentTarget.style.color=C.gold}
                  onMouseLeave={e=>e.currentTarget.style.color=C.dim}
                >
                  {"Need a next move? → Ask Coach Sarah AI"}
                </span>
                <button onClick={()=>setTouchFor(p.id)} style={{background:C.black,color:C.white,padding:'10px 18px',borderRadius:10,fontSize:14,fontWeight:700,fontFamily:'Oswald,sans-serif',border:'none',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}}>+ Touch</button>
                <button onClick={()=>setConfirmDel(p.id)} style={{background:C.red+'22',color:C.red,padding:'8px 12px',borderRadius:8,fontSize:13,border:'none',cursor:'pointer'}}>✕</button>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <div style={{background:C.card,borderRadius:14,padding:4,boxShadow:C.shadow3d}}>
                <div style={{background:C.cardInner,borderRadius:10,padding:14}}>
                  <SL small>Channel</SL>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>
                    {CHANNELS.map(c=>(
                      <button key={c.id} onClick={()=>moveProspect(p.id,c.id)} style={{background:p.channel===c.id?c.color:'#f0f0f0',color:p.channel===c.id?'#fff':C.text,padding:'5px 10px',borderRadius:8,fontSize:12,fontWeight:700,fontFamily:'Oswald,sans-serif',border:'none',cursor:'pointer',transition:'all .12s'}}>{c.key}</button>
                    ))}
                  </div>
                  <div style={{color:ch.color,fontSize:14,fontWeight:600,fontFamily:'Oswald,sans-serif'}}>{ch.name}</div>
                  <div style={{color:C.muted,fontSize:13,marginTop:2,lineHeight:1.4}}>{ch.tagline}</div>
                </div>
              </div>
              <div style={{background:C.card,borderRadius:14,padding:4,boxShadow:C.shadow3d}}>
                <div style={{background:C.cardInner,borderRadius:10,padding:14}}>
                  <SL small>Intent Level</SL>
                  {INTENT.map(i=>(
                    <button key={i.id} onClick={()=>setIntent(p.id,i.id)} style={{display:'block',width:'100%',background:p.intent===i.id?i.color+'22':'#f5f5f5',color:p.intent===i.id?i.color:C.text,border:`1px solid ${p.intent===i.id?i.color+'44':'transparent'}`,padding:'8px 10px',borderRadius:8,fontSize:14,textAlign:'left',cursor:'pointer',marginBottom:4,fontWeight:p.intent===i.id?600:400,transition:'all .12s'}}>{i.emoji} {i.label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{background:C.card,borderRadius:12,padding:4,marginBottom:16,boxShadow:C.shadow}}>
              <div style={{background:C.cardInner,borderRadius:9,borderLeft:`4px solid ${ch.color}`,padding:'14px 16px'}}>
                <div style={{color:ch.color,fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8,fontFamily:'Oswald,sans-serif'}}>📋 Script — {ch.name}</div>
                <pre style={{color:'#4a5568',fontSize:13,whiteSpace:'pre-wrap',lineHeight:1.7,fontFamily:'monospace'}}>{ch.script}</pre>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              <div>
                <SL small>Notes</SL>
                <textarea value={p.notes||''} onChange={e=>patchProspect(p.id,{notes:e.target.value})} placeholder="Pain points, what they said..." style={{width:'100%',background:C.white,border:'2px solid #e0e0e0',color:C.text,padding:'10px 12px',borderRadius:8,fontSize:14,resize:'vertical',minHeight:80,lineHeight:1.55,outline:'none'}}/>
              </div>
              <div>
                <SL small>Email Collected</SL>
                <input value={p.email||''} onChange={e=>patchProspect(p.id,{email:e.target.value})} placeholder="email@example.com" style={{width:'100%',background:C.white,border:'2px solid #e0e0e0',color:C.text,padding:'10px 12px',borderRadius:8,fontSize:14,marginBottom:8,display:'block',outline:'none'}}/>
                <SL small>Source</SL>
                <input value={p.source||''} onChange={e=>patchProspect(p.id,{source:e.target.value})} placeholder="Where found..." style={{width:'100%',background:C.white,border:'2px solid #e0e0e0',color:C.text,padding:'10px 12px',borderRadius:8,fontSize:14,display:'block',outline:'none'}}/>
              </div>
            </div>

            <SL small>Touch History ({pts.length})</SL>
            {pts.length===0&&<div style={{color:C.dark,fontSize:14,opacity:.4,padding:'8px 0'}}>No touches logged yet.</div>}
            <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:300,overflowY:'auto'}}>
              {[...pts].reverse().map((t,i)=>(
                <div key={i} style={{background:C.card,borderRadius:8,padding:3,boxShadow:'0 2px 6px rgba(0,0,0,0.15)'}}>
                  <div style={{background:C.cardInner,borderRadius:6,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div>
                      <span style={{color:C.text,fontSize:14}}>{t.touch_type}</span>
                      {t.note&&<div style={{color:C.muted,fontSize:13,marginTop:2}}>{t.note}</div>}
                    </div>
                    <span style={{color:C.muted,fontSize:12,whiteSpace:'nowrap',marginLeft:10,fontFamily:'monospace'}}>{fmtDate(t.touch_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {addOpen&&<Overlay onClose={()=>setAddOpen(false)}><AddForm onSubmit={addProspect} onCancel={()=>setAddOpen(false)} saving={saving} userId={uid} onUsageUpdate={handleAiUsageUpdate} onLimitReached={()=>setAiLimitModal(true)} aiUsage={aiUsage}/></Overlay>}
      {touchFor&&<Overlay onClose={()=>setTouchFor(null)}><TouchForm prospect={prospects.find(p=>p.id===touchFor)} onSubmit={(type,note)=>logTouch(touchFor,type,note)} onCancel={()=>setTouchFor(null)}/></Overlay>}
      {aiFor&&<Overlay onClose={()=>setAiFor(null)}><AISuggestionForm prospect={prospects.find(p=>p.id===aiFor.id)} channel={aiFor.channel} onClose={()=>setAiFor(null)} userId={uid} onUsageUpdate={handleAiUsageUpdate} onLimitReached={()=>{setAiFor(null);setAiLimitModal(true)}} aiUsage={aiUsage}/></Overlay>}
    </div>
  )
}

// ─── SHARED UI ───────────────────────────────────────────────��
function GlobalStyles() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{background:${C.gold};color:${C.text};font-family:'Inter',sans-serif;min-height:100vh}
    ::-webkit-scrollbar{width:5px;height:5px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.2);border-radius:4px}
    button{cursor:pointer;border:none;font-family:'Inter',sans-serif}
    input,textarea{font-family:'Inter',sans-serif;outline:none}
    .fade{animation:fade .2s ease}
    @keyframes fade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
  `}</style>
}

function Splash({children}) {
  return <div style={{minHeight:'100vh',background:C.gold,display:'flex',alignItems:'center',justifyContent:'center',color:C.dark,fontSize:16,fontFamily:'Inter,sans-serif'}}><style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${C.gold}}`}</style>{children}</div>
}

function Toast({msg}) {
  return <div style={{position:'fixed',top:16,right:16,zIndex:9999,background:C.black,color:C.white,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:700,fontFamily:'Oswald,sans-serif',boxShadow:'0 4px 20px rgba(0,0,0,.3)',animation:'fade .2s ease'}}>{msg}</div>
}

function Overlay({children,onClose}) {
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:18,padding:5,width:'100%',maxWidth:460,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,0.3)'}} className="fade">
        <div style={{background:C.cardInner,borderRadius:14,padding:24}}>{children}</div>
      </div>
    </div>
  )
}

function SL({children,small}) {
  return <div style={{color:small?C.muted:C.dark,fontSize:small?11:13,textTransform:'uppercase',letterSpacing:'.5px',fontWeight:700,marginBottom:small?6:10,fontFamily:'Oswald,sans-serif'}}>{children}</div>
}

function GoldBtn({children,onClick,full,style:s={}}) {
  return <button onClick={onClick} style={{flex:full?1:undefined,background:C.black,color:C.white,border:'none',padding:'12px 16px',borderRadius:10,fontSize:15,fontWeight:700,fontFamily:'Oswald,sans-serif',width:full?'100%':undefined,cursor:'pointer',boxShadow:'0 3px 10px rgba(0,0,0,0.2)',...s}}>{children}</button>
}

function GhostBtn({children,onClick,full}) {
  return <button onClick={onClick} style={{flex:full?1:undefined,background:'#f5f5f5',color:C.text,border:'2px solid #e0e0e0',padding:'12px 16px',borderRadius:10,fontSize:15,fontFamily:'Inter,sans-serif',width:full?'100%':undefined,cursor:'pointer'}}>{children}</button>
}

function MetricsRow({m}) {
  return (
    <div style={{display:'flex',gap:6}}>
      {[['DMs',m.dms],['Replies',m.replies],['Emails',m.emails],['Offers',m.offers],['Sales',m.sales]].map(([l,v])=>(
        <div key={l} style={{flex:1,background:'#f5f5f5',borderRadius:8,padding:'8px 4px',textAlign:'center',border:'1px solid #e0e0e0'}}>
          <div style={{color:C.muted,fontSize:11,marginBottom:3}}>{l}</div>
          <div style={{color:C.text,fontSize:17,fontWeight:700,fontFamily:'monospace'}}>{v||0}</div>
        </div>
      ))}
    </div>
  )
}

function AddForm({onSubmit,onCancel,saving,userId,onUsageUpdate,onLimitReached,aiUsage}) {
  const [f,setF]=useState({name:'',handle:'',source:'',notes:'',channel:'3',intent:'cold'})
  const [sourceSelection, setSourceSelection]=useState(null)
  const [scriptLoading, setScriptLoading]=useState(false)
  const [generatedScript, setGeneratedScript]=useState(null)
  const [scriptError, setScriptError]=useState(null)
  const [copied, setCopied]=useState(false)
  const set=(k,v)=>setF(p=>({...p,[k]:v}))
  const ok=f.name.trim()&&f.handle.trim()
  
  // WHERE FOUND OPTIONS with icons, auto-channel suggestions, and guidance
  const SOURCE_OPTIONS = [
    {id:'followed',icon:'👤',label:'They followed me',channels:['1'],guidance:'New follower = 24-48hr window. Message them before they forget you exist.'},
    {id:'hashtag',icon:'#️⃣',label:'I found them via hashtag',channels:['3','4'],guidance:"Haven't connected yet — start with engagement (CH4) or go straight to a Curiosity Opener (CH3)."},
    {id:'competitor',icon:'🔍',label:"I found them via a competitor's followers",channels:['3','4'],guidance:'Verified cold prospect. Warm up with engagement first, then Curiosity Opener.'},
    {id:'engagement',icon:'💬',label:'Engagement mining (they commented/liked)',channels:['2','3'],guidance:"They've shown active intent. Strong candidate for a direct Curiosity Opener."},
    {id:'referral',icon:'🤝',label:'Referral / someone sent them',channels:['1','2'],guidance:"Warm intro = higher trust baseline. Open conversation naturally, don't pitch early."},
    {id:'talking',icon:'💭',label:"We've already been talking",channels:['2'],guidance:'Active conversation = CH2. Add value and keep building trust.'},
  ]
  
  // CHANNEL DESCRIPTIONS
  const CHANNEL_DESC = {
    '1':'They just followed you. Your job: open a conversation within 48hrs.',
    '2':"You're already talking. Your job: add value, build trust, don't rush the offer.",
    '3':'Cold target. Your job: send a personalized Curiosity Opener and get one reply.',
    '4':'Pre-DM warmup. Like, comment, react to their content for 3-5 days before messaging.',
    '5':'Hot lead. Your job: diagnose, position, and make a soft offer.',
  }
  
  // INTENT CARDS with labels and descriptions
  const INTENT_CARDS = [
    {id:'hot',emoji:'🔥',label:'Hot',desc:'Buying signals present. Asked about pricing, programs, or results. Ready for CH5.',color:'#e74c3c'},
    {id:'warm',emoji:'⚡',label:'Warm',desc:"Engaged and responsive but hasn't shown direct buying intent yet.",color:'#f39c12'},
    {id:'cold',emoji:'❄️',label:'Cold',desc:'No interaction yet or very early stage. Just starting the relationship.',color:'#3498db'},
  ]
  
  // DYNAMIC NOTES PLACEHOLDERS by channel
  const NOTES_PLACEHOLDERS = {
    '1':"What did you notice on their profile? Bio keywords, what they post about, any struggle signals. What's your opener going to reference?",
    '2':"What have they said so far? What's their goal or pain? What do they do for work? What's the next logical question?",
    '3':'What specifically caught your attention? Post topic, bio detail, comment they left somewhere. This is what your Curiosity Opener will reference.',
    '4':"What content of theirs are you going to engage with? What's their niche? What signals make them a fit?",
    '5':'What buying signals have they shown? What exact words did they use about their problem? What objections might come up?',
  }
  
  // NOTES CHECKLISTS by channel
  const NOTES_CHECKLIST = {
    '1':['What they post about','Bio keywords','Any struggle signals'],
    '2':['Their stated goal','Their biggest frustration','Where they are in their journey'],
    '3':['Specific post to reference','Bio detail','Why they\'re a fit'],
    '4':['Content themes','Engagement patterns','Niche fit signals'],
    '5':['Exact words they used','Buying signals noted','Likely objections'],
  }
  
  const selectSource = (opt) => {
    setSourceSelection(opt)
    set('source', opt.label)
    // Auto-select first recommended channel
    if(opt.channels.length>0) set('channel', opt.channels[0])
  }
  
  const canGenerateScript = sourceSelection && f.channel && (!aiUsage || aiUsage.callsRemaining > 0)
  
  const generateScript = async () => {
    if(!canGenerateScript) return
    // Check if limit reached before attempting
    if(aiUsage && aiUsage.callsRemaining <= 0) {
      onLimitReached?.()
      return
    }
    setScriptLoading(true)
    setScriptError(null)
    setGeneratedScript(null)
    try {
      const res = await fetch('/api/first-touch', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          whereFound: sourceSelection.label,
          channel: f.channel,
          intent: f.intent || 'cold',
          notes: f.notes || '',
          userId: userId,
          prospectName: f.name || null,
          prospectHandle: f.handle || null
        })
      })
      const data = await res.json()
      // Handle limit reached from server
      if(data.error === 'limit_reached') {
        onLimitReached?.()
        return
      }
      if(!res.ok) throw new Error(data.error)
      setGeneratedScript(data.script)
      // Update usage stats
      if(data.usage) {
        onUsageUpdate?.(data.usage)
      }
    } catch(err) {
      setScriptError("Couldn't generate right now — add your notes and try again.")
    } finally {
      setScriptLoading(false)
    }
  }
  
  const copyScript = () => {
    if(!generatedScript) return
    navigator.clipboard.writeText(generatedScript)
    setCopied(true)
    setTimeout(()=>setCopied(false),2000)
  }
  
  const formatScript = (text) => {
    return text.split('\n').map((line,i) => {
      if(line.startsWith('**') && line.endsWith('**')) {
        const label = line.replace(/\*\*/g,'')
        return <div key={i} style={{fontFamily:'Oswald,sans-serif',fontSize:13,fontWeight:700,color:C.gold,textTransform:'uppercase',letterSpacing:'.4px',marginTop:i>0?12:0,marginBottom:4}}>{label}</div>
      }
      if(line.trim()==='') return <div key={i} style={{height:6}}/>
      return <div key={i} style={{color:C.text,fontSize:14,lineHeight:1.6}}>{line}</div>
    })
  }
  
  return (
    <div style={{maxHeight:'75vh',overflowY:'auto',paddingRight:8}}>
      <div style={{fontFamily:'Oswald,sans-serif',fontSize:22,color:C.text,fontWeight:700,marginBottom:16}}>Add Prospect</div>
      
      {/* FIELD 1: Name + Handle */}
      {[{k:'name',l:'Full Name *',ph:'Jane Smith'},{k:'handle',l:'Handle *',ph:'@janesmith'}].map(row=>(
        <div key={row.k} style={{marginBottom:12}}>
          <SL small>{row.l}</SL>
          <input value={f[row.k]} onChange={e=>set(row.k,e.target.value)} placeholder={row.ph} style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'10px 13px',borderRadius:10,fontSize:15}}/>
        </div>
      ))}
      
      {/* FIELD 2: Where Found - Smart Selector */}
      <div style={{marginBottom:12}}>
        <SL small>Where Found</SL>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          {SOURCE_OPTIONS.map(opt=>(
            <button key={opt.id} onClick={()=>selectSource(opt)} style={{
              background:sourceSelection?.id===opt.id?C.gold+'22':C.white,
              border:`2px solid ${sourceSelection?.id===opt.id?C.gold:'#e0e0e0'}`,
              borderRadius:10,padding:'10px 12px',textAlign:'left',cursor:'pointer',transition:'all .12s',display:'flex',alignItems:'center',gap:8
            }}>
              <span style={{fontSize:18}}>{opt.icon}</span>
              <span style={{fontSize:13,color:C.text,lineHeight:1.3}}>{opt.label}</span>
            </button>
          ))}
        </div>
        {/* Guidance note */}
        {sourceSelection && (
          <div style={{marginTop:10,background:C.card,borderRadius:8,padding:'10px 14px',color:C.white,fontSize:13,lineHeight:1.5}}>
            <span style={{color:C.gold,marginRight:6}}>→</span>{sourceSelection.guidance}
          </div>
        )}
      </div>
      
      {/* FIELD 3: Starting Channel */}
      <div style={{marginBottom:12}}>
        <SL small>Starting Channel</SL>
        <div style={{display:'flex',gap:5}}>
          {CHANNELS.map(ch=>(
            <button key={ch.id} onClick={()=>set('channel',String(ch.id))} style={{flex:1,background:f.channel===String(ch.id)?ch.color:'#f5f5f5',color:f.channel===String(ch.id)?'#fff':C.text,border:`2px solid ${f.channel===String(ch.id)?ch.color:'#e0e0e0'}`,padding:'8px 0',borderRadius:8,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',cursor:'pointer',transition:'all .12s'}}>{ch.key}</button>
          ))}
        </div>
        {/* Channel description */}
        {f.channel && (
          <div style={{marginTop:8,color:C.muted,fontSize:13,lineHeight:1.5,paddingLeft:2}}>
            {CHANNEL_DESC[f.channel]}
          </div>
        )}
      </div>
      
      {/* FIELD 4: Intent Level - Cards */}
      <div style={{marginBottom:12}}>
        <SL small>Intent Level</SL>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {INTENT_CARDS.map(ic=>(
            <button key={ic.id} onClick={()=>set('intent',ic.id)} style={{
              background:f.intent===ic.id?ic.color+'15':C.white,
              border:`2px solid ${f.intent===ic.id?ic.color:'#e0e0e0'}`,
              borderRadius:10,padding:'10px 14px',textAlign:'left',cursor:'pointer',transition:'all .12s',display:'flex',alignItems:'flex-start',gap:10
            }}>
              <span style={{fontSize:20}}>{ic.emoji}</span>
              <div>
                <div style={{fontFamily:'Oswald,sans-serif',fontSize:14,fontWeight:700,color:f.intent===ic.id?ic.color:C.text}}>{ic.label}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.4,marginTop:2}}>{ic.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* FIELD 5: Notes with dynamic prompt */}
      <div style={{marginBottom:16}}>
        <SL small>Notes</SL>
        {/* Checklist reminder */}
        <div style={{background:'#fafafa',border:'1px solid #eee',borderRadius:8,padding:'8px 12px',marginBottom:8}}>
          <div style={{fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:'.3px',marginBottom:4}}>{"Don't miss these:"}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'4px 12px'}}>
            {(NOTES_CHECKLIST[f.channel]||NOTES_CHECKLIST['3']).map((item,i)=>(
              <span key={i} style={{fontSize:12,color:C.dim}}>☐ {item}</span>
            ))}
          </div>
        </div>
        <textarea value={f.notes} onChange={e=>set('notes',e.target.value)} placeholder={NOTES_PLACEHOLDERS[f.channel]||NOTES_PLACEHOLDERS['3']} style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'10px 13px',borderRadius:10,fontSize:14,resize:'vertical',minHeight:80,lineHeight:1.5}}/>
      </div>
      
      {/* Generate Script Button - SECONDARY style, visually subordinate */}
      <div style={{marginBottom:16}}>
        {/* Skip hint text */}
        <div style={{color:C.dim,fontSize:12,fontStyle:'italic',marginBottom:8,lineHeight:1.5}}>
          {"Already know what to say? Skip this — the AI is here when you're genuinely stuck, not as a replacement for your own instincts."}
        </div>
        <button 
          onClick={generateScript} 
          disabled={!canGenerateScript||scriptLoading}
          style={{
            width:'100%',
            background:'transparent',
            color:canGenerateScript&&!scriptLoading?'#6C3483':'#aaa',
            padding:'10px 14px',borderRadius:10,fontSize:13,fontWeight:600,fontFamily:'Oswald,sans-serif',
            border:`2px solid ${canGenerateScript&&!scriptLoading?'#6C3483':'#ddd'}`,
            cursor:canGenerateScript&&!scriptLoading?'pointer':'not-allowed',
            transition:'all .15s',display:'flex',alignItems:'center',justifyContent:'center',gap:8
          }}
        >
          <span style={{fontSize:14}}>✨</span>
          {scriptLoading?'Sarah\'s brain is working...':'Generate First Touch Script'}
        </button>
        
        {/* Script Error */}
        {scriptError && (
          <div style={{marginTop:10,background:C.red+'15',border:`1px solid ${C.red}33`,borderRadius:8,padding:'10px 14px',color:C.red,fontSize:13}}>{scriptError}</div>
        )}
        
        {/* Generated Script Result */}
        {generatedScript && (
          <div style={{marginTop:12,background:'#fafafa',border:'2px solid #e8e8e8',borderRadius:12,padding:16}}>
            {formatScript(generatedScript)}
            <button onClick={copyScript} style={{
              marginTop:12,width:'100%',background:copied?'#27AE60':'#6C3483',color:'#fff',
              padding:'10px 14px',borderRadius:8,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',
              border:'none',cursor:'pointer',transition:'all .15s'
            }}>
              {copied?'Copied!':'Copy Script'}
            </button>
          </div>
        )}
      </div>
      
      {/* Bottom Buttons - pinned */}
      <div style={{position:'sticky',bottom:0,background:C.cardInner,paddingTop:12,borderTop:'1px solid #eee',display:'flex',gap:8}}>
        <GhostBtn full onClick={onCancel}>Cancel</GhostBtn>
        <GoldBtn full onClick={()=>ok&&!saving&&onSubmit(f)} style={{background:ok&&!saving?C.black:'#ccc',color:ok&&!saving?C.white:C.muted,cursor:ok&&!saving?'pointer':'not-allowed'}}>{saving?'Saving...':'Add to Pipeline'}</GoldBtn>
      </div>
    </div>
  )
}

function TouchForm({prospect,onSubmit,onCancel}) {
  const [type,setType]=useState('')
  const [note,setNote]=useState('')
  const ch=CHANNELS.find(c=>c.id===(prospect?.channel||3))
  const types=[...new Set([...(ch?.touchTypes||[]),'Value-add message','Lead magnet sent','Soft offer sent','Objection handled','Discovery call booked','Sale closed','Follow-up touch','Story reaction','Comment left','Liked posts'])]
  return (
    <>
      <div style={{fontFamily:'Oswald,sans-serif',fontSize:22,color:C.text,fontWeight:700,marginBottom:6}}>Log Touch</div>
      <div style={{color:C.muted,fontSize:15,marginBottom:14}}>{prospect?.name} · <span style={{color:ch?.color,fontWeight:600}}>{ch?.name}</span></div>
      <SL small>Touch Type</SL>
      <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:14}}>
        {types.map(t=>(
          <button key={t} onClick={()=>setType(t)} style={{background:type===t?C.black:'#f5f5f5',color:type===t?C.white:C.text,border:`2px solid ${type===t?C.black:'#e0e0e0'}`,padding:'6px 12px',borderRadius:8,fontSize:13,fontWeight:type===t?700:400,cursor:'pointer',transition:'all .1s'}}>{t}</button>
        ))}
      </div>
      <div style={{marginBottom:16}}>
        <SL small>Note (optional)</SL>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="What happened? What did they say?" style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'10px 13px',borderRadius:10,fontSize:14,resize:'vertical',minHeight:70,lineHeight:1.5}}/>
      </div>
      <div style={{display:'flex',gap:8}}>
        <GhostBtn full onClick={onCancel}>Cancel</GhostBtn>
        <GoldBtn full onClick={()=>type&&onSubmit(type,note)} style={{background:type?C.gold:'#ccc',color:type?C.black:C.muted,cursor:type?'pointer':'not-allowed'}}>Log Touch</GoldBtn>
      </div>
    </>
  )
}

function AISuggestionForm({prospect, channel, onClose, userId, onUsageUpdate, onLimitReached, aiUsage}) {
  const [convoText, setConvoText] = useState('')
  const [selChannel, setSelChannel] = useState(channel || 1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const ch = CHANNELS.find(c => c.id === selChannel)

  const handleSubmit = async () => {
    if (!convoText.trim()) return
    // Check if limit reached before attempting
    if(aiUsage && aiUsage.callsRemaining <= 0) {
      onLimitReached?.()
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/ai-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationText: convoText.trim(), 
          channel: selChannel, 
          userId: userId,
          prospectName: prospect?.name || null,
          prospectHandle: prospect?.handle || null
        }),
      })
      const data = await res.json()
      // Handle limit reached from server
      if(data.error === 'limit_reached') {
        onLimitReached?.()
        return
      }
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setResult(data.suggestion)
      // Update usage stats
      if(data.usage) {
        onUsageUpdate?.(data.usage)
      }
    } catch (err) {
      setError("Sarah's brain is thinking -- try again in a moment.")
    } finally {
      setLoading(false)
    }
  }

  const copyResult = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatResult = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        const label = line.replace(/\*\*/g, '')
        return <div key={i} style={{fontFamily:'Oswald,sans-serif',fontSize:16,fontWeight:700,color:C.text,textTransform:'uppercase',letterSpacing:'.5px',marginTop:i>0?18:0,marginBottom:6,borderBottom:`2px solid ${C.gold}`,paddingBottom:4}}>{label}</div>
      }
      if (line.startsWith('- ')) {
        return <div key={i} style={{color:C.text,fontSize:15,lineHeight:1.7,paddingLeft:16,position:'relative'}}><span style={{position:'absolute',left:0,color:C.gold,fontWeight:700}}>{'>'}</span>{line.slice(2)}</div>
      }
      if (line.trim() === '') return <div key={i} style={{height:8}} />
      return <div key={i} style={{color:C.text,fontSize:15,lineHeight:1.7}}>{line}</div>
    })
  }

  return (
    <>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
        <span style={{fontSize:24}}>&#x1F9E0;</span>
        <div style={{fontFamily:'Oswald,sans-serif',fontSize:22,color:C.text,fontWeight:700}}>{"Coach Sarah AI"}</div>
      </div>
      <div style={{fontFamily:'Oswald,sans-serif',fontSize:16,color:C.gold,fontWeight:600,marginBottom:16}}>{"What's My Next Move?"}</div>

      {prospect && (
        <div style={{background:'#f5f5f5',borderRadius:10,padding:'10px 14px',marginBottom:16,border:'2px solid #e0e0e0'}}>
          <span style={{color:C.text,fontWeight:600,fontSize:15}}>{prospect.name}</span>
          <span style={{color:C.muted,fontSize:14,marginLeft:8}}>{prospect.handle}</span>
          <span style={{color:ch?.color,fontSize:13,marginLeft:8,fontWeight:600}}>{ch?.key} - {ch?.name}</span>
        </div>
      )}

      {!result ? (
        <>
          <SL small>Which channel is this person in?</SL>
          <div style={{display:'flex',gap:5,marginBottom:16}}>
            {CHANNELS.map(c => (
              <button key={c.id} onClick={() => setSelChannel(c.id)} style={{flex:1,background:selChannel===c.id?c.color:'#f5f5f5',color:selChannel===c.id?'#fff':C.text,border:`2px solid ${selChannel===c.id?c.color:'#e0e0e0'}`,padding:'8px 0',borderRadius:8,fontSize:13,fontWeight:700,fontFamily:'Oswald,sans-serif',cursor:'pointer',transition:'all .12s'}}>{c.key}</button>
            ))}
          </div>

          <SL small>Paste your last message exchange here (or describe what happened)</SL>
          <textarea
            value={convoText}
            onChange={e => setConvoText(e.target.value)}
            placeholder={"Example: I sent her a DM saying 'Hey! Love your fitness page' and she replied 'Thanks! What do you do?' and I said 'I'm a health coach' and she hasn't replied in 2 days..."}
            style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'12px 14px',borderRadius:10,fontSize:15,resize:'vertical',minHeight:120,lineHeight:1.6,marginBottom:16}}
          />

          {error && <div style={{background:C.red+'15',border:`1px solid ${C.red}33`,color:C.red,fontSize:14,padding:'10px 14px',borderRadius:10,marginBottom:14}}>{error}</div>}

          <div style={{display:'flex',gap:8}}>
            <GhostBtn full onClick={onClose}>Cancel</GhostBtn>
            <GoldBtn
              full
              onClick={handleSubmit}
              style={{
                background: loading ? C.muted : convoText.trim() ? '#6C3483' : '#ccc',
                color: loading || !convoText.trim() ? '#aaa' : '#fff',
                cursor: loading || !convoText.trim() ? 'not-allowed' : 'pointer',
                boxShadow: convoText.trim() && !loading ? '0 3px 12px rgba(108,52,131,0.3)' : 'none',
              }}
            >
              {loading ? 'Analyzing...' : 'Get My Next Move'}
            </GoldBtn>
          </div>
        </>
      ) : (
        <>
          <div style={{background:'#fafafa',border:'2px solid #e0e0e0',borderRadius:12,padding:18,marginBottom:16,maxHeight:400,overflowY:'auto'}}>
            {formatResult(result)}
          </div>

          <div style={{display:'flex',gap:8}}>
            <GhostBtn full onClick={() => { setResult(null); setConvoText('') }}>Ask Again</GhostBtn>
            <GoldBtn
              full
              onClick={copyResult}
              style={{background:'#6C3483',color:'#fff',boxShadow:'0 3px 12px rgba(108,52,131,0.3)'}}
            >
              {copied ? 'Copied!' : 'Copy Response'}
            </GoldBtn>
          </div>

          <button onClick={onClose} style={{width:'100%',marginTop:8,background:'none',border:'none',color:C.muted,fontSize:14,cursor:'pointer',padding:'8px 0'}}>Close</button>
        </>
      )}
    </>
  )
}

function InviteForm({onSubmit,onCancel}) {
  const [f,setF]=useState({email:'',fullName:'',cohort:'',password:''})
  const set=(k,v)=>setF(p=>({...p,[k]:v}))
  const ok=f.email.trim()&&f.fullName.trim()&&f.password.length>=6
  return (
    <>
      <div style={{fontFamily:'Oswald,sans-serif',fontSize:22,color:C.text,fontWeight:700,marginBottom:16}}>Invite Student</div>
      {[{k:'fullName',l:'Full Name *',ph:'Jane Smith'},{k:'email',l:'Email *',ph:'jane@example.com',t:'email'},{k:'password',l:'Temp Password *',ph:'Min 6 characters',t:'password'},{k:'cohort',l:'Cohort (optional)',ph:'Spring 2025...'}].map(row=>(
        <div key={row.k} style={{marginBottom:12}}>
          <SL small>{row.l}</SL>
          <input type={row.t||'text'} value={f[row.k]} onChange={e=>set(row.k,e.target.value)} placeholder={row.ph} style={{width:'100%',background:'#f5f5f5',border:'2px solid #e0e0e0',color:C.text,padding:'10px 13px',borderRadius:10,fontSize:15}}/>
        </div>
      ))}
      <div style={{color:C.muted,fontSize:13,marginBottom:16,lineHeight:1.5}}>Student logs in with this email + password. Ask them to change their password after first login.</div>
      <div style={{display:'flex',gap:8}}>
        <GhostBtn full onClick={onCancel}>Cancel</GhostBtn>
        <GoldBtn full onClick={()=>ok&&onSubmit(f)} style={{background:ok?C.gold:'#ccc',color:ok?C.black:C.muted,cursor:ok?'pointer':'not-allowed'}}>Create Account</GoldBtn>
      </div>
    </>
  )
}
