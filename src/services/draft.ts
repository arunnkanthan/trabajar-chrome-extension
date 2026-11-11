/**
 * Saves the job form as a draft in chrome.storage.session, one draft per browser tab.
 *
 * - Survives the popup closing (clicking outside it).
 * - Each tab has its own draft, so a half-filled job for one posting doesn't show
 *   up on another tab. Tab IDs are unique across all Chrome windows, and a tab
 *   keeps its draft if you drag it into another window.
 * - Cleared when Chrome quits (session storage lives in memory only), after a
 *   successful submit, or when you press Clear.
 */
const DRAFT_KEY_PREFIX = 'jobFormDraft:'

// chrome.* only exists when running as the extension (not in a plain browser tab)
const isExtension = () => typeof chrome !== 'undefined' && !!chrome.storage?.session && !!chrome.tabs

/** Storage key for the tab the popup was opened on (the active tab in the current window). */
const draftKey = async (): Promise<string | null> => {
  if (!isExtension()) return null
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab?.id == null ? null : `${DRAFT_KEY_PREFIX}${tab.id}`
}

export const loadDraft = async <T extends object>(): Promise<Partial<T> | null> => {
  const key = await draftKey()
  if (!key) return null
  const result = await chrome.storage.session.get(key)
  return (result[key] as Partial<T> | undefined) ?? null
}

export const saveDraft = async (draft: object): Promise<void> => {
  const key = await draftKey()
  if (key) await chrome.storage.session.set({ [key]: draft })
}

export const clearDraft = async (): Promise<void> => {
  const key = await draftKey()
  if (key) await chrome.storage.session.remove(key)
}
