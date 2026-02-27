import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client for API routes
function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Fetch coach profile by user ID
export async function getCoachProfile(userId) {
  if (!userId) return null
  
  const sb = getServerSupabase()
  if (!sb) return null
  
  const { data, error } = await sb
    .from('coach_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error || !data) return null
  return data
}

// Build the coach profile context string for AI prompts
export function buildCoachProfilePrompt(profile) {
  if (!profile) return ''
  
  const deliveryMethod = {
    'dm': 'DM request',
    'link_in_bio': 'link in bio',
    'email_optin': 'email opt-in',
    'none': 'no lead magnet currently'
  }[profile.lead_magnet_delivery] || profile.lead_magnet_delivery
  
  const salesMethod = {
    'discovery_call': 'discovery call',
    'direct_dm': 'direct DM close',
    'application': 'application process',
    'sales_page': 'sales page'
  }[profile.offer_sales_method] || profile.offer_sales_method
  
  return `
COACH PROFILE — USE THIS TO PERSONALIZE EVERY RESPONSE:

This coach works with: ${profile.niche_who || 'not specified'} who struggle with ${profile.niche_problem || 'not specified'} and want to ${profile.niche_result || 'not specified'}.

Their lead magnet: ${profile.lead_magnet_name || 'None'} — ${profile.lead_magnet_description || 'No description'}. Delivered via: ${deliveryMethod}.

Their core offer: ${profile.offer_name || 'Not specified'} — ${profile.offer_description || 'No description'}. Investment: ${profile.offer_price || 'Not specified'}. Sold via: ${salesMethod}.

Their story: ${profile.coach_story || 'Not provided'}

A real result they've gotten: ${profile.coach_result_example || 'Not provided'}

INSTRUCTIONS FOR USING THIS PROFILE:
- Use the dream client description to make every script feel like it was written for THIS coach's specific audience
- Reference the lead magnet at the natural moment in CH1 and CH2 conversations when a prospect expresses a struggle — never earlier
- Never mention the core offer name or price in any opener or warm conversation script — that belongs only in CH5
- Use the coach's story and real result to add authenticity to positioning messages — but only quote it if it's genuinely relevant, never force it
- If the coach works with health/wellness clients: ground all scripts in real human emotions around body image, energy, confidence, and lifestyle — not just "losing weight" or "getting fit"
- If the coach works with other coaches or business clients: ground scripts in the emotional reality of building something alone, fear of being seen, and the gap between expertise and income
- Adapt language and examples to match whatever niche this coach serves

`
}
