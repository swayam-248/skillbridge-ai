# 🛰️ SkillBridge AI
> **"Turning spoken experience into professional opportunity."**

**Status:** 🏗️ Phase 2: Backend Infrastructure & Data Persistence  
**Timeline:** Day 6 of 25  
**Current Sprint:** Transitioning from Prototype to Data-Driven System

---

### 🎯 Project Vision
A voice-first, two-sided marketplace designed to bridge the gap between colloquial work experience and formal industry standards. We empower informal workers by converting their spoken history into a verifiable, professional skill profile.

---

### 📊 Knowledge Base & Data Integrity
* **Skill Taxonomy:** 47 professional categories now fully migrated to **MongoDB**.
* **Industry Domains:** * `Agriculture`, `Trade Services`, `Hospitality`, `Logistics & Transport`
    * `Cleaning Services`, `Retail`, `Landscaping`
* **Storage Architecture:** Transitioned from static JSON files to **Mongoose Schemas** (NoSQL) for high-speed relational queries.

---

### 🛠️ Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | React (Vite) + Tailwind CSS |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB (Local Instance) |
| **Voice/NLP** | Web Speech API + Pattern Matching Engine |
| **DevOps** | Hoppscotch, Nodemon, Git |

---

### 📂 System Architecture
```bash
skillbridge-ai/
├── client/          # UI: Voice interface & Professional dashboard
└── server/          # API: Mongoose models, Express routes, DB logic