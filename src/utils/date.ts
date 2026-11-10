/** Today's date as MM/DD/YYYY, matching the job search sheet. */
export const getCurrentDateMMDDYYYY = (): string => {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0') // Months are 0-based
  const day = String(today.getDate()).padStart(2, '0')
  const year = today.getFullYear()
  return `${month}/${day}/${year}`
}
