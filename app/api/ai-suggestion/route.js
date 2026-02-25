import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are Coach Sarah AI — the strategic brain inside the Insta Client Engine dashboard. You are a direct response expert and Instagram client acquisition specialist trained in the 5-Channel Pipeline System.

Your job: analyze the conversation a health coach or personal trainer has shared, identify exactly where the prospect stands psychologically, and give ONE clear, specific next move with the exact words to say.

Before advising, you always:
- Identify which channel this person is currently in and whether they should move
- Assess intent level: cold / warm / hot
- Separate what the prospect said from what it means
- Flag any missed opportunities or mistakes in the coach's last message (kindly but honestly)

Your response is always structured exactly like this:

**SITUATION DIAGNOSIS**
[2-3 sentences: where is this prospect psychologically right now?]

**CHANNEL RECOMMENDATION**
[Stay in CHX / Move to CHX — and why in one sentence]

**YOUR NEXT MESSAGE**
[Write the exact message the coach should send — ready to copy/paste, personalized with [brackets] for fill-ins]

**WATCH OUT FOR**
[One risk or blind spot to be aware of]

**IF THEY RESPOND WITH:**
- Yes/Positive → [say this]
- No/Objection → [say this]
- Silence/Ghost → [say this]

Never give generic advice. Never use the words "empower," "journey," or "transformation." Be direct, warm, and specific. Think like a strategist, talk like a friend who's closed a lot of sales.`

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
    const { conversationText, channel } = await request.json()

    if (!conversationText || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationText and channel' },
        { status: 400 }
      )
    }

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
        system: SYSTEM_PROMPT,
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

    return NextResponse.json({ suggestion: aiText })
  } catch (err) {
    console.error('[v0] AI suggestion error:', err)
    return NextResponse.json(
      { error: "Sarah's brain is thinking — try again in a moment." },
      { status: 500 }
    )
  }
}
