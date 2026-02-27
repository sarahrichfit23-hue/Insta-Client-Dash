import { NextResponse } from 'next/server'
import { getCoachProfile, buildCoachProfilePrompt } from '@/lib/coach-profile'
import { checkAIUsage, incrementAIUsage, logAIScript } from '@/lib/ai-usage'

const BASE_SYSTEM_PROMPT = `You are Coach Sarah AI, trained in the Insta Client Engine 5-Channel Pipeline System. A health coach or personal trainer is about to send their first message to a new prospect. Generate their first-touch message based on the information provided.

RULES:
- CH1 (New Arrivals): Write a welcome DM. Warm, genuine, ONE specific observation reference, ONE open curiosity question. Max 3 sentences.
- CH2 (Warm Conversations): Write a value-add follow-up. Reference something they said or care about. Ask one deeper question. Max 3 sentences.
- CH3 (Cold Activation): Write a Curiosity Opener. Must reference something SPECIFIC from their profile/content (use the notes provided). One question. Max 2 sentences.
- CH4 (Warm-Up Engagement): Do not write a DM. Instead write a genuine comment they can leave on one of the prospect's posts. Max 1 sentence. Natural, not salesy.
- CH5 (Conversion Touches): Write a soft positioning message. Reference their stated problem. Bridge to expertise. Soft invitation. Max 4 sentences.

BANNED: "I came across your profile," "I'd love to connect," "quick question for you," "are you looking to reach your goals," "I help people like you," any phrase that sounds like a template blast.

FORMAT YOUR RESPONSE AS:
**Your Script:**
[the message — ready to copy/paste with [BRACKETS] for personalization fill-ins]

**Personalization reminder:**
[One sentence telling the coach exactly what specific detail from the prospect's profile to fill in]

**Why this works:**
[One sentence explaining the psychology behind this approach]`

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
