# SkillBridge AI 🚀
**The "Uber for Skilled Labor": Bridging the gap between manual experience and professional opportunities.**

SkillBridge AI is a premium, two-sided marketplace designed to help workers translate manual labor experience into professional titles using AI-driven voice registration, and allow recruiters to book active talent in real-time.

## 🏗️ Technical Architecture (The Marketplace Pivot)

### **1. Real-Time Booking Engine (The "Uber" Logic)**
- **Live Availability:** Workers control their visibility using a sleek "Go Online" toggle. Recruiters can only discover and book workers who are actively marked as online.
- **Transactional Lifecycle:** Robust backend tracking of job states (`Pending` -> `Accepted` -> `Completed` -> `Cancelled`).
- **Privacy First:** A worker's contact information (email and phone number) is securely hidden from the recruiter until the worker explicitly clicks "Accept Job".

### **2. Security & Access Control**
- **Passwordless Auth:** Secure OTP-based email verification using Nodemailer and JSON Web Tokens (JWT).
- **Role-Based Access Control (RBAC):** Dedicated middlewares (`protectWorker`, `protectRecruiter`, `protectAny`) strictly enforce API access based on the user's role.
- **Dedicated Dashboards:** Cleanly separated React Router routes (`/dashboard`) that adapt functionality entirely based on user role.

### **3. Reputation System**
- **Ratings & Reviews:** After a job is marked "Completed" by the recruiter, they can leave a 1-5 star review and comment.
- **Automated Aggregation:** The backend automatically calculates and updates the worker's average rating on their public profile with every new review.

### **4. Premium "Antigravity" UI/UX**
- **Dark Mode Native:** A stunning, premium dark theme featuring radial gradients, neon glows, and glassmorphism panels (`backdrop-blur-3xl`).
- **Voice Integration:** Workers can build their profile entirely hands-free using Speech-to-Text APIs, which map raw descriptions to professional titles.
- **Micro-Animations:** Fluid layout transitions, pulsing status indicators, and interactive gradient buttons built entirely with Tailwind CSS.

## ✅ Completed Milestones
- [x] **Authentication:** Passwordless OTP email verification.
- [x] **Authorization:** Role-specific permissions and JWT security.
- [x] **Voice AI:** Real-time speech-to-text NLP processing.
- [x] **Marketplace Discovery:** Live filtering of active workers in the Talent Pool.
- [x] **Booking System:** Complete end-to-end job requests and contact reveals.
- [x] **Reputation:** Post-job 5-star rating system.
- [x] **UI/UX:** Complete Antigravity dark mode overhaul.

## 🛠️ Tech Stack
- **Frontend:** React.js, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Security:** JSON Web Tokens (JWT), Bcrypt, Nodemailer

---

## 🚀 Upcoming Roadmap
- **Real-Time WebSockets:** Upgrading the booking engine from HTTP fetching to Socket.io for millisecond-level instant notifications.
- **Payment Gateway:** Integrating Stripe Connect to handle secure payouts between recruiters and workers.
- **GPS Integration:** Showing recruiter-worker distance using geolocation APIs.