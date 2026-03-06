'use client'
import { useState, useEffect, useMemo } from 'react'

// Colors matching the app
const C = {
  black: '#1a1a1a', gold: '#F6BD60', white: '#fffdf7', card: '#2a2a2a',
  cardInner: '#fffdf7', text: '#1a1a1a', muted: '#8a8a8a', dim: '#5a5a5a',
  red: '#E74C3C', green: '#27AE60', orange: '#E67E22', blue: '#3498DB',
  purple: '#9B59B6', shadow: '0 4px 12px rgba(0,0,0,0.15)'
}

// Get week number for a date
function getWeekNumber(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// Get Monday of a week
function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

// Format date range
function formatDateRange(startDate) {
  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const opts = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

// Check if date is in current week
function isCurrentWeek(startDate) {
  const now = new Date()
  const currentMonday = getMonday(now)
  const weekMonday = new Date(startDate)
  return currentMonday.toDateString() === weekMonday.toDateString()
}

export default function PerformanceHistory({ metricsHistory, userId, sb, onUsageUpdate }) {
  const [timeRange, setTimeRange] = useState('6weeks')
  const [weeklyInsight, setWeeklyInsight] = useState(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const [insightError, setInsightError] = useState(null)
  const [cachedInsight, setCachedInsight] = useState(null)

  // Calculate current week's Monday for caching
  const currentWeekStart = useMemo(() => {
    return getMonday(new Date()).toISOString().slice(0, 10)
  }, [])

  // Load cached insight on mount
  useEffect(() => {
    if (sb && userId) {
      sb.from('weekly_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', currentWeekStart)
        .single()
        .then(({ data }) => {
          if (data) {
            setCachedInsight(data)
          }
        })
    }
  }, [sb, userId, currentWeekStart])

  // Filter metrics by time range
  const filteredMetrics = useMemo(() => {
    if (!metricsHistory || metricsHistory.length === 0) return []
    
    const now = new Date()
    let cutoffDate = new Date()
    
    switch (timeRange) {
      case '7days':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case '30days':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case '6weeks':
      default:
        cutoffDate.setDate(now.getDate() - 42)
        break
    }
    
    return metricsHistory.filter(m => new Date(m.metric_date) >= cutoffDate)
  }, [metricsHistory, timeRange])

  // Aggregate metrics by week
  const weeklyData = useMemo(() => {
    if (!filteredMetrics.length) return []
    
    const weeks = {}
    
    filteredMetrics.forEach(m => {
      const monday = getMonday(m.metric_date)
      const weekKey = monday.toISOString().slice(0, 10)
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          weekStart: weekKey,
          weekNumber: getWeekNumber(monday),
          dms: 0,
          replies: 0,
          emails: 0,
          offers: 0,
          sales: 0,
          days: []
        }
      }
      
      weeks[weekKey].dms += m.dms || 0
      weeks[weekKey].replies += m.replies || 0
      weeks[weekKey].emails += m.emails || 0
      weeks[weekKey].offers += m.offers || 0
      weeks[weekKey].sales += m.sales || 0
      weeks[weekKey].days.push(m)
    })
    
    return Object.values(weeks).sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart))
  }, [filteredMetrics])

  // Calculate total metrics for conversion rates
  const totals = useMemo(() => {
    return filteredMetrics.reduce((acc, m) => ({
      dms: acc.dms + (m.dms || 0),
      replies: acc.replies + (m.replies || 0),
      emails: acc.emails + (m.emails || 0),
      offers: acc.offers + (m.offers || 0),
      sales: acc.sales + (m.sales || 0),
    }), { dms: 0, replies: 0, emails: 0, offers: 0, sales: 0 })
  }, [filteredMetrics])

  // Conversion rates
  const conversionRates = useMemo(() => ({
    replyRate: totals.dms > 0 ? ((totals.replies / totals.dms) * 100).toFixed(1) : null,
    emailRate: totals.replies > 0 ? ((totals.emails / totals.replies) * 100).toFixed(1) : null,
    offerRate: totals.replies > 0 ? ((totals.offers / totals.replies) * 100).toFixed(1) : null,
    closeRate: totals.offers > 0 ? ((totals.sales / totals.offers) * 100).toFixed(1) : null,
  }), [totals])

  // Personal bests
  const personalBests = useMemo(() => {
    if (!metricsHistory || metricsHistory.length === 0) return {}
    
    const bests = {
      dms: { value: 0, date: null },
      replies: { value: 0, date: null },
      offers: { value: 0, date: null },
    }
    
    metricsHistory.forEach(m => {
      if ((m.dms || 0) > bests.dms.value) {
        bests.dms = { value: m.dms, date: m.metric_date }
      }
      if ((m.replies || 0) > bests.replies.value) {
        bests.replies = { value: m.replies, date: m.metric_date }
      }
      if ((m.offers || 0) > bests.offers.value) {
        bests.offers = { value: m.offers, date: m.metric_date }
      }
    })
    
    return bests
  }, [metricsHistory])

  // Best week calculation
  const bestWeek = useMemo(() => {
    if (weeklyData.length < 2) return null
    
    let best = null
    let maxScore = 0
    
    weeklyData.forEach(w => {
      const score = w.dms + (w.replies * 2) + (w.sales * 10)
      if (score > maxScore) {
        maxScore = score
        best = w
      }
    })
    
    return best && maxScore > 0 ? best : null
  }, [weeklyData])

  // Generate weekly footer text
  const getWeekFooter = (week) => {
    if (week.sales > 0) return `${week.sales} client${week.sales > 1 ? 's' : ''} closed this week.`
    if (week.offers > 0) return 'Offers out. Keep following up.'
    if (week.replies > 0) return 'Good conversations building. Push toward offers.'
    if (week.dms > 0) return 'Pipeline filling. Focus on getting replies.'
    return 'No activity logged this week.'
  }

  // Check if week has any activity
  const hasActivity = (week) => {
    return week.dms > 0 || week.replies > 0 || week.emails > 0 || week.offers > 0 || week.sales > 0
  }

  // Get benchmark status
  const getBenchmark = (rate, thresholds) => {
    if (rate === null) return { status: 'none', color: C.muted, message: 'Not enough data yet' }
    const r = parseFloat(rate)
    if (r < thresholds.low) return { status: 'low', color: C.red, message: thresholds.lowMsg }
    if (r >= thresholds.high) return { status: 'high', color: C.green, message: thresholds.highMsg }
    return { status: 'target', color: C.gold, message: thresholds.targetMsg }
  }

  // Generate weekly insight
  const generateInsight = async () => {
    if (!userId || weeklyData.length === 0) return
    
    setInsightLoading(true)
    setInsightError(null)
    
    try {
      const currentWeek = weeklyData[0]
      const previousWeek = weeklyData[1] || null
      
      const response = await fetch('/api/weekly-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          weekData: currentWeek,
          previousWeekData: previousWeek,
          conversionRates: {
            replyRate: conversionRates.replyRate || '0',
            emailRate: conversionRates.emailRate || '0',
            offerRate: conversionRates.offerRate || '0',
            closeRate: conversionRates.closeRate || '0',
          },
          weekNumber: currentWeek.weekNumber
        })
      })
      
      const data = await response.json()
      
      if (data.error) {
        if (response.status === 429) {
          setInsightError('Daily AI limit reached. Try again tomorrow.')
        } else {
          setInsightError(data.error)
        }
      } else {
        setWeeklyInsight(data.insight)
        setCachedInsight({ insight_text: data.insight, created_at: new Date().toISOString() })
        onUsageUpdate?.()
      }
    } catch (err) {
      setInsightError('Failed to generate insight. Please try again.')
    } finally {
      setInsightLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const daysOfData = filteredMetrics.length

  return (
    <div style={{ marginTop: 40 }} className="fade">
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: 'Oswald,sans-serif', fontSize: 20, color: C.black, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>
          Performance History
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { key: '7days', label: '7 days' },
            { key: '30days', label: '30 days' },
            { key: '6weeks', label: '6 weeks' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTimeRange(t.key)}
              style={{
                background: timeRange === t.key ? C.gold : 'transparent',
                color: timeRange === t.key ? C.black : C.muted,
                border: timeRange === t.key ? 'none' : '1px solid #d4d4d4',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all .15s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Best Week Callout */}
      {bestWeek && (
        <div style={{
          background: C.card,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ color: C.gold, fontSize: 14 }}>&#9733;</span>
          <span style={{ color: C.gold, fontSize: 13, fontWeight: 500 }}>
            Your best week so far: Week {bestWeek.weekNumber} — {bestWeek.dms} DMs, {bestWeek.replies} replies
          </span>
        </div>
      )}

      {/* Weekly Summary Cards */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Oswald,sans-serif', fontSize: 14, color: C.muted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
          Your Weeks at a Glance
        </div>
        
        {weeklyData.length === 0 ? (
          <div style={{ background: C.card, borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <div style={{ color: C.muted, fontSize: 14 }}>No data yet. Start logging your daily numbers to see weekly summaries here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
            {weeklyData.map(week => {
              const isCurrent = isCurrentWeek(week.weekStart)
              const active = hasActivity(week)
              
              return (
                <div
                  key={week.weekStart}
                  style={{
                    background: C.card,
                    borderRadius: 12,
                    padding: 4,
                    minWidth: 180,
                    flexShrink: 0,
                    boxShadow: C.shadow,
                    borderTop: isCurrent ? `3px solid ${C.gold}` : '3px solid #3a3a3a',
                    opacity: active ? 1 : 0.6
                  }}
                >
                  <div style={{ background: C.cardInner, borderRadius: 9, padding: 14 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ color: C.gold, fontSize: 14, fontWeight: 700, fontFamily: 'Oswald,sans-serif' }}>
                        Week {week.weekNumber}
                      </div>
                      {isCurrent && (
                        <span style={{ background: C.gold, color: C.black, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                          This Week
                        </span>
                      )}
                    </div>
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>{formatDateRange(week.weekStart)}</div>
                    
                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: C.text }}>&#9993; <strong>{week.dms}</strong> DMs</div>
                      <div style={{ fontSize: 12, color: C.text }}>&#128172; <strong>{week.replies}</strong> Replies</div>
                      <div style={{ fontSize: 12, color: C.text }}>&#9993; <strong>{week.emails}</strong> Emails</div>
                      <div style={{ fontSize: 12, color: C.text }}>&#9678; <strong>{week.offers}</strong> Offers</div>
                      <div style={{ fontSize: 12, color: C.text, gridColumn: 'span 2' }}>&#9733; <strong>{week.sales}</strong> Sales</div>
                    </div>
                    
                    {/* Footer */}
                    <div style={{
                      fontSize: 11,
                      color: active ? C.dim : C.muted,
                      fontStyle: active ? 'normal' : 'italic',
                      lineHeight: 1.4,
                      borderTop: '1px solid #e8e4db',
                      paddingTop: 10
                    }}>
                      {week.sales > 0 && '&#127881; '}{getWeekFooter(week)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Conversion Rates */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Oswald,sans-serif', fontSize: 14, color: C.muted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>
          Your Conversion Rates
        </div>
        <div style={{ color: C.dim, fontSize: 12, marginBottom: 14 }}>
          These tell you exactly where your system is working — and where to focus next.
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {/* Reply Rate */}
          {(() => {
            const benchmark = getBenchmark(conversionRates.replyRate, {
              low: 15, high: 30,
              lowMsg: 'Below target. Revisit your openers.',
              targetMsg: 'On target. Keep going.',
              highMsg: 'Crushing it. Your openers are working.'
            })
            return (
              <div style={{ background: C.card, borderRadius: 12, padding: 4, boxShadow: C.shadow }}>
                <div style={{ background: C.cardInner, borderRadius: 9, padding: 16 }}>
                  <div style={{ color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>Reply Rate</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                    {conversionRates.replyRate !== null ? `${conversionRates.replyRate}%` : '—'}
                  </div>
                  <div style={{ height: 4, background: '#e5e5e5', borderRadius: 2, marginBottom: 8 }}>
                    <div style={{ height: '100%', width: conversionRates.replyRate ? `${Math.min(parseFloat(conversionRates.replyRate), 100)}%` : 0, background: benchmark.color, borderRadius: 2 }} />
                  </div>
                  <div style={{ color: benchmark.color, fontSize: 11, marginBottom: 4 }}>{benchmark.message}</div>
                  <div style={{ color: C.muted, fontSize: 10 }}>Target: 15–30%</div>
                </div>
              </div>
            )
          })()}

          {/* Email Rate */}
          {(() => {
            const benchmark = getBenchmark(conversionRates.emailRate, {
              low: 10, high: 20,
              lowMsg: 'Low. Are you offering your lead magnet?',
              targetMsg: 'On target.',
              highMsg: 'Strong. Lead magnet is landing well.'
            })
            return (
              <div style={{ background: C.card, borderRadius: 12, padding: 4, boxShadow: C.shadow }}>
                <div style={{ background: C.cardInner, borderRadius: 9, padding: 16 }}>
                  <div style={{ color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>Email Rate</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                    {conversionRates.emailRate !== null ? `${conversionRates.emailRate}%` : '—'}
                  </div>
                  <div style={{ height: 4, background: '#e5e5e5', borderRadius: 2, marginBottom: 8 }}>
                    <div style={{ height: '100%', width: conversionRates.emailRate ? `${Math.min(parseFloat(conversionRates.emailRate), 100)}%` : 0, background: benchmark.color, borderRadius: 2 }} />
                  </div>
                  <div style={{ color: benchmark.color, fontSize: 11, marginBottom: 4 }}>{benchmark.message}</div>
                  <div style={{ color: C.muted, fontSize: 10 }}>Target: 10–20%</div>
                </div>
              </div>
            )
          })()}

          {/* Offer Rate */}
          {(() => {
            const benchmark = getBenchmark(conversionRates.offerRate, {
              low: 15, high: 25,
              lowMsg: 'Low. Are warm convos moving to CH5?',
              targetMsg: 'On target.',
              highMsg: 'Strong pipeline-to-offer conversion.'
            })
            return (
              <div style={{ background: C.card, borderRadius: 12, padding: 4, boxShadow: C.shadow }}>
                <div style={{ background: C.cardInner, borderRadius: 9, padding: 16 }}>
                  <div style={{ color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>Offer Rate</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                    {conversionRates.offerRate !== null ? `${conversionRates.offerRate}%` : '—'}
                  </div>
                  <div style={{ height: 4, background: '#e5e5e5', borderRadius: 2, marginBottom: 8 }}>
                    <div style={{ height: '100%', width: conversionRates.offerRate ? `${Math.min(parseFloat(conversionRates.offerRate), 100)}%` : 0, background: benchmark.color, borderRadius: 2 }} />
                  </div>
                  <div style={{ color: benchmark.color, fontSize: 11, marginBottom: 4 }}>{benchmark.message}</div>
                  <div style={{ color: C.muted, fontSize: 10 }}>Target: 15–25%</div>
                </div>
              </div>
            )
          })()}

          {/* Close Rate */}
          {(() => {
            const benchmark = getBenchmark(conversionRates.closeRate, {
              low: 20, high: 40,
              lowMsg: 'Low. Revisit your soft offer.',
              targetMsg: 'On target.',
              highMsg: 'Exceptional. You\'re closing well.'
            })
            return (
              <div style={{ background: C.card, borderRadius: 12, padding: 4, boxShadow: C.shadow }}>
                <div style={{ background: C.cardInner, borderRadius: 9, padding: 16 }}>
                  <div style={{ color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>Close Rate</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                    {conversionRates.closeRate !== null ? `${conversionRates.closeRate}%` : '—'}
                  </div>
                  <div style={{ height: 4, background: '#e5e5e5', borderRadius: 2, marginBottom: 8 }}>
                    <div style={{ height: '100%', width: conversionRates.closeRate ? `${Math.min(parseFloat(conversionRates.closeRate), 100)}%` : 0, background: benchmark.color, borderRadius: 2 }} />
                  </div>
                  <div style={{ color: benchmark.color, fontSize: 11, marginBottom: 4 }}>{benchmark.message}</div>
                  <div style={{ color: C.muted, fontSize: 10 }}>Target: 20–40%</div>
                </div>
              </div>
            )
          })()}
        </div>
        
        {daysOfData < 7 && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f5f3ee', borderRadius: 8, fontSize: 12, color: C.dim }}>
            Conversion rates get more meaningful after 2+ weeks of consistent tracking. Keep logging.
          </div>
        )}
      </div>

      {/* Personal Bests */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Oswald,sans-serif', fontSize: 14, color: C.muted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
          Personal Bests
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ background: C.card, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span style={{ color: C.gold }}>&#127942;</span>
            <span style={{ color: C.white, fontSize: 12 }}>
              Best DM day: <strong>{personalBests.dms?.value || '—'}</strong>{personalBests.dms?.date && ` on ${formatDate(personalBests.dms.date)}`}
            </span>
          </div>
          <div style={{ background: C.card, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span style={{ color: C.gold }}>&#127942;</span>
            <span style={{ color: C.white, fontSize: 12 }}>
              Best reply day: <strong>{personalBests.replies?.value || '—'}</strong>{personalBests.replies?.date && ` on ${formatDate(personalBests.replies.date)}`}
            </span>
          </div>
          <div style={{ background: C.card, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span style={{ color: C.gold }}>&#127942;</span>
            <span style={{ color: C.white, fontSize: 12 }}>
              Most offers: <strong>{personalBests.offers?.value || '—'}</strong>{personalBests.offers?.date && ` on ${formatDate(personalBests.offers.date)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Coaching Insight */}
      <div>
        <div style={{ fontFamily: 'Oswald,sans-serif', fontSize: 14, color: C.muted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>
          &#128202; Coach Sarah's Read on Your Numbers
        </div>
        <div style={{ color: C.dim, fontSize: 11, marginBottom: 12 }}>
          Updates once per week. Uses 1 AI call.
        </div>
        
        <div style={{ background: C.card, borderRadius: 12, padding: 4, boxShadow: C.shadow }}>
          <div style={{ background: C.cardInner, borderRadius: 9, borderLeft: `3px solid ${C.gold}`, padding: 18 }}>
            {(cachedInsight || weeklyInsight) ? (
              <>
                <div style={{ color: C.text, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {(weeklyInsight || cachedInsight.insight_text).split('**').map((part, i) => 
                    i % 2 === 0 ? part : <strong key={i} style={{ color: C.black }}>{part}</strong>
                  )}
                </div>
                <div style={{ marginTop: 12, color: C.muted, fontSize: 10 }}>
                  Generated {cachedInsight?.created_at ? new Date(cachedInsight.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'just now'}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                {insightError ? (
                  <div style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{insightError}</div>
                ) : (
                  <div style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>
                    {weeklyData.length === 0 
                      ? 'Log at least a week of data to get your first coaching insight.'
                      : 'Get a personalized analysis of your numbers from Coach Sarah AI.'}
                  </div>
                )}
                <button
                  onClick={generateInsight}
                  disabled={insightLoading || weeklyData.length === 0}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${C.gold}`,
                    color: C.gold,
                    padding: '10px 18px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: insightLoading || weeklyData.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: insightLoading || weeklyData.length === 0 ? 0.5 : 1
                  }}
                >
                  {insightLoading ? 'Generating...' : "Generate This Week's Insight"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
