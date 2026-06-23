import axios from 'axios'

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const api = axios.create({
  baseURL: isLocal ? '/api' : 'https://msme-creditpulse.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
})

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password })

export const register = (username, email, password) =>
  api.post('/auth/register', { username, email, password })

// Policy Configuration
export const getPolicy = () =>
  api.get('/policy')

export const updatePolicy = (policyData) =>
  api.post('/policy', policyData)

// Credit Memo
export const getCreditMemo = (id) =>
  api.get(`/reports/${id}/memo`)

// Predictions
export const predictSingle = (data) =>
  api.post('/predict', data)

export const predictCSV = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/predict/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// Assessments
export const getAssessments = (limit = 20) =>
  api.get(`/assessments?limit=${limit}`)

export const getAssessmentDetail = (id) =>
  api.get(`/assessments/${id}`)

// Dashboard
export const getDashboardStats = () =>
  api.get('/dashboard/stats')

// Reports
export const downloadJsonReport = (id) =>
  api.get(`/reports/${id}/json`, { responseType: 'blob' })

export const downloadPdfReport = (id) =>
  api.get(`/reports/${id}/pdf`, { responseType: 'blob' })

export default api
