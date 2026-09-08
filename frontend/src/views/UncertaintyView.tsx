import { useState, useEffect } from 'react'
import { fetchUncertainties } from '../api'

interface UnresolvedFact {
  id: string
  query: string
  entity: string
  metric: string
  period: string
  status: 'insufficient' | 'ambiguous' | 'conflict_unresolved'
  reason: string
  missing: string[]
  partialEvidence?: string
  partialSource?: string
  confidence: number
}

const SAMPLE_UNRESOLVED: UnresolvedFact[] = [
  {
    id: 'u1',
    query: "What is TechCorp's net profit margin for FY2024?",
    entity: 'TechCorp Ltd',
    metric: 'Net Profit Margin',
    period: 'FY2024',
    status: 'insufficient',
    reason: "The available documents contain revenue figures for FY2024 but do not explicitly state net profit or PAT as a percentage of revenue. The annual report mentions EBITDA margin but not net margin.",
    missing: ['Net Profit (PAT) for FY2024', 'Profit & Loss statement or summary', 'Management commentary on net margin'],
    partialEvidence: 'EBITDA margins improved by 120 basis points to 18.4% in FY23, reflecting operating leverage...',
    partialSource: 'TechCorp AR 2023, p.44',
    confidence: 0,
  },
  {
    id: 'u2',
    query: "Has TechCorp disclosed ESG or sustainability targets?",
    entity: 'TechCorp Ltd',
    metric: 'ESG Commitments',
    period: 'FY2023–24',
    status: 'ambiguous',
    reason: "References to sustainability initiatives appear in two documents but the claims are vague and no quantified targets, baselines or timelines are stated. Unable to extract a verifiable fact.",
    missing: ['Quantified ESG targets (emissions, water, waste)', 'Baseline year and measurement methodology', 'Third-party verification or assurance report'],
    partialEvidence: 'The Company remains committed to sustainable business practices and is evaluating its environmental impact across operations...',
    partialSource: 'TechCorp AR 2023, p.104',
    confidence: 12,
  },
  {
    id: 'u3',
    query: "What is TechCorp's debt-to-equity ratio?",
    entity: 'TechCorp Ltd',
    metric: 'Debt-to-Equity Ratio',
    period: 'FY2023',
    status: 'insufficient',
    reason: "Total debt and equity figures are present in separate sections of the AR2023 but the balance sheet summary page referenced (p.76) contains incomplete data in the indexed PDF — the table appears to be image-encoded and could not be extracted.",
    missing: ['Parseable balance sheet data (p.76 is image-encoded)', 'Total borrowings as of March 31, 2023', 'Shareholders equity breakdown'],
    confidence: 0,
  },
  {
    id: 'u4',
    query: "What were TechCorp's top 3 revenue segments in FY24?",
    entity: 'TechCorp Ltd',
    metric: 'Revenue Segmentation',
    period: 'FY2024',
    status: 'conflict_unresolved',
    reason: "Two documents provide segment revenue data for FY24 but use different segment definitions — the AR2024 uses a 4-segment model while the Analyst Report uses a 3-segment model with different naming conventions. Segments cannot be reliably reconciled without additional clarification.",
    missing: ['Segment definition mapping between AR and Analyst Report', 'Audited segment revenue disclosures', 'Management clarification on segment reclassification'],
    partialEvidence: 'Cloud & Infrastructure revenue grew 67% to ₹5,400 crore, comprising 43% of total revenue...',
    partialSource: 'TechCorp AR 2024, p.51',
    confidence: 31,
  },
]

const STATUS_CONFIG = {
  insufficient: {
    label: 'Insufficient Evidence',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.25)',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
        <circle cx="8" cy="8" r="7" stroke="#fbbf24" strokeWidth="1.5" />
        <line x1="8" y1="4.5" x2="8" y2="9" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.8" fill="#fbbf24" />
      </svg>
    ),
  },
  ambiguous: {
    label: 'Ambiguous Evidence',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.1)',
    border: 'rgba(251,146,60,0.25)',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
        <path d="M8 1L15 13H1L8 1z" stroke="#fb923c" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="8" y1="6" x2="8" y2="9.5" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.8" fill="#fb923c" />
      </svg>
    ),
  },
  conflict_unresolved: {
    label: 'Unresolved Conflict',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.1)',
    border: 'rgba(248,113,113,0.25)',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
        <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
}

export default function UncertaintyView() {
  const [unresolvedList, setUnresolvedList] = useState<UnresolvedFact[]>(SAMPLE_UNRESOLVED)
  const [selected, setSelected] = useState<UnresolvedFact | null>(null)

  useEffect(() => {
    fetchUncertainties().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        const mapped: UnresolvedFact[] = data.map((u: any, i: number) => ({
          id: u.id || `u_${i}`,
          query: `Extracted Uncertainty: ${u.fact}`,
          entity: u.entity,
          metric: u.fact,
          period: u.period,
          status: 'ambiguous',
          reason: u.explanation || 'Low extraction confidence score or ambiguous table text.',
          missing: ['Direct tabular confirmation', 'Explicit paragraph context'],
          partialEvidence: u.evidence,
          partialSource: `${u.source}, p.${u.page}`,
          confidence: u.confidence
        }))
        setUnresolvedList(mapped)
      }
    })
  }, [])

  return (
    <div className="h-full overflow-y-auto" style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            Unresolved States
          </h1>
          <div
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontFamily: 'var(--font-mono)' }}
          >
            {unresolvedList.length} unresolved
          </div>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          FactLayer does not hallucinate. When evidence is insufficient, it says so explicitly.
        </p>
      </div>

      {/* Principle banner */}
      <div
        className="rounded-xl px-5 py-4 mb-8 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(124,106,255,0.08) 0%, rgba(34,211,238,0.04) 100%)', border: '1px solid rgba(124,106,255,0.2)' }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(124,106,255,0.2)', border: '1px solid rgba(124,106,255,0.3)' }}
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
            <path d="M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 3c.6 0 1 .4 1 1v3c0 .6-.4 1-1 1s-1-.4-1-1V6c0-.6.4-1 1-1zm0 6.5c-.5 0-.9-.4-.9-.9s.4-.9.9-.9.9.4.9.9-.4.9-.9.9z" fill="#9d8fff" />
          </svg>
        </div>
        <div>
          <div className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
            Honest by design
          </div>
          <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            Instead of fabricating an answer, FactLayer surfaces exactly what is missing and why the question cannot be answered with the available evidence.
          </p>
        </div>
      </div>

      {/* Unresolved cards */}
      <div className="space-y-4">
        {unresolvedList.map((item, idx) => {
          const config = STATUS_CONFIG[item.status]
          const isExpanded = selected?.id === item.id

          return (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: 'var(--color-panel)',
                border: `1px solid ${isExpanded ? config.border : 'var(--color-border)'}`,
                animation: `fade-in-up 0.3s ease ${idx * 0.08}s both`,
              }}
            >
              {/* Card header */}
              <button
                className="w-full text-left px-5 py-4 flex items-start gap-4"
                onClick={() => setSelected(isExpanded ? null : item)}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: config.bg, border: `1px solid ${config.border}` }}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ background: config.bg, color: config.color, fontFamily: 'var(--font-mono)' }}
                    >
                      {config.label}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {item.entity} · {item.period}
                    </span>
                  </div>
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {item.query}
                  </div>
                </div>

                {/* Confidence pill */}
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <div
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)', color: config.color, fontFamily: 'var(--font-mono)' }}
                  >
                    {item.confidence}% confident
                  </div>
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    className="w-3 h-3 transition-transform duration-200"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--color-text-muted)' }}
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div
                  className="px-5 pb-5"
                  style={{ borderTop: '1px solid var(--color-border)', animation: 'fade-in 0.2s ease' }}
                >
                  <div className="pt-4 space-y-5">
                    {/* What FactLayer says */}
                    <div
                      className="rounded-xl p-4 flex gap-3"
                      style={{ background: config.bg, border: `1px solid ${config.border}` }}
                    >
                      <div className="w-0.5 rounded-full flex-shrink-0" style={{ background: config.color }} />
                      <div>
                        <div className="text-[11px] font-semibold mb-1" style={{ color: config.color, fontFamily: 'var(--font-mono)' }}>
                          FactLayer says
                        </div>
                        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                          {item.reason}
                        </p>
                      </div>
                    </div>

                    {/* What is missing */}
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        What is missing
                      </div>
                      <div className="space-y-1.5">
                        {item.missing.map((m, i) => (
                          <div key={i} className="flex items-center gap-2.5">
                            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                              <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                                <path d="M2 5h6M5 2v6" stroke={config.color} strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
                              </svg>
                            </div>
                            <span className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Partial evidence if any */}
                    {item.partialEvidence && (
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Partial evidence found
                        </div>
                        <div
                          className="rounded-xl p-3.5 flex gap-3"
                          style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}
                        >
                          <div className="w-0.5 rounded-full flex-shrink-0" style={{ background: '#fbbf24', opacity: 0.5 }} />
                          <div>
                            <p className="text-[12px] italic leading-relaxed" style={{ color: '#fde68a', opacity: 0.8 }}>
                              "{item.partialEvidence}"
                            </p>
                            <div className="text-[10px] mt-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {item.partialSource} — related but not conclusive
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Confidence bar */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Extraction confidence</span>
                        <span className="text-[11px]" style={{ color: config.color, fontFamily: 'var(--font-mono)' }}>{item.confidence}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${item.confidence}%`, background: config.color, opacity: 0.7 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
