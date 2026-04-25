# 🛡️ ScamBreaker

**ScamBreaker** is an AI-powered scam reporting and case management platform built for Malaysia's National Scam Response Centre (NSRC). It connects scam victims directly with law enforcement authorities through an intelligent, guided reporting workflow.

> 🔗 **Live Demo:** [https://scambreaker.vercel.app](https://scambreaker.vercel.app)

---

## ✨ Features

### Victim Portal (`/victim`)
- **AI-Guided Reporting** — Conversational AI that walks victims through filing a scam report
- **Smart Case Analysis** — Auto scam type detection, urgency scoring, and risk assessment via GLM AI
- **Document Generation** — Auto-generates Police Reports (BM) and Bank Dispute Letters (EN)
- **Case Dashboard** — Track status, upload evidence, view AI-recommended action steps
- **Profile Management** — Manage IC Number, Phone Number linked to reports

### Authority Portal (`/authority`)
- **Case Management Dashboard** — Priority-sorted cases with SLA enforcement
- **AI Insights Panel** — Recoverability scoring with time-decay modeling
- **Workflow Engine** — `NEW → TRIAGED → INVESTIGATING → RESOLVED / CLOSED`
- **Intervention Actions** — Freeze accounts, escalate cases, request evidence
- **Audit Trail** — Full workflow logging with actor tracking

### AI & Backend
- **GLM Integration** — Structured extraction of scam type, amount, suspects, bank accounts
- **Recoverability Engine** — Dynamic score decay based on elapsed time
- **Role-Based Auth** — JWT authentication with victim and authority roles
- **Evidence Management** — File upload linked to case records

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **AI Model:** GLM (ZhipuAI)
- **Auth:** JWT via `jose` + `bcryptjs`
- **Styling:** Tailwind CSS 4
- **Animation:** Framer Motion
- **OCR:** Tesseract.js
- **PDF Parsing:** pdfjs-dist
- **Deployment:** Vercel

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or [Neon](https://neon.tech))

### 1. Clone the repository
```bash
git clone https://github.com/your-username/scambreaker.git
cd scambreaker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
GLM_API_KEY="your-glm-api-key"
GLM_MODEL="glm-5.1"
JWT_SECRET="your-jwt-secret"
```

### 4. Set up the database
```bash
npx prisma db push
npx prisma db seed
```

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📁 Project Structure

```
scambreaker/
├── prisma/              # Database schema & seed data
├── src/
│   ├── app/
│   │   ├── api/         # REST API routes (cases, chat, evidence)
│   │   ├── actions/     # Server actions (workflow, case management)
│   │   ├── authority/   # Authority dashboard pages
│   │   ├── victim/      # Victim portal pages
│   │   └── page.tsx     # Landing page
│   └── lib/             # Shared utilities (auth, prisma, AI engine)
└── public/              # Static assets
```

---

