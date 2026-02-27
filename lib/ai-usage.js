import { createClient } from '@supabase/supabase-js'

// Create a Supabase client for server-side usage
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

// Check if user can make an AI call (handles daily reset)
export async function checkAIUsage(userId) {
  if (!userId) return { canCall: true, callsToday: 0, callsLimit: 50, showWarning: false }
  
  const sb = getSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  
  // Get coach profile
  const { data: profile, error } = await sb
    .from('coach_profiles')
    .select('ai_calls_today, ai_calls_limit, ai_calls_reset_date, ai_warning_shown_today')
    .eq('user_id', userId)
    .single()
  
  if (error || !profile) {
    // No profile yet or error - allow call with defaults
    return { canCall: true, callsToday: 0, callsLimit: 50, showWarning: false }
  }
  
  // Check if we need to reset (new day)
  if (!profile.ai_calls_reset_date || profile.ai_calls_reset_date < today) {
    await sb
      .from('coach_profiles')
      .update({ 
        ai_calls_today: 0, 
        ai_calls_reset_date: today,
        ai_warning_shown_today: false 
      })
      .eq('user_id', userId)
    
    return { canCall: true, callsToday: 0, callsLimit: profile.ai_calls_limit || 50, showWarning: false }
  }
  
  const callsToday = profile.ai_calls_today || 0
  const callsLimit = profile.ai_calls_limit || 50
  const canCall = callsToday < callsLimit
  
  return { 
    canCall, 
    callsToday, 
    callsLimit,
    showWarning: false,
    warningShownToday: profile.ai_warning_shown_today || false
  }
}

// Increment AI usage after successful call
export async function incrementAIUsage(userId) {
  if (!userId) return { newCount: 1, limit: 50, showWarning: false }
  
  const sb = getSupabaseAdmin()
  
  // Get current values
  const { data: profile } = await sb
    .from('coach_profiles')
    .select('ai_calls_today, ai_calls_limit, ai_warning_shown_today')
    .eq('user_id', userId)
    .single()
  
  if (!profile) return { newCount: 1, limit: 50, showWarning: false }
  
  const newCount = (profile.ai_calls_today || 0) + 1
  const limit = profile.ai_calls_limit || 50
  const warningThreshold = Math.ceil(limit * 0.75)
  
  // Check if we should show warning (just crossed 75%)
  const showWarning = newCount >= warningThreshold && !profile.ai_warning_shown_today
  
  // Update the counter
  const updateData = { ai_calls_today: newCount }
  if (showWarning) {
    updateData.ai_warning_shown_today = true
  }
  
  await sb
    .from('coach_profiles')
    .update(updateData)
    .eq('user_id', userId)
  
  return { newCount, limit, showWarning }
}

// Log an AI-generated script
export async function logAIScript(userId, { prospectName, prospectHandle, channel, generationType, generatedOutput }) {
  if (!userId || !generatedOutput) return null
  
  const sb = getSupabaseAdmin()
  
  const { data, error } = await sb
    .from('ai_script_log')
    .insert({
      user_id: userId,
      prospect_name: prospectName || null,
      prospect_handle: prospectHandle || null,
      channel: channel || null,
      generation_type: generationType,
      generated_output: generatedOutput
    })
    .select()
    .single()
  
  if (error) {
    console.error('[v0] Error logging AI script:', error)
    return null
  }
  
  return data
}

// Get today's AI scripts for a user
export async function getTodayScripts(userId) {
  if (!userId) return []
  
  const sb = getSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await sb
    .from('ai_script_log')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', today + 'T00:00:00')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('[v0] Error fetching today scripts:', error)
    return []
  }
  
  return data || []
}
