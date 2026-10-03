# SafirPass

## AI-Powered Smart Tourist Digital Identity, Safety & Incident Response System

SafirPass is a privacy-first digital identity and emergency response platform designed for international tourists. It helps travelers verify their identity, share only the information required by service providers, and trigger fast emergency assistance when needed.

The platform combines:
- digital identity verification
- consent-based selective disclosure
- emergency SOS reporting
- location-aware authority response dashboards
- secure, real-time tourist support workflows

---

## Overview

SafirPass gives tourists a safer alternative to handing over physical passports in hotels, transport hubs, rental agencies, and embassies. Instead of exposing full identity documents, the system verifies a tourist’s identity and shares only necessary attributes such as name, validity period, nationality, or stay details.

This project is built with Next.js, Neon Serverless Postgres, MongoDB Atlas, and a dedicated FastAPI Python ML service. It includes:
- authentication with Google OAuth and email-based sign in
- profile and KYC data management
- active-learning document authenticity ML model (Scikit-Learn)
- AWS Rekognition facial biometrics and live SNS emergency alerts
- AI-assisted Tourist Safety Drawer with real-time incident guidance
- QR-based selective disclosure flows
- consent request approval and denial handling
- SOS alert creation and command center tracking
- geofence and incident visibility

---

## Key Features

### AI & Machine Learning Intelligence
- **Active-Learning Document ML Pipeline**: Extracts visual and structural features (blur, entropy, contrast, edge density, aspect ratio) with a Scikit-learn RandomForest model
- **Authority Model Retraining**: Retrain document authenticity models on-demand directly from the Admin Portal using verified ground-truth datasets
- **Real-Time Upload Evaluation**: Immediate client-side feedback on image blur and resolution quality before document submission
- **Facial Biometric Matching**: Seamless integration with AWS Rekognition for facial comparison and liveness verification
- **Interactive Tourist Safety Assistant**: Instant floating AI drawer offering localized emergency advice, rapid embassy contacts, and safety protocols

### Tourist Experience
- Secure account creation and sign-in
- Digital identity verification workflow
- Passport and visa verification records
- Selective disclosure of personal details
- Offline-safe credential generation and QR sharing
- Emergency SOS trigger with geolocation

### Authority & Response Panels
- Dashboard for traveler, consent, and verification status
- Emergency command console for SOS triage
- Safety geofence visibility
- Real-time alert dispatch telemetry
- Active learning dataset statistics and ML model inspector

### Privacy & Security
- Attribute-based sharing instead of raw passport exposure
- Session management with JWT and HTTP-only cookies
- Google OAuth integration
- Parameterized SQL protection via Neon Serverless Postgres
- Dual-layer storage with MongoDB Atlas Document Vault
- Minimal data sharing by default

---

## Tech Stack

- **Frontend & App Framework**: Next.js 16 (Turbopack, App Router), React 19, Tailwind CSS
- **Databases**: Neon Serverless Postgres (`@neondatabase/serverless`), MongoDB Atlas (`mongoose`)
- **Python ML Microservice**: FastAPI, Uvicorn, Scikit-learn, NumPy, Pillow, Pytest
- **Cloud & AI Services**: AWS Rekognition, AWS SNS, Cloudinary
- **Security & Identity**: Google OAuth 2.0, Web Crypto API for JWT signing, SHA-256 password hashing
- **Export & Barcodes**: `html-to-image`, `jspdf`, `qrcode`, `jsbarcode`

---

## Project Structure

```bash
safir_pass/
├── app/
│   ├── api/
│   │   ├── admin/documents/dataset/  # ML active learning dataset routes
│   │   ├── assistant/                # Safety assistant chat route
│   │   ├── fastapi/[...path]/        # FastAPI reverse proxy route
│   │   ├── kyc/                      # Document & biometric verification
│   │   └── ...
│   ├── admin/                        # Admin dashboard & model retraining
│   ├── dashboard/                    # Tourist verification, ID & SOS
│   └── ...
├── components/
│   ├── SafetyAssistantDrawer.jsx     # Floating AI safety assistant
│   └── ...
├── lib/
│   ├── db/
│   │   ├── postgres.js               # Neon PostgreSQL client
│   │   └── mongoose.js               # MongoDB Mongoose models
│   ├── fastapi.js                    # FastAPI client integration
│   └── password.js                   # Secure password utilities
├── python-services/                  # Python FastAPI & ML microservice
│   ├── app/
│   │   ├── document_ml.py            # Active learning document model
│   │   ├── integrations.py          # AWS Rekognition & SNS
│   │   ├── main.py                  # FastAPI application entry
│   │   └── ...
│   └── tests/                        # FastAPI test suite
├── database/
│   └── neon_schema.sql
├── package.json
└── README.md
```

---

## Prerequisites

Before you start, make sure you have:

- Node.js 20 or newer
- npm 10 or newer
- Git
- A Neon Serverless Postgres project (or PostgreSQL database)
- A MongoDB Atlas database
- A Google Cloud project with OAuth credentials

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/safir_pass.git
cd safir_pass
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill the values:

```bash
copy .env.example .env.local
```

Then update the file with your values:

```env
DATABASE_URL="postgresql://username:password@ep-example-123.us-east-2.aws.neon.tech/neondb?sslmode=require"
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/SafirPass?retryWrites=true&w=majority"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
JWT_SECRET="your-long-random-secret"
```

### 4. Create your PostgreSQL database

In Neon Console SQL Editor, run the SQL from:

```bash
database/neon_schema.sql
```

This creates:
- profiles
- kyc_applications
- consent_requests
- sos_alerts
- geofences

### 5. Set up Google OAuth

In Google Cloud Console:
1. Create or select a project.
2. Enable Google Identity / OAuth.
3. Create an OAuth client ID.
4. Add authorized redirect URI:
   - http://localhost:3000/api/auth/callback/google
5. Copy the client ID and secret into your `.env.local` file.

---

## Run the App

### Development mode

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Production build

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

---

## Useful Commands

```bash
# install dependencies
npm install

# run development server
npm run dev

# build for production
npm run build

# run production server
npm run start

# lint project
npm run lint

# create a new branch
git checkout -b feature/my-change

# check git status
git status

# add files
git add .

# commit changes
git commit -m "Add feature name"

# push branch
git push origin feature/my-change
```

---

## How to Contribute

We welcome contributions from developers, designers, testers, and community members.

### 1. Fork the repository

```bash
git fork https://github.com/<your-username>/safir_pass.git
```

Or create a fork from GitHub UI and then clone it locally.

### 2. Create a branch

```bash
git checkout -b feature/your-feature-name
```

Use a clear branch name such as:
- feature/google-auth-improvement
- fix/sos-dashboard-bug
- chore/update-readme
- docs/setup-guide

### 3. Make changes

- Keep code clear and readable
- Follow existing project patterns
- Avoid breaking the app structure
- Update documentation when changing setup or workflows

### 4. Validate locally

Run the relevant checks before opening a PR:

```bash
npm install
npm run lint
npm run build
```

### 5. Commit your work

```bash
git add .
git commit -m "feat: add tourist verification workflow"
```

Use commit messages that are clear and conventional, for example:
- feat: add new dashboard section
- fix: correct auth redirect issue
- docs: improve contributor setup guide
- chore: update dependency versions

### 6. Push and open a PR

```bash
git push origin feature/your-feature-name
```

Then open a pull request on GitHub and include:
- what changed
- why it was needed
- validation performed
- any screenshots if UI changed

---

## Contribution Guidelines

- Keep changes focused and small
- Prefer clear, maintainable code
- Add comments only when they improve clarity
- Test your work before submitting
- Respect the project’s privacy-first security standards
- Do not expose secrets, API keys, or credentials in commits

---

## Environment Security

Never commit:
- .env.local files
- production API secrets
- Supabase service role keys
- OAuth client secrets

Use `.env.local` for local development only and keep all secrets in a secure environment.

---

## Support

If you have questions or need help with setup, open an issue or contact the maintainer.

---

## Summary

SafirPass is a modern safety and identity platform built for travelers, authorities, and service providers. It reduces risk, protects personal information, and improves emergency response through a secure, privacy-first digital ecosystem.

We welcome contributors who want to improve the experience, strengthen the platform, and help scale a safer travel ecosystem.
