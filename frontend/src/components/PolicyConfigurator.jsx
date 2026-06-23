import { useState, useEffect } from 'react'
import { getPolicy, updatePolicy } from '../api/client'
import { Sliders, CheckCircle, RefreshCw, Info } from 'lucide-react'

const POLICY_FIELDS = [
  { name: 'w_monthly_turnover', label: 'Turnover Weight' },
  { name: 'w_cash_flow_stability', label: 'Cash Flow Stability Weight' },
  { name: 'w_emi_repayment_rate', label: 'Repayment Consistency Weight' },
  { name: 'w_gst_filing_consistency', label: 'GST Filing Weight' },
  { name: 'w_invoice_delay_days', label: 'Invoice Delay Penalty' },
  { name: 'w_account_balance_trend', label: 'Balance Trend Weight' },
  { name: 'w_business_age', label: 'Business Vintage Weight' },
  { name: 'w_loan_burden_ratio', label: 'Debt Burden Weight' },
]

export default function PolicyConfigurator() {
  const [policy, setPolicy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchPolicy = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getPolicy()
      setPolicy(res.data)
    } catch {
      setError('Failed to fetch credit policy.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicy()
  }, [])

  const handleWeightChange = (name, val) => {
    setPolicy(prev => ({
      ...prev,
      [name]: parseFloat(val),
    }))
  }

  const handleThresholdChange = (name, val) => {
    const num = Math.min(100, Math.max(0, parseFloat(val) || 0))
    setPolicy(prev => ({
      ...prev,
      [name]: num,
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await updatePolicy(policy)
      setPolicy(res.data)
      setSuccess('Scoring policy updated successfully!')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save credit policy.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-6 flex justify-center items-center h-96">
        <span className="text-sm text-navy-400 flex items-center gap-2">
          <RefreshCw className="animate-spin w-4 h-4" /> Loading active policy...
        </span>
      </div>
    )
  }

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy-800 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-gold-500" />
          Scoring Policy Sandbox
        </h3>
        <button
          type="button"
          onClick={fetchPolicy}
          className="text-xs text-navy-500 hover:text-navy-700 underline"
        >
          Reset to Active
        </button>
      </div>

      <p className="text-xs text-navy-500 bg-navy-50 rounded-lg p-3 flex items-start gap-2 leading-relaxed">
        <Info className="w-4 h-4 text-navy-600 shrink-0 mt-0.5" />
        Configure risk thresholds and adjust indicator weights below to custom-tune the ML SHAP-weighted scoring behavior.
      </p>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Risk Thresholds */}
        <div className="grid grid-cols-2 gap-4 border-b border-navy-100 pb-4">
          <div>
            <label className="text-xs font-semibold text-navy-700">Low Risk Threshold</label>
            <input
              type="number"
              value={policy.low_threshold}
              onChange={(e) => handleThresholdChange('low_threshold', e.target.value)}
              className="input-field mt-1 py-1 px-2.5 text-sm"
              min="0"
              max="100"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-700">Medium Risk Threshold</label>
            <input
              type="number"
              value={policy.medium_threshold}
              onChange={(e) => handleThresholdChange('medium_threshold', e.target.value)}
              className="input-field mt-1 py-1 px-2.5 text-sm"
              min="0"
              max="100"
              required
            />
          </div>
        </div>

        {/* Weights list */}
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {POLICY_FIELDS.map(field => {
            const val = policy[field.name] || 0.0
            return (
              <div key={field.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-navy-700">{field.label}</span>
                  <span className="font-bold text-gold-600">{val.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="3.0"
                  step="0.1"
                  value={val}
                  onChange={(e) => handleWeightChange(field.name, e.target.value)}
                  className="w-full h-1.5 bg-navy-100 rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
              </div>
            )
          })}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full text-xs py-2.5"
        >
          {saving ? 'Saving Settings...' : 'Apply Scoring Weights'}
        </button>
      </form>
    </div>
  )
}
