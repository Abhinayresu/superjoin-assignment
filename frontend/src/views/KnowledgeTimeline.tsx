import { useState, useEffect } from 'react'
import { fetchTimeline } from '../api'

interface TimelineEvent {
  id: string
  date: string
  year: string
  category: string
  label: string
  entity: string
  from?: string
  to: string
  source: string
  page: number
  evidence: string
  color: string
  significant?: boolean
}

const SAMPLE_EVENTS: TimelineEvent[] = [
  {
    id: 'e1',
    date: 'April 2021',
    year: 'FY21',
    category: 'leadership',
    label: 'CEO Appointment',
    entity: 'TechCorp Ltd',
    to: 'Rajan Mehta',
    source: 'TechCorp AR 2021',
    page: 14,
    evidence: 'The Board of Directors appointed Mr. Rajan Mehta as Managing Director & CEO effective April 1, 2021, following the retirement of the founding CEO.',
    color: '#60a5fa',
  },
  {
    id: 'e2',
    date: 'March 2022',
    year: 'FY22',
    category: 'financials',
    label: 'Revenue',
    entity: 'TechCorp Ltd',
    from: '₹5,200cr',
    to: '₹6,550cr',
    source: 'TechCorp AR 2022',
    page: 39,
    evidence: 'Consolidated revenue grew 26% to ₹6,550 crore in FY22, driven by cloud services and digital transformation mandates.',
    color: '#22d3ee',
  },
  {
    id: 'e3',
    date: 'March 2023',
    year: 'FY23',
    category: 'financials',
    label: 'Revenue',
    entity: 'TechCorp Ltd',
    from: '₹6,550cr',
    to: '₹8,000cr',
    source: 'TechCorp AR 2023',
    page: 42,
    evidence: 'Revenue from operations of ₹8,000 crore for FY23 represents a 22% YoY increase over ₹6,550 crore in FY22.',
    color: '#22d3ee',
  },
  {
    id: 'e4',
    date: 'March 2023',
    year: 'FY23',
    category: 'workforce',
    label: 'Employees',
    entity: 'TechCorp Ltd',
    from: '8,400',
    to: '12,000',
    source: 'TechCorp AR 2023',
    page: 87,
    evidence: 'Workforce expanded 43% to 12,000 employees, reflecting aggressive hiring in engineering and cloud delivery practices.',
    color: '#a3e635',
    significant: true,
  },
  {
    id: 'e5',
    date: 'March 2024',
    year: 'FY24',
    category: 'financials',
    label: 'Revenue',
    entity: 'TechCorp Ltd',
    from: '₹8,000cr',
    to: '₹12,500cr',
    source: 'TechCorp AR 2024',
    page: 38,
    evidence: 'FY24 revenue reached ₹12,500 crore, a 56% increase over FY23 driven by large enterprise cloud contracts in North America and GCC markets.',
    color: '#22d3ee',
    significant: true,
  },
  {
    id: 'e6',
    date: 'March 2024',
    year: 'FY24',
    category: 'workforce',
    label: 'Employees',
    entity: 'TechCorp Ltd',
    from: '12,000',
    to: '18,500',
    source: 'TechCorp AR 2024',
    page: 92,
    evidence: 'Global headcount reached 18,500 as of March 31, 2024, including 2,200 new hires in the AI & Data practice.',
    color: '#a3e635',
  },
  {
    id: 'e7',
    date: 'November 2024',
    year: 'FY25',
    category: 'governance',
    label: 'Board Expansion',
    entity: 'TechCorp Ltd',
    to: '+2 independent directors',
    source: 'Board Filing Nov 2024',
    page: 3,
    evidence: 'The Company appointed two additional independent directors, expanding the Board to 9 members with a majority of independent directors.',
    color: '#7c6aff',
  },
]

const CAT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  financials: { bg: 'rgba(34,211,238,0.1)', text: '#22d3ee', dot: '#22d3ee' },
  workforce: { bg: 'rgba(163,230,53,0.1)', text: '#a3e635', dot: '#a3e635' },
  leadership: { bg: 'rgba(96,165,250,0.1)', text: '#60a5fa', dot: '#60a5fa' },
  governance: { bg: 'rgba(124,106,255,0.1)', text: '#9d8fff', dot: '#7c6aff' },
}

export default function KnowledgeTimeline() {
  const [eventsList, setEventsList] = useState<TimelineEvent[]>(SAMPLE_EVENTS)
  const [selected, setSelected] = useState<TimelineEvent | null>(SAMPLE_EVENTS[0])
  const [filterCat, setFilterCat] = useState<string | null>(null)

  useEffect(() => {
    fetchTimeline().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        const mapped: TimelineEvent[] = data.map((item: any, i: number) => ({
          id: item.id || `e_${i}`,
          date: item.period || 'Period',
          year: item.period || 'FY24',
          category: 'financials',
          label: item.title,
          entity: item.source,
          to: item.value,
          source: item.source,
          page: item.page,
          evidence: item.evidence,
          color: '#22d3ee'
        }))
        setEventsList(mapped)
        setSelected(mapped[0])
      }
    })
  }, [])

  const filteredEvents = filterCat ? eventsList.filter((e) => e.category === filterCat) : eventsList

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-8 py-5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            Knowledge Timeline
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            How facts change over time — every value backed by evidence
          </p>
        </div>
        {/* Category filters */}
        <div className="flex gap-2">
          {[null, 'financials', 'workforce', 'leadership', 'governance'].map((cat) => (
            <button
              key={String(cat)}
              onClick={() => setFilterCat(cat)}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: filterCat === cat
                  ? CAT_COLORS[cat ?? '']?.bg ?? 'rgba(124,106,255,0.2)'
                  : 'var(--color-panel)',
                color: filterCat === cat
                  ? CAT_COLORS[cat ?? '']?.text ?? '#9d8fff'
                  : 'var(--color-text-muted)',
                border: `1px solid ${filterCat === cat ? 'rgba(255,255,255,0.1)' : 'var(--color-border)'}`,
              }}
            >
              {cat ?? 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline + panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Timeline scroll area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-8 pr-6">
          <div className="relative" style={{ minWidth: Math.max(filteredEvents.length * 180, 700) }}>
            {/* Track line */}
            <div
              className="absolute"
              style={{
                left: 60,
                right: 60,
                top: 108,
                height: 2,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 10%, rgba(255,255,255,0.1) 90%, transparent)',
              }}
            />

            {/* Events row */}
            <div className="flex" style={{ gap: 12 }}>
              {filteredEvents.map((event, idx) => {
                const isSelected = selected?.id === event.id
                const colors = CAT_COLORS[event.category]
                return (
                  <div
                    key={event.id}
                    className="flex flex-col items-center"
                    style={{ minWidth: 160, animation: `fade-in-up 0.3s ease ${idx * 0.06}s both` }}
                  >
                    {/* Above-track: date + label */}
                    <div className="text-center mb-3" style={{ height: 70 }}>
                      <div className="text-[10px] font-semibold mb-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {event.date}
                      </div>
                      <div
                        className="text-[11px] px-2.5 py-0.5 rounded-full inline-block"
                        style={{ ...colors, fontFamily: 'var(--font-mono)', fontSize: 10 }}
                      >
                        {event.category}
                      </div>
                    </div>

                    {/* Node on track */}
                    <button
                      onClick={() => setSelected(isSelected ? null : event)}
                      className="relative z-10 flex items-center justify-center transition-all duration-200"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isSelected
                          ? event.color
                          : `${event.color}22`,
                        border: `2px solid ${isSelected ? event.color : `${event.color}66`}`,
                        boxShadow: isSelected ? `0 0 20px ${event.color}55` : 'none',
                      }}
                    >
                      {event.significant && !isSelected && (
                        <div
                          className="absolute inset-0 rounded-full border-2"
                          style={{ borderColor: event.color, opacity: 0.3, animation: 'ring-expand 2s ease-out infinite' }}
                        />
                      )}
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: isSelected ? 'white' : event.color }}
                      />
                    </button>

                    {/* Below: fact change */}
                    <div className="mt-4 text-center" style={{ width: 140 }}>
                      <div className="text-[12px] font-semibold mb-1" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
                        {event.label}
                      </div>
                      {event.from ? (
                        <div className="flex items-center justify-center gap-1.5 text-[11px]">
                          <span style={{ color: 'var(--color-text-muted)' }}>{event.from}</span>
                          <span style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>→</span>
                          <span style={{ color: event.color, fontWeight: 600 }}>{event.to}</span>
                        </div>
                      ) : (
                        <div className="text-[11px]" style={{ color: event.color, fontWeight: 600 }}>{event.to}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Evidence panel */}
        {selected && (
          <div
            className="h-full flex-shrink-0 overflow-y-auto"
            style={{ width: 320, borderLeft: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: '28px 24px', animation: 'fade-in 0.2s ease' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ ...CAT_COLORS[selected.category], fontFamily: 'var(--font-mono)' }}
              >
                {selected.category}
              </span>
              <button onClick={() => setSelected(null)} className="text-xs opacity-40 hover:opacity-80 transition-opacity" style={{ color: 'var(--color-text-primary)' }}>
                ✕
              </button>
            </div>

            <div className="text-lg font-bold mb-0.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              {selected.label}
            </div>
            <div className="text-2xl font-black mb-1" style={{ fontFamily: 'var(--font-display)', color: selected.color }}>
              {selected.to}
            </div>
            {selected.from && (
              <div className="text-[12px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Previously: {selected.from}
              </div>
            )}

            <div
              className="grid grid-cols-2 gap-2.5 mb-5 p-3 rounded-xl"
              style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
            >
              {[
                { label: 'Date', value: selected.date },
                { label: 'Entity', value: selected.entity },
                { label: 'Source', value: selected.source },
                { label: 'Page', value: `p.${selected.page}` },
              ].map((r) => (
                <div key={r.label}>
                  <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {r.label}
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--color-text-primary)' }}>{r.value}</div>
                </div>
              ))}
            </div>

            {/* Evidence */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.04)' }}
            >
              <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(251,191,36,0.15)' }}>
                <span className="text-[10px] font-semibold" style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                  Evidence
                </span>
              </div>
              <div className="p-4">
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  "{selected.evidence}"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!selected && (
        <div
          className="px-8 py-3 text-[11px] flex-shrink-0"
          style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)' }}
        >
          Click any node to reveal the evidence behind that change
        </div>
      )}
    </div>
  )
}
