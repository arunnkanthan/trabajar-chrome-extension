import React, { useState } from 'react'
import { sendJobToSheet, type WorkLocation } from '../services/sheets'
import { getCurrentDateMMDDYYYY } from '../utils/date'

const WORK_LOCATIONS: Exclude<WorkLocation, ''>[] = ['REMOTE', 'HYBRID', 'ONSITE']

const emptyForm = {
  companyName: '',
  positionTitle: '',
  positionLink: '',
  jobBoard: '',
  workLocation: '' as WorkLocation,
  notes: '',
}

type Status = { type: 'idle' } | { type: 'saving' } | { type: 'ok'; message: string } | { type: 'error'; message: string }

export const JobForm: React.FC = () => {
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState<Status>({ type: 'idle' })

  const update = (field: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value })

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
      <input className="form-input" type="url" placeholder="Url" value={form.positionLink} onChange={update('positionLink')} />
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

      <button className="submit-button" type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Submit'}
      </button>

      {(status.type === 'ok' || status.type === 'error') && (
        <p className={`form-status ${status.type === 'error' ? 'status-error' : 'status-ok'}`} role="status">
          {status.message}
        </p>
      )}
    </form>
  )
}
