/** The tab the popup was opened on (the active tab in the current window), or null outside the extension. */
export const getActiveTab = async (): Promise<chrome.tabs.Tab | null> => {
  if (typeof chrome === 'undefined' || !chrome.tabs) return null
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab ?? null
}

/**
 * The address of the page the popup was opened on, e.g. the job posting.
 * Readable thanks to the activeTab permission. Returns '' for non-web pages
 * (new tab, chrome:// settings, etc.).
 */
export const getActiveTabUrl = async (): Promise<string> => {
  const tab = await getActiveTab()
  if (tab && tab.url === undefined) {
    // Chrome hides the URL when the extension doesn't have activeTab access to this tab
    throw new Error('No access to this page. Reload the extension in chrome://extensions, then refresh this tab.')
  }
  const url = tab?.url ?? ''
  return /^https?:\/\//i.test(url) ? url : ''
}
