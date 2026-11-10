import React from 'react'

interface CopyButtonProps {
  id: string
  label: string
  text: string
  icon: string
}

export const CopyButton: React.FC<CopyButtonProps> = ({ id, label, text, icon }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      
      // Close the popup after copying
      window.close()
      console.log('Clipboard updated successfully!')
    } catch (err) {
      console.error('Failed to read or write to the clipboard: ', err)
    }
  }

  return (
    <button
      id={id}
      className="copy-button"
      onClick={handleCopy}
      title={`Copy ${label} text`}
    >
      <span className="button-icon">{icon}</span>
      <span className="button-label">{label}</span>
    </button>
  )
}
