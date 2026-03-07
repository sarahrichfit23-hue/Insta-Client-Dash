'use client'
import { useState, useEffect, useRef } from 'react'

// Brand colors
const C = {
  gold: '#F6BD60',
  black: '#1E1E1E',
  dark: '#2a2a2a',
  card: '#2a2a2a',
  cardInner: '#ffffff',
  white: '#ffffff',
  muted: '#888888',
  dim: '#aaaaaa',
  red: '#C0392B',
  text: '#1a1a1a',
}

// Script block with copy button
function ScriptBlock({ children, title }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div style={{
      background: C.black,
      borderRadius: 8,
      padding: 16,
      position: 'relative',
      marginBottom: 16,
    }}>
      {title && (
        <div style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>
          {title}
        </div>
      )}
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: copied ? '#27AE60' : C.gold,
          color: C.black,
          border: 'none',
          borderRadius: 4,
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <div style={{ color: C.gold, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
        {children}
      </div>
    </div>
  )
}

// Formula callout box
function FormulaBox({ children, title }) {
  return (
    <div style={{
      background: C.dark,
      borderLeft: `3px solid ${C.gold}`,
      borderRadius: '0 8px 8px 0',
      padding: 16,
      marginBottom: 16,
    }}>
      {title && (
        <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          {title}
        </div>
      )}
      <div style={{ color: C.white, fontSize: 14, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  )
}

// Warning/banned phrases box
function WarningBox({ children, title = 'Common Mistakes' }) {
  return (
    <div style={{
      background: C.dark,
      borderLeft: `3px solid ${C.red}`,
      borderRadius: '0 8px 8px 0',
      padding: 16,
      marginBottom: 16,
    }}>
      <div style={{ color: C.red, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  )
}

// Collapsible section
function Section({ id, title, children, isExpanded, onToggle, searchMatch }) {
  const sectionRef = useRef(null)
  
  useEffect(() => {
    if (isExpanded && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [isExpanded])
  
  return (
    <div ref={sectionRef} id={id} style={{ marginBottom: 16 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          background: C.dark,
          border: 'none',
          borderRadius: 10,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          opacity: searchMatch === false ? 0.4 : 1,
        }}
      >
        <span style={{ color: C.gold, fontSize: 16, fontWeight: 700, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </span>
        <span style={{ color: C.gold, fontSize: 20, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          v
        </span>
      </button>
      {isExpanded && (
        <div style={{ padding: '20px 0', borderBottom: `1px solid ${C.dark}` }}>
          {children}
        </div>
      )}
    </div>
  )
}

// Sub-section header
function SubSection({ id, title, children }) {
  return (
    <div id={id} style={{ marginBottom: 32 }}>
      <h3 style={{ color: C.white, fontSize: 18, fontWeight: 600, marginBottom: 16, fontFamily: 'Oswald, sans-serif' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

// Channel quick reference card
function ChannelCard({ chKey, name, color, who, goal, dailyTarget, nextStep }) {
  return (
    <div style={{
      background: C.dark,
      borderRadius: 10,
      padding: 16,
      borderTop: `4px solid ${color}`,
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ background: color, color: C.white, padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>{chKey}</span>
        <span style={{ color: C.white, fontSize: 15, fontWeight: 600 }}>{name}</span>
      </div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
        <div><strong style={{ color: C.dim }}>Who:</strong> {who}</div>
        <div><strong style={{ color: C.dim }}>Goal:</strong> {goal}</div>
        <div><strong style={{ color: C.dim }}>Daily:</strong> {dailyTarget}</div>
        <div><strong style={{ color: C.dim }}>Next:</strong> {nextStep}</div>
      </div>
    </div>
  )
}

// Main Playbook component
export default function Playbook({ initialSection, initialAnchor }) {
  const [expandedSections, setExpandedSections] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  
  // Handle initial navigation from tooltip
  useEffect(() => {
    if (initialSection) {
      setExpandedSections(prev => ({ ...prev, [initialSection]: true }))
      if (initialAnchor) {
        setTimeout(() => {
          const el = document.getElementById(initialAnchor)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    }
  }, [initialSection, initialAnchor])
  
  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))
  }
  
  // Search filtering
  const searchLower = searchQuery.toLowerCase()
  const matchesSearch = (text) => {
    if (!searchQuery) return null
    return text.toLowerCase().includes(searchLower)
  }
  
  const sectionMatches = {
    'starting-conversations': matchesSearch('curiosity opener authority reversal genuine human opener starting conversations cold outreach dm'),
    'keeping-conversations': matchesSearch('3-step reply formula value-add layered insight loop keeping conversations alive warm'),
    'sales-door': matchesSearch('soft positioning behavioral intent mapping 3 filters sales door opening qualification'),
    'closing': matchesSearch('soft offer objection handling follow-up closing making offers sales'),
    'daily-system': matchesSearch('60-minute power hour pipeline channel conversion daily system'),
  }
  
  return (
    <div style={{ padding: '24px 24px 48px', maxWidth: 900, margin: '0 auto' }} className="fade">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: 32, color: C.black, fontWeight: 700, margin: 0 }}>
          THE INSTA CLIENT ENGINE PLAYBOOK
        </h1>
        <p style={{ color: C.muted, fontSize: 14, margin: '8px 0 0' }}>
          Every formula, every script, every system — organized by what you're trying to do right now.
        </p>
      </div>
      
      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search the playbook..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            background: C.cardInner,
            border: `2px solid #e0e0e0`,
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 15,
          }}
        />
      </div>
      
      {/* SECTION 1: STARTING CONVERSATIONS */}
      <Section
        id="starting-conversations"
        title="1. Starting Conversations"
        isExpanded={expandedSections['starting-conversations']}
        onToggle={() => toggleSection('starting-conversations')}
        searchMatch={sectionMatches['starting-conversations']}
      >
        <SubSection id="curiosity-opener" title="The Curiosity Opener">
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            Your cold outreach message. Positions the prospect as the expert whose advice you're seeking — so there's zero sales pressure. This is your go-to for CH3 prospects after they've been warmed up in CH4.
          </p>
          
          <FormulaBox title="The Formula">
            <strong>Hey [Name],</strong> can I ask for your advice on something? I'm [creating content / putting together a guide / building a resource] for <strong>[dream client description]</strong>. When it comes to <strong>[their desired result]</strong>, what's been the hardest part for you?
          </FormulaBox>
          
          <div style={{ color: C.white, fontSize: 14, marginBottom: 16 }}>
            <strong>Why it works:</strong> People love giving advice. It disarms sales resistance completely. You're not selling — you're asking for help.
          </div>
          
          <h4 style={{ color: C.dim, fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase' }}>Copy-Paste Examples</h4>
          
          <ScriptBlock title="Health Coach targeting new coaches">
{`Hey [Name], can I ask for your advice on something?

I'm putting together a guide for health coaches who are just starting out.

When it comes to getting your first paying clients, what's been the hardest part for you?`}
          </ScriptBlock>
          
          <ScriptBlock title="Fitness Coach targeting busy moms">
{`Hey [Name], can I ask for your advice on something?

I'm creating content for moms who want to get back in shape but feel like they have zero time.

When it comes to staying consistent with workouts, what's been the biggest challenge for you?`}
          </ScriptBlock>
          
          <ScriptBlock title="Nutrition Coach targeting men over 40">
{`Hey [Name], can I ask for your advice on something?

I'm building a resource for guys over 40 who want to lose the dad bod without giving up everything they love.

When it comes to eating healthier without feeling restricted, what's been the hardest part?`}
          </ScriptBlock>
          
          <ScriptBlock title="Business Coach targeting service providers">
{`Hey [Name], can I ask for your advice on something?

I'm putting together a guide for service providers who want to raise their prices but feel stuck.

When it comes to charging what you're worth, what's been the biggest obstacle for you?`}
          </ScriptBlock>
          
          <ScriptBlock title="Wellness Coach targeting burned-out professionals">
{`Hey [Name], can I ask for your advice on something?

I'm creating content for professionals who feel burned out but can't seem to slow down.

When it comes to actually taking time for yourself, what's been the hardest part?`}
          </ScriptBlock>
          
          <WarningBox>
            Never ask "are you looking for clients" or "are you interested in working with a coach" — these are curiosity openers wearing a Halloween costume. They don't work. The prospect can smell the pitch from a mile away.
          </WarningBox>
        </SubSection>
        
        <SubSection id="authority-reversal" title="The Authority Reversal">
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            A DM approach where YOU become the gatekeeper, not the pursuer. Instead of chasing the prospect, you frame what you're building in a way that makes them want to qualify themselves to you.
          </p>
          
          <FormulaBox title="When to Use It">
            Use the Authority Reversal when you have a strong personal brand or are launching something new. It works especially well for CH1 (new followers) because you're not chasing — you're welcoming them into your world on your terms.
          </FormulaBox>
          
          <div style={{ color: C.white, fontSize: 14, marginBottom: 16 }}>
            <strong>Why it works:</strong> Flips the power dynamic. You stop chasing and start curating. The prospect feels like they discovered something exclusive, not like they're being sold to.
          </div>
          
          <h4 style={{ color: C.dim, fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase' }}>The Energy (Not Templates)</h4>
          
          <ScriptBlock title="Example 1 — Research Frame">
{`Hey [Name] — I'm actually doing some research on [topic they care about] and your profile caught my eye.

Quick question: [one specific question about their situation]`}
          </ScriptBlock>
          
          <ScriptBlock title="Example 2 — Building Something Frame">
{`Hey [Name] — I'm putting together something for [specific type of person] and I'm being pretty selective about who I share it with.

Based on what I saw on your page, you might be a fit. Mind if I ask you something?`}
          </ScriptBlock>
          
          <ScriptBlock title="Example 3 — Expert Frame">
{`Hey [Name] — noticed you're deep in [their niche/interest]. I work with people in that space and I'm curious about something.

What's the biggest thing you're trying to figure out right now with [specific topic]?`}
          </ScriptBlock>
          
          <FormulaBox>
            <strong style={{ color: C.gold }}>The coach never chases. The coach curates.</strong>
          </FormulaBox>
        </SubSection>
        
        <SubSection id="warm-up" title="The Genuine Human Opener (CH1 Only)">
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            For new followers only. A genuine, human reaction to something specific on their profile. No strategy — just a real connection point. Send within 24-48 hours of their follow.
          </p>
          
          <FormulaBox title="When to Use It">
            CH1 only, within 24-48 hours of their follow. This is about starting a conversation, not closing a sale. Goal: get one reply.
          </FormulaBox>
          
          <ScriptBlock title="Example 1 — Comment on specific content">
{`Hey [Name]! Thanks for the follow — just saw your post about [specific thing]. That really resonated.

What made you start talking about that?`}
          </ScriptBlock>
          
          <ScriptBlock title="Example 2 — Bio observation">
{`Hey [Name]! Thanks for following — noticed in your bio you're a [their role/identity]. Love that.

What brought you over to my corner of Instagram?`}
          </ScriptBlock>
          
          <ScriptBlock title="Example 3 — Shared interest">
{`Hey [Name]! Thanks for the follow. Saw we're both into [shared interest from their profile].

What's been your biggest focus with that lately?`}
          </ScriptBlock>
          
          <WarningBox title="What NOT to Say">
            "I came across your profile and love what you're doing" — generic, everyone says this
            "I'd love to connect" — meaningless
            "Quick question for you" — overused, signals spam
            "I help people like you achieve their goals" — too salesy for CH1
          </WarningBox>
        </SubSection>
      </Section>
      
      {/* SECTION 2: KEEPING CONVERSATIONS ALIVE */}
      <Section
        id="keeping-conversations"
        title="2. Keeping Conversations Alive"
        isExpanded={expandedSections['keeping-conversations']}
        onToggle={() => toggleSection('keeping-conversations')}
        searchMatch={sectionMatches['keeping-conversations']}
      >
        <SubSection id="3-step-reply" title="The 3-Step Reply Formula">
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            How you respond every time a prospect replies to you. This formula keeps conversations moving forward without being pushy.
          </p>
          
          <FormulaBox title="The Formula">
            <div style={{ marginBottom: 12 }}><strong>Step 1 — Validate:</strong> Mirror what they said, show you actually read it.</div>
            <div style={{ marginBottom: 12 }}><strong>Step 2 — Add Value:</strong> One genuine observation or micro-insight.</div>
            <div><strong>Step 3 — Ask One Question:</strong> Goes one level deeper into their situation.</div>
          </FormulaBox>
          
          <h4 style={{ color: C.dim, fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase' }}>Full Conversation Example</h4>
          
          <div style={{ background: C.black, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>THEM:</div>
              <div style={{ color: C.white, fontSize: 14 }}>"Yeah, honestly the hardest part has been staying consistent. I start strong but then life gets in the way."</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: C.gold, fontSize: 11, marginBottom: 4 }}>YOU (3-Step Reply):</div>
              <div style={{ color: C.gold, fontSize: 14 }}>
                <strong>Step 1:</strong> "Totally get that — consistency is the thing everyone struggles with, not just you."<br/><br/>
                <strong>Step 2:</strong> "What I've noticed is it's usually not a motivation problem — it's a systems problem."<br/><br/>
                <strong>Step 3:</strong> "When life gets in the way, what's usually the first thing that gets dropped?"
              </div>
            </div>
            <div>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>THEM:</div>
              <div style={{ color: C.white, fontSize: 14 }}>"Honestly? Meal prep. I just don't have the time and then I end up eating whatever's easy."</div>
            </div>
          </div>
          
          <FormulaBox>
            <strong style={{ color: C.gold }}>Rule: One question per message. Every time. Non-negotiable.</strong>
          </FormulaBox>
        </SubSection>
        
        <SubSection id="value-add" title="Value-Add Messages">
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            Messages that add genuine value to the conversation without asking for anything. Use these in CH2 to build trust before any positioning.
          </p>
          
          <ScriptBlock title="Resource Share">
{`Hey — saw this and thought of what you mentioned about [their struggle].

[Link or tip or insight]

Thought it might be useful. How's it going with [their goal] this week?`}
          </ScriptBlock>
          
          <ScriptBlock title="Answer a Question">
{`Hey — you asked about [topic] the other day and I've been thinking about it.

Here's what's worked for me/my clients: [specific insight]

Does that help at all?`}
          </ScriptBlock>
          
          <ScriptBlock title="Check-In">
{`Hey [Name] — just wanted to check in.

How's [thing they mentioned] going? Any progress?`}
          </ScriptBlock>
        </SubSection>
        
        <SubSection id="layered-insight" title="The Layered Insight Loop">
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            The progressive deepening of a conversation. Each exchange you learn more about the prospect, and each question goes one level deeper than the last. By the time you reach CH5, you know exactly what they need and can use their own words to close.
          </p>
          
          <FormulaBox title="How It Works">
            <div style={{ marginBottom: 12 }}><strong>Layer 1:</strong> Surface problem (what they say is wrong)</div>
            <div style={{ marginBottom: 12 }}><strong>Layer 2:</strong> Real problem (why it's actually happening)</div>
            <div style={{ marginBottom: 12 }}><strong>Layer 3:</strong> Root cause (the deeper belief or behavior)</div>
            <div><strong>Layer 4:</strong> Emotional stakes (what it's costing them)</div>
          </FormulaBox>
          
          <div style={{ color: C.white, fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
            <strong>What you're listening for at each stage:</strong><br/>
            - Their exact words describing the problem<br/>
            - What they've already tried<br/>
            - Why those solutions didn't work<br/>
            - What it would mean if they solved this<br/>
            - What it's costing them to stay stuck
          </div>
        </SubSection>
      </Section>
      
      {/* SECTION 3: OPENING THE SALES DOOR */}
      <Section
        id="sales-door"
        title="3. Opening the Sales Door"
        isExpanded={expandedSections['sales-door']}
        onToggle={() => toggleSection('sales-door')}
        searchMatch={sectionMatches['sales-door']}
      >
        <SubSection id="soft-positioning" title="Soft Positioning">
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            Naturally mentioning your expertise mid-conversation without pitching — so the prospect starts to see you as the solution before you ever make an offer.
          </p>
          
          <FormulaBox title="The Formula">
            <div style={{ marginBottom: 8 }}><strong>Bridge:</strong> Reference something they said</div>
            <div style={{ marginBottom: 8 }}><strong>Position:</strong> Mention your expertise naturally</div>
            <div style={{ marginBottom: 8 }}><strong>Credibility:</strong> One specific result</div>
            <div><strong>Question:</strong> Open the sales door softly</div>
          </FormulaBox>
          
          <ScriptBlock title="Example 1">
{`That's actually exactly what I help people with — [their struggle].

I just helped a client go from [before state] to [after state] in [timeframe].

Is that the kind of thing you're trying to figure out right now?`}
          </ScriptBlock>
          
          <ScriptBlock title="Example 2">
{`You know, what you described about [their problem] is so common.

I work with [avatar] on exactly this — one of my clients was in the same spot and [specific result].

What have you tried so far to fix it?`}
          </ScriptBlock>
          
          <ScriptBlock title="Example 3">
{`Based on what you're sharing, this sounds a lot like what [avatar] go through.

I actually specialize in helping people navigate this — had a client recently who [specific win].

Have you thought about getting some help with it?`}
          </ScriptBlock>
          
          <FormulaBox title="Timing Guide">
            Start soft positioning after 3-5 genuine exchanges in CH2. Not before. If you position too early, you'll lose trust. If you wait too long, the momentum dies.
          </FormulaBox>
        </SubSection>
        
        <SubSection id="behavioral-intent" title="Behavioral Intent Mapping">
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            Reading a prospect's Instagram behavior — what they post, comment on, and engage with — to determine if they're a qualified fit before you ever send a message. You're not guessing. You're gathering intelligence.
          </p>
          
          <FormulaBox title="The 3 Filters">
            <div style={{ marginBottom: 12 }}><strong>Filter 1:</strong> Do they have the problem you solve?</div>
            <div style={{ marginBottom: 12 }}><strong>Filter 2:</strong> Are they actively seeking a solution?</div>
            <div><strong>Filter 3:</strong> Can they invest in solving it?</div>
          </FormulaBox>
          
          <h4 style={{ color: C.dim, fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase' }}>Signal Types</h4>
          
          <div style={{ color: C.white, fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>
            <strong style={{ color: C.gold }}>Bio signals:</strong> Job title, "helping X do Y", certifications, "DM me for", link in bio<br/>
            <strong style={{ color: C.gold }}>Content signals:</strong> Posts about struggles, asks for advice, shares wins (shows they take action)<br/>
            <strong style={{ color: C.gold }}>Engagement signals:</strong> Comments on competitor content, uses relevant hashtags, shares others' posts in your niche
          </div>
          
          <FormulaBox title="Qualified vs Disqualified">
            <strong style={{ color: '#27AE60' }}>Qualified:</strong> Posts consistently, engages with niche content, bio shows they take their work seriously, content shows they're actively working on the problem you solve<br/><br/>
            <strong style={{ color: C.red }}>Disqualified:</strong> No posts in 6+ months, only reposts memes, bio is empty or unrelated, no evidence they have the problem you solve
          </FormulaBox>
        </SubSection>
      </Section>
      
      {/* SECTION 4: MAKING OFFERS AND CLOSING */}
      <Section
        id="closing"
        title="4. Making Offers and Closing"
        isExpanded={expandedSections['closing']}
        onToggle={() => toggleSection('closing')}
        searchMatch={sectionMatches['closing']}
      >
        <SubSection id="soft-offer" title="The Soft Offer Framework">
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            How you make an offer that feels like their idea, not a sales pitch. Only use in CH5, never before.
          </p>
          
          <FormulaBox title="The Formula">
            <div style={{ marginBottom: 8 }}><strong>Reference their pain:</strong> Use their exact words from the conversation</div>
            <div style={{ marginBottom: 8 }}><strong>Plant the seed:</strong> Mention you have something that helps</div>
            <div style={{ marginBottom: 8 }}><strong>Position your offer:</strong> Describe it briefly</div>
            <div><strong>Make it optional:</strong> "Totally up to you, just wanted to put it out there"</div>
          </FormulaBox>
          
          <ScriptBlock title="Example 1">
{`Based on what you shared about [their exact words] — that's literally what [your program] was built for.

It's a [brief description] that helps [avatar] go from [before] to [after].

Would it be weird if I told you a bit more about how it works?`}
          </ScriptBlock>
          
          <ScriptBlock title="Example 2">
{`You know, everything you've described — [their struggle], [their goal], [their frustration] — I have something that might actually help.

It's not for everyone, but based on what you've shared, you might be a fit.

Want me to walk you through what it looks like?`}
          </ScriptBlock>
          
          <ScriptBlock title="Example 3">
{`I don't usually do this, but based on our conversation...

I think [your program] could really help with [their specific situation].

Totally up to you — but if you're curious, I can tell you more about it.`}
          </ScriptBlock>
          
          <FormulaBox title="The 'Would It Be Weird If' Framing">
            This phrase is magic. It reduces resistance because you're asking permission instead of pushing. It signals that you care about their comfort more than making a sale.
          </FormulaBox>
        </SubSection>
        
        <SubSection id="objection-handling" title="The Objection Handling Formula">
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            The 4-step response to any sales objection. Stay calm, stay curious, stay in control.
          </p>
          
          <FormulaBox title="The 4-Step Formula">
            <div style={{ marginBottom: 8 }}><strong>1. Acknowledge:</strong> "I totally understand."</div>
            <div style={{ marginBottom: 8 }}><strong>2. Clarify:</strong> "What specifically are you concerned about?"</div>
            <div style={{ marginBottom: 8 }}><strong>3. Address:</strong> Handle the specific concern (payment plan, ROI, timing, fit)</div>
            <div><strong>4. Re-close:</strong> "Does that help? Ready to move forward?"</div>
          </FormulaBox>
          
          <h4 style={{ color: C.dim, fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase' }}>The 5 Most Common Objections</h4>
          
          <ScriptBlock title="1. 'I can't afford it'">
{`I totally understand — and I wouldn't want you to put yourself in a bad spot.

Can I ask — is it the total investment, or is it more about the timing of payments?

[If timing] We do have a payment plan that breaks it down to [amount] per month.

[If total] I get it. Would it help to know what kind of ROI my clients typically see?`}
          </ScriptBlock>
          
          <ScriptBlock title="2. 'I need to think about it'">
{`Totally fair — what specifically do you want to think through?

[Listen, then address that specific thing]

Does that help clarify things? What would need to be true for you to feel good about moving forward?`}
          </ScriptBlock>
          
          <ScriptBlock title="3. 'Now's not the best time'">
{`I hear you. Can I ask — what's making the timing feel off right now?

[Listen]

Here's what I've noticed: there's never a perfect time. The question is whether the cost of waiting is higher than the cost of starting.

What do you think?`}
          </ScriptBlock>
          
          <ScriptBlock title="4. 'I'm not sure it's the right fit'">
{`That's a fair concern — can you tell me more about what's making you unsure?

[Listen]

Based on what you've shared, here's why I think it could work for you: [specific reasons based on their situation]

Does that address your concern?`}
          </ScriptBlock>
          
          <ScriptBlock title="5. 'I need to talk to my spouse/partner'">
{`Of course — that makes sense.

What do you think they'll want to know about it?

[Help them prepare to have that conversation]

When do you think you'll be able to chat with them? I can follow up [day] to see where you're at.`}
          </ScriptBlock>
          
          <h4 style={{ color: C.dim, fontSize: 13, fontWeight: 600, marginBottom: 12, marginTop: 24, textTransform: 'uppercase' }}>Follow-Up Scripts</h4>
          
          <ScriptBlock title="Objection Uncoverer">
{`Hey [Name] — I know we talked about [your program] the other day.

I wanted to check in — is there anything that's holding you back from moving forward?

No pressure either way — just want to make sure I answered all your questions.`}
          </ScriptBlock>
          
          <ScriptBlock title="Last Call">
{`Hey [Name] — just wanted to give you a heads up.

I'm closing enrollment for [program] on [date], and I'd hate for you to miss out if this is something you wanted to do.

Any questions I can answer before then?`}
          </ScriptBlock>
          
          <ScriptBlock title="One More Thing">
{`Hey [Name] — one more thing I forgot to mention.

[Relevant benefit or bonus or client result]

Just wanted to make sure you had all the info. Let me know if you have any questions!`}
          </ScriptBlock>
        </SubSection>
      </Section>
      
      {/* SECTION 5: THE DAILY SYSTEM */}
      <Section
        id="daily-system"
        title="5. The Daily System"
        isExpanded={expandedSections['daily-system']}
        onToggle={() => toggleSection('daily-system')}
        searchMatch={sectionMatches['daily-system']}
      >
        <SubSection id="power-hour" title="The 60-Minute Power Hour">
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            Your non-negotiable daily execution block. 60 minutes, same time every day, all five channels worked in sequence.
          </p>
          
          <FormulaBox title="Minute-by-Minute Breakdown">
            <div style={{ marginBottom: 8 }}><strong>0-5 min:</strong> Review — check replies, scan notifications, prioritize hot leads</div>
            <div style={{ marginBottom: 8 }}><strong>5-20 min:</strong> CH5 — Work your hottest leads first (closes are highest leverage)</div>
            <div style={{ marginBottom: 8 }}><strong>20-35 min:</strong> CH2 — Warm conversations, add value, deepen relationships</div>
            <div style={{ marginBottom: 8 }}><strong>35-55 min:</strong> CH3 — Cold outreach, send curiosity openers</div>
            <div><strong>55-60 min:</strong> Track — Log your numbers in the Daily tab</div>
          </FormulaBox>
          
          <div style={{ color: C.white, fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
            <strong>What "done" looks like:</strong><br/>
            - All CH5 leads touched<br/>
            - 5-10 CH2 conversations moved forward<br/>
            - 20-30 new CH3 openers sent<br/>
            - Numbers logged<br/>
            - Tomorrow's hot leads identified
          </div>
        </SubSection>
        
        <SubSection id="pipeline-reference" title="The 5-Channel Pipeline — Quick Reference">
          <ChannelCard
            chKey="CH1"
            name="New Arrivals"
            color="#2471A3"
            who="People who just followed you"
            goal="Start a genuine conversation"
            dailyTarget="10-20 touches"
            nextStep="Move to CH2 when they reply"
          />
          <ChannelCard
            chKey="CH2"
            name="Warm Conversations"
            color="#D68910"
            who="People who've replied and are engaging"
            goal="Build trust, add value, open sales window"
            dailyTarget="20-30 touches"
            nextStep="Move to CH5 when they show buying signals"
          />
          <ChannelCard
            chKey="CH3"
            name="Cold Activation"
            color="#7D3C98"
            who="Qualified cold prospects"
            goal="Get one reply with your Curiosity Opener"
            dailyTarget="30-40 DMs"
            nextStep="Move to CH2 when they reply"
          />
          <ChannelCard
            chKey="CH4"
            name="Warm-Up Engagement"
            color="#1E8449"
            who="People who need pre-DM relationship building"
            goal="Get on their radar before DMing"
            dailyTarget="3-5 touches per prospect"
            nextStep="Move to CH3 after 3-5 days"
          />
          <ChannelCard
            chKey="CH5"
            name="Conversion Touches"
            color="#C0392B"
            who="Hot leads ready for an offer"
            goal="Diagnose, position, close"
            dailyTarget="All leads touched daily"
            nextStep="Close or archive"
          />
        </SubSection>
        
        <SubSection id="benchmarks" title="Conversion Rate Benchmarks">
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            These are healthy targets. Don't stress if you're below — focus on improvement over time.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div style={{ background: C.dark, borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ color: C.gold, fontSize: 24, fontWeight: 700, fontFamily: 'Oswald, sans-serif' }}>15-30%</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Reply Rate</div>
            </div>
            <div style={{ background: C.dark, borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ color: C.gold, fontSize: 24, fontWeight: 700, fontFamily: 'Oswald, sans-serif' }}>10-20%</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Email Collection Rate</div>
            </div>
            <div style={{ background: C.dark, borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ color: C.gold, fontSize: 24, fontWeight: 700, fontFamily: 'Oswald, sans-serif' }}>15-25%</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Offer Rate</div>
            </div>
            <div style={{ background: C.dark, borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ color: C.gold, fontSize: 24, fontWeight: 700, fontFamily: 'Oswald, sans-serif' }}>20-40%</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Close Rate</div>
            </div>
          </div>
          
          <FormulaBox title="Reality Check" style={{ marginTop: 16 }}>
            <strong>50-100 touches per client is normal.</strong> If you're closing clients with fewer touches, you're doing great. If it takes more, keep refining your messaging and qualification.
          </FormulaBox>
        </SubSection>
      </Section>
    </div>
  )
}
