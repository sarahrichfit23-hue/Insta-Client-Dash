import { createClient } from '@supabase/supabase-js'
import { streamText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SYSTEM_PROMPT = `You are Coach Sarah AI analyzing a health coach's weekly performance data from the Insta Client Engine pipeline system.

You will receive their numbers for the current week and their conversion rates. Your job is to give them ONE specific, honest, actionable insight — not a generic pep talk.

Structure your response exactly like this:

**THIS WEEK IN ONE SENTENCE:**
[Summarize what the numbers actually show — honest, direct]

**WHERE YOUR SYSTEM IS WORKING:**
[One specific thing the numbers show is going well — be specific, reference actual numbers]

**WHERE TO FOCUS THIS WEEK:**
[One specific bottleneck the numbers reveal — with one concrete action to fix it. Reference the 5-Channel Pipeline System. Don't give generic advice.]

**YOUR NUMBER TO BEAT:**
[Pick one metric and give them a specific target for next week based on their current trajectory]

Keep the entire response under 150 words. Be direct. Be specific. Sound like a coach who actually looked at their numbers — not like a motivational poster.
Never use the words: transform, empower, journey, synergy, or hustle.`

export async function POST(req) {
  try {
    const { userId, weekData, previousWeekData, conversionRates, weekNumber } = await req.json()

    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check AI usage first
    const { data: usageData } = await supabase.rpc('check_and_reset_ai_usage', { p_user_id: userId })
    
    if (usageData && usageData[0] && !usageData[0].can_call) {
      return Response.json({ 
        error: 'Daily AI limit reached',
        usage: usageData[0]
      }, { status: 429 })
    }

    // Build the user message
    const currentWeek = `Week ${weekNumber} data: ${weekData.dms || 0} DMs sent, ${weekData.replies || 0} replies (${conversionRates.replyRate}% reply rate), ${weekData.emails || 0} emails collected, ${weekData.offers || 0} offers made (${conversionRates.offerRate}% offer rate), ${weekData.sales || 0} sales closed (${conversionRates.closeRate}% close rate).`
    
    const prevWeek = previousWeekData 
      ? ` Previous week: ${previousWeekData.dms || 0} DMs, ${previousWeekData.replies || 0} replies, ${previousWeekData.emails || 0} emails, ${previousWeekData.offers || 0} offers, ${previousWeekData.sales || 0} sales.`
      : ' No previous week data for comparison.'

    const userMessage = currentWeek + prevWeek

    // Generate the insight
    const result = streamText({
      model: gateway('anthropic/claude-sonnet-4'),
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 400,
    })

    // Collect the full response
    let insightText = ''
    for await (const chunk of result.textStream) {
      insightText += chunk
    }

    // Calculate week start date (Monday of current week)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const weekStartDate = new Date(now.setDate(diff)).toISOString().slice(0, 10)

    // Save the insight to database
    const { error: saveError } = await supabase
      .from('weekly_insights')
      .upsert({
        user_id: userId,
        week_start_date: weekStartDate,
        insight_text: insightText,
      }, { onConflict: 'user_id,week_start_date' })

    if (saveError) {
      console.error('Error saving insight:', saveError)
    }

    // Increment AI usage
    await supabase.rpc('increment_ai_usage', { p_user_id: userId })

    return Response.json({ 
      insight: insightText,
      weekStartDate,
      generated: true
    })

  } catch (error) {
    console.error('Weekly insight error:', error)
    return Response.json({ error: 'Failed to generate insight' }, { status: 500 })
  }
}
