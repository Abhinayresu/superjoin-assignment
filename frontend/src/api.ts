export const API_BASE = 'http://localhost:8000/api'

export async function fetchStatus() {
  try {
    const res = await fetch(`${API_BASE}/status`)
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Backend offline, using fallback:', e)
  }
  return null
}

export async function fetchDocuments() {
  try {
    const res = await fetch(`${API_BASE}/documents`)
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Backend offline, using fallback:', e)
  }
  return null
}

export async function uploadPDF(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Ingestion failed')
  }

  return await res.json()
}

export async function seedDemoDataset(dataset: string = 'delhivery') {
  const res = await fetch(`${API_BASE}/demo/seed?dataset=${dataset}`, {
    method: 'POST',
  })
  return await res.json()
}

export async function fetchFacts() {
  try {
    const res = await fetch(`${API_BASE}/facts`)
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Backend offline, using fallback:', e)
  }
  return null
}

export async function fetchConflicts() {
  try {
    const res = await fetch(`${API_BASE}/conflicts`)
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Backend offline, using fallback:', e)
  }
  return null
}

export async function fetchUncertainties() {
  try {
    const res = await fetch(`${API_BASE}/uncertainties`)
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Backend offline, using fallback:', e)
  }
  return null
}

export async function fetchEvidence() {
  try {
    const res = await fetch(`${API_BASE}/evidence`)
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Backend offline, using fallback:', e)
  }
  return null
}

export async function fetchGraph() {
  try {
    const res = await fetch(`${API_BASE}/graph`)
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Backend offline, using fallback:', e)
  }
  return null
}

export async function fetchTimeline() {
  try {
    const res = await fetch(`${API_BASE}/timeline`)
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Backend offline, using fallback:', e)
  }
  return null
}
