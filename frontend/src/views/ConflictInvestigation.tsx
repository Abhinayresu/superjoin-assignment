import { useState, useEffect, useRef } from 'react'
import { fetchConflicts } from '../api'

interface Criterion {
  label: string
  valueA: string
  valueB: string
  match: boolean
  note?: string
}

interface Conflict {
  id: string
  title: string
  entityA: string
  valueA: string
  sourceA: string
  pageA: number
  entityB: string
  valueB: string
  sourceB: string
  pageB: number
  criteria: Criterion[]
  verdict: 'GENUINE CONTRADICTION' | 'NOT A CONTRADICTION'
  verdictReason: string
}

const SAMPLE_CONFLICTS: Conflict[] = [
  {
    id: 'c1',
    title: 'Revenue FY2023 — Discrepancy',
    entityA: 'TechCorp Ltd',
    valueA: '₹8,000 crore',
    sourceA: 'TechCorp AR 2023',
    pageA: 42,
    entityB: 'TechCorp Ltd',
    valueB: '₹10,000 crore',
    sourceB: 'Analyst Report Q4',
    pageB: 17,
    criteria: [
      { label: 'Entity', valueA: 'TechCorp Ltd', valueB: 'TechCorp Ltd', match: true },
      { label: 'Metric', valueA: 'Annual Revenue', valueB: 'Annual Revenue', match: true },
      { label: 'Period', valueA: 'FY2023', valueB: 'FY2023', match: true },
      { label: 'Scope', valueA: 'Consolidated', valueB: 'Consolidated', match: true },
      { label: 'Unit', valueA: 'INR crore', valueB: 'INR crore', match: true, note: 'Normalized from ₹ crore → INR crore' },
    ],
    verdict: 'GENUINE CONTRADICTION',
    verdictReason: 'All five dimensions match — entity, metric, period, scope, and unit — yet the values differ by ₹2,000 crore. This is a genuine factual conflict requiring source-level verification.',
  },
  {
    id: 'c2',
    title: 'Revenue Growth — Contextual Difference',
    entityA: 'TechCorp Ltd',
    valueA: '₹12,500 crore',
    sourceA: 'TechCorp AR 2024',
    pageA: 38,
    entityB: 'TechCorp Ltd',
    valueB: '₹8,000 crore',
    sourceB: 'TechCorp AR 2023',
    pageB: 42,
    criteria: [
      { label: 'Entity', valueA: 'TechCorp Ltd', valueB: 'TechCorp Ltd', match: true },
      { label: 'Metric', valueA: 'Annual Revenue', valueB: 'Annual Revenue', match: true },
      { label: 'Period', valueA: 'FY2024', valueB: 'FY2023', match: false, note: 'Different fiscal years — expected variance' },
    ],
    verdict: 'NOT A CONTRADICTION',
    verdictReason: 'The reporting periods differ (FY2024 vs FY2023). This is expected: the company grew from ₹8,000cr to ₹12,500cr. No conflict exists.',
  },
]

function InvestigationPanel({ conflict }: { conflict: Conflict }) {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [revealedSteps, setRevealedSteps] = useState(0)
  const [showVerdict, setShowVerdict] = useState(false)
  const timeoutRefs = useRef<NodeJS.Timeout[]>([])

  const resetAll = () => {
    timeoutRefs.current.forEach(clearTimeout)
    setPhase('idle')
    setRevealedSteps(0)
    setShowVerdict(false)
  }

  useEffect(() => {
    return () => timeoutRefs.current.forEach(clearTimeout)
  }, [])

  const startInvestigation = () => {
    resetAll()
    setPhase('running')
    const numSteps = conflict.criteria.length

    for (let i = 0; i < numSteps; i++) {
      const t = setTimeout(() => {
        setRevealedSteps(i + 1)
      }, 700 + i * 900)
      timeoutRefs.current.push(t)
    }

    const finalT = setTimeout(() => {
      setPhase('done')
      setShowVerdict(true)
    }, 700 + numSteps * 900 + 400)
    timeoutRefs.current.push(finalT)
  }

  const isGenuine = conflict.verdict === 'GENUINE CONTRADICTION'

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
    >
      {/* Title bar */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Conflict #{conflict.id}
          </div>
          <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            {conflict.title}
          </h3>
        </div>
        {phase !== 'idle' && (
          <button
            onClick={resetAll}
            className="text-[12px] px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
          >
            Reset
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Two conflicting values */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: conflict.sourceA, page: conflict.pageA, value: conflict.valueA, entity: conflict.entityA, side: 'A' },
            { label: conflict.sourceB, page: conflict.pageB, value: conflict.valueB, entity: conflict.entityB, side: 'B' },
          ].map((side) => (
            <div
              key={side.side}
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="text-[10px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span
                  className="w-4 h-4 rounded flex items-center justify-center text-[9px]"
                  style={{ background: 'rgba(124,106,255,0.2)', color: '#9d8fff' }}
                >
                  {side.side}
                </span>
                {side.label}
                <span className="ml-auto opacity-60">p.{side.page}</span>
              </div>
              <div
                className="text-xl font-bold leading-tight"
                style={{ fontFamily: 'var(--font-display)', color: phase === 'done' && isGenuine ? '#f87171' : 'var(--color-text-primary)' }}
              >
                {side.value}
              </div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>{side.entity}</div>
            </div>
          ))}
        </div>

        {/* VS divider */}
        {phase === 'idle' && (
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            <span className="text-[11px] font-semibold" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>vs</span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          </div>
        )}

        {/* Investigate button */}
        {phase === 'idle' && (
          <button
            onClick={startInvestigation}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2.5"
            style={{
              background: 'linear-gradient(135deg, rgba(124,106,255,0.25) 0%, rgba(34,211,238,0.15) 100%)',
              color: 'var(--color-violet-bright)',
              border: '1px solid rgba(124,106,255,0.35)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,106,255,0.35) 0%, rgba(34,211,238,0.25) 100%)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,106,255,0.25) 0%, rgba(34,211,238,0.15) 100%)' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <circle cx="7" cy="7" r="5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
            Begin Investigation
          </button>
        )}

        {/* Investigation steps */}
        {phase !== 'idle' && (
          <div className="space-y-2 mb-5">
            <div className="text-[11px] font-semibold mb-3 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Investigation Criteria
            </div>
            {conflict.criteria.map((criterion, i) => {
              const revealed = revealedSteps > i
              return (
                <div
                  key={criterion.label}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
                  style={{
                    opacity: revealed ? 1 : 0.2,
                    background: revealed
                      ? criterion.match
                        ? 'rgba(74,222,128,0.07)'
                        : 'rgba(248,113,113,0.07)'
                      : 'transparent',
                    border: revealed
                      ? criterion.match
                        ? '1px solid rgba(74,222,128,0.2)'
                        : '1px solid rgba(248,113,113,0.2)'
                      : '1px solid transparent',
                    animation: revealed ? 'step-reveal 0.35s ease' : undefined,
                  }}
                >
                  {/* Status icon */}
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: revealed
                        ? criterion.match
                          ? 'rgba(74,222,128,0.25)'
                          : 'rgba(248,113,113,0.25)'
                        : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    {revealed ? (
                      criterion.match ? (
                        <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3">
                          <path d="M2 5l2.5 2.5L8 3" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3">
                          <path d="M3 3l4 4M7 3l-4 4" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
                    )}
                  </div>

                  <div className="flex-1 flex items-center gap-3">
                    <span
                      className="text-[12px] font-semibold w-16 flex-shrink-0"
                      style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}
                    >
                      {criterion.label}
                    </span>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[12px] truncate" style={{ color: revealed ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                        {criterion.valueA}
                      </span>
                      <span className="text-[10px] opacity-50" style={{ color: 'var(--color-text-muted)' }}>|</span>
                      <span className="text-[12px] truncate" style={{ color: revealed ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                        {criterion.valueB}
                      </span>
                    </div>
                    {revealed && (
                      <span
                        className="text-[11px] font-semibold flex-shrink-0"
                        style={{
                          color: criterion.match ? '#4ade80' : '#f87171',
                          fontFamily: 'var(--font-mono)',
                          animation: 'fade-in 0.2s ease',
                        }}
                      >
                        {criterion.match ? 'Match ✓' : 'Differ ✕'}
                      </span>
                    )}
                  </div>
                  {revealed && criterion.note && (
                    <div className="absolute left-16 top-full text-[10px] mt-0.5 opacity-60" style={{ color: 'var(--color-text-muted)' }}>
                      {criterion.note}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Verdict */}
        {showVerdict && (
          <div
            className="rounded-xl p-5 mt-4"
            style={{
              background: isGenuine
                ? 'linear-gradient(135deg, rgba(248,113,113,0.12) 0%, rgba(248,113,113,0.06) 100%)'
                : 'linear-gradient(135deg, rgba(74,222,128,0.12) 0%, rgba(74,222,128,0.06) 100%)',
              border: `1px solid ${isGenuine ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`,
              animation: 'verdict-in 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: isGenuine ? 'rgba(248,113,113,0.25)' : 'rgba(74,222,128,0.25)',
                  boxShadow: `0 0 16px ${isGenuine ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`,
                }}
              >
                {isGenuine ? (
                  <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                    <path d="M7 2l1 4h4l-3 2.5 1 4L7 10l-3 2.5 1-4L2 6h4z" fill="#f87171" opacity="0.8" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                    <path d="M3 7l3 3 5-5" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <div>
                <div
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: isGenuine ? 'rgba(248,113,113,0.7)' : 'rgba(74,222,128,0.7)', fontFamily: 'var(--font-mono)' }}
                >
                  Verdict
                </div>
                <div
                  className="text-base font-bold"
                  style={{ fontFamily: 'var(--font-display)', color: isGenuine ? '#f87171' : '#4ade80' }}
                >
                  {conflict.verdict}
                </div>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {conflict.verdictReason}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConflictInvestigation() {
  const [conflictsList, setConflictsList] = useState<Conflict[]>(SAMPLE_CONFLICTS)
  const [activeConflict, setActiveConflict] = useState(0)

  useEffect(() => {
    fetchConflicts().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setConflictsList(data)
        setActiveConflict(0)
      }
    })
  }, [])

  return (
    <div className="h-full overflow-y-auto" style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          Conflict Investigation
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Systematically investigate whether conflicting facts represent genuine contradictions
        </p>
      </div>

      {/* Conflict selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {conflictsList.map((c, i) => (
          <button
            key={c.id || i}
            onClick={() => setActiveConflict(i)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[12px] font-medium transition-all"
            style={{
              background: activeConflict === i ? 'rgba(248,113,113,0.15)' : 'var(--color-panel)',
              color: activeConflict === i ? '#f87171' : 'var(--color-text-secondary)',
              border: activeConflict === i ? '1px solid rgba(248,113,113,0.35)' : '1px solid var(--color-border)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: activeConflict === i ? '#f87171' : 'var(--color-text-muted)' }}
            />
            {c.title}
          </button>
        ))}
      </div>

      {/* How it works banner */}
      <div
        className="rounded-xl px-5 py-4 mb-6 flex items-center gap-4"
        style={{ background: 'rgba(124,106,255,0.06)', border: '1px solid rgba(124,106,255,0.15)' }}
      >
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {['Same entity', 'Same metric', 'Same period', 'Same scope', 'Unit normalized'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              {i > 0 && <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>→</span>}
              <span
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(124,106,255,0.15)', color: '#9d8fff', fontFamily: 'var(--font-mono)' }}
              >
                {step}
              </span>
            </div>
          ))}
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>→</span>
          <span
            className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171', fontFamily: 'var(--font-mono)' }}
          >
            Genuine Contradiction
          </span>
        </div>
        <div className="text-[11px] text-right flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
          Click "Begin Investigation"<br />to see step-by-step reveal
        </div>
      </div>

      {/* Main panel */}
      {conflictsList.length > 0 && (
        <InvestigationPanel key={activeConflict} conflict={conflictsList[activeConflict] || conflictsList[0]} />
      )}
    </div>
  )
}
