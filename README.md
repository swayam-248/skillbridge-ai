# SkillBridge AI 🌉
### The Rising Span • Skilled Labor Marketplace

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Compromise NLP](https://img.shields.io/badge/Compromise-NLP_14-FF6B6B?style=flat-square)](https://compromise.cool/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

> **"From Hands-On Labor to Verified Market Equity. Cross The Rising Span."**
> 
> SkillBridge AI is an Uber-style, two-sided marketplace designed to bridge practical tradespeople with recruiters. Workers turn raw spoken experience into certified trade credentials in seconds, while contractors and facility managers discover and book talent with live availability dispatch.

---

## 🏛️ Brand Identity: "The Rising Span"

The brand identity represents an architectural bridge constructed from ascending cantilever tiers:

```
          [ CROWN TIER 04 ]          ═══ Master Reputation & Verified Trust
             /═════════\
         ═══/           \═══         ─── TIER 03: Direct Radar Dispatch
        /                   \
    ═══/                     \═══    ─── TIER 02: NLP Synthesis & Root Matching
   /                             \
═══                               ═══─── TIER 01: Raw Spoken Daily Experience
─────────────────────────────────────────────────────────────────────────────
```

- **Royal Azure Steps (Left Tier Ladder):** Represents ground-level experience, dependability, and foundational craftsmanship.
- **Ascending Diagonal Cantilever Beam:** Slices upward through the tiers, symbolizing career elevation and income growth.
- **Radiant Cyan Slats (Right Tier Ladder):** Represents technology, verification, and liquidity in the modern talent market.
- **Leaping Bridge Arc Wordmark:** Soars over `BRIDGE` with a circular terminus, evoking continuous connection between worker and hirer.

---

## ✨ Core Pillars & Features

### 🎙️ 1. Precision AI Voice Studio & NLP Matching
- **Zero-Barrier Voice Onboarding:** Tradespeople speak naturally about their daily tools and tasks without typing or resume writing.
- **Entity-Aware Semantic Scoring:** Replaces naive keyword matching with an intelligent multi-layer semantic analyzer:
  - **Entity Discrimination:** Distinguishes core domain entities (e.g., `bathroom`, `pipe`, `wire`, `engine`) from common action verbs (`clean`, `fix`, `repair`). Saying *"I clean bathroom"* accurately maps to **Residential Cleaning** and **Sanitation**, completely filtering out false positives like painting or food preparation.
  - **Dynamic Synonyms:** Built-in semantic expansions (e.g., `bathroom` ↔ `restroom`, `washroom`, `toilet`; `plumbing` ↔ `pipes`, `leak`, `faucet`, `drain`).
  - **Trade Title Weighting:** Specialized trade titles receive relevance boosts so primary crafts rank at the top.
- **Dual Voice & Text Input:** Accessible across all devices with real-time speech synthesis and instant text extraction.

### ⚡ 2. Real-Time Radar Dispatch ("Uber for Labor")
- **One-Touch Availability Switch:** Workers flip their status **Online / Offline** with a live animated radar beacon.
- **Contractor Problem Matcher:** Recruiters type plain descriptions (*"Water leaking under kitchen sink"*) to instantly match certified plumbers.
- **Contact Card Lock:** Worker phone numbers and email addresses remain strictly protected and hidden until the worker accepts the booking.

### 🔐 3. Direct Email & Password Authentication
- **Fast, Secure Access:** Built with encrypted `bcryptjs` password hashing and 24-hour signed JSON Web Tokens (JWT).
- **Role-Aware Workspaces:** Seamless toggle between **Skilled Worker** (*portfolio & voice studio*) and **Recruiter** (*talent discovery & dispatch*).
- **One-Click Google OAuth:** Optional Google Sign-In with automated address-bar token sanitization.

### ⭐ 4. Verified Reputation & Escrow Feedback
- **Transparent 5-Star Reviews:** Unlocked upon job completion; aggregate ratings update dynamically in MongoDB Atlas.
- **Career Ascension Multipliers:** Track record metrics showing completed jobs, repeat clients, and market rank.

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Vite + React 19)                        │
├───────────────────────┬──────────────────────────────┬───────────────────────┤
│    LANDING PAGE (/)   │     WORKER WORKSPACE         │  RECRUITER WORKSPACE  │
│  • Rising Span Hero   │  • Voice Studio View         │  • Radar Problem Match│
│  • Equalizer Simulator│  • Skills Portfolio (4 Tiers)│  • Active Talent Pool │
│  • Blueprint FIG 1.0  │  • Booking Request Inbox     │  • Direct Bookings    │
│  • Trade Categories   │  • Verified Reviews History  │  • Job Postings Board │
└───────────────────────┴──────────────┬───────────────┴───────────────────────┘
                                       │ REST API (Bearer JWT)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       BACKEND (Node.js + Express 5)                          │
├──────────────────────┬───────────────────────────────┬───────────────────────┤
│   AUTH CONTROLLER    │      PROFILES & DISPATCH      │   BOOKINGS & REVIEWS  │
│  • /api/auth/register│  • /api/profiles              │  • /api/bookings      │
│  • /api/auth/login   │  • /api/profiles/:userId      │  • /api/bookings/:id  │
│  • /api/auth/google  │  • /api/skills (42 Standard)  │  • /api/reviews       │
└──────────────────────┴──────────────┬────────────────┴───────────────────────┘
                                       │ Mongoose ODM
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE (MongoDB Atlas)                            │
│    Collections: Users | Profiles | Skills (42) | Bookings | Reviews | Jobs   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS 3.4, Compromise NLP 14 |
| **Typography** | Plus Jakarta Sans & Outfit (Google Fonts) |
| **Backend** | Node.js 22, Express.js 5.2, Mongoose 9.4 |
| **Security** | bcryptjs, jsonwebtoken (JWT), CORS, Environment Isolation |
| **Database** | MongoDB Atlas (Cloud Cluster) |
| **Deployment** | Vercel (Monorepo static build + serverless function) |

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create worker or recruiter account with email & password |
| `POST` | `/api/auth/login` | Authenticate with email & password, returns JWT token |
| `GET` | `/api/auth/google` | Initiate Google OAuth 2.0 flow |
| `GET` | `/api/auth/google/callback` | Google OAuth redirect callback |

### Profiles & Talent Pool
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/profiles` | List verified workers with optional skill filter |
| `GET` | `/api/profiles/:userId` | Get complete worker dossier with ratings & reviews |
| `POST` | `/api/profiles` | Create or update worker profile (skills, bio, contact) |
| `PUT` | `/api/profiles/status` | Toggle worker availability (`isOnline: true/false`) |
| `GET` | `/api/skills` | Fetch all 42 standardized trade skill definitions |

### Bookings & Jobs
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/bookings` | Create direct booking request for a worker |
| `GET` | `/api/bookings` | Fetch user bookings (supports `pending/active/completed`) |
| `PUT` | `/api/bookings/:id/status`| Accept, reject, complete, or cancel a booking |
| `POST` | `/api/reviews` | Submit 1–5 star rating and comment for completed job |
| `GET` | `/api/jobs` | Browse active job postings board |
| `POST` | `/api/jobs` | Post new job opening (recruiter only) |

---

## 💻 Getting Started (Local Development)

This repository is configured as an **npm workspace monorepo**.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/swayam-248/skillbridge-ai.git
cd skillbridge-ai
npm install
```

### 2. Configure Environment Variables
Create a `Server/.env` file with the following variables:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/skillbridge
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Seed Standardized Trade Skills
Populate your MongoDB database with the 42 verified trade models:
```bash
npm run seed
```

### 4. Run Development Servers
Start both the Vite frontend and Express backend concurrently:
```bash
npm run dev
```
- **Landing Page & Web App:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000`
- **Health Check:** `http://localhost:5000/api/health`

---

## 🚀 Production Deployment (Vercel)

This project is optimized for unified monorepo deployment on **Vercel** (`vercel.json`):

1. **Import Repository:** Import `swayam-248/skillbridge-ai` in the [Vercel Dashboard](https://vercel.com/new).
2. **Build Settings:**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `Client/dist`
3. **Configure Environment Variables:**
   Add `MONGO_URI` and `JWT_SECRET` under **Project Settings → Environment Variables**.
4. **Deploy:**
   Every push to `main` triggers an automated deployment via Vercel Git Integration.

---

## 📄 License
This project is licensed under the [ISC License](LICENSE).