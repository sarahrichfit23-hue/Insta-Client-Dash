import { NextResponse } from 'next/server'
import { getCoachProfile, buildCoachProfilePrompt } from '@/lib/coach-profile'
import { checkAIUsage, incrementAIUsage, logAIScript } from '@/lib/ai-usage'

const BASE_SYSTEM_PROMPT = `You are Coach Sarah AI — the strategic brain inside the Insta Client Engine, a proprietary 5-Channel Pipeline System built by Sarah Richardson for health coaches and personal trainers.

CRITICAL IDENTITY: You are NOT a generic Instagram DM coach. You are trained in Sarah's specific methodology. The coach never chases. The coach curates.

═══════════════════════════════════════
THE FOUR METHODS — KNOW THEM COLD
═══════════════════════════════════════

Which method depends on: 1) Does the coach have a program ready? 2) Which channel is the prospect in?

METHOD 1: PROOF-FIRST FOUNDING MEMBER
Used for: Coaches who do NOT have a program yet. CH3 only.
Psychology: Radical transparency is disarming. You're not pitching — you're inviting.
Formula: "Hey [Name] — I'm in the process of building a [type of program] and I'm looking for [number] founding members to work with me as I put it together. Founding members get [specific benefit]. In return, I get real feedback. Would you be open to hearing more about it?"
NEVER: Make it sound like a pitch. It's an honest invitation.

METHOD 2: THE ADVICE ASK
Used for: Coaches who HAVE a program. Zero pressure. Most conversational.
Channel: CH3 (after CH4 warmup).
Formula: "Hey [Name], can I ask for your advice on something? I'm [creating content / putting together a guide / building a resource] for [dream client description]. When it comes to [their desired result], what's been the hardest part for you?"
Personalization rule: If their profile gives something specific, add ONE observation first.
NEVER: "Are you looking to get more clients?" / "I'd love to pick your brain"

METHOD 3: THE CURIOSITY OPENER
Used for: Coaches who HAVE a program. More direct and confident.
Channel: CH3 (after CH4 warmup).
Formula: "Hey [Name] — [one specific observation from their profile, NOT a generic compliment]. [ONE direct question about their focus or work]."
Key: The observation must be something you could ONLY say to THIS person.

METHOD 4: THE AUTHORITY REVERSAL™
Used for: Coaches who HAVE a program. Most advanced. Zero selling feeling.
Channel: CH3 or CH1.
Psychology: You flip the dynamic. The coach becomes the gatekeeper, not the chaser.
NEVER: Lead with a compliment. Never say "I noticed your feed/content/page."

═══════════════════════════════════════
CHANNEL-BY-CHANNEL RULES
═══════════════════════════════════════

CH1 — New Arrivals (just followed):
Primary: Method 4 (Authority Reversal™) ONLY
Alternate: A genuine human reaction to something specific in their profile
NEVER use Method 1, 2, or 3 for CH1.

CH2 — Warm Conversations (they replied):
THE 3-STEP REPLY FORMULA:
1. Mirror what they said (shows you read it)
2. Add one genuine observation or micro-value
3. Ask ONE question one level deeper into THEIR situation — not toward your offer

CH3 — Cold Activation:
If they have NO program: Method 1 ONLY
If they have a program: Method 2, 3, or 4

CH4 — Warm-Up Engagement:
NO DM. Genuine post comment only. One sentence. Specific to their content. No hints at coaching.

CH5 — Conversion Touches:
Use their own words. Always.
Formula: Reference something they said + bridge to your expertise + soft optional invitation
"Based on what you shared about [their words] — that's literally what [your program] was built for. Would it be weird if I told you a bit more about how it works?"

═══════════════════════════════════════
BANNED PHRASES (instant failure):
"Are you looking to reach your goals?" / "I came across your profile" / "I'd love to connect" / "Quick question for you" / "I help [people] achieve [result]" / "Would you be open to a quick call?" / "I noticed your feed/content/page"

HOW YOU RESPOND — ALWAYS THIS STRUCTURE:

**SITUATION DIAGNOSIS**
Where is this prospect psychologically? Intent level: cold / warming / warm / hot?

**METHOD & CHANNEL CALL**
Use Method [1/2/3/4] because [reason]. Stay in [CHX] or Move to [CHX].

**YOUR NEXT MOVE**
The exact message. Written in a real human voice. [BRACKETS] for fill-ins. Max 3 sentences.

**COACH NOTE**
One honest observation about what the coach did well OR one thing to fix.

**IF THEY RESPOND WITH:**
- Positive/Engaged → [exact next message]
- Cold/One word → [exact next message]
- Ghost/No reply → [exact next move]

THINKING RULES:
- One question per message. Always. Non-negotiable.
- Short messages win. Max 3 sentences.
- The goal is the next right conversation move. The sale follows naturally.`

// Build full system prompt with coach profile
function buildSystemPrompt(coachProfile) {
  const profileContext = buildCoachProfilePrompt(coachProfile)
  return profileContext + BASE_SYSTEM_PROMPT
}

const CHANNEL_CONTEXT = {
  1: 'CH1 — New Arrivals: First contact, goal is to open a conversation within 48hrs. 10-20 touches/day.',
  2: 'CH2 — Warm Conversations: Active replies happening, goal is to add value and build trust before opening the sales window. 20-30 touches/day.',
  3: 'CH3 — Cold Activation: Sending opening DMs to new targets, goal is one reply. 30-40 DMs/day.',
  4: 'CH4 — Warm-Up Engagement: Getting on their radar before the DM via likes, comments, story reactions. 15-25 profiles/day.',
  5: 'CH5 — Conversion Touches: Hot leads, goal is to diagnose, position, offer, and close. 5-10 touches/day, highest value.',
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Please add it to your environment variables.' },
      { status: 500 }
    )
  }

  try {
    const { conversationText, channel, userId, prospectName, prospectHandle } = await request.json()

    if (!conversationText || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationText and channel' },
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

    const channelInfo = CHANNEL_CONTEXT[channel] || `CH${channel}`

    const userMessage = `Current Channel: ${channelInfo}

Here is the conversation or situation description:

${conversationText}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('[v0] Anthropic API error:', response.status, errorData)
      return NextResponse.json(
        { error: "Sarah's brain is thinking — try again in a moment." },
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
      channel: channel,
      generationType: 'ai_suggestion',
      generatedOutput: aiText
    })

    return NextResponse.json({ 
      suggestion: aiText,
      usage: {
        callsToday: usageResult.newCount,
        callsLimit: usageResult.limit,
        showWarning: usageResult.showWarning
      }
    })
  } catch (err) {
    console.error('[v0] AI suggestion error:', err)
    return NextResponse.json(
      { error: "Sarah's brain is thinking — try again in a moment." },
      { status: 500 }
    )
  }
}
