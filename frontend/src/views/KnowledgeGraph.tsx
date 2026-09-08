import { useState, useEffect } from 'react'
import { fetchStatus } from '../api'

type View = 'graph' | 'ingest' | 'facts' | 'conflicts' | 'timeline' | 'evidence' | 'uncertainty'

interface Props {
  onNavigate: (v: View) => void
}

const NODES = {
  ar2023: { id: 'ar2023', type: 'document', label: 'TechCorp AR 2023', sub: '142 pages', x: 150, y: 155, color: '#7c6aff' },
  ar2024: { id: 'ar2024', type: 'document', label: 'TechCorp AR 2024', sub: '158 pages', x: 630, y: 155, color: '#7c6aff' },
  analyst: { id: 'analyst', type: 'document', label: 'Analyst Report Q4', sub: '38 pages', x: 390, y: 430, color: '#7c6aff' },
  rev_8k: { id: 'rev_8k', type: 'fact', label: '₹8,000cr Revenue', sub: 'FY23', x: 260, y: 290, color: '#22d3ee' },
  rev_10k: { id: 'rev_10k', type: 'fact', label: '₹10,000cr Revenue', sub: 'FY23', x: 510, y: 290, color: '#22d3ee' },
  rev_12k: { id: 'rev_12k', type: 'fact', label: '₹12,500cr Revenue', sub: 'FY24', x: 630, y: 340, color: '#22d3ee' },
  ceo: { id: 'ceo', type: 'fact', label: 'CEO: Rajan Mehta', sub: 'FY23–24', x: 390, y: 195, color: '#60a5fa' },
  emp_12: { id: 'emp_12', type: 'fact', label: '12,000 Employees', sub: 'FY23', x: 145, y: 360, color: '#60a5fa' },
  emp_18: { id: 'emp_18', type: 'fact', label: '18,500 Employees', sub: 'FY24', x: 600, y: 420, color: '#60a5fa' },
  entity: { id: 'entity', type: 'entity', label: 'TechCorp Ltd', sub: 'NSE: TECHC', x: 390, y: 310, color: '#a3e635' },
}

const EDGES = [
  { from: 'ar2023', to: 'rev_8k', type: 'contains', delay: 0 },
  { from: 'analyst', to: 'rev_10k', type: 'contains', delay: 200 },
  { from: 'ar2024', to: 'rev_12k', type: 'contains', delay: 400 },
  { from: 'ar2023', to: 'ceo', type: 'contains', delay: 600 },
  { from: 'ar2023', to: 'emp_12', type: 'contains', delay: 800 },
  { from: 'ar2024', to: 'emp_18', type: 'contains', delay: 1000 },
  { from: 'rev_8k', to: 'rev_10k', type: 'contradicts', delay: 1200 },
  { from: 'rev_10k', to: 'rev_12k', type: 'contextual', delay: 1400 },
  { from: 'entity', to: 'rev_8k', type: 'related', delay: 1600 },
  { from: 'entity', to: 'rev_10k', type: 'related', delay: 1700 },
  { from: 'entity', to: 'rev_12k', type: 'related', delay: 1800 },
  { from: 'entity', to: 'emp_12', type: 'related', delay: 1900 },
  { from: 'entity', to: 'emp_18', type: 'related', delay: 2000 },
]

const edgeColor = (type: string) => {
  if (type === 'contains') return '#7c6aff'
  if (type === 'contradicts') return '#f87171'
  if (type === 'contextual') return '#fbbf24'
  return 'rgba(163,230,53,0.4)'
}

function cubicPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = (x2 - x1) * 0.5
  const dy = (y2 - y1) * 0.5
  return `M ${x1} ${y1} C ${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`
}

const NODE_INFO: Record<string, { fact: string; entity: string; value: string; period: string; source: string; confidence: number; desc: string }> = {
  rev_8k: { fact: 'Annual Revenue', entity: 'TechCorp Ltd', value: '₹8,000 crore', period: 'FY2023', source: 'TechCorp AR 2023', confidence: 97, desc: 'Revenue reported in annual report FY23, pg. 42' },
  rev_10k: { fact: 'Annual Revenue', entity: 'TechCorp Ltd', value: '₹10,000 crore', period: 'FY2023', source: 'Analyst Report Q4', confidence: 82, desc: 'Revenue figure from independent analyst forecast/estimate Q4' },
  rev_12k: { fact: 'Annual Revenue', entity: 'TechCorp Ltd', value: '₹12,500 crore', period: 'FY2024', source: 'TechCorp AR 2024', confidence: 97, desc: 'Revenue reported in annual report FY24, pg. 38' },
  ceo: { fact: 'Chief Executive Officer', entity: 'TechCorp Ltd', value: 'Rajan Mehta', period: 'FY23–24', source: 'TechCorp AR 2023', confidence: 99, desc: 'CEO named in governance section, pg. 18' },
  emp_12: { fact: 'Total Employees', entity: 'TechCorp Ltd', value: '12,000', period: 'FY2023', source: 'TechCorp AR 2023', confidence: 96, desc: 'Headcount as of March 31, 2023, pg. 87' },
  emp_18: { fact: 'Total Employees', entity: 'TechCorp Ltd', value: '18,500', period: 'FY2024', source: 'TechCorp AR 2024', confidence: 96, desc: 'Headcount as of March 31, 2024, pg. 92' },
  entity: { fact: 'Listed Entity', entity: 'TechCorp Ltd', value: 'NSE: TECHC / BSE: 542801', period: 'Ongoing', source: 'TechCorp AR 2023', confidence: 100, desc: 'Exchange-listed technology company, CIN: L72200MH2008PLC180234' },
  ar2023: { fact: 'Source Document', entity: 'TechCorp Ltd', value: 'Annual Report', period: 'FY2023', source: 'Uploaded PDF', confidence: 100, desc: '142-page annual report. Indexed 23 facts, 0 conflicts.' },
  ar2024: { fact: 'Source Document', entity: 'TechCorp Ltd', value: 'Annual Report', period: 'FY2024', source: 'Uploaded PDF', confidence: 100, desc: '158-page annual report. Indexed 31 facts, 1 conflict.' },
  analyst: { fact: 'Source Document', entity: 'TechCorp Ltd', value: 'Analyst Report', period: 'Q4 FY23', source: 'Uploaded PDF', confidence: 100, desc: '38-page analyst research note. Indexed 12 facts, 1 conflict.' },
}

export default function KnowledgeGraph({ onNavigate }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null)
  const [visibleEdges, setVisibleEdges] = useState<Set<number>>(new Set())
  const [mounted, setMounted] = useState(false)
  const [liveStats, setLiveStats] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    EDGES.forEach((edge, i) => {
      setTimeout(() => {
        setVisibleEdges((prev) => new Set([...prev, i]))
      }, edge.delay)
    })
    fetchStatus().then((s) => s && setLiveStats(s))
  }, [])

  const STATS = [
    { label: 'Documents', value: liveStats ? String(liveStats.total_documents) : '3', color: '#7c6aff' },
    { label: 'Facts', value: liveStats ? String(liveStats.total_facts) : '47', color: '#22d3ee' },
    { label: 'Entities', value: liveStats ? String(liveStats.total_documents > 0 ? liveStats.total_documents * 2 : 8) : '8', color: '#a3e635' },
    { label: 'Conflicts', value: liveStats ? String(liveStats.pending_conflicts) : '2', color: '#f87171' },
  ]

  const selectedInfo = selected ? NODE_INFO[selected] : null
  const selectedNode = selected ? NODES[selected as keyof typeof NODES] : null

  const connectedNodeIds = selected
    ? new Set(
        EDGES.filter((e) => e.from === selected || e.to === selected).flatMap((e) => [e.from, e.to])
      )
    : null

  return (
    <div className="relative flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-void)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-8 py-5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          >
            Knowledge Layer
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Living network of facts, documents and relationships
          </p>
        </div>
        <div className="flex items-center gap-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
            >
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.label}</div>
              <div className="text-lg font-bold leading-none mt-0.5" style={{ fontFamily: 'var(--font-display)', color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
          <button
            onClick={() => onNavigate('conflicts')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" style={{ animation: 'glow-pulse 1.5s ease-in-out infinite' }} />
            2 conflicts
          </button>
        </div>
      </div>

      {/* Graph + Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* SVG Graph */}
        <div className="flex-1 relative overflow-hidden">
          {/* Atmospheric glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124,106,255,0.06) 0%, transparent 70%)',
            }}
          />

          <svg
            viewBox="0 0 800 520"
            className="w-full h-full"
            style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease' }}
          >
            <defs>
              <filter id="glow-violet" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-soft" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <radialGradient id="node-doc" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(124,106,255,0.3)" />
                <stop offset="100%" stopColor="rgba(124,106,255,0.08)" />
              </radialGradient>
              <radialGradient id="node-fact-cyan" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(34,211,238,0.3)" />
                <stop offset="100%" stopColor="rgba(34,211,238,0.08)" />
              </radialGradient>
              <radialGradient id="node-fact-blue" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(96,165,250,0.3)" />
                <stop offset="100%" stopColor="rgba(96,165,250,0.08)" />
              </radialGradient>
              <radialGradient id="node-entity" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(163,230,53,0.3)" />
                <stop offset="100%" stopColor="rgba(163,230,53,0.08)" />
              </radialGradient>
            </defs>

            {/* Edges */}
            {EDGES.map((edge, i) => {
              const from = NODES[edge.from as keyof typeof NODES]
              const to = NODES[edge.to as keyof typeof NODES]
              if (!from || !to) return null
              const visible = visibleEdges.has(i)
              const isHighlighted =
                selected && (edge.from === selected || edge.to === selected)
              const isConflict = edge.type === 'contradicts'
              const color = edgeColor(edge.type)
              const dasharray = edge.type === 'contains' ? 'none' : edge.type === 'contradicts' ? '4 3' : '6 4'
              const opacity = selected ? (isHighlighted ? 1 : 0.1) : hoveredEdge === i ? 0.9 : 0.5

              return (
                <g key={i}>
                  {/* Glow layer for contradictions */}
                  {isConflict && visible && (
                    <path
                      d={cubicPath(from.x, from.y, to.x, to.y)}
                      fill="none"
                      stroke={color}
                      strokeWidth="6"
                      opacity={0.15}
                      style={{ animation: 'conflict-pulse 2s ease-in-out infinite' }}
                    />
                  )}
                  <path
                    d={cubicPath(from.x, from.y, to.x, to.y)}
                    fill="none"
                    stroke={color}
                    strokeWidth={isConflict ? 2 : 1.5}
                    strokeDasharray={dasharray}
                    opacity={visible ? opacity : 0}
                    style={{
                      transition: 'opacity 0.4s ease',
                      animation: isConflict
                        ? 'edge-flow 1.2s linear infinite, conflict-pulse 2s ease-in-out infinite'
                        : edge.type === 'contextual'
                        ? 'edge-flow 2s linear infinite'
                        : undefined,
                    }}
                    onMouseEnter={() => setHoveredEdge(i)}
                    onMouseLeave={() => setHoveredEdge(null)}
                  />
                  {/* Edge label for contradictions */}
                  {isConflict && visible && (
                    <text
                      x={(from.x + to.x) / 2}
                      y={(from.y + to.y) / 2 - 10}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#f87171"
                      opacity={0.8}
                      fontFamily="JetBrains Mono, monospace"
                      style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}
                    >
                      CONTRADICTION
                    </text>
                  )}
                </g>
              )
            })}

            {/* Nodes */}
            {Object.values(NODES).map((node, idx) => {
              const isSelected = selected === node.id
              const isConnected = connectedNodeIds ? connectedNodeIds.has(node.id) : true
              const opacity = selected ? (isConnected ? 1 : 0.25) : 1
              const floatDelay = `${(idx * 0.7) % 3}s`
              const floatDuration = `${3 + (idx * 0.4) % 2}s`

              if (node.type === 'document') {
                return (
                  <g
                    key={node.id}
                    style={{
                      animation: `node-float ${floatDuration} ease-in-out infinite`,
                      animationDelay: floatDelay,
                      opacity: mounted ? opacity : 0,
                      transition: 'opacity 0.3s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelected(selected === node.id ? null : node.id)}
                  >
                    <rect
                      x={node.x - 58}
                      y={node.y - 22}
                      width={116}
                      height={44}
                      rx={6}
                      fill="url(#node-doc)"
                      stroke={isSelected ? '#9d8fff' : 'rgba(124,106,255,0.4)'}
                      strokeWidth={isSelected ? 1.5 : 1}
                      filter={isSelected ? 'url(#glow-violet)' : undefined}
                    />
                    {isSelected && (
                      <rect
                        x={node.x - 58}
                        y={node.y - 22}
                        width={116}
                        height={44}
                        rx={6}
                        fill="none"
                        stroke="#9d8fff"
                        strokeWidth={3}
                        opacity={0.2}
                      />
                    )}
                    <text x={node.x} y={node.y - 5} textAnchor="middle" fontSize="11" fill="#c4baff" fontFamily="Outfit, sans-serif" fontWeight="600">
                      {node.label}
                    </text>
                    <text x={node.x} y={node.y + 10} textAnchor="middle" fontSize="9" fill="rgba(124,106,255,0.7)" fontFamily="JetBrains Mono, monospace">
                      {node.sub}
                    </text>
                    <rect x={node.x - 3} y={node.y - 20} width={6} height={3} rx={1} fill="#7c6aff" opacity={0.6} />
                  </g>
                )
              }

              if (node.type === 'entity') {
                const w = 100, h = 38
                const fill = 'url(#node-entity)'
                return (
                  <g
                    key={node.id}
                    style={{
                      animation: `node-float ${floatDuration} ease-in-out infinite`,
                      animationDelay: floatDelay,
                      opacity: mounted ? opacity : 0,
                      transition: 'opacity 0.3s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelected(selected === node.id ? null : node.id)}
                  >
                    <polygon
                      points={`${node.x},${node.y - h / 2} ${node.x + w / 2},${node.y} ${node.x},${node.y + h / 2} ${node.x - w / 2},${node.y}`}
                      fill={fill}
                      stroke={isSelected ? '#a3e635' : 'rgba(163,230,53,0.5)'}
                      strokeWidth={isSelected ? 1.5 : 1}
                      filter={isSelected ? 'url(#glow-soft)' : undefined}
                    />
                    <text x={node.x} y={node.y - 3} textAnchor="middle" fontSize="10" fill="#c6f87a" fontFamily="Outfit, sans-serif" fontWeight="600">
                      {node.label}
                    </text>
                    <text x={node.x} y={node.y + 11} textAnchor="middle" fontSize="8" fill="rgba(163,230,53,0.6)" fontFamily="JetBrains Mono, monospace">
                      {node.sub}
                    </text>
                  </g>
                )
              }

              // Fact nodes
              const r = 34
              const gradId = node.color === '#60a5fa' ? 'url(#node-fact-blue)' : 'url(#node-fact-cyan)'
              const isConflictFact = node.id === 'rev_8k' || node.id === 'rev_10k'
              return (
                <g
                  key={node.id}
                  style={{
                    animation: `node-float ${floatDuration} ease-in-out infinite`,
                    animationDelay: floatDelay,
                    opacity: mounted ? opacity : 0,
                    transition: 'opacity 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelected(selected === node.id ? null : node.id)}
                >
                  {isConflictFact && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={r + 8}
                      fill="none"
                      stroke="#f87171"
                      strokeWidth={1}
                      opacity={0.15}
                      style={{ animation: 'ring-expand 2s ease-out infinite' }}
                    />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={gradId}
                    stroke={isSelected ? node.color : isConflictFact ? 'rgba(248,113,113,0.5)' : `${node.color}66`}
                    strokeWidth={isSelected ? 2 : isConflictFact ? 1.5 : 1}
                    filter={isSelected || isConflictFact ? 'url(#glow-soft)' : undefined}
                  />
                  <text x={node.x} y={node.y - 5} textAnchor="middle" fontSize="9.5" fill={node.color} fontFamily="Outfit, sans-serif" fontWeight="700">
                    {node.label.split(' ')[0]}
                  </text>
                  <text x={node.x} y={node.y + 7} textAnchor="middle" fontSize="9" fill={`${node.color}cc`} fontFamily="Outfit, sans-serif" fontWeight="500">
                    {node.label.split(' ').slice(1).join(' ')}
                  </text>
                  <text x={node.x} y={node.y + 20} textAnchor="middle" fontSize="8" fill={`${node.color}77`} fontFamily="JetBrains Mono, monospace">
                    {node.sub}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Legend */}
          <div
            className="absolute bottom-5 left-6 flex gap-4 text-[11px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
          >
            {[
              { color: '#7c6aff', label: 'Contains', dashed: false },
              { color: '#f87171', label: 'Contradicts', dashed: true },
              { color: '#fbbf24', label: 'Contextual', dashed: true },
              { color: '#a3e635', label: 'Related', dashed: true },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <svg width="22" height="10" viewBox="0 0 22 10">
                  <line x1="1" y1="5" x2="21" y2="5" stroke={l.color} strokeWidth="1.5" strokeDasharray={l.dashed ? '4 3' : 'none'} />
                </svg>
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && selectedInfo && selectedNode && (
          <div
            className="h-full flex-shrink-0 overflow-y-auto"
            style={{
              width: 280,
              background: 'var(--color-surface)',
              borderLeft: '1px solid var(--color-border)',
              animation: 'fade-in 0.2s ease',
            }}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-widest"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    background:
                      selectedNode.type === 'document'
                        ? 'rgba(124,106,255,0.2)'
                        : selectedNode.type === 'entity'
                        ? 'rgba(163,230,53,0.2)'
                        : 'rgba(34,211,238,0.2)',
                    color:
                      selectedNode.type === 'document'
                        ? '#9d8fff'
                        : selectedNode.type === 'entity'
                        ? '#a3e635'
                        : '#22d3ee',
                  }}
                >
                  {selectedNode.type}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs opacity-40 hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  ✕
                </button>
              </div>

              <h3
                className="text-base font-bold leading-tight mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
              >
                {selectedNode.label}
              </h3>
              <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>{selectedInfo.desc}</p>

              <div className="space-y-2.5">
                {[
                  { label: 'Fact', value: selectedInfo.fact },
                  { label: 'Entity', value: selectedInfo.entity },
                  { label: 'Value', value: selectedInfo.value },
                  { label: 'Period', value: selectedInfo.period },
                  { label: 'Source', value: selectedInfo.source },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {row.label}
                    </span>
                    <span className="text-[12px] text-right" style={{ color: 'var(--color-text-primary)' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Confidence */}
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Confidence</span>
                  <span className="text-[12px] font-semibold" style={{ color: '#4ade80', fontFamily: 'var(--font-mono)' }}>
                    {selectedInfo.confidence}%
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${selectedInfo.confidence}%`,
                      background: selectedInfo.confidence > 90 ? '#4ade80' : selectedInfo.confidence > 70 ? '#fbbf24' : '#f87171',
                    }}
                  />
                </div>
              </div>

              {/* Conflict indicator */}
              {(selected === 'rev_8k' || selected === 'rev_10k') && (
                <div
                  className="mt-4 p-3 rounded-lg"
                  style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}
                >
                  <div className="text-[11px] font-semibold mb-0.5" style={{ color: '#f87171' }}>Conflict Detected</div>
                  <p className="text-[11px]" style={{ color: 'rgba(248,113,113,0.8)' }}>
                    This fact contradicts another fact for the same entity and period.
                  </p>
                  <button
                    className="mt-2 text-[11px] font-medium"
                    style={{ color: '#f87171', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                    onClick={() => onNavigate('conflicts')}
                  >
                    Investigate →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
