'use client'
import { useState, useRef, useEffect } from 'react'

// Brand colors
const C = {
  gold: '#F6BD60',
  black: '#1E1E1E',
  dark: '#2a2a2a',
  white: '#ffffff',
  muted: '#888888',
}

// Glossary of terms with definitions, examples, and playbook section links
export const GLOSSARY = {
  'Curiosity Opener': {
    definition: "Your cold outreach message. Positions the prospect as the expert whose advice you're seeking — so there's zero sales pressure.",
    formula: 'Hey [Name], can I ask for your advice? I\'m creating content for [dream clients]. When it comes to [desired result], what\'s been the hardest part for you?',
    whyItWorks: "People love giving advice. It disarms sales resistance completely.",
    playbookSection: 'starting-conversations',
    playbookAnchor: 'curiosity-opener',
  },
  'Authority Reversal': {
    definition: "A DM approach where YOU become the gatekeeper, not the pursuer. Instead of chasing the prospect, you frame what you're building in a way that makes them want to qualify themselves to you.",
    whyItWorks: "Flips the power dynamic. You stop chasing and start curating.",
    playbookSection: 'starting-conversations',
    playbookAnchor: 'authority-reversal',
  },
  '3-Step Reply Formula': {
    definition: "How you respond every time a prospect replies to you.",
    formula: "Step 1 — Validate (mirror what they said). Step 2 — Add Value (one genuine observation). Step 3 — Ask One Question (goes deeper into their situation).",
    whyItWorks: "One question per message. Always.",
    playbookSection: 'keeping-conversations',
    playbookAnchor: '3-step-reply',
  },
  'Behavioral Intent Mapping': {
    definition: "Reading a prospect's Instagram behavior — what they post, comment on, and engage with — to determine if they're a qualified fit before you ever send a message.",
    whyItWorks: "You're not guessing. You're gathering intelligence.",
    playbookSection: 'sales-door',
    playbookAnchor: 'behavioral-intent',
  },
  'The 3 Filters': {
    definition: "Three qualification criteria every prospect must pass before entering your pipeline.",
    formula: "Filter 1: Do they have the problem you solve? Filter 2: Are they actively seeking a solution? Filter 3: Can they invest in solving it?",
    playbookSection: 'sales-door',
    playbookAnchor: '3-filters',
  },
  'Soft Positioning': {
    definition: "Naturally mentioning your expertise mid-conversation without pitching — so the prospect starts to see you as the solution before you ever make an offer.",
    formula: "Bridge (reference something they said) + Position (mention your expertise naturally) + Credibility (one specific result) + Question (open the sales door softly).",
    playbookSection: 'sales-door',
    playbookAnchor: 'soft-positioning',
  },
  'Soft Offer Framework': {
    definition: "How you make an offer that feels like their idea, not a sales pitch.",
    formula: "Reference their pain (use their words) + Plant the seed + Position your offer + Make it optional (\"totally up to you, just wanted to put it out there\").",
    playbookSection: 'closing',
    playbookAnchor: 'soft-offer',
  },
  'Layered Insight Loop': {
    definition: "The progressive deepening of a conversation — each exchange you learn more about the prospect, and each question goes one level deeper than the last. By CH5, you know exactly what they need and can use their own words to close.",
    playbookSection: 'keeping-conversations',
    playbookAnchor: 'layered-insight',
  },
  '60-Minute Power Hour': {
    definition: "Your non-negotiable daily execution block. 60 minutes, same time every day, all five channels worked in sequence.",
    formula: "0-5 min review, 5-20 min CH5 hot leads, 20-35 min CH2 warm conversations, 35-55 min CH3 cold outreach, 55-60 min track numbers.",
    playbookSection: 'daily-system',
    playbookAnchor: 'power-hour',
  },
  'Engagement Mining': {
    definition: "Finding qualified prospects by looking at who's actively engaging with content in your niche — comments on competitor posts, hashtag activity, story responses. These people have already self-identified as interested.",
    playbookSection: 'daily-system',
    playbookAnchor: 'engagement-mining',
  },
  'Warm-Up Engagement': {
    definition: "The pre-DM relationship building phase (CH4). Like 2-3 posts, leave one genuine comment, react to a story. Get on their radar before you slide into their DMs. No DM until they know your face.",
    playbookSection: 'starting-conversations',
    playbookAnchor: 'warm-up',
  },
  'Dream Client List': {
    definition: "Your master list of verified prospects who have passed the 3 Filters. This is your pipeline fuel — every name on it has been researched and qualified before any outreach begins.",
    playbookSection: 'daily-system',
    playbookAnchor: 'dream-client-list',
  },
  'Objection Handling Formula': {
    definition: "The 4-step response to any sales objection.",
    formula: "Acknowledge (\"I totally understand\") + Clarify (\"What specifically concerns you?\") + Address (payment plan, ROI, timing, fit) + Re-close (\"Does that help? Ready to move forward?\").",
    playbookSection: 'closing',
    playbookAnchor: 'objection-handling',
  },
}

// Alternate forms of terms (for text matching)
export const TERM_ALIASES = {
  'Authority Reversal': ['Authority Reversal™', 'The Authority Reversal'],
  'Behavioral Intent Mapping': ['Behavioral Intent Mapping™'],
  'Layered Insight Loop': ['Layered Insight Loop™'],
  '3-Step Reply Formula': ['3-Step Reply', 'Three-Step Reply Formula'],
  'Curiosity Opener': ['The Curiosity Opener'],
  'Soft Offer Framework': ['Soft Offer', 'The Soft Offer Framework'],
  'Soft Positioning': ['The Soft Positioning Move'],
  '60-Minute Power Hour': ['Power Hour', 'The Power Hour'],
  'The 3 Filters': ['3 Filters', 'Three Filters'],
  'Dream Client List': ['Dream 1,000', 'Dream Client'],
}

// Build reverse lookup
const buildTermLookup = () => {
  const lookup = {}
  Object.keys(GLOSSARY).forEach(term => {
    lookup[term.toLowerCase()] = term
    if (TERM_ALIASES[term]) {
      TERM_ALIASES[term].forEach(alias => {
        lookup[alias.toLowerCase()] = term
      })
    }
  })
  return lookup
}

export const TERM_LOOKUP = buildTermLookup()

// Tooltip component
export function TermTooltip({ term, children, onNavigateToPlaybook }) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: true })
  const triggerRef = useRef(null)
  const tooltipRef = useRef(null)
  const timeoutRef = useRef(null)
  
  const glossaryEntry = GLOSSARY[term]
  if (!glossaryEntry) return children
  
  const calculatePosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceAbove = rect.top
    const spaceBelow = window.innerHeight - rect.bottom
    setPosition({ top: spaceBelow < 200 && spaceAbove > spaceBelow })
  }
  
  const handleOpen = () => {
    calculatePosition()
    setIsOpen(true)
    // Auto-dismiss on mobile after 6 seconds
    if ('ontouchstart' in window) {
      timeoutRef.current = setTimeout(() => setIsOpen(false), 6000)
    }
  }
  
  const handleClose = () => {
    setIsOpen(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }
  
  const handlePlaybookClick = (e) => {
    e.stopPropagation()
    handleClose()
    if (onNavigateToPlaybook) {
      onNavigateToPlaybook(glossaryEntry.playbookSection, glossaryEntry.playbookAnchor)
    }
  }
  
  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target) && 
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        handleClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])
  
  return (
    <span style={{ position: 'relative', display: 'inline' }}>
      <span
        ref={triggerRef}
        onClick={handleOpen}
        onMouseEnter={() => !('ontouchstart' in window) && handleOpen()}
        onMouseLeave={() => !('ontouchstart' in window) && handleClose()}
        style={{
          borderBottom: `1px dotted ${C.gold}`,
          cursor: 'help',
          color: 'inherit',
        }}
      >
        {children}
      </span>
      
      {isOpen && (
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            [position.top ? 'bottom' : 'top']: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: position.top ? 0 : 8,
            marginBottom: position.top ? 8 : 0,
            width: 280,
            maxWidth: '90vw',
            background: C.dark,
            border: `1px solid ${C.gold}`,
            borderRadius: 8,
            padding: 14,
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button (mobile) */}
          {'ontouchstart' in window && (
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'none',
                border: 'none',
                color: C.muted,
                fontSize: 18,
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
              }}
            >
              x
            </button>
          )}
          
          {/* Term name */}
          <div style={{ color: C.gold, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
            {term}
          </div>
          
          {/* Definition */}
          <div style={{ color: C.white, fontSize: 13, lineHeight: 1.5, marginBottom: glossaryEntry.formula ? 10 : 0 }}>
            {glossaryEntry.definition}
          </div>
          
          {/* Formula if exists */}
          {glossaryEntry.formula && (
            <div style={{ 
              background: C.black, 
              borderRadius: 6, 
              padding: 10, 
              marginBottom: 10,
              borderLeft: `2px solid ${C.gold}`,
            }}>
              <div style={{ color: C.gold, fontSize: 12, lineHeight: 1.5 }}>
                {glossaryEntry.formula}
              </div>
            </div>
          )}
          
          {/* Why it works */}
          {glossaryEntry.whyItWorks && (
            <div style={{ color: C.muted, fontSize: 12, fontStyle: 'italic', marginBottom: 10 }}>
              {glossaryEntry.whyItWorks}
            </div>
          )}
          
          {/* Playbook link */}
          <button
            onClick={handlePlaybookClick}
            style={{
              background: 'none',
              border: 'none',
              color: C.gold,
              fontSize: 11,
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            See full examples in the Playbook
          </button>
        </div>
      )}
    </span>
  )
}

// Helper function to wrap terms in text with tooltips
export function wrapTermsInText(text, onNavigateToPlaybook) {
  if (!text || typeof text !== 'string') return text
  
  // Sort terms by length (longest first) to avoid partial matches
  const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length)
  const allTerms = []
  
  terms.forEach(term => {
    allTerms.push(term)
    if (TERM_ALIASES[term]) {
      TERM_ALIASES[term].forEach(alias => allTerms.push(alias))
    }
  })
  
  // Create regex pattern
  const pattern = new RegExp(`(${allTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  
  const parts = text.split(pattern)
  
  return parts.map((part, idx) => {
    const lookupKey = part.toLowerCase()
    const canonicalTerm = TERM_LOOKUP[lookupKey]
    
    if (canonicalTerm) {
      return (
        <TermTooltip key={idx} term={canonicalTerm} onNavigateToPlaybook={onNavigateToPlaybook}>
          {part}
        </TermTooltip>
      )
    }
    return part
  })
}

export default TermTooltip
