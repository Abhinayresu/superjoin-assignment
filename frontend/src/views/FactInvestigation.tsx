import { useState, useEffect } from 'react'
import { fetchFacts } from '../api'

const SAMPLE_FACTS = [
  {
    id: 'f1',
    fact: 'Annual Revenue',
    entity: 'TechCorp Ltd',
    value: '₹8,000 crore',
    period: 'FY2023',
    scope: 'Consolidated',
    confidence: 97,
    source: 'TechCorp AR 2023',
    page: 42,
    evidence: 'The Company recorded consolidated revenue from operations of ₹8,000 crore for the financial year ended March 31, 2023, representing a growth of 22% over the previous year.',
    tag: 'financial',
    conflict: true,
  },
  {
    id: 'f2',
    fact: 'Annual Revenue',
    entity: 'TechCorp Ltd',
    value: '₹10,000 crore',
    period: 'FY2023',
    scope: 'Consolidated',
    confidence: 82,
    source: 'Analyst Report Q4',
    page: 17,
    evidence: 'We estimate TechCorp\'s consolidated revenue for FY23 to be approximately ₹10,000 crore, based on our channel checks and management commentary.',
    tag: 'financial',
    conflict: true,
  },
  {
    id: 'f3',
    fact: 'Annual Revenue',
    entity: 'TechCorp Ltd',
    value: '₹12,500 crore',
    period: 'FY2024',
    scope: 'Consolidated',
    confidence: 97,
    source: 'TechCorp AR 2024',
    page: 38,
    evidence: 'Consolidated revenue from operations for the year ended March 31, 2024 was ₹12,500 crore, up 56% over FY23 on a reported basis.',
    tag: 'financial',
    conflict: false,
  },
  {
    id: 'f4',
    fact: 'Chief Executive Officer',
    entity: 'TechCorp Ltd',
    value: 'Rajan Mehta',
    period: 'FY2023–24',
    scope: 'Board & Leadership',
    confidence: 99,
    source: 'TechCorp AR 2023',
    page: 18,
    evidence: 'Mr. Rajan Mehta, Managing Director & CEO, has led the Company since 2019 and continues to drive its strategic agenda across cloud, data and AI services.',
    tag: 'governance',
    conflict: false,
  },
  {
    id: 'f5',
    fact: 'Total Employees',
    entity: 'TechCorp Ltd',
    value: '12,000',
    period: 'FY2023',
    scope: 'Global headcount',
    confidence: 96,
    source: 'TechCorp AR 2023',
    page: 87,
    evidence: 'As of March 31, 2023, the Company employed 12,000 full-time employees across its offices in India, the United States and Singapore.',
    tag: 'workforce',
    conflict: false,
  },
  {
    id: 'f6',
    fact: 'Total Employees',
    entity: 'TechCorp Ltd',
    value: '18,500',
    period: 'FY2024',
    scope: 'Global headcount',
    confidence: 96,
    source: 'TechCorp AR 2024',
    page: 92,
    evidence: 'The Company\'s global workforce grew to 18,500 employees as of March 31, 2024, reflecting strategic hiring across engineering, product and go-to-market functions.',
    tag: 'workforce',
    conflict: false,
  },
]

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  financial: { bg: 'rgba(34,211,238,0.15)', text: '#22d3ee' },
  governance: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
  workforce: { bg: 'rgba(163,230,53,0.15)', text: '#a3e635' },
}

const CONF_COLOR = (c: number) => c >= 90 ? '#4ade80' : c >= 70 ? '#fbbf24' : '#f87171'

export default function FactInvestigation() {
  const [factsList, setFactsList] = useState<any[]>(SAMPLE_FACTS)
  const [selected, setSelected] = useState<any>(SAMPLE_FACTS[0])
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchFacts().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setFactsList(data)
        setSelected(data[0])
      }
    })
  }, [])

  const filtered = filter ? factsList.filter((f) => f.tag === filter) : factsList


  return (
    <div className="h-full flex overflow-hidden">
      {/* Left list */}
      <div
        className="h-full overflow-y-auto flex-shrink-0"
        style={{ width: 340, borderRight: '1px solid var(--color-border)', padding: '28px 20px' }}
      >
        <div className="mb-5">
          <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            Fact Investigation
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {factsList.length} facts extracted across documents
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {[null, 'financial', 'governance', 'workforce'].map((t) => (
            <button
              key={String(t)}
              onClick={() => setFilter(t)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: filter === t ? TAG_COLORS[t ?? '']?.bg ?? 'rgba(124,106,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: filter === t ? TAG_COLORS[t ?? '']?.text ?? '#9d8fff' : 'var(--color-text-muted)',
                border: `1px solid ${filter === t ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
              }}
            >
              {t ?? 'All'}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          {filtered.map((fact) => (
            <button
              key={fact.id}
              onClick={() => setSelected(fact)}
              className="w-full text-left px-3.5 py-3 rounded-xl transition-all"
              style={{
                background: selected.id === fact.id ? 'var(--color-violet-dim)' : 'rgba(255,255,255,0.03)',
                border: selected.id === fact.id ? '1px solid rgba(124,106,255,0.3)' : '1px solid transparent',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {fact.fact}
                  </div>
                  <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {fact.value} · {fact.period}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                  {fact.conflict && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f87171', boxShadow: '0 0 5px #f87171' }} />
                  )}
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: CONF_COLOR(fact.confidence), fontFamily: 'var(--font-mono)' }}
                  >
                    {fact.confidence}%
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail view */}
      <div className="flex-1 h-full overflow-y-auto" style={{ padding: '32px 40px' }}>
        <div style={{ animation: 'fade-in-up 0.25s ease', maxWidth: 660 }}>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ ...TAG_COLORS[selected.tag], fontFamily: 'var(--font-mono)' }}
                >
                  {selected.tag}
                </span>
                {selected.conflict && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171', fontFamily: 'var(--font-mono)' }}
                  >
                    ⚡ conflict
                  </span>
                )}
              </div>
              <h2
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
              >
                {selected.fact}
              </h2>
              <div
                className="text-3xl font-black mt-1"
                style={{ fontFamily: 'var(--font-display)', color: '#22d3ee', letterSpacing: '-0.02em' }}
              >
                {selected.value}
              </div>
            </div>
            {/* Confidence ring */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <circle
                  cx="30" cy="30" r="24"
                  fill="none"
                  stroke={CONF_COLOR(selected.confidence)}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${(selected.confidence / 100) * 150.8} 150.8`}
                  transform="rotate(-90 30 30)"
                />
                <text x="30" y="35" textAnchor="middle" fontSize="12" fontWeight="700" fill={CONF_COLOR(selected.confidence)} fontFamily="JetBrains Mono">
                  {selected.confidence}%
                </text>
              </svg>
              <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                confidence
              </div>
            </div>
          </div>

          {/* Metadata grid */}
          <div
            className="grid grid-cols-3 gap-3 mb-6 p-4 rounded-xl"
            style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
          >
            {[
              { label: 'Entity', value: selected.entity },
              { label: 'Period', value: selected.period },
              { label: 'Scope', value: selected.scope },
              { label: 'Source', value: selected.source },
              { label: 'Page', value: `p.${selected.page}` },
              { label: 'Fact ID', value: selected.id.toUpperCase() },
            ].map((row) => (
              <div key={row.label}>
                <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {row.label}
                </div>
                <div className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>

          {/* Evidence */}
          <div
            className="rounded-xl overflow-hidden mb-6"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <div
              className="px-4 py-2.5 flex items-center gap-2"
              style={{ background: 'var(--color-panel)', borderBottom: '1px solid var(--color-border)' }}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="#fbbf24" strokeWidth="1.3" className="w-3.5 h-3.5">
                <rect x="2" y="1" width="10" height="12" rx="1" />
                <line x1="4" y1="4" x2="10" y2="4" />
                <line x1="4" y1="6.5" x2="10" y2="6.5" />
                <line x1="4" y1="9" x2="7" y2="9" />
              </svg>
              <span className="text-[11px] font-medium" style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                Evidence — {selected.source}, p.{selected.page}
              </span>
            </div>
            <div className="p-5" style={{ background: 'rgba(251,191,36,0.04)' }}>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {selected.evidence.split(selected.value).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <mark
                        style={{ background: 'rgba(251,191,36,0.3)', color: '#fde68a', borderRadius: 3, padding: '1px 2px' }}
                      >
                        {selected.value}
                      </mark>
                    )}
                  </span>
                ))}
              </p>
            </div>
          </div>

          {/* Related facts */}
          {selected.conflict && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                Related / Conflicting Facts
              </div>
              <div className="space-y-2">
                {factsList.filter((f) => f.id !== selected.id && f.fact === selected.fact).map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => setSelected(rel)}
                    className="w-full text-left p-4 rounded-xl transition-all"
                    style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: '#f87171' }}>
                        {rel.value}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{rel.period}</span>
                      <span className="ml-auto text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{rel.source}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
