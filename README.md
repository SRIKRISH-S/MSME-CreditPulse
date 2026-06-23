# 🏦 MSME CreditPulse

> AI-Powered MSME Financial Health Scoring, Policy Sandbox, & Credit Sanction Assistant for Bank Relationship Managers.

**Built for IDBI Innovate 2026** — *Winner / 1st Place Submission Target*

---

## 🎯 What It Does

**CreditPulse** is an enterprise-grade AI assistant that transforms the slow, document-heavy MSME loan approval process into an instantaneous, audited, and customizable digital workflow. 

### 🌟 Key Upgraded Features

1. **🔒 Secure Relationship Manager Authentication**
   - RMs can create custom database-backed accounts with secure PBKDF2 + SHA256 password hashing.
2. **📈 SHAP-Driven Scoring Sandbox (Policy Playground)**
   - Banks can adjust the weights ($w_i$) of the 8 financial indicators and risk thresholds in real-time.
   - Using SHAP (SHapley Additive exPlanations) values from the underlying XGBoost model, the system computes custom adjusted scores:
     $$\text{Adjusted Score} = \text{base\_value} + \sum (w_i \times \text{SHAP}_i)$$
     *Allows credit rules custom tuning without model retraining!*
3. **🤖 AI Co-pilot Credit Memo & Email Drafts**
   - Automatically generates formal banking Credit Sanction Memos containing executive summaries, core strengths, and conditional mitigations.
   - Drafts copyable client email updates depending on approval tier.
   - Provides business remediation tips to help applicants improve their scores.
4. **📊 Peer Group Benchmarking**
   - Displays a side-by-side comparison table showing how the applicant stacks up against other businesses in the database.
5. **📁 Bulk Ingestion & Templates**
   - Supports dragging and dropping CSV files containing hundreds of MSME records for bulk scoring, with built-in downloadable column templates.
6. **📄 Dynamic PDF Sanction Documents**
   - Instant PDF document generation styled in IDBI's brand color guidelines using `reportlab`.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│             Frontend UI (React 18 + Vite + Tailwind)         │
│  - DB Auth Login/Register                                   │
│  - Interactive Dashboard & Sandbox Weights Sliders          │
│  - Single Form Assessment, Peer Benchmarking, AI Insights    │
│  - Bulk CSV Upload & PDF Sanction Download                  │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTP / REST
┌──────────────▼──────────────────────────────────────────────┐
│                  Backend REST API (FastAPI)                 │
│  - User Auth, Custom Policy, Reports, Prediction Routers    │
└──────────────┬──────────────────────────────────────────────┘
               │ SQLAlchemy ORM
┌──────────────▼──────────────────────────────────────────────┐
│                    ML Engine & DB Storage                   │
│  - XGBoost Regressor (Scoring Model)                        │
│  - SHAP Explainer (Explainable AI contributions)            │
│  - SQLite Database (Saves users, custom policies, logs)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **Git**

### 1. Clone & Setup Backend

```bash
# Clone the repository
git clone https://github.com/SRIKRISH-S/MSME-CreditPlus.git
cd MSME-CreditPlus

# Backend setup
cd backend
python -m venv venv

# Activate Virtual Env (Windows)
.\venv\Scripts\activate
# Activate Virtual Env (Mac/Linux)
source venv/bin/activate

# Install dependencies (utilizes cp312 binary wheels on Windows)
pip install -r requirements.txt
```

### 2. Generate Data & Train Model
*Before running the server, generate the 500-row synthetic training data and train the XGBoost model artifact:*
```bash
python ml/generate_data.py
python ml/train.py
```

### 3. Start Backend
```bash
uvicorn main:app --reload --port 8000
```
*API Swagger Documentation is available at:* `http://localhost:8000/docs`

### 4. Start Frontend
*In a new terminal window:*
```bash
cd frontend
npm install
npm run dev
```
*Frontend interface is available at:* `http://localhost:5173`

---

## 🔑 Demo Access Credentials
You can register your own RM account in the database using the "Register RM" link, or log in with our pre-configured admin profile:
- **Username:** `admin`
- **Password:** `idbi2026`

---

## 📊 MSME Financial Parameters

| Indicator | Feature Name | Range | Description |
|---|---|---|---|
| Monthly Turnover | `monthly_turnover` | 0.5 – 500 | Business monthly revenue in ₹ Lakhs |
| Cash Flow Stability | `cash_flow_stability` | 0 – 1 | Multi-month ledger stability score |
| EMI Repayment Rate | `emi_repayment_rate` | 0 – 100 | Percentage of on-time loan repayments |
| GST Filing Consistency | `gst_filing_consistency` | 0 – 100 | Percentage of regulatory tax filing matching dates |
| Invoice Delay | `invoice_delay_days` | 0 – 90 | Average delays in days customer pay receivables |
| Balance Trend | `account_balance_trend` | -1.0 to 1.0 | Average current account cash trajectory |
| Business Age | `business_age` | 0 – 50 | Years of active operation |
| Loan Burden Ratio | `loan_burden_ratio` | 0 – 100 | Existing leverage debt percentage |

---

## 📡 Upgraded API Routes

| Router | Method | Endpoint | Description |
|---|---|---|---|
| **Authentication** | POST | `/api/auth/register` | Create a new RM account |
| | POST | `/api/auth/login` | Login and obtain session token |
| **Scoring Policy** | GET | `/api/policy` | Get the currently active sandbox weights |
| | POST | `/api/policy` | Update weights and risk thresholds |
| **Predictions** | POST | `/api/predict` | Score an MSME using active policy |
| | POST | `/api/predict/csv` | Bulk parse and score CSV rows |
| | GET | `/api/predict/sample-template` | Download empty CSV template |
| | GET | `/api/assessments` | History of assessments |
| | GET | `/api/assessments/{id}` | Assessment detail + peer benchmark data |
| **AI Co-pilot / Reports** | GET | `/api/reports/{id}/memo` | Generate AI Sanction memo & email drafts |
| | GET | `/api/reports/{id}/pdf` | Download formal branded PDF |

---

## 🐳 Docker Deployment

To launch the entire platform in a containerized environment (including automatic backend dataset generation, model training, and database seeding):
```bash
docker-compose up --build
```
- Web Application: `http://localhost:5173`
- Backend Swagger: `http://localhost:8000/docs`

---

Built with ❤️ for **IDBI Innovate 2026**
