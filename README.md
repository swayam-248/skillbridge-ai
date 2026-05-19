# SkillBridge AI 🚀
**The "Uber for Skilled Labor": Bridging the gap between manual experience and professional opportunities.**

SkillBridge AI is a premium, two-sided marketplace designed to help workers translate manual labor experience into professional titles using AI-driven voice registration, and allow recruiters to book active talent in real-time.

## 🏗️ Technical Architecture (The Marketplace Pivot)

### **1. AI-Powered Voice Registration (The "Antigravity" Input)**
- **Intelligent NLP matching:** Uses the `compromise` NLP library to perform root-word stemming. The system intelligently connects variations like "plumber," "plumbing," and "plumb" to the correct professional category.
- **Hands-Free Onboarding:** Workers can build their profile entirely by speaking. A live transcript provides real-time feedback, showing exactly what the AI is hearing.
- **Inclusive Search:** The Talent Pool now features a unified discovery engine that lists all registered workers, providing visibility even to those who have not yet completed their full profile.

### **2. High-Performance Login Flow**
- **Zero-Wait Authentication:** OTP verification now includes an optimized "Direct Login" system. For existing users, the server returns the full profile data immediately, skipping unnecessary network requests and bypassing the onboarding screen entirely.
- **Data Normalization:** Robust input cleaning (trimming/lowercasing) on both client and server prevents common authentication failures caused by whitespace or case sensitivity.

### **3. Real-Time Booking Engine (The "Uber" Logic)**
- **Live Availability:** Workers control their visibility using a sleek "Go Online" toggle (powered by Mongoose Upserts to handle dynamic profile creation).
- **Transactional Lifecycle:** Robust backend tracking of job states (`Pending` -> `Accepted` -> `Completed` -> `Cancelled`).
- **Privacy First:** A worker's contact information (email and phone number) is securely hidden from the recruiter until the worker explicitly clicks "Accept Job".

### **4. Reputation & Trust System**
- **Ratings & Reviews:** After a job is marked "Completed," recruiters can leave 1-5 star reviews.
- **Automated Aggregation:** The backend automatically calculates average ratings in real-time, updating the worker's reputation instantly.

## ✅ Recent Technical Wins

### 🛠️ Core Infrastructure & Stability
- **Monorepo Architecture:** Set up **npm workspaces** to allow single-command dependencies installation (`npm install`) and execution. Exposed root scripts (`npm run dev`, `npm run build`, `npm start`, `npm run seed`) for seamless project management.
- **Express 5 Support:** Refactored routing wildcards to RegExp patterns (`app.get(/.*/)`) to ensure full compatibility with the Express 5 router and prevent backend crashes.
- **Backend Detail Fetching:** Implemented the missing `GET /api/profiles/:userId` endpoint so worker details load correctly in the talent pool.
- **Dynamic Path Seeding:** Configured `importData.js` with `path.join(__dirname, ...)` so developers can run database migrations from any directory in the monorepo.
- **Mongoose Mapping Safety:** Added type and array validation in the profile POST route to safeguard skills parsing and prevent schema-related Node crashes.

### 🎨 Premium Frontend & UX Improvements
- **Animated Soundwave Feedback:** Created an animated wave component (`Soundwave.jsx`) using CSS keyframes that modulates gradient lines in real-time when voice recording is active.
- **Shimmering Skeleton Loaders:** Replaced generic full-page loading spinners with shimmering CSS placeholders (`SkeletonCard.jsx` and `SkeletonGrid`) that load cards resembling matching worker profiles.
- **Split 6-Digit OTP Field:** Replaced standard text inputs with an autofocus-advancing row of 6 inputs in the Login screen. It automatically jumps fields on input, tracks backspace keys to shift focus backward, and supports paste events for 6-digit codes.
- **Storage Synchronization:** Fixed storage calls in `ProfileDetails.jsx` to load JWT tokens from `sessionStorage` (synchronizing with `AuthContext.jsx`) and resolved authorization header errors.

## 🛠️ Tech Stack
- **Frontend:** React.js (Vite), Tailwind CSS, Vanilla CSS Animations
- **Backend:** Node.js, Express.js (Express 5 compatible)
- **Database:** MongoDB (Mongoose)
- **NLP:** Compromise.js (Smart root-word stemming)
- **Security:** JSON Web Tokens (JWT), Nodemailer (OTP)

---

## 💻 Getting Started (Local Development)

This project uses **npm workspaces** to manage the full stack within a single monorepo.

1. **Install dependencies for the entire project:**
   ```bash
   npm install
   ```
2. **Seed the database with NLP skills:**
   Make sure MongoDB is running on your PC, then run:
   ```bash
   npm run seed
   ```
3. **Run both frontend and backend concurrently:**
   ```bash
   npm run dev
   ```
   * Frontend: `http://localhost:5173`
   * Backend: `http://localhost:5000`

---

## 🚀 Deployment

The project is pre-configured for a **unified deployment** where the backend serves the built React frontend static assets, eliminating CORS issues.

* **Build Command:** `npm run build`
* **Start Command:** `npm start`

For detailed setup instructions on Render, Vercel, or Railway, check the [Deployment Guide](file:///C:/Users/sahor/.gemini/antigravity/brain/cd9f5d4d-9bb4-47a6-9090-2de4bfe1ac92/artifacts/deployment_guide.md).