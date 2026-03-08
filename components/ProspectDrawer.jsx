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

// Dynamic recommendation logic based on channel, last activity, and touch count
function getRecommendedAction(channel, touchCount, notes) {
  const lastNote = notes?.[0]?.note_text?.toLowerCase() || ''
  const hasWelcomeDm = notes.some(n => n.note_text?.toLowerCase().includes('welcome dm'))
  const hasReply = notes.some(n => {
    const text = n.note_text?.toLowerCase() || ''
    return text.includes('replied') || text.includes('they said') || text.includes('she said') || 
           text.includes('he said') || text.includes('got a reply') || text.includes('responded') || 
           text.includes('messaged back')
  })
  const hasCuriosityOpener = notes.some(n => {
    const text = n.note_text?.toLowerCase() || ''
    return text.includes('curiosity opener') || text.includes('dm sent') || text.includes('opener sent')
  })
  
  switch (channel) {
    case 1: // New Arrivals
      if (touchCount === 0 && !hasWelcomeDm) {
        return "Your move: Send your welcome DM within 24–48hrs. Reference something specific from their profile in the Intel tab. Goal: one reply — nothing more."
      }
      if (hasWelcomeDm && touchCount === 1) {
        return "Your move: Welcome DM sent — now wait for their reply. While you wait, engage their content (like a post, react to a story). Do NOT send another DM yet."
      }
      if (touchCount >= 2 && !hasReply) {
        return "Your move: No reply yet — don't chase. Engage their content for 2–3 more days then consider moving them to CH4 to warm up before trying again."
      }
      if (hasReply) {
        return "Your move: They replied — move them to CH2 now. They're a warm conversation. ← Use the Move Channel button below."
      }
      return "Your move: Send your welcome DM within 24–48hrs. Reference something specific from their profile. Goal: one reply."
      
    case 2: // Warm Conversations
      if (touchCount <= 3) {
        return "Your move: Early stage — keep adding value. Ask one question that goes deeper into their situation. No positioning yet. Just be genuinely curious about them."
      }
      if (touchCount >= 4 && touchCount <= 7) {
        return "Your move: Relationship is building. Start soft positioning — reference something they've shared and naturally mention your expertise. Don't pitch. Plant seeds."
      }
      if (touchCount >= 8) {
        return "Your move: This relationship is warm enough. If they've shown any interest signals, consider moving them to CH5 for a soft offer conversation."
      }
      return "Your move: Add value. Reference something they said. Ask one question that goes deeper. Do not mention your offer yet."
      
    case 3: // Cold Activation
      if (touchCount === 0) {
        return "Your move: Don't DM yet. This person needs CH4 engagement first — move them there and warm up their radar for 3–5 days before sending anything."
      }
      if (hasCuriosityOpener) {
        return "Your move: Opener sent — now wait 48hrs. If no reply, engage their content and try a different angle. If they reply, move to CH2 immediately."
      }
      return "Your move: Send your Curiosity Opener. Reference something SPECIFIC from their profile. One question. Max 2 sentences."
      
    case 4: // Warm-Up Engagement
      if (touchCount < 3) {
        return "Your move: Keep engaging their content — like posts, leave one genuine comment, react to stories. No DM yet. You need 3–5 touches before they know your face."
      }
      if (touchCount >= 3 && touchCount < 5) {
        return "Your move: Almost ready — one or two more genuine content engagements and then move them to CH3 for your Curiosity Opener."
      }
      if (touchCount >= 5) {
        return "Your move: They know your face now. Move them to CH3 and send your Curiosity Opener today. Don't over-warm — timing matters."
      }
      return "Your move: Engage their content today — like, comment, react. No DM yet."
      
    case 5: // Conversion Touches
      if (touchCount <= 2) {
        return "Your move: Diagnose first — ask about their specific situation using their own words from your notes. Don't offer anything yet. Understand before you position."
      }
      if (touchCount >= 3 && touchCount <= 5) {
        return "Your move: You have enough context now. Make your soft offer — reference their exact problem, bridge to your program, make it optional. 'Would it be weird if I told you more about how this works?'"
      }
      if (touchCount >= 6) {
        return "Your move: If they're still here after 6 touches with no close, there's an objection that hasn't surfaced yet. Ask directly: 'What's holding you back from moving forward?' Then listen."
      }
      return "Your move: Diagnose → position → soft offer. Use their exact words from your notes."
      
    default:
      return "Your move: Review their profile and determine the best next step."
  }
}

// Smart prompt detection
function detectSmartPrompts(noteText) {
  const text = noteText?.toLowerCase() || ''
  const prompts = []
  
  // Reply detection for CH2 move
  if (text.includes('replied') || text.includes('they said') || text.includes('she said') || 
      text.includes('he said') || text.includes('got a reply') || text.includes('responded') || 
      text.includes('messaged back')) {
    prompts.push({ type: 'move_ch2', message: "Looks like they replied — ready to move them to CH2?" })
  }
  
  // Win detection
  if (text.includes('said yes') || text.includes('wants to sign up') || text.includes('ready to start') || 
      text.includes('booked a call') || text.includes('signed up') || text.includes('paid') ||
      text.includes('enrolled') || text.includes('committed')) {
    prompts.push({ type: 'mark_won', message: "Sounds like a win — ready to mark them as Won?" })
  }
  
  return prompts
}

// Smart Prompt inline component
function SmartPrompt({ prompt, prospect, onMoveChannel, onWon }) {
  const [dismissed, setDismissed] = useState(false)
  
  if (dismissed) return null
  
  // Don't show CH2 prompt if already in CH2+
  if (prompt.type === 'move_ch2' && prospect.channel >= 2) return null
  
  // Don't show won prompt if already won
  if (prompt.type === 'mark_won' && prospect.status === 'won') return null
  
  return (
    <div style={{
      background: '#333',
      borderLeft: `3px solid ${C.gold}`,
      borderRadius: '0 6px 6px 0',
      padding: '10px 12px',
      marginTop: 6,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10
    }}>
      <span style={{ color: C.dim, fontSize: 12, flex: 1 }}>{prompt.message}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {prompt.type === 'move_ch2' && (
          <button 
            onClick={() => { onMoveChannel(2); setDismissed(true); }}
            style={{ background: C.gold, color: C.black, border: 'none', padding: '6px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >Move to CH2 →</button>
        )}
        {prompt.type === 'mark_won' && (
          <button 
            onClick={() => { onWon(); setDismissed(true); }}
            style={{ background: C.green, color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >Mark as Won 🎉</button>
        )}
        <button 
          onClick={() => setDismissed(true)}
          style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 14, cursor: 'pointer', padding: '2px 4px' }}
        >×</button>
      </div>
    </div>
  )
}

const ARCHIVE_REASONS = [
  { id: 'not_fit', label: 'Not a fit' },
  { id: 'bad_timing', label: 'Bad timing — follow up later' },
  { id: 'no_response', label: 'No response after multiple touches' },
  { id: 'other', label: 'Other' },
]

// ─── SITUATION TILES ──────────────────────────────────────────
const SITUATIONS = [
  { id: 'just_followed', emoji: '📩', label: 'They just followed me', channels: [1] },
  { id: 'replied_opener', emoji: '💬', label: 'They replied to my opener', channels: [1, 2, 3] },
  { id: 'really_interested', emoji: '🔥', label: 'They seem really interested', channels: [2, 5] },
  { id: 'cold_reply', emoji: '🧊', label: 'They gave a cold/one-word reply', channels: [1, 2, 3] },
  { id: 'ghosted', emoji: '👻', label: 'They went quiet / ghosted', channels: [2, 3, 5] },
  { id: 'need_to_think', emoji: '🤔', label: 'They said they need to think about it', channels: [5] },
  { id: 'cant_afford', emoji: '💸', label: "They said they can't afford it", channels: [5] },
  { id: 'not_right_time', emoji: '⏰', label: "They said now's not the right time", channels: [5] },
  { id: 'talk_to_partner', emoji: '👫', label: 'They need to talk to their partner', channels: [5] },
  { id: 'make_offer', emoji: '🎯', label: 'I want to make an offer', channels: [5] },
  { id: 'lead_magnet', emoji: '📧', label: 'I want to offer my lead magnet', channels: [2] },
  { id: 'check_in', emoji: '🔄', label: 'I want to check in after silence', channels: [2, 3, 5] },
]

// ─── SITUATION SCRIPTS ────────────────────────────────────────
const SITUATION_SCRIPTS = {
  just_followed: {
    1: [
      { label: 'Genuine Human Opener', script: `Hey [Name] — okay your [specific thing from their content] had me. [One genuine reaction]. [One curious question about THEM as a person].\n\n💡 Fill in something you actually noticed. If you can't find anything specific — go look at their last 3 posts first.` },
      { label: 'Authority Reversal', script: `Hey [Name] — I'm actually putting together [something relevant you're building] for [your dream client type]. Your [specific thing about their profile] caught my attention — would love to get your take on something if you have a sec?` },
    ]
  },
  replied_opener: {
    1: [
      { label: 'Keep it going — 3-Step Reply', script: `Step 1 — VALIDATE: Mirror what they said. Show you actually read it.\nStep 2 — ADD VALUE: One genuine observation relevant to what they shared.\nStep 3 — ASK ONE QUESTION: Goes one level deeper.\n\n💡 If their reply was warm, consider moving them to CH2 now.` },
    ],
    2: [
      { label: '3-Step Reply Formula', script: `[VALIDATE their reply] + [ADD VALUE with one insight] + [ASK ONE question that goes deeper]\n\n💡 One question per message. Every time. Non-negotiable.` },
    ],
    3: [
      { label: 'They replied — move to CH2', script: `Great — they replied! Move them to CH2 now and continue the conversation there using the 3-Step Reply Formula.` },
    ]
  },
  really_interested: {
    2: [
      { label: 'Soft Positioning', script: `You know it's funny — what you just described about [their exact words] is literally what I see with almost every [dream client type] I work with. I've been helping [them] with [result] for a while now and the pattern is always the same. Can I ask you something kind of direct?\n\n💡 Only use this after 3–5 genuine exchanges.` },
    ],
    5: [
      { label: 'Soft Offer', script: `Based on what you shared about [their exact words describing their problem] — that's honestly exactly what [your program name] was built for. It's designed specifically for [dream client] who are dealing with [their situation]. Would it be weird if I told you a bit more about how it works?\n\n💡 The phrase "would it be weird if" is intentional — softer than "would you like to" and gets more yes responses.` },
    ]
  },
  cold_reply: {
    1: [
      { label: 'Re-engage gently', script: `No worries — sounds like you're busy! [One genuine comment about something specific from their profile]. If you ever want to chat about [their topic], I'm around.\n\n💡 Don't chase. Plant a seed and move on.` },
    ],
    2: [
      { label: 'Value-add pivot', script: `Totally get it. Hey random thought — I just saw [something relevant] and thought of you based on what you shared about [their situation]. Thought it might be useful: [tip or resource].\n\n💡 Give value, don't ask for anything.` },
    ],
    3: [
      { label: 'Acknowledge and pivot', script: `Appreciate the reply! Based on your [specific profile detail], I had a feeling [topic] might resonate. No pressure either way — just curious what your experience has been with [related question]?\n\n💡 If still cold after this, consider moving to CH4 to warm them up.` },
    ]
  },
  ghosted: {
    2: [
      { label: 'Soft check-in', script: `Hey [Name] — just thinking about what you shared about [their situation]. How's that going? Did anything shift?\n\n💡 Give them an easy opening to re-engage.` },
    ],
    3: [
      { label: 'Different angle', script: `Hey [Name] — circling back with a different thought. [New angle or question related to their profile]. Curious if that resonates?\n\n💡 If no reply after 2 attempts, move to CH4 and warm them up before trying again.` },
    ],
    5: [
      { label: 'Objection uncoverer', script: `Hey [Name] — just circling back. I know you were thinking it over — what's your gut telling you?\n\n💡 This surfaces the real objection.` },
      { label: 'Last call', script: `Hey [Name] — I don't want to keep nudging you if the timing genuinely isn't right. Where are you at with everything?\n\n💡 Gives them permission to say no, which often gets them to share what's really going on.` },
    ]
  },
  need_to_think: {
    5: [
      { label: '4-Step Objection Handler', script: `Of course — this is a real decision. Can I ask what specifically you want to think through? Sometimes talking it out helps clarify things faster than thinking alone.\n\n💡 Formula: Acknowledge + Clarify + Address + Re-close` },
    ]
  },
  cant_afford: {
    5: [
      { label: '4-Step Objection Handler', script: `I totally get that — [program] is definitely an investment. Can I ask what specifically feels like a stretch right now?\n\n[Listen]\n\n[Address with payment plan or ROI reframe]\n\nDoes knowing that change how it feels?\n\n💡 Formula: Acknowledge + Clarify + Address + Re-close` },
    ]
  },
  not_right_time: {
    5: [
      { label: '4-Step Objection Handler', script: `That makes sense — timing matters. Can I ask what would need to be different for the timing to feel right?\n\n[Listen]\n\n[Address the real barrier]\n\nWhat would it mean for you if that barrier wasn't there?\n\n💡 Formula: Acknowledge + Clarify + Address + Re-close` },
    ]
  },
  talk_to_partner: {
    5: [
      { label: '4-Step Objection Handler', script: `Absolutely — I'd want you both on the same page too. What do you think their main questions will be? I can make sure you have everything you need to answer them.\n\n💡 Equip them to sell it internally.` },
    ]
  },
  make_offer: {
    5: [
      { label: 'Soft Offer Framework', script: `Based on what you shared about [their exact words describing their problem] — that's honestly exactly what [your program name] was built for. It's designed specifically for [dream client] who are dealing with [their situation]. Would it be weird if I told you a bit more about how it works?\n\n💡 Reference their pain using their EXACT words, plant the seed, position your offer, make it optional.` },
    ]
  },
  lead_magnet: {
    2: [
      { label: 'Lead Magnet Offer', script: `Hey — given what you shared about [their struggle], I actually put together [LEAD MAGNET] that covers exactly that. Would it be helpful if I sent it over?\n\n💡 Wait for them to say yes before sending.` },
    ]
  },
  check_in: {
    2: [
      { label: 'Value-add check-in', script: `Hey [Name] — just thinking about what you shared about [their situation]. How's that going? Did anything shift?` },
    ],
    3: [
      { label: 'Re-engagement', script: `Hey [Name] — saw [something they posted] and thought of our conversation. How's [their goal] going?` },
    ],
    5: [
      { label: 'One more thing', script: `Hey [Name] — totally fine either way, but I wanted to share one thing before I let this go: [one specific result or insight relevant to their exact situation]. Just felt like you needed to hear that.` },
    ]
  }
}

// ─── CHANNEL SCRIPT LIBRARY ───────────────────────────────────
const CHANNEL_SCRIPTS = {
  1: {
    goal: 'Open a genuine conversation within 24–48hrs. Zero selling. Zero agenda. Just be human.',
    sections: [
      {
        title: 'APPROACH A — The Genuine Human Opener',
        subtitle: 'When their profile gives you something specific',
        scripts: [
          { label: 'Specific observation opener', script: `Hey [Name] — okay your [specific thing from their content, e.g. reel about meal prepping / post about their certification / bio mention] had me. [One genuine reaction or observation]. [One curious question about THEM — not their goals, not their struggles, just them as a person].\n\n💡 Fill in something you actually noticed. If you can't find anything specific — go look at their last 3 posts first.` },
          { label: 'Simpler version', script: `Hey [Name]! Glad you found me — [one specific thing you noticed about their page]. [One question about their work or focus that has nothing to do with coaching or selling].` },
        ]
      },
      {
        title: 'APPROACH B — The Authority Reversal',
        subtitle: 'When you want to position yourself without being obvious about it',
        scripts: [
          { label: 'Authority Reversal', script: `Hey [Name] — I'm actually putting together [something relevant you're building/creating] for [your dream client type]. Your [specific thing about their profile] caught my attention — would love to get your take on something if you have a sec?\n\n💡 This works because you're the one with something valuable. They become curious about you.` },
        ]
      }
    ],
    warnings: [
      `"Out of curiosity, what brought you to my page?" — signals you want to qualify them as a lead`,
      `"Are you currently working with clients?" — first DM sales radar trigger`,
      `"I'd love to connect!" — means nothing`,
      `Any opener that could be sent to 100 people without changing a word`
    ]
  },
  2: {
    goal: 'Add value, build trust, go deeper. Do NOT mention your offer yet. Your only job is to keep them talking about themselves.',
    sections: [
      {
        title: 'The 3-Step Reply Formula',
        subtitle: 'For every reply they send you',
        isFormula: true,
        formula: `Step 1 — VALIDATE: Mirror what they said. Show you actually read it. (1 sentence)\nStep 2 — ADD VALUE: One genuine observation, resource, or insight relevant to what they shared.\nStep 3 — ASK ONE QUESTION: Goes one level deeper into their situation. Never about your offer.\n\n⚡ One question per message. Every time. Non-negotiable.`,
        example: {
          them: `Honestly I've been posting for months and nothing is working.`,
          you: `Ugh that's the most frustrating place to be — putting in the work and feeling like you're shouting into the void. [VALUE: one genuine observation about why this happens]. Can I ask — when you say nothing's working, are you getting any engagement at all or is it crickets across the board?`
        }
      },
      {
        title: 'Value-Add Message Templates',
        subtitle: 'When you want to add value without asking anything',
        scripts: [
          { label: 'Resource share', script: `Hey [Name] — saw [something they posted] and immediately thought of [relevant resource/insight]. Thought you might find it useful — [share it or describe it briefly].` },
          { label: 'Answer a question', script: `Random but I saw your question about [topic] and had to jump in — [genuine answer in 2–3 sentences]. Hope that helps!` },
          { label: 'Check-in', script: `Hey [Name] — just thinking about what you shared about [their situation]. How's that going? Did anything shift?` },
        ]
      },
      {
        title: 'Soft Positioning',
        subtitle: "When you're 3–5 exchanges deep and ready to open the sales door softly",
        isFormula: true,
        formula: `Bridge (reference something they said) + Position (mention your expertise naturally — don't brag) + Credibility (one specific real result) + Question (opens the door without pushing through it)`,
        scripts: [
          { label: 'Soft positioning script', script: `You know it's funny — what you just described about [their exact words] is literally what I see with almost every [dream client type] I work with. I've been helping [them] with [result] for a while now and the pattern is always the same. Can I ask you something kind of direct?\n\n💡 Only use this after 3–5 genuine exchanges. Too early and it feels like a setup.` },
        ]
      }
    ],
    warnings: [
      `"So what are your goals?" — sounds like an intake form`,
      `"I actually have a program that could help with that" — way too early`,
      `Two questions in one message — kills conversation momentum`
    ]
  },
  3: {
    goal: 'One reply. That\'s the only goal. Personalize every single message — if it could be sent to anyone, rewrite it.',
    sections: [
      {
        title: 'The Curiosity Opener',
        subtitle: 'Your primary cold outreach message',
        isFormula: true,
        formula: `Hey [Name], can I ask for your advice on something? I'm [creating content / putting together a guide / building a resource] for [dream client description]. When it comes to [their desired result], what's been the hardest part for you?`,
        scripts: [
          { label: 'With personalization (higher reply rate)', script: `Hey [Name] — [one specific observation about something they posted or their bio, e.g. 'saw you just got your health coaching cert' / 'love that you're focusing on postpartum fitness']. Can I ask for your advice on something? I'm creating content for [dream clients]. When it comes to [desired result], what's been the hardest part?` },
        ]
      },
      {
        title: 'Niche-Specific Examples',
        subtitle: 'Adapt to your specific audience',
        scripts: [
          { label: 'Health coach → new coaches', script: `Hey [Name] — can I ask for your advice? I'm putting together a guide for new health coaches. When it comes to landing your first paying clients, what's been the hardest part so far?` },
          { label: 'Fitness coach → busy moms', script: `Hey [Name] — can I ask your advice on something? I'm creating content for busy moms who want to get back in shape. When it comes to staying consistent with fitness, what gets in the way most?` },
          { label: 'Nutrition coach → men 40+', script: `Hey [Name] — quick advice question if you don't mind. I'm building a resource for guys over 40 trying to get their energy back. When it comes to nutrition and training, what's felt hardest to figure out?` },
          { label: 'Business coach → service providers', script: `Hey [Name] — can I ask for your input on something? I'm creating content for service-based business owners. When it comes to getting consistent clients, what's the biggest thing holding you back?` },
        ]
      }
    ],
    important: `CH3 always comes AFTER CH4 engagement. This person should already have seen your face via likes, comments, or story reactions before this DM lands. A cold DM to someone who's never seen you = lower reply rate.`,
    warnings: [
      `"I came across your profile and love what you're doing"`,
      `"Are you looking to grow your business / reach your goals?"`,
      `"I help people like you achieve [result]"`,
      `Any message over 4 sentences`
    ]
  },
  4: {
    goal: "Get on their radar before the DM. No selling. No hinting. Just be a real person who finds their content genuinely interesting.",
    note: "There are no DM scripts for CH4. This channel is engagement only — likes, comments, story reactions. The 'script' here is a genuine comment on their content.",
    sections: [
      {
        title: 'Engagement Comment Templates',
        subtitle: 'Leave one of these on their most recent relevant post',
        scripts: [
          { label: 'React to a result/win they shared', script: `This kind of progress doesn't happen by accident — the consistency here is real.` },
          { label: 'React to advice/content they posted', script: `The way you broke this down actually made it click for me — hadn't thought about it from that angle.` },
          { label: 'React to something personal they shared', script: `This is the kind of honest content that actually helps people. More of this please.` },
          { label: 'React to a question they asked', script: `[Genuine answer to their question in one sentence]. Curious what made you think about this?` },
        ]
      }
    ],
    rule: `The comment must be about THEIR content. Never mention yourself. Never hint at coaching. Never ask about their goals. Just be a real person.`,
    timing: `3–5 genuine engagement touches over 3–5 days. Then move them to CH3 for the Curiosity Opener. Don't over-warm — timing matters.`,
    warnings: []
  },
  5: {
    goal: 'Diagnose → position → soft offer → close. Use their exact words. Never pitch — invite.',
    sections: [
      {
        title: 'Soft Offer Framework',
        subtitle: "When you're ready to make the offer",
        isFormula: true,
        formula: `Reference their pain (use their EXACT words from previous messages) + Plant the seed + Position your offer + Make it optional`,
        scripts: [
          { label: 'Soft offer script', script: `Based on what you shared about [their exact words describing their problem] — that's honestly exactly what [your program name] was built for. It's designed specifically for [dream client] who are dealing with [their situation]. Would it be weird if I told you a bit more about how it works?\n\n💡 The phrase "would it be weird if" is intentional — it's softer than "would you like to" and gets significantly more yes responses.` },
        ]
      },
      {
        title: 'Objection Handling Scripts',
        subtitle: 'When they hesitate — use the 4-step formula: Acknowledge + Clarify + Address + Re-close',
        scripts: [
          { label: `"I can't afford it"`, script: `I totally get that — [program] is definitely an investment. Can I ask what specifically feels like a stretch right now?\n\n[Listen]\n\n[Address with payment plan or ROI reframe]\n\nDoes knowing that change how it feels?` },
          { label: `"I need to think about it"`, script: `Of course — this is a real decision. Can I ask what specifically you want to think through? Sometimes talking it out helps clarify things faster than thinking alone.` },
          { label: `"Now's not the right time"`, script: `That makes sense — timing matters. Can I ask what would need to be different for the timing to feel right?\n\n[Listen]\n\n[Address the real barrier]\n\nWhat would it mean for you if that barrier wasn't there?` },
          { label: `"I need to talk to my partner"`, script: `Absolutely — I'd want you both on the same page too. What do you think their main questions will be? I can make sure you have everything you need to answer them.` },
          { label: `"I'm not sure it's the right fit"`, script: `That's actually the most important thing to get right. What specifically feels uncertain about the fit?\n\n[Listen]\n\n[Address directly]\n\nBased on what you've shared — [connect their specific situation to your program]. Does that land differently?` },
        ]
      },
      {
        title: 'Follow-up Scripts',
        subtitle: 'Strategic follow-up after an offer is made',
        scripts: [
          { label: 'Objection Uncoverer', script: `Hey [Name] — just circling back. I know you were thinking it over — what's your gut telling you?` },
          { label: 'Last Call', script: `Hey [Name] — I don't want to keep nudging you if the timing genuinely isn't right. Where are you at with everything?` },
          { label: 'One More Thing', script: `Hey [Name] — totally fine either way, but I wanted to share one thing before I let this go: [one specific result or insight relevant to their exact situation]. Just felt like you needed to hear that.` },
        ]
      }
    ],
    warnings: [
      `"Just checking in!" — means nothing, signals desperation`,
      `Making the offer again before addressing the objection`,
      `"I really think this would be perfect for you" — tells not shows`,
      `More than one follow-up per week`
    ]
  }
}

// ─── SCRIPTS TAB CONTENT COMPONENT ────────────────────────────
function ScriptsTabContent({ 
  prospect, channel, selectedSituation, setSelectedSituation, 
  expandedChannel, setExpandedChannel, generatingScript, setGeneratingScript,
  generatedScript, setGeneratedScript, conversationNotes, onOpenAI, userId, sb
}) {
  const p = prospect
  const ch = channel
  
  // Auto-expand current channel when tab opens
  useEffect(() => {
    if (expandedChannel === null) {
      setExpandedChannel(p.channel)
    }
  }, [])
  
  // Get scripts for selected situation filtered by current channel
  const getSituationScripts = () => {
    if (!selectedSituation) return []
    const situationData = SITUATION_SCRIPTS[selectedSituation]
    if (!situationData) return []
    // Get scripts for current channel, or closest available
    return situationData[p.channel] || situationData[Object.keys(situationData)[0]] || []
  }
  
  // Generate personalized script
  const handleGenerateScript = async () => {
    setGeneratingScript(true)
    setGeneratedScript(null)
    
    try {
      const context = conversationNotes.map(n => n.note_text).join('\n')
      const res = await fetch('/api/ai-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          prospectId: p.id,
          prospectName: p.name,
          channel: p.channel,
          intel: {},
          conversationHistory: context,
          requestType: 'next_message'
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setGeneratedScript(data.suggestion || data.script || 'Could not generate script.')
      } else {
        setGeneratedScript('Could not generate script right now.')
      }
    } catch (err) {
      setGeneratedScript('Error generating script. Try again.')
    }
    
    setGeneratingScript(false)
  }
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text.replace(/💡.*$/gm, '').trim())
  }

  return (
    <>
      {/* SECTION 1: Situation Selector */}
      <div style={{marginBottom:24}}>
        <div style={{color:C.gold,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>What just happened?</div>
        <div style={{color:C.dim,fontSize:12,fontStyle:'italic',marginBottom:12}}>Tap your situation and get the right script instantly.</div>
        
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {SITUATIONS.map(sit => (
            <button
              key={sit.id}
              onClick={() => setSelectedSituation(selectedSituation === sit.id ? null : sit.id)}
              style={{
                background: selectedSituation === sit.id ? '#3a3a3a' : '#2a2a2a',
                border: selectedSituation === sit.id ? `1px solid ${C.gold}` : '1px solid #3a3a3a',
                borderRadius: 8,
                padding: '8px 12px',
                color: C.white,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all .15s'
              }}
            >
              <span>{sit.emoji}</span>
              <span>{sit.label}</span>
            </button>
          ))}
        </div>
        
        {/* Expanded situation scripts */}
        {selectedSituation && (
          <div style={{marginTop:12,background:'#242424',borderRadius:10,padding:14,position:'relative'}}>
            <button 
              onClick={() => setSelectedSituation(null)}
              style={{position:'absolute',top:8,right:8,background:'none',border:'none',color:C.muted,fontSize:16,cursor:'pointer'}}
            >×</button>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {getSituationScripts().map((s, idx) => (
                <div key={idx} style={{background:'#1a1a1a',borderRadius:8,padding:12}}>
                  <div style={{color:C.dim,fontSize:11,marginBottom:6}}>{s.label}</div>
                  <div style={{color:C.gold,fontSize:13,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{s.script}</div>
                  <button 
                    onClick={() => copyToClipboard(s.script)}
                    style={{marginTop:8,background:C.gold,color:C.black,border:'none',padding:'6px 12px',borderRadius:4,fontSize:11,fontWeight:600,cursor:'pointer'}}
                  >Copy</button>
                </div>
              ))}
              {getSituationScripts().length === 0 && (
                <div style={{color:C.dim,fontSize:13,fontStyle:'italic'}}>
                  No scripts for this situation in {ch.key}. Check the Full Script Library below for {ch.name} scripts.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* SECTION 2: Full Script Library */}
      <div style={{marginBottom:24}}>
        <div style={{color:C.gold,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Full Script Library</div>
        <div style={{color:C.dim,fontSize:12,marginBottom:12}}>Browse all scripts by channel stage.</div>
        
        {CHANNELS.map(chLib => {
          const isExpanded = expandedChannel === chLib.id
          const scripts = CHANNEL_SCRIPTS[chLib.id]
          
          return (
            <div key={chLib.id} style={{marginBottom:8}}>
              <button
                onClick={() => setExpandedChannel(isExpanded ? null : chLib.id)}
                style={{
                  width:'100%',
                  background: '#2a2a2a',
                  border: `1px solid ${chLib.id === p.channel ? chLib.color : '#3a3a3a'}`,
                  borderRadius: isExpanded ? '8px 8px 0 0' : 8,
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{background:chLib.color+'22',color:chLib.color,padding:'3px 8px',borderRadius:4,fontSize:11,fontWeight:700}}>{chLib.key}</span>
                  <span style={{color:C.white,fontSize:13,fontWeight:600}}>{chLib.name}</span>
                  {chLib.id === p.channel && <span style={{color:C.dim,fontSize:11}}>(current)</span>}
                </div>
                <span style={{color:C.muted,fontSize:14}}>{isExpanded ? '▲' : '▼'}</span>
              </button>
              
              {isExpanded && scripts && (
                <div style={{background:'#242424',borderRadius:'0 0 8px 8px',padding:14,borderLeft:`1px solid ${chLib.color}`,borderRight:'1px solid #3a3a3a',borderBottom:'1px solid #3a3a3a'}}>
                  {/* Goal */}
                  <div style={{color:C.dim,fontSize:12,marginBottom:12,fontStyle:'italic'}}>Goal: {scripts.goal}</div>
                  
                  {/* Note for CH4 */}
                  {scripts.note && (
                    <div style={{background:'#1a1a1a',borderLeft:`3px solid ${C.gold}`,borderRadius:'0 6px 6px 0',padding:10,marginBottom:12}}>
                      <div style={{color:C.dim,fontSize:12}}>{scripts.note}</div>
                    </div>
                  )}
                  
                  {/* Important reminder for CH3 */}
                  {scripts.important && (
                    <div style={{background:'#1a1a1a',border:`1px solid ${C.gold}`,borderRadius:6,padding:10,marginBottom:12}}>
                      <div style={{color:C.gold,fontSize:12}}>⚠️ {scripts.important}</div>
                    </div>
                  )}
                  
                  {/* Sections */}
                  {scripts.sections.map((section, sIdx) => (
                    <div key={sIdx} style={{marginBottom:16}}>
                      <div style={{color:C.white,fontSize:13,fontWeight:700,marginBottom:2}}>{section.title}</div>
                      <div style={{color:C.dim,fontSize:11,marginBottom:8}}>{section.subtitle}</div>
                      
                      {/* Formula card */}
                      {section.isFormula && section.formula && (
                        <div style={{background:'#1a1a1a',borderLeft:`3px solid ${C.gold}`,borderRadius:'0 6px 6px 0',padding:10,marginBottom:8}}>
                          <div style={{color:C.white,fontSize:12,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{section.formula}</div>
                        </div>
                      )}
                      
                      {/* Example */}
                      {section.example && (
                        <div style={{background:'#1a1a1a',borderRadius:6,padding:10,marginBottom:8}}>
                          <div style={{color:C.dim,fontSize:11,marginBottom:4}}>They said:</div>
                          <div style={{color:C.white,fontSize:12,marginBottom:8,fontStyle:'italic'}}>"{section.example.them}"</div>
                          <div style={{color:C.dim,fontSize:11,marginBottom:4}}>Your reply:</div>
                          <div style={{color:C.gold,fontSize:12,lineHeight:1.5}}>{section.example.you}</div>
                        </div>
                      )}
                      
                      {/* Scripts */}
                      {section.scripts && section.scripts.map((s, scriptIdx) => (
                        <div key={scriptIdx} style={{background:'#1a1a1a',borderRadius:6,padding:10,marginBottom:6}}>
                          <div style={{color:C.dim,fontSize:11,marginBottom:4}}>{s.label}</div>
                          <div style={{color:C.gold,fontSize:12,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{s.script}</div>
                          <button 
                            onClick={() => copyToClipboard(s.script)}
                            style={{marginTop:6,background:C.gold,color:C.black,border:'none',padding:'4px 10px',borderRadius:4,fontSize:10,fontWeight:600,cursor:'pointer'}}
                          >Copy</button>
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  {/* Rule for CH4 */}
                  {scripts.rule && (
                    <div style={{background:'#1a1a1a',borderRadius:6,padding:10,marginBottom:12}}>
                      <div style={{color:C.white,fontSize:12}}>⚡ {scripts.rule}</div>
                    </div>
                  )}
                  
                  {/* Timing for CH4 */}
                  {scripts.timing && (
                    <div style={{color:C.dim,fontSize:11,marginBottom:12}}>{scripts.timing}</div>
                  )}
                  
                  {/* Warnings */}
                  {scripts.warnings && scripts.warnings.length > 0 && (
                    <div style={{background:'#1a1a1a',borderLeft:'3px solid #C0392B',borderRadius:'0 6px 6px 0',padding:10}}>
                      <div style={{color:'#C0392B',fontSize:11,fontWeight:700,marginBottom:6}}>WHAT NOT TO SAY</div>
                      {scripts.warnings.map((w, wIdx) => (
                        <div key={wIdx} style={{color:C.dim,fontSize:11,marginBottom:2}}>❌ {w}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* SECTION 3: Generate Personalized Script */}
      <div style={{background:'#242424',borderLeft:`3px solid ${C.gold}`,borderRadius:'0 8px 8px 0',padding:14}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
          <span style={{color:C.gold,fontSize:13,fontWeight:600}}>✦ Want something written for this specific person?</span>
        </div>
        <div style={{color:C.dim,fontSize:12,marginBottom:8}}>
          The scripts above are frameworks. This generates one written specifically for {p.name} based on your actual conversation history.
        </div>
        <div style={{color:C.muted,fontSize:11,marginBottom:10}}>Uses 1 AI call</div>
        
        <button
          onClick={handleGenerateScript}
          disabled={generatingScript}
          style={{
            background: 'transparent',
            border: `1px solid ${C.gold}`,
            color: C.gold,
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: generatingScript ? 'wait' : 'pointer',
            opacity: generatingScript ? 0.7 : 1
          }}
        >
          {generatingScript ? "Sarah's brain is working..." : `Generate My Script for ${p.name}`}
        </button>
        
        {generatedScript && (
          <div style={{marginTop:12,background:'#1a1a1a',borderRadius:8,padding:12}}>
            <div style={{color:C.gold,fontSize:13,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{generatedScript}</div>
            <button 
              onClick={() => copyToClipboard(generatedScript)}
              style={{marginTop:8,background:C.gold,color:C.black,border:'none',padding:'6px 12px',borderRadius:4,fontSize:11,fontWeight:600,cursor:'pointer'}}
            >Copy</button>
          </div>
        )}
      </div>
    </>
  )
}

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
  const [selectedSituation, setSelectedSituation] = useState(null)
  const [expandedChannel, setExpandedChannel] = useState(null)
  const [generatingScript, setGeneratingScript] = useState(false)
  const [generatedScript, setGeneratedScript] = useState(null)
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
    
    // Insert the note into prospect_notes
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
    
    // If logging a touch, also insert into touches table and update last_contacted_at
    // (but NOT into prospect_notes again since we just did that above)
    if (incrementTouch) {
      // Insert into touches table for touch count tracking
      const touch = { prospect_id: p.id, user_id: userId, touch_type: type, note: noteText.trim(), touch_date: new Date().toISOString().slice(0, 10) }
      await sb.from('touches').insert(touch)
      
      // Update last_contacted_at
      await sb.from('prospects').update({ last_contacted_at: new Date().toISOString() }).eq('id', p.id)
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

  // Quick touch (no note) - uses the unified logTouch which handles both tables
  const quickTouch = async () => {
    setSaving(true)
    await onLogTouch?.(p.id, 'Quick touch logged', 'conversation')
    // Refresh notes to show the new touch in activity feed
    await fetchData()
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
          {['intel','scripts','activity'].map(t => (
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
                  <div style={{color:C.white,fontSize:14,lineHeight:1.6}}>{getRecommendedAction(p.channel, touchCount, notes)}</div>
                </div>
              </div>
            </>
          ) : tab === 'scripts' ? (
            <ScriptsTabContent 
              prospect={p}
              channel={ch}
              selectedSituation={selectedSituation}
              setSelectedSituation={setSelectedSituation}
              expandedChannel={expandedChannel}
              setExpandedChannel={setExpandedChannel}
              generatingScript={generatingScript}
              setGeneratingScript={setGeneratingScript}
              generatedScript={generatedScript}
              setGeneratedScript={setGeneratedScript}
              conversationNotes={conversationNotes}
              onOpenAI={onOpenAI}
              userId={userId}
              sb={sb}
            />
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
                    
                    // Get smart prompts for this note
                    const smartPrompts = detectSmartPrompts(note.note_text)
                    
                    return (
                      <div key={note.id}>
                        <div style={{
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
                        
                        {/* Smart Prompts */}
                        {smartPrompts.map((prompt, pIdx) => (
                          <SmartPrompt 
                            key={`${note.id}-prompt-${pIdx}`}
                            prompt={prompt}
                            prospect={p}
                            onMoveChannel={handleMoveChannel}
                            onWon={handleWon}
                          />
                        ))}
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
