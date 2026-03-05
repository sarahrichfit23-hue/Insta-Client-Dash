import { NextResponse } from 'next/server'
import { getCoachProfile, buildCoachProfilePrompt } from '@/lib/coach-profile'
import { checkAIUsage, incrementAIUsage, logAIScript } from '@/lib/ai-usage'

const BASE_SYSTEM_PROMPT = `You are Coach Sarah AI, trained in the Insta Client Engine 5-Channel Pipeline System. Generate the coach's first-touch message using THE FOUR METHODS below.

═══════════════════════════════════════
THE FOUR METHODS — KNOW THEM COLD
═══════════════════════════════════════

METHOD 1: PROOF-FIRST FOUNDING MEMBER
Used for: Coaches who do NOT have a program yet.
Channel: CH3 only.
Psychology: Radical transparency is disarming. You're not pitching — you're inviting someone to help build something.
Formula: "Hey [Name] — I'm in the process of building a [type of program] and I'm looking for [number] founding members to work with me as I put it together. Founding members get [specific benefit]. In return, I get real feedback from real people instead of guessing. Would you be open to hearing more about it?"
NEVER: Make it sound like a pitch. It's an honest invitation. The transparency IS the hook.

METHOD 2: THE ADVICE ASK
Used for: Coaches who HAVE a program. Zero pressure. Most conversational.
Channel: CH3 (after CH4 warmup).
Psychology: Position THEM as the expert. No selling pressure — they self-identify their problem.
Formula: "Hey [Name], can I ask for your advice on something? I'm [creating content / putting together a guide / building a resource] for [dream client description]. When it comes to [their desired result], what's been the hardest part for you?"
Personalization rule: If their profile gives something specific, add ONE observation first.
NEVER: "Are you looking to get more clients?" / "I'd love to pick your brain"

METHOD 3: THE CURIOSITY OPENER
Used for: Coaches who HAVE a program. More direct and confident.
Channel: CH3 (after CH4 warmup).
Psychology: Specific reference proves you looked. Direct question respects their time.
Formula: "Hey [Name] — [one specific observation from their profile, NOT a generic compliment]. [ONE direct question about their focus or work — not their struggles, not their goals, about THEM]."
Key: The observation must be something you could ONLY say to THIS person.

METHOD 4: THE AUTHORITY REVERSAL™
Used for: Coaches who HAVE a program. Most advanced method. Zero selling feeling.
Channel: CH3 or CH1.
Psychology: You flip the dynamic. The coach becomes the gatekeeper, not the chaser.
How it works: Frame what you're building/researching. Reference something specific about THIS prospect. Ask ONE question that makes them want to engage.
NEVER: Lead with a compliment. Never say "I noticed your feed/content/page."

═══════════════════════════════════════
CHANNEL-BY-CHANNEL RULES
═══════════════════════════════════════

CH1 — New Arrivals (just followed):
Primary: Method 4 (Authority Reversal™) ONLY
Alternate: A genuine human reaction to something specific in their profile
NEVER use Method 1, 2, or 3 for CH1.

CH3 — Cold Activation:
If they have NO program: Method 1 ONLY
If they have a program: Method 2 (Advice Ask), Method 3 (Curiosity Opener), or Method 4 (Authority Reversal™)

CH4 — Warm-Up Engagement:
NO DM. Generate a genuine post comment only. One sentence. Specific to their content. No hints at coaching.

CH5 — Conversion Touches:
Use their own words. Always.
Formula: Reference something they said + bridge to your expertise + soft optional invitation

═══════════════════════════════════════
BANNED PHRASES (instant failure):
"I came across your profile," "I'd love to connect," "quick question for you," "are you looking to reach your goals," "I help people like you," "I noticed your feed"

FORMAT YOUR RESPONSE AS:
**Method Used:** [Method 1/2/3/4 and why]

**Your Script:**
[the message — ready to copy/paste with [BRACKETS] for personalization fill-ins]

**Personalization reminder:**
[One sentence telling the coach exactly what specific detail to fill in]

**Why this works:**
[One sentence explaining the psychology]`

function buildSystemPrompt(coachProfile) {
  const profileContext = buildCoachProfilePrompt(coachProfile)
  return profileContext + BASE_SYSTEM_PROMPT
}

const CHANNEL_NAMES = {
  '1': 'CH1 — New Arrivals',
  '2': 'CH2 — Warm Conversations',
  '3': 'CH3 — Cold Activation',
  '4': 'CH4 — Warm-Up Engagement',
  '5': 'CH5 — Conversion Touches',
}

const INTENT_LABELS = {
  'hot': 'Hot — Buying signals present',
  'warm': 'Warm — Engaged but no direct buying intent yet',
  'cold': 'Cold — No interaction yet or very early stage',
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured.' },
      { status: 500 }
    )
  }

  try {
    const { whereFound, channel, intent, notes, userId, prospectName, prospectHandle } = await request.json()

    if (!whereFound || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check AI usage limits
    const usageCheck = await checkAIUsage(userId)
    if (!usageCheck.canCall) {
      return NextResponse.json(
        { 
          error: 'limit_reached',
          callsToday: usageCheck.callsToday,
          callsLimit: usageCheck.callsLimit
        },
        { status: 429 }
      )
    }

    // Fetch coach profile for personalization
    const coachProfile = userId ? await getCoachProfile(userId) : null
    const systemPrompt = buildSystemPrompt(coachProfile)

    const channelName = CHANNEL_NAMES[channel] || `CH${channel}`
    const intentLabel = INTENT_LABELS[intent] || 'Unknown'

    const userMessage = `Where Found: ${whereFound}
Starting Channel: ${channelName}
Intent Level: ${intentLabel}
Notes: ${notes || '(none provided)'}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Couldn't generate right now — add your notes and try again." },
        { status: response.status }
      )
    }

    const data = await response.json()
    const aiText = data.content?.[0]?.text || 'No response generated.'

    // Increment usage and log the script
    const usageResult = await incrementAIUsage(userId)
    await logAIScript(userId, {
      prospectName: prospectName || null,
      prospectHandle: prospectHandle || null,
      channel: parseInt(channel) || null,
      generationType: 'first_touch',
      generatedOutput: aiText
    })

    return NextResponse.json({ 
      script: aiText,
      usage: {
        callsToday: usageResult.newCount,
        callsLimit: usageResult.limit,
        showWarning: usageResult.showWarning
      }
    })
  } catch (err) {
    console.error('[v0] First touch script error:', err)
    return NextResponse.json(
      { error: "Couldn't generate right now — add your notes and try again." },
      { status: 500 }
    )
  }
}
