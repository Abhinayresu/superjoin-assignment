import { useState, useRef, useCallback, useEffect } from 'react'
import { fetchDocuments, uploadPDF, seedDemoDataset } from '../api'

const STEPS = [
  { id: 'read', label: 'Reading document', detail: 'Parsing PDF structure and page layout', icon: '📄' },
  { id: 'extract', label: 'Extracting evidence', detail: 'Identifying sentences with factual claims', icon: '🔍' },
  { id: 'discover', label: 'Discovering facts', detail: 'Parsing entities, values and periods', icon: '💡' },
  { id: 'normalize', label: 'Normalizing values', detail: 'Converting units, dates and currencies', icon: '⚖️' },
  { id: 'compare', label: 'Comparing knowledge', detail: 'Matching against existing facts in graph', icon: '🔗' },
  { id: 'build', label: 'Building relationships', detail: 'Inserting nodes and edges into knowledge layer', icon: '🕸️' },
]

interface FileState {
  name: string
  size: string
  step: number
  done: boolean
  facts: number
  conflicts: number
  pages: number
}

const SAMPLE_FILES: FileState[] = [
  { name: 'TechCorp_Annual_Report_2023.pdf', size: '4.2 MB', step: 6, done: true, facts: 23, conflicts: 0, pages: 142 },
  { name: 'TechCorp_Annual_Report_2024.pdf', size: '5.1 MB', step: 6, done: true, facts: 31, conflicts: 1, pages: 158 },
  { name: 'Analyst_Report_Q4_FY23.pdf', size: '1.8 MB', step: 6, done: true, facts: 12, conflicts: 1, pages: 38 },
]

function FileRow({ file }: { file: FileState }) {
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl"
      style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(124,106,255,0.15)', border: '1px solid rgba(124,106,255,0.2)' }}
      >
        <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" stroke="#9d8fff" strokeWidth="1.5">
          <path d="M4 2h8l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" />
          <path d="M12 2v4h4" />
          <line x1="6" y1="10" x2="14" y2="10" />
          <line x1="6" y1="13" x2="11" y2="13" />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
            {file.name}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {file.size} · {file.pages} pages
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-center">
          <div className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: '#22d3ee' }}>
            {file.facts}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>facts</div>
        </div>
        <div className="text-center">
          <div
            className="text-base font-bold"
            style={{ fontFamily: 'var(--font-display)', color: file.conflicts > 0 ? '#f87171' : '#4ade80' }}
          >
            {file.conflicts}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>conflicts</div>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
          style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', fontFamily: 'var(--font-mono)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          Indexed
        </div>
      </div>
    </div>
  )
}

interface ProcessingFile {
  name: string
  step: number
  progress: number
}

export default function DocumentIngestion() {
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState<ProcessingFile | null>(null)
  const [processed, setProcessed] = useState<FileState[]>(SAMPLE_FILES)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadBackendDocuments = async () => {
    const docs = await fetchDocuments()
    if (docs && Array.isArray(docs) && docs.length > 0) {
      setProcessed(docs)
    }
  }

  useEffect(() => {
    loadBackendDocuments()
  }, [])

  const runProcessing = useCallback(async (fileObj?: File, nameOverride?: string) => {
    const name = nameOverride || fileObj?.name || 'Document.pdf'
    setProcessing({ name, step: 0, progress: 0 })
    let step = 0

    const interval = setInterval(() => {
      step = Math.min(step + 1, STEPS.length - 1)
      setProcessing({ name, step, progress: (step / STEPS.length) * 100 })
    }, 600)

    try {
      if (fileObj) {
        await uploadPDF(fileObj)
      } else {
        await seedDemoDataset('delhivery')
      }
    } catch (err) {
      console.error('Ingestion failed:', err)
    } finally {
      clearInterval(interval)
      setProcessing({ name, step: STEPS.length, progress: 100 })
      setTimeout(async () => {
        await loadBackendDocuments()
        setProcessing(null)
      }, 500)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (files[0]) runProcessing(files[0])
    },
    [runProcessing]
  )

  const handleDemo = () => {
    runProcessing(undefined, 'Starter_Delhivery_Dataset.pdf')
  }


  return (
    <div className="h-full overflow-y-auto" style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          Ingest Documents
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Upload PDFs to extract facts, evidence and relationships into the knowledge layer
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !processing && inputRef.current?.click()}
        className="relative rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 mb-8"
        style={{
          background: dragging
            ? 'rgba(124,106,255,0.12)'
            : 'linear-gradient(135deg, rgba(124,106,255,0.06) 0%, rgba(34,211,238,0.04) 100%)',
          border: dragging
            ? '1.5px dashed #7c6aff'
            : '1.5px dashed rgba(255,255,255,0.12)',
          minHeight: 180,
        }}
      >
        {/* Scan line animation */}
        {dragging && (
          <div
            className="absolute inset-x-0 h-px pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, #7c6aff, transparent)',
              animation: 'scan 1.2s linear infinite',
              top: 0,
            }}
          />
        )}

        <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && runProcessing(e.target.files[0])} />

        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300"
            style={{
              background: dragging ? 'rgba(124,106,255,0.25)' : 'rgba(124,106,255,0.1)',
              border: '1px solid rgba(124,106,255,0.3)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#9d8fff" strokeWidth="1.5" className="w-7 h-7">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </div>

          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Drop PDFs here to begin investigation
          </p>
          <p className="text-[12px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Annual reports, research notes, filings — any structured PDF
          </p>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
              style={{ background: 'var(--color-violet-dim)', color: 'var(--color-violet-bright)', border: '1px solid rgba(124,106,255,0.3)' }}
            >
              Browse files
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDemo() }}
              className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
              style={{ background: 'var(--color-panel)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            >
              Run demo ingest
            </button>
          </div>
        </div>
      </div>

      {/* Processing view */}
      {processing && (
        <div
          className="rounded-2xl overflow-hidden mb-8"
          style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', animation: 'fade-in-up 0.3s ease' }}
        >
          {/* Progress bar */}
          <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${processing.progress}%`,
                background: 'linear-gradient(90deg, #7c6aff, #22d3ee)',
                boxShadow: '0 0 12px rgba(124,106,255,0.6)',
              }}
            />
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {processing.name}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Processing...
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: '#7c6aff',
                      animation: `dot-bounce 1.2s ease-in-out infinite`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {STEPS.map((step, idx) => {
                const done = processing.step > idx
                const active = processing.step === idx
                return (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 transition-all duration-300"
                    style={{
                      opacity: done ? 1 : active ? 1 : 0.3,
                      animation: active ? 'step-reveal 0.3s ease' : undefined,
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[14px]"
                      style={{
                        background: done
                          ? 'rgba(74,222,128,0.2)'
                          : active
                          ? 'rgba(124,106,255,0.2)'
                          : 'rgba(255,255,255,0.05)',
                        border: done
                          ? '1px solid rgba(74,222,128,0.4)'
                          : active
                          ? '1px solid rgba(124,106,255,0.4)'
                          : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {done ? (
                        <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5">
                          <path d="M2 6l3 3 5-5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      ) : active ? (
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: '#7c6aff', animation: 'glow-pulse 0.8s ease-in-out infinite' }}
                        />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
                      )}
                    </div>

                    <div className="flex-1">
                      <div
                        className="text-[13px] font-medium"
                        style={{ color: done ? '#4ade80' : active ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                      >
                        {step.label}
                      </div>
                      {active && (
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)', animation: 'fade-in 0.3s ease' }}>
                          {step.detail}
                        </div>
                      )}
                    </div>

                    {done && (
                      <span className="text-[11px]" style={{ color: '#4ade80', fontFamily: 'var(--font-mono)' }}>
                        done
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Processed files */}
      {processed.length > 0 && (
        <div>
          <div
            className="flex items-center justify-between mb-3"
          >
            <div className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Indexed Documents — {processed.length}
            </div>
            <div
              className="text-[11px]"
              style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
            >
              {processed.reduce((a, b) => a + b.facts, 0)} total facts
            </div>
          </div>
          <div className="space-y-2">
            {processed.map((f, i) => (
              <div key={i} style={{ animation: `fade-in-up 0.3s ease ${i * 0.05}s both` }}>
                <FileRow file={f} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
