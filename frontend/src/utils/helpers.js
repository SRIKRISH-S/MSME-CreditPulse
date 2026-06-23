/**
 * Get risk badge CSS class based on risk band.
 */
export function getRiskBadgeClass(riskBand) {
  const classes = {
    Low: 'badge-low',
    Medium: 'badge-medium',
    High: 'badge-high',
  }
  return classes[riskBand] || 'badge-medium'
}

/**
 * Get color hex for risk band.
 */
export function getRiskColor(riskBand) {
  const colors = {
    Low: '#38a169',
    Medium: '#d69e2e',
    High: '#e53e3e',
  }
  return colors[riskBand] || '#627d98'
}

/**
 * Get action icon and color.
 */
export function getActionStyle(action) {
  const styles = {
    Approve: { color: '#38a169', bg: 'bg-green-50', border: 'border-green-200' },
    Review: { color: '#d69e2e', bg: 'bg-amber-50', border: 'border-amber-200' },
    'Request Documents': { color: '#2b6cb0', bg: 'bg-blue-50', border: 'border-blue-200' },
    Reject: { color: '#e53e3e', bg: 'bg-red-50', border: 'border-red-200' },
  }
  return styles[action] || styles.Review
}

/**
 * Format number with Indian-style grouping.
 */
export function formatIndianNumber(num) {
  if (num === undefined || num === null) return '0'
  return num.toLocaleString('en-IN')
}

/**
 * Trigger file download from blob.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
