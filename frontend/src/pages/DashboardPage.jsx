import { useState, useEffect } from 'react'
import { getDashboardStats } from '../api/client'
import StatsCards from '../components/StatsCards'
import RecentAssessments from '../components/RecentAssessments'
import PolicyConfigurator from '../components/PolicyConfigurator'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Activity, RefreshCw } from 'lucide-react'

const RISK_COLORS = { Low: '#38a169', Medium: '#d69e2e', High: '#e53e3e' }

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getDashboardStats()
      setStats(res.data)
    } catch {
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-navy-500">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading dashboard...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={fetchStats} className="btn-secondary">Retry</button>
      </div>
    )
  }

  const riskData = stats ? [
    { name: 'Low Risk', value: stats.low_risk_count, color: RISK_COLORS.Low },
    { name: 'Medium Risk', value: stats.medium_risk_count, color: RISK_COLORS.Medium },
    { name: 'High Risk', value: stats.high_risk_count, color: RISK_COLORS.High },
  ].filter(d => d.value > 0) : []

  const distData = stats?.score_distribution || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Activity className="w-7 h-7 text-gold-500" />
            Dashboard
          </h1>
          <p className="text-navy-500 text-sm mt-1">MSME Credit Assessment Overview</p>
        </div>
        <button
          onClick={fetchStats}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      <StatsCards stats={stats} />

      {/* Main dashboard columns: Left is charts, Right is policy config */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk distribution pie */}
            <div className="card p-6">
              <h3 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gold-500 rounded-full" />
                Risk Distribution
              </h3>
              {riskData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="60%" height={200}>
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {riskData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#1a365d',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '13px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {riskData.map(d => (
                      <div key={d.name} className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="text-sm text-navy-600">{d.name}</span>
                        <span className="text-sm font-bold text-navy-800">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-navy-400 text-center py-8">No data yet</p>
              )}
            </div>

            {/* Score distribution bar */}
            <div className="card p-6">
              <h3 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gold-500 rounded-full" />
                Score Distribution
              </h3>
              {distData.some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={distData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 11, fill: '#627d98' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#627d98' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1a365d',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="count" fill="#2b6cb0" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-navy-400 text-center py-8">No data yet</p>
              )}
            </div>
          </div>

          {/* Recent assessments */}
          <div className="card p-6">
            <h3 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold-500 rounded-full" />
              Recent Assessments
            </h3>
            <RecentAssessments assessments={stats?.recent_assessments} />
          </div>
        </div>

        {/* Sandbox Configurator sidebar */}
        <div className="xl:col-span-1">
          <PolicyConfigurator />
        </div>
      </div>
    </div>
  )
}
