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
- [x] **NLP Upgrade:** Switched to `compromise` for smarter skill matching and root-word recognition.
- [x] **Navigation Speed:** Implemented account-age-based onboarding skips to allow existing users to "login directly."
- [x] **Recruiter Permissions:** Fixed a critical RBAC bug that was preventing recruiters from saving profiles.
- [x] **Database Optimization:** Optimized `/api/profiles` with a "User-First" aggregation to ensure the talent pool is never empty.
- [x] **UI Polish:** Redesigned the Talent Pool with a high-end glassmorphism aesthetic and fixed data structure mismatches.

## 🛠️ Tech Stack
- **Frontend:** React.js (Vite), Tailwind CSS, Framer Motion (for animations)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **NLP:** Compromise.js
- **Security:** JSON Web Tokens (JWT), Nodemailer (OTP)

---

## 🚀 Upcoming Roadmap
- **Real-Time WebSockets:** Upgrading the booking engine from HTTP fetching to Socket.io for millisecond-level instant notifications.
- **Payment Gateway:** Integrating Stripe Connect to handle secure payouts between recruiters and workers.
- **GPS Integration:** Showing recruiter-worker distance using geolocation APIs.