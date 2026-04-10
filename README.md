SkillBridge AI 🧾
Status: 🏗️ Phase 2: Backend Infrastructure & Data Persistence (Day 6/25)

🎯 Project Vision
A voice-first, two-sided marketplace that converts colloquial spoken experience into professional skill profiles, connecting active workers to local job opportunities in real-time.

📊 Knowledge Base Status
Skill Taxonomy: 47 professional categories now hosted in MongoDB.

Industry Sectors: Agriculture, Trade Services, Hospitality, Logistics, Cleaning, Retail, and Landscaping.

Data Integrity: Migrated from Relational JSON to NoSQL Document Storage.

🛠️ Tech Stack (Full-Stack)
Frontend: React.js (Vite) + Tailwind CSS

Backend: Node.js + Express.js

Database: MongoDB (Local Instance)

Voice Logic: Web Speech API + Regex NLP Matcher

Testing: Hoppscotch / Postman

📁 System Architecture
/client: React frontend, voice interface, and professional profile dashboard.

/server: Node.js API, Mongoose models, and database connection logic.

📅 Progress Log
[x] Day 1-2: Environment setup and 47-category skill library design.

[x] Day 3-4: NLP & Voice Integration. Built real-time matching engine and voice-to-text pipeline.

[x] Day 5: UI/UX Prototype. Created professional dashboard with industry-specific color-coding and export features.

[x] Day 6: Backend Migration. Restructured project into Client/Server architecture. Connected MongoDB, designed Skill Schemas, and built the /api/skills REST endpoint.

🚀 Development Commands
Start Backend:

Bash
cd server && npx nodemon index.js
Start Frontend:

Bash
cd client && npm run dev