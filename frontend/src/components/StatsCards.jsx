import { TrendingUp, Users, ShieldAlert, ShieldCheck } from 'lucide-react'

export default function StatsCards({ stats }) {
  if (!stats) return null

  const cards = [
    {
      label: 'Total Assessments',
      value: stats.total_assessments,
      icon: Users,
      color: 'text-navy-700',
      bg: 'bg-navy-100',
    },
    {
      label: 'Average Score',
      value: stats.avg_score?.toFixed(1) || '0',
      icon: TrendingUp,
      color: 'text-gold-600',
      bg: 'bg-gold-300/30',
    },
    {
      label: 'Low Risk',
      value: stats.low_risk_count,
      icon: ShieldCheck,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'High Risk',
      value: stats.high_risk_count,
      icon: ShieldAlert,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="card p-6 animate-slide-up"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">
                {card.label}
              </p>
              <p className={`text-3xl font-extrabold mt-1 ${card.color}`}>
                {card.value}
              </p>
            </div>
            <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
