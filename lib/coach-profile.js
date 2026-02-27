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
  
  // Helper to check if a field is actually provided or should be marked as NOT PROVIDED YET
  const provided = (val) => val && val.trim() ? val : 'NOT PROVIDED YET'
  
  // Handle delivery method as array or string (may be JSON string from DB)
  const deliveryMethodMap = {
    'dm': 'DM request',
    'link_in_bio': 'link in bio',
    'email_optin': 'email opt-in',
  }
  let deliveryMethod = 'NOT PROVIDED YET'
  let delivery = profile.lead_magnet_delivery
  // Parse JSON string if stored as string in DB
  if (typeof delivery === 'string' && delivery.startsWith('[')) {
    try { delivery = JSON.parse(delivery) } catch(e) { /* keep as string */ }
  }
  if (Array.isArray(delivery) && delivery.length > 0) {
    if (delivery.includes('not_sure')) {
      deliveryMethod = 'NOT PROVIDED YET — coach is still figuring out delivery method'
    } else {
      deliveryMethod = delivery.map(d => deliveryMethodMap[d] || d).join(', ')
    }
  } else if (typeof delivery === 'string' && delivery && delivery !== 'none') {
    deliveryMethod = deliveryMethodMap[delivery] || delivery
  }
  
  // Handle sales method as array or string (may be JSON string from DB)
  const salesMethodMap = {
    'discovery_call': 'discovery call',
    'direct_dm': 'direct DM close',
    'application': 'application process',
    'sales_page': 'sales page'
  }
  let salesMethod = 'NOT PROVIDED YET'
  let sales = profile.offer_sales_method
  // Parse JSON string if stored as string in DB
  if (typeof sales === 'string' && sales.startsWith('[')) {
    try { sales = JSON.parse(sales) } catch(e) { /* keep as string */ }
  }
  if (Array.isArray(sales) && sales.length > 0) {
    salesMethod = sales.map(s => salesMethodMap[s] || s).join(', ')
  } else if (typeof sales === 'string' && sales) {
    salesMethod = salesMethodMap[sales] || sales
  }
  
  // Check if lead magnet section is filled
  const deliveryProvided = Array.isArray(delivery) ? (delivery.length > 0 && !delivery.includes('not_sure')) : (delivery && delivery !== 'none')
  const hasLeadMagnet = profile.lead_magnet_name && profile.lead_magnet_name.trim() && deliveryProvided
  const leadMagnetSection = hasLeadMagnet 
    ? `Their lead magnet: ${profile.lead_magnet_name} — ${profile.lead_magnet_description || 'No description'}. Delivered via: ${deliveryMethod}.`
    : `Their lead magnet: NOT PROVIDED YET — do not reference any lead magnet in scripts. Focus on direct conversation value instead.`
  
  // Check if offer section is filled
  const hasOffer = profile.offer_name && profile.offer_name.trim() && profile.offer_price && profile.offer_price.trim()
  const offerSection = hasOffer
    ? `Their core offer: ${profile.offer_name} — ${profile.offer_description || 'No description'}. Investment: ${profile.offer_price}. Sold via: ${salesMethod}.`
    : `Their core offer: NOT PROVIDED YET — skip any CH5 conversion suggestions. Focus on relationship-building in CH1-CH4 only.`
  
  // Check if story section is filled
  const hasStory = profile.coach_story && profile.coach_story.trim()
  const storySection = hasStory
    ? `Their story: ${profile.coach_story}`
    : `Their story: NOT PROVIDED YET — do not reference any personal story or origin. Keep scripts generic but warm.`
  
  const hasResult = profile.coach_result_example && profile.coach_result_example.trim()
  const resultSection = hasResult
    ? `A real result they've gotten: ${profile.coach_result_example}`
    : `A real result they've gotten: NOT PROVIDED YET — do not fabricate or reference any specific client results.`
  
  return `
COACH PROFILE — USE THIS TO PERSONALIZE EVERY RESPONSE:

This coach works with: ${provided(profile.niche_who)} who struggle with ${provided(profile.niche_problem)} and want to ${provided(profile.niche_result)}.

${leadMagnetSection}

${offerSection}

${storySection}

${resultSection}

INSTRUCTIONS FOR USING THIS PROFILE:
- Use the dream client description to make every script feel like it was written for THIS coach's specific audience
- If lead magnet is "NOT PROVIDED YET": do not mention any freebie, guide, or lead magnet — focus on pure conversation value
- If core offer is "NOT PROVIDED YET": avoid any CH5 conversion scripts — focus only on relationship-building
- If story/result is "NOT PROVIDED YET": do not invent or assume any personal details — keep scripts authentic but generic
- Reference the lead magnet at the natural moment in CH1 and CH2 conversations when a prospect expresses a struggle — never earlier
- Never mention the core offer name or price in any opener or warm conversation script — that belongs only in CH5
- Use the coach's story and real result to add authenticity to positioning messages — but only quote it if it's genuinely relevant, never force it
- If the coach works with health/wellness clients: ground all scripts in real human emotions around body image, energy, confidence, and lifestyle — not just "losing weight" or "getting fit"
- If the coach works with other coaches or business clients: ground scripts in the emotional reality of building something alone, fear of being seen, and the gap between expertise and income
- Adapt language and examples to match whatever niche this coach serves

`
}
