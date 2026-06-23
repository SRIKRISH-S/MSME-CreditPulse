import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts'

const POSITIVE_COLOR = '#38a169'
const NEGATIVE_COLOR = '#e53e3e'

export default function FeatureChart({ factors }) {
  if (!factors || factors.length === 0) return null

  // Take top 8 factors, sorted by absolute contribution
  const data = factors
    .slice(0, 8)
    .map(f => ({
      name: f.display_name || f.feature,
      value: f.contribution,
      raw: f.value,
    }))
    .reverse() // Bottom-to-top for horizontal bar

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-navy-900 text-white px-4 py-3 rounded-lg shadow-xl text-sm">
        <p className="font-semibold">{d.name}</p>
        <p className="text-navy-300">Input Value: {d.raw}</p>
        <p style={{ color: d.value >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR }}>
          Impact: {d.value >= 0 ? '+' : ''}{d.value.toFixed(2)}
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-navy-700 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-gold-500 rounded-full" />
        AI Explainability — Feature Impact (SHAP)
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: '#627d98' }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#334e68' }}
            width={140}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0f4f8' }} />
          <ReferenceLine x={0} stroke="#9fb3c8" strokeDasharray="3 3" />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.value >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-navy-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm" style={{ background: POSITIVE_COLOR }} />
          Positive impact (raises score)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm" style={{ background: NEGATIVE_COLOR }} />
          Negative impact (lowers score)
        </span>
      </div>
    </div>
  )
}
