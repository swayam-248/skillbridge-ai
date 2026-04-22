# SkillBridge AI 🚀
**Bridging the gap between manual experience and professional titles.**

SkillBridge AI is a full-stack platform designed to help workers translate manual labor experience into professional, industry-recognized titles using AI-driven matching and a secure recruitment marketplace.

## 🏗️ Technical Architecture (Day 12 Update)

### **1. Security & Access Control**
- **Role-Based Access Control (RBAC):** Implemented backend middleware (`protectRecruiter`) that validates JWT tokens and restricts sensitive data access to specific user roles.
- **Protected Frontend Routes:** Developed a high-order component (HOC) to shield routes like `/profiles`, redirecting unauthorized users back to the dashboard.
- **Defensive Rendering:** Implemented "bulletproof" UI logic using optional chaining (`?.`) and array verification to prevent application crashes during asynchronous data loading.

### **2. Database & API Integration**
- **Relational Data Mapping:** Utilized Mongoose `.populate()` to link the `Profile` collection with the `User` collection, allowing for a unified view of professional data and account credentials.
- **State Synchronization:** Integrated React Context API with LocalStorage to maintain a "persistent session," allowing users to stay logged in across page refreshes.
- **RESTful Design:** Standardized API endpoints for both fetching (`GET`) and updating (`POST`) professional profiles.

### **3. UI/UX with Antigravity**
- **Dynamic Mode Switching:** A smart toggle system that adjusts the interface based on the logged-in user's role (Recruiter vs. Worker).
- **Real-time Filtering:** A frontend search engine that filters the Talent Pool by name or professional title without additional server pings.

## ✅ Completed Milestones
- [x] **Authentication:** Passwordless OTP email verification.
- [x] **Authorization:** Role-specific permissions and JWT security.
- [x] **Marketplace:** A live, searchable Talent Pool pulling from MongoDB.
- [x] **Stability:** Eliminated "White Screen" errors via defensive state management.

## 🛠️ Tech Stack
- **Frontend:** React.js, Vite, Antigravity UI, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Security:** JSON Web Tokens (JWT), Bcrypt

---

## 🚀 Upcoming for Day 13
- **AI Matching Engine:** Developing logic to match worker skills to job descriptions.
- **Detailed Profile Views:** Expanding cards to show full career histories.
- **Contact System:** Connecting recruiters and workers via secure messaging.