import React, { useEffect, useState } from 'react'
import { sendJobToSheet, type WorkLocation } from '../services/sheets'
import { getCurrentDateMMDDYYYY } from '../utils/date'
import { clearDraft, loadDraft, saveDraft } from '../services/draft'
import { getActiveTabUrl } from '../services/tabs'

const WORK_LOCATIONS: Exclude<WorkLocation, ''>[] = ['REMOTE', 'HYBRID', 'ONSITE']

type FormState = {
  companyName: string
  positionTitle: string
  positionLink: string
  jobBoard: string
  workLocation: WorkLocation
  notes: string
}

const emptyForm: FormState = {
  companyName: '',
  positionTitle: '',
  positionLink: '',
  jobBoard: '',
  workLocation: '',
  notes: '',
}

const isEmpty = (form: FormState) => Object.values(form).every((value) => value === '')

type Status = { type: 'idle' } | { type: 'saving' } | { type: 'ok'; message: string } | { type: 'error'; message: string }

export const JobForm: React.FC = () => {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const [draftLoaded, setDraftLoaded] = useState(false)

  // Restore this tab's draft when the popup opens
  useEffect(() => {
    loadDraft<FormState>()
      .then((draft) => { if (draft) setForm({ ...emptyForm, ...draft }) })
      .catch((err) => console.error('Failed to load draft', err))
      .finally(() => setDraftLoaded(true))
  }, [])

  // Save the draft on every change (only after it's been restored, so we don't overwrite it with an empty form)
  useEffect(() => {
    if (!draftLoaded) return
    const persist = isEmpty(form) ? clearDraft() : saveDraft(form)
    persist.catch((err) => console.error('Failed to save draft', err))
  }, [form, draftLoaded])

  const update = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value })

  // Fill Url with the address of the page the popup was opened on (the job posting)
  const handleUsePageUrl = async () => {
    try {
      const pageUrl = await getActiveTabUrl()
      if (!pageUrl) {
        setStatus({ type: 'error', message: "This page doesn't have a web address to use." })
        return
      }
      setForm((current) => ({ ...current, positionLink: pageUrl }))
    } catch (err) {
      console.error('Failed to read tab URL', err)
      setStatus({ type: 'error', message: err instanceof Error ? err.message : "Couldn't read this page's address." })
    }
  }

  const handleClear = () => {
    setForm(emptyForm)
    setStatus({ type: 'idle' })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const job = {
      date: getCurrentDateMMDDYYYY(),
      companyName: form.companyName.trim(),
      positionTitle: form.positionTitle.trim(),
      positionLink: form.positionLink.trim(),
      jobBoard: form.jobBoard.trim(),
      workLocation: form.workLocation,
      notes: form.notes.trim(),
    }

    if (!job.companyName || !job.positionTitle || !job.positionLink) {
      setStatus({ type: 'error', message: 'Company, position and URL are required.' })
      return
    }

    setStatus({ type: 'saving' })
    try {
      const row = await sendJobToSheet(job)
      setStatus({ type: 'ok', message: `Saved to row ${row} ✓` })
      setForm(emptyForm)
    } catch (err) {
      console.error('Failed to save job', err)
      setStatus({ type: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  const saving = status.type === 'saving'

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      <h3 className="form-title">Track a job</h3>
      <input className="form-input" type="text" placeholder="Company Name" value={form.companyName} onChange={update('companyName')} />
      <input className="form-input" type="text" placeholder="Position" value={form.positionTitle} onChange={update('positionTitle')} />
      <div className="input-row">
        <input className="form-input" type="url" placeholder="Url" value={form.positionLink} onChange={update('positionLink')} />
        <button
          className="page-url-button"
          type="button"
          onClick={handleUsePageUrl}
          title="Use this page's address"
          aria-label="Use this page's address"
        >
          🔗
        </button>
      </div>
      <input className="form-input" type="text" placeholder="Job Board" value={form.jobBoard} onChange={update('jobBoard')} />

      <div className="radio-group" role="radiogroup" aria-label="Work location">
        {WORK_LOCATIONS.map((location) => (
          <label key={location} className="radio-label">
            <input
              type="radio"
              name="workLocation"
              value={location}
              checked={form.workLocation === location}
              onChange={update('workLocation')}
            />
            {location}
          </label>
        ))}
      </div>

      <input className="form-input" type="text" placeholder="Any notes?" value={form.notes} onChange={update('notes')} />

      <div className="form-actions">
        <button className="submit-button" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Submit'}
        </button>
        <button className="clear-button" type="button" onClick={handleClear} disabled={saving || isEmpty(form)}>
          Clear
        </button>
      </div>

      <p
        className={`form-status ${
          status.type === 'error' ? 'status-error' : status.type === 'ok' ? 'status-ok' : 'status-hidden'
        }`}
        role="status"
      >
        {status.type === 'ok' || status.type === 'error' ? status.message : '\u00A0'}
      </p>
    </form>
  )
}
