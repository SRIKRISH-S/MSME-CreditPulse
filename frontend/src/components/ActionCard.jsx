import {
  CheckCircle2, Search, FileText, XCircle
} from 'lucide-react'
import { getActionStyle } from '../utils/helpers'

const actionIcons = {
  Approve: CheckCircle2,
  Review: Search,
  'Request Documents': FileText,
  Reject: XCircle,
}

export default function ActionCard({ action, detail }) {
  const style = getActionStyle(action)
  const Icon = actionIcons[action] || Search

  return (
    <div className={`rounded-xl border-2 ${style.border} ${style.bg} p-5`}>
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${style.color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color: style.color }} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-navy-900 text-lg">
            Recommended Action:{' '}
            <span style={{ color: style.color }}>{action}</span>
          </h3>
          <p className="text-navy-600 text-sm mt-1.5 leading-relaxed">
            {detail}
          </p>
        </div>
      </div>
    </div>
  )
}
