import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'

export default function CSVUpload({ onUpload, loading }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    setError('')
    if (selected) {
      if (!selected.name.endsWith('.csv')) {
        setError('Please select a CSV file.')
        setFile(null)
        return
      }
      if (selected.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum 5MB.')
        setFile(null)
        return
      }
      setFile(selected)
    }
  }

  const handleUpload = () => {
    if (file) {
      onUpload(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0]
    if (dropped?.name.endsWith('.csv')) {
      setFile(dropped)
      setError('')
    } else {
      setError('Only CSV files are accepted.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy-800">Bulk CSV Upload</h3>
        <a
          href="/api/predict/sample-template"
          download="creditpulse_bulk_template.csv"
          className="text-xs font-semibold text-gold-600 hover:text-gold-700 flex items-center gap-1.5 underline underline-offset-2"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Download CSV Template
        </a>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-navy-300 rounded-xl p-8 text-center cursor-pointer
                   hover:border-gold-500 hover:bg-gold-500/5 transition-all duration-300"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <Upload className="w-10 h-10 text-navy-400 mx-auto mb-3" />
        <p className="text-navy-600 font-medium">
          {file ? file.name : 'Drop CSV file here or click to browse'}
        </p>
        <p className="text-navy-400 text-xs mt-1">
          Required columns: business_name, monthly_turnover, cash_flow_stability, emi_repayment_rate, gst_filing_consistency, invoice_delay_days, account_balance_trend, business_age, loan_burden_ratio
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {file && (
        <div className="flex items-center justify-between p-3 bg-navy-100 rounded-lg">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-navy-600" />
            <span className="text-sm font-medium text-navy-700">{file.name}</span>
            <span className="text-xs text-navy-400">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            onClick={handleUpload}
            disabled={loading}
            className="btn-primary text-sm py-2 px-4"
          >
            {loading ? 'Processing...' : 'Analyze All'}
          </button>
        </div>
      )}
    </div>
  )
}
