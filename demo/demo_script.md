.//# 🎬 MSME CreditPulse — Demo Script (5 minutes)

## Slide 1: Opening (30 seconds)

> "Good morning! We're presenting **MSME CreditPulse** — an AI-powered credit assessment platform
> designed for bank Relationship Managers to make faster, smarter MSME lending decisions."
>
> "Today, banks take 7-14 days to assess MSME loan applications. CreditPulse does it in **under 5 seconds**."

---

## Demo Flow 1: Login (15 seconds)

1. Open the app → Show the professional banking-style login screen
2. Login with `admin / idbi2026`
3. Show the dashboard loads instantly

> "The platform uses a secure, role-based login. Here's the RM dashboard."

---

## Demo Flow 2: Dashboard (45 seconds)

1. Point to the **4 stat cards**: Total Assessments, Average Score, Low Risk, High Risk
2. Show the **Risk Distribution Pie Chart** — "At a glance, the RM sees portfolio health"
3. Show the **Score Distribution Bar Chart** — "Most MSMEs fall in the 60-80 healthy range"
4. Scroll to **Recent Assessments** table

> "This gives the RM a bird's-eye view of their entire MSME portfolio."

---

## Demo Flow 3: Single Assessment (90 seconds) ⭐ KEY DEMO

1. Navigate to **New Assessment**
2. Click **"Load Sample Data"** to fill the form
3. Click **"Run Credit Assessment"**
4. Wait for the animated results to appear

Show each section:

1. **Score Gauge** — "This MSME scored 78 out of 100 — animated, color-coded"
2. **Risk Badge** — "Classified as Low Risk in green"
3. **Recommended Action** — "The AI recommends Approve with standard terms"
4. **SHAP Chart** — ⭐ "This is the explainability layer. Each bar shows HOW MUCH each factor
   contributed to the score. EMI Repayment pushed the score UP. Invoice Delays pulled it DOWN.
   This is SHAP — the same explainability used by top global banks."
5. **Input Summary** — "All inputs are preserved for audit trail"

> "The entire assessment took **under 2 seconds**. No manual spreadsheets. No guesswork."

---

## Demo Flow 4: Bulk CSV Upload (30 seconds)

1. Switch to **CSV Upload** tab
2. Upload the `sample_msme_data.csv` file
3. Show bulk results: total, average, min/max scores
4. Show the results table

> "For portfolio reviews, RMs can upload hundreds of MSMEs at once."

---

## Demo Flow 5: Report Download (30 seconds)

1. Click **Download PDF Report**
2. Open the PDF — show professional IDBI-branded report
3. Show: score summary table, input data, SHAP factors

> "Every assessment generates a downloadable report — ready for the credit committee."

---

## Closing (30 seconds)

> "To recap: CreditPulse gives you:
> 1. **Speed** — 2 seconds vs 14 days
> 2. **AI Explainability** — every score is transparent and auditable
> 3. **Scalability** — bulk assessments for portfolio reviews
> 4. **Compliance** — PDF reports for audit trails
>
> Built with XGBoost, SHAP, FastAPI, and React. Deployment-ready with Docker.
>
> Thank you!"

---

## Backup Talking Points

- **"What if the model fails?"** — We have a rule-based fallback scorer that's always available.
- **"Is this production ready?"** — The architecture is production-grade. For production, swap SQLite for PostgreSQL, add OAuth2, and deploy on cloud.
- **"What about data privacy?"** — All data stays within the bank's infrastructure. No external API calls.
- **"How accurate is the model?"** — Our XGBoost model achieves R² > 0.95 on validation data. In production, we'd train on real bank data.
