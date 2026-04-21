# SkillBridge AI 🚀

An AI-powered recruitment platform bridging the gap between manual experience and professional titles.

## 🏗️ Technical Architecture (Updated Day 11)

### Frontend (React + Vite)
- **State Management:** React Context API (`AuthContext`) for global user state.
- **Authentication:** Passwordless OTP (Email-based) using Nodemailer.
- **Persistence:** JWT stored in `localStorage` for seamless sessions.
- **Routing:** Protected routes using `react-router-dom`.

### Backend (Node.js + Express)
- **Database:** MongoDB (Mongoose) storing Users and OTPs.
- **Security:** JWT (JSON Web Tokens) and CORS configuration.
- **Communication:** Axios-driven requests between Client and Server.

## ✅ Completed Milestones
- [x] Backend OTP Logic & MongoDB Integration
- [x] JWT Token generation and verification
- [x] Frontend AuthProvider (Context API)
- [x] Role-based UI (Recruiter vs. Worker views)
- [x] Functional Logout and Session Persistence