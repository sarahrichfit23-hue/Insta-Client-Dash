import { NextResponse } from 'next/server'
import { checkAIUsage, getTodayScripts } from '@/lib/ai-usage'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }
    
    const usage = await checkAIUsage(userId)
    const scripts = await getTodayScripts(userId)
    
    return NextResponse.json({
      callsToday: usage.callsToday,
      callsLimit: usage.callsLimit,
      callsRemaining: Math.max(0, usage.callsLimit - usage.callsToday),
      canCall: usage.canCall,
      scripts: scripts
    })
  } catch (err) {
    console.error('[v0] AI usage fetch error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    )
  }
}
