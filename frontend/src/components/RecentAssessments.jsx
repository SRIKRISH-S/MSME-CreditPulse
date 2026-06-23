import RiskBadge from './RiskBadge'

export default function RecentAssessments({ assessments }) {
  if (!assessments || assessments.length === 0) {
    return (
      <div className="text-center py-12 text-navy-400">
        <p className="text-lg font-medium">No assessments yet</p>
        <p className="text-sm mt-1">Run your first credit assessment to see results here.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-navy-200">
            <th className="text-left py-3 px-4 font-semibold text-navy-600 uppercase text-xs tracking-wider">ID</th>
            <th className="text-left py-3 px-4 font-semibold text-navy-600 uppercase text-xs tracking-wider">Business</th>
            <th className="text-center py-3 px-4 font-semibold text-navy-600 uppercase text-xs tracking-wider">Score</th>
            <th className="text-center py-3 px-4 font-semibold text-navy-600 uppercase text-xs tracking-wider">Risk</th>
            <th className="text-left py-3 px-4 font-semibold text-navy-600 uppercase text-xs tracking-wider">Action</th>
            <th className="text-left py-3 px-4 font-semibold text-navy-600 uppercase text-xs tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody>
          {assessments.map((a, i) => (
            <tr
              key={a.id}
              className="border-b border-navy-100 hover:bg-navy-50/60 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <td className="py-3 px-4 text-navy-400 font-mono text-xs">#{a.id}</td>
              <td className="py-3 px-4 font-medium text-navy-800">{a.business_name}</td>
              <td className="py-3 px-4 text-center">
                <span className="font-bold text-navy-900">{a.credit_score}</span>
                <span className="text-navy-400">/100</span>
              </td>
              <td className="py-3 px-4 text-center">
                <RiskBadge riskBand={a.risk_band} />
              </td>
              <td className="py-3 px-4 text-navy-600">{a.recommended_action}</td>
              <td className="py-3 px-4 text-navy-400 text-xs">
                {a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
