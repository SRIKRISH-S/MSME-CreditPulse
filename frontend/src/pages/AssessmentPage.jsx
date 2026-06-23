import { useState } from 'react'
import { predictSingle, predictCSV, downloadPdfReport, downloadJsonReport, getAssessmentDetail, getCreditMemo } from '../api/client'
import MSMEForm from '../components/MSMEForm'
import CSVUpload from '../components/CSVUpload'
import ScoreGauge from '../components/ScoreGauge'
import RiskBadge from '../components/RiskBadge'
import FeatureChart from '../components/FeatureChart'
import ActionCard from '../components/ActionCard'
import RecentAssessments from '../components/RecentAssessments'
import { downloadBlob } from '../utils/helpers'
import { ClipboardCheck, FileDown, FileJson, Cpu, Sparkles, UserCheck, TrendingUp, BarChart2, MessageSquare, Clipboard } from 'lucide-react'

export default function AssessmentPage() {
  const [result, setResult] = useState(null)
  const [bulkResults, setBulkResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('form') // 'form' | 'csv'
  
  // Detail tabs: 'shap' | 'ai' | 'peers'
  const [resultTab, setResultTab] = useState('shap')
  const [memoData, setMemoData] = useState(null)
  const [memoLoading, setMemoLoading] = useState(false)
  const [copiedMemo, setCopiedMemo] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  const handleFormSubmit = async (data) => {
    setLoading(true)
    setError('')
    setResult(null)
    setBulkResults(null)
    setMemoData(null)
    setResultTab('shap')
    try {
      const res = await predictSingle(data)
      // Fetch full details which has peer group averages!
      const detailRes = await getAssessmentDetail(res.data.id)
      setResult(detailRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCSVUpload = async (file) => {
    setLoading(true)
    setError('')
    setResult(null)
    setBulkResults(null)
    setMemoData(null)
    try {
      const res = await predictCSV(file)
      setBulkResults(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'CSV processing failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (id) => {
    try {
      const res = await downloadPdfReport(id)
      downloadBlob(res.data, `creditpulse_report_${id}.pdf`)
    } catch {
      alert('Failed to download PDF report.')
    }
  }

  const handleDownloadJSON = async (id) => {
    try {
      const res = await downloadJsonReport(id)
      downloadBlob(res.data, `creditpulse_report_${id}.json`)
    } catch {
      alert('Failed to download JSON report.')
    }
  }

  const fetchMemo = async (id) => {
    if (memoData) return
    setMemoLoading(true)
    try {
      const res = await getCreditMemo(id)
      setMemoData(res.data)
    } catch {
      alert('Failed to load AI credit memo insights.')
    } finally {
      setMemoLoading(false)
    }
  }

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    if (type === 'memo') {
      setCopiedMemo(true)
      setTimeout(() => setCopiedMemo(false), 2000)
    } else {
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-3">
          <ClipboardCheck className="w-7 h-7 text-gold-500" />
          New Credit Assessment
        </h1>
        <p className="text-navy-500 text-sm mt-1">
          Enter MSME financial data or upload a CSV for bulk analysis
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-navy-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('form')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'form'
              ? 'bg-white text-navy-900 shadow-sm'
              : 'text-navy-500 hover:text-navy-700'
          }`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'csv'
              ? 'bg-white text-navy-900 shadow-sm'
              : 'text-navy-500 hover:text-navy-700'
          }`}
        >
          CSV Upload
        </button>
      </div>

      {/* Input section */}
      <div className="card p-6">
        {activeTab === 'form' ? (
          <MSMEForm onSubmit={handleFormSubmit} loading={loading} />
        ) : (
          <CSVUpload onUpload={handleCSVUpload} loading={loading} />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Single result */}
      {result && (
        <div className="space-y-6 result-panel">
          {/* Header bar */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-500" />
              Assessment Results — {result.business_name}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-navy-400 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" />
                {result.model_type === 'xgboost' ? 'XGBoost + SHAP' : 'Rule-Based Engine'}
              </span>
            </div>
          </div>

          {/* Score + Risk + Action row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score gauge */}
            <div className="card p-6 flex items-center justify-center">
              <ScoreGauge score={result.credit_score} riskBand={result.risk_band} />
            </div>

            {/* Risk + Details */}
            <div className="card p-6 space-y-4">
              <div>
                <p className="text-xs font-medium text-navy-500 uppercase tracking-wider mb-2">Risk Classification</p>
                <RiskBadge riskBand={result.risk_band} size="lg" />
              </div>
              <div>
                <p className="text-xs font-medium text-navy-500 uppercase tracking-wider mb-2">Credit Score</p>
                <p className="text-4xl font-extrabold text-navy-900">{result.credit_score}<span className="text-lg text-navy-400">/100</span></p>
              </div>
              <div>
                <p className="text-xs font-medium text-navy-500 uppercase tracking-wider mb-2">Model</p>
                <p className="text-sm text-navy-600 font-medium">{result.model_type === 'xgboost' ? 'XGBoost Regressor + SHAP' : 'Rule-Based Scoring Engine'}</p>
              </div>
            </div>

            {/* Download buttons */}
            <div className="card p-6 space-y-4">
              <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">Download Report</p>
              <button
                onClick={() => handleDownloadPDF(result.id)}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                <FileDown className="w-4 h-4" />
                Download PDF Report
              </button>
              <button
                onClick={() => handleDownloadJSON(result.id)}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
              >
                <FileJson className="w-4 h-4" />
                Download JSON Data
              </button>
            </div>
          </div>

          {/* Action recommendation */}
          <ActionCard action={result.recommended_action} detail={result.action_detail} />

          {/* Upgraded Results Tabs */}
          <div className="border-b border-navy-100 flex gap-6">
            <button
              onClick={() => setResultTab('shap')}
              className={`pb-3 font-semibold text-sm transition-all relative ${
                resultTab === 'shap' ? 'text-navy-900' : 'text-navy-400 hover:text-navy-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> SHAP Explanations
              </span>
              {resultTab === 'shap' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />}
            </button>
            <button
              onClick={() => {
                setResultTab('ai')
                fetchMemo(result.id)
              }}
              className={`pb-3 font-semibold text-sm transition-all relative ${
                resultTab === 'ai' ? 'text-navy-900' : 'text-navy-400 hover:text-navy-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> AI Co-pilot Insights
              </span>
              {resultTab === 'ai' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />}
            </button>
            <button
              onClick={() => setResultTab('peers')}
              className={`pb-3 font-semibold text-sm transition-all relative ${
                resultTab === 'peers' ? 'text-navy-900' : 'text-navy-400 hover:text-navy-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Peer Benchmarking
              </span>
              {resultTab === 'peers' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />}
            </button>
          </div>

          {/* Tab 1: SHAP Explanations */}
          {resultTab === 'shap' && (
            <div className="card p-6">
              <FeatureChart factors={result.top_factors} />
            </div>
          )}

          {/* Tab 2: AI Co-pilot Insights */}
          {resultTab === 'ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Credit Sanction Memo */}
              <div className="card p-6 space-y-4 flex flex-col">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-navy-800 flex items-center gap-2 text-sm">
                    <UserCheck className="w-4 h-4 text-gold-500" /> Credit Sanction Memorandum
                  </h4>
                  <button
                    onClick={() => copyToClipboard(memoData?.memo_text, 'memo')}
                    className="text-xs text-gold-600 hover:text-gold-700 flex items-center gap-1 font-medium bg-gold-50 px-2.5 py-1.5 rounded-lg transition-all"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    {copiedMemo ? 'Copied!' : 'Copy Memo'}
                  </button>
                </div>
                {memoLoading ? (
                  <div className="flex-1 flex justify-center items-center h-48">
                    <span className="text-sm text-navy-400 animate-pulse">Drafting sanction memo...</span>
                  </div>
                ) : (
                  <pre className="bg-navy-50 text-navy-900 font-mono text-xs rounded-xl p-4 overflow-auto max-h-[350px] leading-relaxed whitespace-pre-wrap flex-1 border border-navy-100">
                    {memoData?.memo_text}
                  </pre>
                )}
              </div>

              {/* Email & Remediation */}
              <div className="space-y-6">
                {/* Client Email */}
                <div className="card p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-navy-800 text-sm">Draft Customer Notification</h4>
                    <button
                      onClick={() => copyToClipboard(memoData?.client_email, 'email')}
                      className="text-xs text-gold-600 hover:text-gold-700 flex items-center gap-1 font-medium bg-gold-50 px-2 py-1 rounded"
                    >
                      {copiedEmail ? 'Copied!' : 'Copy Email'}
                    </button>
                  </div>
                  {memoLoading ? (
                    <div className="h-24 flex items-center justify-center text-xs text-navy-400">Generating email...</div>
                  ) : (
                    <pre className="bg-navy-50 text-navy-800 font-mono text-xs rounded-lg p-3 overflow-auto max-h-[150px] whitespace-pre-wrap border border-navy-100">
                      {memoData?.client_email}
                    </pre>
                  )}
                </div>

                {/* Remediation Plan */}
                <div className="card p-6 space-y-3">
                  <h4 className="font-bold text-navy-800 text-sm">Actionable Score Improvement Plan</h4>
                  {memoLoading ? (
                    <div className="h-24 flex items-center justify-center text-xs text-navy-400">Analysing remediation vectors...</div>
                  ) : (
                    <div className="bg-gold-50/50 rounded-xl p-4 border border-gold-500/20 text-xs text-navy-900 leading-relaxed whitespace-pre-wrap font-sans">
                      {memoData?.remediation_plan}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Peer Benchmarking */}
          {resultTab === 'peers' && (
            <div className="card p-6 space-y-6">
              <h3 className="font-semibold text-navy-800 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gold-500 rounded-full" />
                Side-by-Side Competitor Benchmarking
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-navy-100 bg-navy-50 text-navy-600 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Financial Indicator</th>
                      <th className="py-3 px-4">This Business</th>
                      <th className="py-3 px-4">Sector Peer Average</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50 text-navy-800 font-medium">
                    {/* Monthly Turnover */}
                    <tr className="hover:bg-navy-50/30">
                      <td className="py-3.5 px-4 font-semibold">Monthly Turnover (₹ Lakhs)</td>
                      <td className="py-3.5 px-4 font-bold text-navy-900">₹{result.input_data.monthly_turnover} L</td>
                      <td className="py-3.5 px-4">₹{result.peers?.monthly_turnover} L</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          result.input_data.monthly_turnover >= result.peers?.monthly_turnover
                            ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.input_data.monthly_turnover >= result.peers?.monthly_turnover ? 'Above Avg' : 'Below Avg'}
                        </span>
                      </td>
                    </tr>

                    {/* Cash Flow */}
                    <tr className="hover:bg-navy-50/30">
                      <td className="py-3.5 px-4 font-semibold">Cash Flow Stability</td>
                      <td className="py-3.5 px-4 font-bold text-navy-900">{(result.input_data.cash_flow_stability * 100).toFixed(0)}%</td>
                      <td className="py-3.5 px-4">{(result.peers?.cash_flow_stability * 100).toFixed(0)}%</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          result.input_data.cash_flow_stability >= result.peers?.cash_flow_stability
                            ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.input_data.cash_flow_stability >= result.peers?.cash_flow_stability ? 'Above Avg' : 'Below Avg'}
                        </span>
                      </td>
                    </tr>

                    {/* Repayment */}
                    <tr className="hover:bg-navy-50/30">
                      <td className="py-3.5 px-4 font-semibold">EMI Repayment Rate (%)</td>
                      <td className="py-3.5 px-4 font-bold text-navy-900">{result.input_data.emi_repayment_rate}%</td>
                      <td className="py-3.5 px-4">{result.peers?.emi_repayment_rate}%</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          result.input_data.emi_repayment_rate >= result.peers?.emi_repayment_rate
                            ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.input_data.emi_repayment_rate >= result.peers?.emi_repayment_rate ? 'Above Avg' : 'Below Avg'}
                        </span>
                      </td>
                    </tr>

                    {/* GST Filing */}
                    <tr className="hover:bg-navy-50/30">
                      <td className="py-3.5 px-4 font-semibold">GST Filing Consistency (%)</td>
                      <td className="py-3.5 px-4 font-bold text-navy-900">{result.input_data.gst_filing_consistency}%</td>
                      <td className="py-3.5 px-4">{result.peers?.gst_filing_consistency}%</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          result.input_data.gst_filing_consistency >= result.peers?.gst_filing_consistency
                            ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.input_data.gst_filing_consistency >= result.peers?.gst_filing_consistency ? 'Above Avg' : 'Below Avg'}
                        </span>
                      </td>
                    </tr>

                    {/* Invoice Delay */}
                    <tr className="hover:bg-navy-50/30">
                      <td className="py-3.5 px-4 font-semibold">Avg. Invoice Delay (days)</td>
                      <td className="py-3.5 px-4 font-bold text-navy-900">{result.input_data.invoice_delay_days} days</td>
                      <td className="py-3.5 px-4">{result.peers?.invoice_delay_days} days</td>
                      <td className="py-3.5 px-4">
                        {/* Lower is better */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          result.input_data.invoice_delay_days <= result.peers?.invoice_delay_days
                            ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.input_data.invoice_delay_days <= result.peers?.invoice_delay_days ? 'Above Avg (Efficient)' : 'Below Avg (Slow)'}
                        </span>
                      </td>
                    </tr>

                    {/* Loan Burden */}
                    <tr className="hover:bg-navy-50/30">
                      <td className="py-3.5 px-4 font-semibold">Existing Loan Burden (%)</td>
                      <td className="py-3.5 px-4 font-bold text-navy-900">{result.input_data.loan_burden_ratio}%</td>
                      <td className="py-3.5 px-4">{result.peers?.loan_burden_ratio}%</td>
                      <td className="py-3.5 px-4">
                        {/* Lower is better */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          result.input_data.loan_burden_ratio <= result.peers?.loan_burden_ratio
                            ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.input_data.loan_burden_ratio <= result.peers?.loan_burden_ratio ? 'Above Avg (Lower Debt)' : 'Below Avg (High Debt)'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Input data summary */}
          <div className="card p-6">
            <h3 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold-500 rounded-full" />
              Input Data Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(result.input_data).map(([key, val]) => (
                <div key={key} className="bg-navy-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-navy-500 font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-lg font-bold text-navy-800 mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bulk results */}
      {bulkResults && (
        <div className="space-y-6 result-panel">
          <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold-500" />
            Bulk Analysis Results
          </h2>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-xs text-navy-500 font-medium uppercase">Total Analyzed</p>
              <p className="text-2xl font-extrabold text-navy-900 mt-1">{bulkResults.total}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-navy-500 font-medium uppercase">Avg Score</p>
              <p className="text-2xl font-extrabold text-gold-600 mt-1">{bulkResults.summary.avg_score}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-navy-500 font-medium uppercase">Min Score</p>
              <p className="text-2xl font-extrabold text-red-500 mt-1">{bulkResults.summary.min_score}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-navy-500 font-medium uppercase">Max Score</p>
              <p className="text-2xl font-extrabold text-green-600 mt-1">{bulkResults.summary.max_score}</p>
            </div>
          </div>

          {/* Results table */}
          <div className="card p-6">
            <RecentAssessments
              assessments={bulkResults.results.map(r => ({
                id: r.id,
                business_name: r.business_name,
                credit_score: r.credit_score,
                risk_band: r.risk_band,
                recommended_action: r.recommended_action,
                created_at: r.timestamp,
              }))}
            />
          </div>
        </div>
      )}
    </div>
  )
}
