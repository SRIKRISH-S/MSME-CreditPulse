import { useState } from 'react'

const FIELDS = [
  { name: 'business_name', label: 'Business Name', type: 'text', placeholder: 'e.g. Sharma Enterprises' },
  { name: 'monthly_turnover', label: 'Monthly Turnover (₹ Lakhs)', type: 'number', min: 0.5, max: 500, step: 0.5, placeholder: '0.5 – 500' },
  { name: 'cash_flow_stability', label: 'Cash Flow Stability Score', type: 'number', min: 0, max: 1, step: 0.01, placeholder: '0.00 – 1.00' },
  { name: 'emi_repayment_rate', label: 'EMI Repayment Rate (%)', type: 'number', min: 0, max: 100, step: 0.1, placeholder: '0 – 100' },
  { name: 'gst_filing_consistency', label: 'GST Filing Consistency (%)', type: 'number', min: 0, max: 100, step: 0.1, placeholder: '0 – 100' },
  { name: 'invoice_delay_days', label: 'Avg. Invoice Delay (days)', type: 'number', min: 0, max: 90, step: 1, placeholder: '0 – 90' },
  { name: 'account_balance_trend', label: 'Account Balance Trend', type: 'number', min: -1, max: 1, step: 0.01, placeholder: '-1.00 to 1.00' },
  { name: 'business_age', label: 'Business Age (years)', type: 'number', min: 0, max: 50, step: 0.5, placeholder: '0 – 50' },
  { name: 'loan_burden_ratio', label: 'Existing Loan Burden (%)', type: 'number', min: 0, max: 100, step: 0.1, placeholder: '0 – 100' },
]

const SAMPLE_DATA = {
  business_name: 'Patel Auto Parts',
  monthly_turnover: 85.5,
  cash_flow_stability: 0.72,
  emi_repayment_rate: 92.5,
  gst_filing_consistency: 88.0,
  invoice_delay_days: 12,
  account_balance_trend: 0.35,
  business_age: 8.5,
  loan_burden_ratio: 28.0,
}

export default function MSMEForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    business_name: '',
    monthly_turnover: '',
    cash_flow_stability: '',
    emi_repayment_rate: '',
    gst_filing_consistency: '',
    invoice_delay_days: '',
    account_balance_trend: '',
    business_age: '',
    loan_burden_ratio: '',
  })

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Convert empty strings to avoid validation errors
    const payload = { ...formData }
    for (const field of FIELDS) {
      if (field.type === 'number' && payload[field.name] === '') {
        payload[field.name] = 0
      }
    }
    onSubmit(payload)
  }

  const loadSample = () => {
    setFormData(SAMPLE_DATA)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy-800">MSME Financial Indicators</h3>
        <button
          type="button"
          onClick={loadSample}
          className="text-xs font-medium text-gold-600 hover:text-gold-700 underline underline-offset-2 transition-colors"
        >
          Load Sample Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map(field => (
          <div key={field.name} className={field.name === 'business_name' ? 'md:col-span-2' : ''}>
            <label htmlFor={field.name} className="label">{field.label}</label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              min={field.min}
              max={field.max}
              step={field.step}
              placeholder={field.placeholder}
              value={formData[field.name]}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing...
          </>
        ) : (
          'Run Credit Assessment'
        )}
      </button>
    </form>
  )
}
