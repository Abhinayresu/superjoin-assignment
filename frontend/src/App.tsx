import { useState, useEffect } from 'react'
import type React from 'react'
import KnowledgeGraph from './views/KnowledgeGraph'
import DocumentIngestion from './views/DocumentIngestion'
import FactInvestigation from './views/FactInvestigation'
import ConflictInvestigation from './views/ConflictInvestigation'
import KnowledgeTimeline from './views/KnowledgeTimeline'
import EvidenceView from './views/EvidenceView'
import UncertaintyView from './views/UncertaintyView'
import { fetchStatus } from './api'

type View = 'graph' | 'ingest' | 'facts' | 'conflicts' | 'timeline' | 'evidence' | 'uncertainty'

export default function App() {
  const [view, setView] = useState<View>('graph')
  const [status, setStatus] = useState<any>(null)

  const loadStatus = async () => {
    const data = await fetchStatus()
    if (data) setStatus(data)
  }

  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const nav: { id: View; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'graph',
      label: 'Knowledge Layer',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]">
          <circle cx="10" cy="10" r="2.5" />
          <circle cx="3.5" cy="5" r="1.8" />
          <circle cx="16.5" cy="5" r="1.8" />
          <circle cx="3.5" cy="15" r="1.8" />
          <circle cx="16.5" cy="15" r="1.8" />
          <line x1="7.5" y1="9" x2="5.2" y2="6.6" />
          <line x1="12.5" y1="9" x2="14.8" y2="6.6" />
          <line x1="7.5" y1="11" x2="5.2" y2="13.4" />
          <line x1="12.5" y1="11" x2="14.8" y2="13.4" />
        </svg>
      ),
    },
    {
      id: 'ingest',
      label: 'Ingest Documents',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]">
          <path d="M10 2v10M6 8l4 4 4-4M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
        </svg>
      ),
      badge: status ? String(status.total_documents) : '3',
    },
    {
      id: 'facts',
      label: 'Fact Investigation',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]">
          <circle cx="8.5" cy="8.5" r="5.5" />
          <line x1="12.5" y1="12.5" x2="17" y2="17" />
        </svg>
      ),
    },
    {
      id: 'conflicts',
      label: 'Conflict Investigation',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]">
          <path d="M10 3L2 17h16L10 3z" />
          <line x1="10" y1="9" x2="10" y2="12" />
          <circle cx="10" cy="14.5" r="0.75" fill="currentColor" />
        </svg>
      ),
      badge: status ? String(status.pending_conflicts) : '2',
    },
    {
      id: 'timeline',
      label: 'Knowledge Timeline',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]">
          <line x1="2" y1="10" x2="18" y2="10" />
          <circle cx="6" cy="10" r="2" />
          <circle cx="10" cy="10" r="2" />
          <circle cx="14" cy="10" r="2" />
          <line x1="6" y1="7" x2="6" y2="5" />
          <line x1="10" y1="7" x2="10" y2="5" />
          <line x1="14" y1="7" x2="14" y2="5" />
        </svg>
      ),
    },
    {
      id: 'evidence',
      label: 'Evidence View',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]">
          <rect x="3" y="2" width="14" height="16" rx="1.5" />
          <line x1="6" y1="6" x2="14" y2="6" />
          <line x1="6" y1="9" x2="14" y2="9" />
          <line x1="6" y1="12" x2="10" y2="12" />
          <rect x="5" y="11" width="7" height="3" rx="0.5" fill="rgba(251,191,36,0.25)" stroke="none" />
        </svg>
      ),
    },
    {
      id: 'uncertainty',
      label: 'Unresolved States',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]">
          <circle cx="10" cy="10" r="8" />
          <path d="M7.5 7.5C7.5 6.12 8.62 5 10 5c1.38 0 2.5 1.12 2.5 2.5 0 1.5-1.5 2-2.5 2.5" />
          <circle cx="10" cy="14" r="0.8" fill="currentColor" />
        </svg>
      ),
    },
  ]

  const statusDots = [
    { color: '#4ade80', label: 'System online' },
    { color: '#22d3ee', label: `${status?.total_documents ?? 3} documents indexed` },
    { color: '#fbbf24', label: `${status?.pending_conflicts ?? 2} conflicts pending` },
  ]


  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: 'var(--color-void)', fontFamily: 'var(--font-body)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 h-full"
        style={{
          width: 232,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c6aff 0%, #22d3ee 100%)' }}
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <circle cx="8" cy="8" r="2.5" fill="white" opacity="0.9" />
                <circle cx="3" cy="4" r="1.5" fill="white" opacity="0.6" />
                <circle cx="13" cy="4" r="1.5" fill="white" opacity="0.6" />
                <circle cx="3" cy="12" r="1.5" fill="white" opacity="0.6" />
                <circle cx="13" cy="12" r="1.5" fill="white" opacity="0.6" />
                <line x1="5.4" y1="6.6" x2="6.8" y2="6.8" stroke="white" strokeWidth="1" opacity="0.5" />
                <line x1="9.2" y1="6.8" x2="10.6" y2="6.6" stroke="white" strokeWidth="1" opacity="0.5" />
              </svg>
            </div>
            <div>
              <div
                className="text-sm font-bold tracking-tight leading-none"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
              >
                FactLayer
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                v0.9.1 · beta
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const active = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group relative"
                style={{
                  background: active ? 'var(--color-violet-dim)' : 'transparent',
                  color: active ? 'var(--color-violet-bright)' : 'var(--color-text-secondary)',
                  border: active ? '1px solid rgba(124,106,255,0.25)' : '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.color = 'var(--color-text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--color-text-secondary)'
                  }
                }}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="text-[13px] font-medium flex-1 leading-none" style={{ fontFamily: 'var(--font-body)' }}>
                  {item.label}
                </span>
                {item.badge && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      background: item.id === 'conflicts' ? 'rgba(248,113,113,0.2)' : 'rgba(124,106,255,0.2)',
                      color: item.id === 'conflicts' ? '#f87171' : 'var(--color-violet-bright)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Status panel */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="text-[10px] font-semibold mb-2 tracking-widest uppercase" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            System Status
          </div>
          <div className="space-y-1.5">
            {statusDots.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 h-full overflow-hidden" style={{ background: 'var(--color-void)' }}>
        {view === 'graph' && <KnowledgeGraph onNavigate={setView} />}
        {view === 'ingest' && <DocumentIngestion />}
        {view === 'facts' && <FactInvestigation />}
        {view === 'conflicts' && <ConflictInvestigation />}
        {view === 'timeline' && <KnowledgeTimeline />}
        {view === 'evidence' && <EvidenceView />}
        {view === 'uncertainty' && <UncertaintyView />}
      </main>
    </div>
  )
}
