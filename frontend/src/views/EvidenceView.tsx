import { useState, useEffect } from 'react'
import { fetchFacts } from '../api'

interface Citation {
  id: string
  fact: string
  value: string
  source: string
  page: number
  paragraph: number
  sentence: string
  fullContext: string
  tag: string
  color: string
}

const SAMPLE_CITATIONS: Citation[] = [
  {
    id: 'c1',
    fact: 'Annual Revenue FY23',
    value: '₹8,000 crore',
    source: 'TechCorp AR 2023',
    page: 42,
    paragraph: 2,
    sentence: 'The Company recorded consolidated revenue from operations of ₹8,000 crore for the financial year ended March 31, 2023, representing a growth of 22% over the previous year.',
    fullContext: `Financial Highlights — FY2023\n\nTechCorp Limited delivered a strong performance in FY2023, continuing its trajectory of profitable growth. Net revenue from continuing operations grew across all business segments.\n\nThe Company recorded consolidated revenue from operations of ₹8,000 crore for the financial year ended March 31, 2023, representing a growth of 22% over the previous year. This was primarily driven by strong demand in our Cloud & Infrastructure services business and continued expansion of our Digital Transformation practice.\n\nEBITDA margins improved by 120 basis points to 18.4%, reflecting operating leverage in our delivery model and disciplined cost management.`,
    tag: 'financial',
    color: '#22d3ee',
  },
  {
    id: 'c2',
    fact: 'Total Employees FY23',
    value: '12,000',
    source: 'TechCorp AR 2023',
    page: 87,
    paragraph: 1,
    sentence: 'As of March 31, 2023, the Company employed 12,000 full-time employees across its offices in India, the United States and Singapore.',
    fullContext: `Human Capital — People Strategy\n\nOur people are the foundation of TechCorp's competitive advantage. In FY2023, we invested significantly in attracting, retaining and upskilling talent.\n\nAs of March 31, 2023, the Company employed 12,000 full-time employees across its offices in India, the United States and Singapore. This represents a 43% increase over the 8,400 employees at the end of FY2022. The Company also engaged approximately 2,100 contractors and sub-contractors as of the same date.\n\nEmployee attrition for the year was 14.2%, down from 18.6% in FY2022, reflecting improved retention programmes and competitive compensation benchmarking.`,
    tag: 'workforce',
    color: '#a3e635',
  },
  {
    id: 'c3',
    fact: 'CEO Appointment',
    value: 'Rajan Mehta',
    source: 'TechCorp AR 2023',
    page: 18,
    paragraph: 3,
    sentence: 'Mr. Rajan Mehta, Managing Director & CEO, has led the Company since 2019 and continues to drive its strategic agenda across cloud, data and AI services.',
    fullContext: `Board of Directors & Senior Leadership\n\nThe Board of Directors as of March 31, 2023 comprises nine members, of whom five are independent directors.\n\nMr. Rajan Mehta, Managing Director & CEO, has led the Company since 2019 and continues to drive its strategic agenda across cloud, data and AI services. Under his leadership, the Company has grown revenue more than 2.5x and expanded its global delivery footprint to 18 countries. Prior to TechCorp, Mr. Mehta held senior roles at IBM Global Services and Accenture.\n\nThe Board Nomination & Remuneration Committee reviews CEO compensation annually against peer benchmarks.`,
    tag: 'governance',
    color: '#60a5fa',
  },
  {
    id: 'c4',
    fact: 'Revenue FY23 (Analyst)',
    value: '₹10,000 crore',
    source: 'Analyst Report Q4',
    page: 17,
    paragraph: 2,
    sentence: "We estimate TechCorp's consolidated revenue for FY23 to be approximately ₹10,000 crore, based on our channel checks and management commentary.",
    fullContext: `TechCorp Limited — Q4 FY23 Initiation of Coverage\n\nWe initiate coverage of TechCorp with a BUY rating and a 12-month target price of ₹2,850 per share, implying 28% upside from current levels.\n\nWe estimate TechCorp's consolidated revenue for FY23 to be approximately ₹10,000 crore, based on our channel checks and management commentary. This is ahead of street consensus of ₹8,400 crore and reflects our positive view on the company's large-deal pipeline and cloud migration backlog.\n\nKey risks to our estimates include macro-driven IT spend slowdown, currency headwinds and talent cost inflation.`,
    tag: 'financial',
    color: '#f87171',
  },
]

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  financial: { bg: 'rgba(34,211,238,0.12)', text: '#22d3ee' },
  workforce: { bg: 'rgba(163,230,53,0.12)', text: '#a3e635' },
  governance: { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa' },
}

function DocumentPreview({ citation }: { citation: Citation }) {
  const paragraphs = citation.fullContext.split('\n\n')

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Document bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
          </div>
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {citation.source}.pdf
          </span>
        </div>
        <span className="text-[11px]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          Page {citation.page}
        </span>
      </div>

      {/* Page content */}
      <div className="p-6 space-y-4">
        {paragraphs.map((para, i) => {
          const isTitle = i === 0
          const containsEvidence = para.includes(citation.sentence)

          if (isTitle) {
            return (
              <h3
                key={i}
                className="text-sm font-semibold mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.7)' }}
              >
                {para}
              </h3>
            )
          }

          if (containsEvidence) {
            const before = para.substring(0, para.indexOf(citation.sentence))
            const after = para.substring(para.indexOf(citation.sentence) + citation.sentence.length)
            return (
              <p key={i} className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {before}
                <mark
                  className="relative"
                  style={{
                    background: 'rgba(251,191,36,0.22)',
                    color: '#fde68a',
                    borderRadius: 4,
                    padding: '2px 3px',
                    boxShadow: '0 0 0 1px rgba(251,191,36,0.3)',
                  }}
                >
                  {citation.sentence}
                </mark>
                {after}
              </p>
            )
          }

          return (
            <p key={i} className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {para}
            </p>
          )
        })}
      </div>
    </div>
  )
}

export default function EvidenceView() {
  const [citationsList, setCitationsList] = useState<Citation[]>(SAMPLE_CITATIONS)
  const [selected, setSelected] = useState<Citation>(SAMPLE_CITATIONS[0])

  useEffect(() => {
    fetchFacts().then((facts) => {
      if (facts && Array.isArray(facts) && facts.length > 0) {
        const mapped: Citation[] = facts.map((f: any, idx: number) => ({
          id: f.id || `c_${idx}`,
          fact: f.fact,
          value: f.value,
          source: f.source,
          page: f.page,
          paragraph: 1,
          sentence: f.evidence || f.value,
          fullContext: `Extracted Evidence ground from ${f.source} (Page ${f.page})\n\n${f.evidence}`,
          tag: f.tag || 'financial',
          color: f.tag === 'financial' ? '#22d3ee' : f.tag === 'governance' ? '#60a5fa' : '#a3e635'
        }))
        setCitationsList(mapped)
        setSelected(mapped[0])
      }
    })
  }, [])

  return (
    <div className="h-full flex overflow-hidden">
      {/* Citation list */}
      <div
        className="h-full overflow-y-auto flex-shrink-0"
        style={{ width: 300, borderRight: '1px solid var(--color-border)', padding: '28px 16px' }}
      >
        <div className="mb-5 px-2">
          <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            Evidence View
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Every fact anchored to source text
          </p>
        </div>

        <div className="space-y-1.5">
          {citationsList.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="w-full text-left p-3.5 rounded-xl transition-all"
              style={{
                background: selected.id === c.id ? 'rgba(124,106,255,0.12)' : 'rgba(255,255,255,0.03)',
                border: selected.id === c.id ? '1px solid rgba(124,106,255,0.3)' : '1px solid transparent',
              }}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: c.color }} />
                <div className="min-w-0">
                  <div className="text-[12px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{c.fact}</div>
                  <div className="text-[11px] font-semibold mt-0.5" style={{ color: c.color }}>{c.value}</div>
                  <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {c.source} · p.{c.page}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main evidence area */}
      <div className="flex-1 h-full overflow-y-auto" style={{ padding: '32px 40px' }}>
        <div style={{ maxWidth: 680, animation: 'fade-in-up 0.25s ease' }}>
          {/* Citation header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ ...(TAG_COLORS[selected.tag] ?? { bg: 'rgba(124,106,255,0.15)', text: '#9d8fff' }), fontFamily: 'var(--font-mono)' }}
                >
                  {selected.tag}
                </span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontFamily: 'var(--font-mono)' }}
                >
                  ⚓ cited
                </span>
              </div>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                {selected.fact}
              </h2>
              <div className="text-2xl font-black mt-0.5" style={{ fontFamily: 'var(--font-display)', color: selected.color }}>
                {selected.value}
              </div>
            </div>
          </div>

          {/* Citation metadata */}
          <div
            className="flex items-center gap-6 px-4 py-3 rounded-xl mb-6"
            style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
          >
            {[
              { label: 'Source', value: selected.source },
              { label: 'Page', value: `${selected.page}` },
              { label: 'Paragraph', value: `${selected.paragraph}` },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {r.label}
                </span>
                <span className="text-[12px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{r.value}</span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-1.5 text-[11px]" style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-3.5 h-3.5">
                <rect x="1" y="2" width="12" height="10" rx="1" />
                <line x1="4" y1="5" x2="10" y2="5" />
                <line x1="4" y1="7.5" x2="10" y2="7.5" />
                <line x1="4" y1="10" x2="7" y2="10" />
              </svg>
              Highlighted in document
            </div>
          </div>

          {/* Extracted sentence */}
          <div
            className="rounded-xl p-4 mb-6 flex gap-3"
            style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)' }}
          >
            <div className="w-0.5 rounded-full flex-shrink-0" style={{ background: '#fbbf24' }} />
            <p className="text-[13px] leading-relaxed italic" style={{ color: '#fde68a' }}>
              "{selected.sentence}"
            </p>
          </div>

          {/* Document preview */}
          <div className="mb-2">
            <div className="text-[11px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Document Context — Page {selected.page}
            </div>
            <DocumentPreview citation={selected} />
          </div>
        </div>
      </div>
    </div>
  )
}
