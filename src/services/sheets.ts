export type WorkLocation = 'REMOTE' | 'HYBRID' | 'ONSITE' | ''

export interface Job {
  date: string
  companyName: string
  positionTitle: string
  positionLink: string
  jobBoard: string
  workLocation: WorkLocation
  notes: string
}

interface SheetsResponse {
  ok: boolean
  row?: number
  error?: string
}

const WEB_APP_URL = import.meta.env.VITE_SHEETS_WEB_APP_URL ?? ''
const SECRET = import.meta.env.VITE_SHEETS_SECRET ?? ''

/**
 * Sends a job to the Apps Script web app (backend-services/apps-script/Code.gs),
 * which appends it to the 2026_job_search tab. Resolves with the row it was written to.
 */
export const sendJobToSheet = async (job: Job): Promise<number> => {
  if (!WEB_APP_URL || !SECRET || WEB_APP_URL.includes('<deployment-id>')) {
    throw new Error('Set VITE_SHEETS_WEB_APP_URL and VITE_SHEETS_SECRET in .env.local, then rebuild')
  }

  // text/plain avoids a CORS preflight, which Apps Script web apps don't answer
  const response = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret: SECRET, job }),
  })

  let result: SheetsResponse
  try {
    result = await response.json()
  } catch {
    throw new Error(`Unexpected response from Apps Script (HTTP ${response.status}). Check the URL and that access is "Anyone".`)
  }

  if (!result.ok || result.row == null) {
    throw new Error(result.error || 'Unknown error from Apps Script')
  }
  return result.row
}
