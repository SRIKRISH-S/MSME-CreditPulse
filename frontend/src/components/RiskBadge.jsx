import { getRiskBadgeClass } from '../utils/helpers'
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'

const icons = {
  Low: ShieldCheck,
  Medium: ShieldAlert,
  High: ShieldX,
}

export default function RiskBadge({ riskBand, size = 'md' }) {
  const Icon = icons[riskBand] || ShieldAlert
  const badgeClass = getRiskBadgeClass(riskBand)

  const sizeClass = size === 'lg'
    ? 'px-4 py-2 text-sm gap-2'
    : 'px-3 py-1 text-xs gap-1.5'

  return (
    <span className={`${badgeClass} ${sizeClass} inline-flex items-center`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      {riskBand} Risk
    </span>
  )
}
