# MASTER PRODUCT REQUIREMENT DOCUMENT (PRD) & SYSTEM ARCHITECTURE
**Project Name:** Exam Prep Battle (Gamified SaaS Platform)  
**Target Audience:** Competitive Exam Aspirants (JEE, NEET, UPSC, SSC, CUET, Bank PO)  
**Platform Theme:** Dark Mode Glassmorphism, Gamified Esports-Style Battles, AI Adaptive Learning  
**Core Technologies:** React 18, Vite, TypeScript, Express.js, Supabase PostgreSQL, Groq Llama-3 AI Engine  

---

## 1. Executive Summary & Vision

The **"Exam Prep Battle"** platform transforms dry, stressful exam preparation into an engaging, addictive, esports-style multiplayer experience. By combining real-time competitive quiz battles with cutting-edge AI diagnostic tools and a robust gamified monetization economy, the platform ensures that students maintain daily study streaks, master difficult concepts through spaced repetition, and compete on global leaderboards.

---

## 2. Product Objectives & Core Goals

1. **Gamified PvP Battles:** Enable students to challenge peers or AI bots in real-time, time-bound MCQs across specific subjects, topics, and chapters.
2. **AI-Driven Diagnostics & Adaptive Difficulty:** Leverage Groq Llama-3 AI to analyze post-battle performance, dynamically calibrate question difficulty (ELO-style), and deliver viral Hinglish meme roasts alongside actionable shortcut tricks.
3. **Comprehensive AI Study Assistant:** Provide an autonomous study synthesis engine that converts any topic text or PYQ PDF into structured summary notes, mnemonics, formula sheets, spaced-repetition flashcards, and rapid-recall quizzes.
4. **SaaS Monetization & Gamified Economy:** Implement a freemium model powered by dual currencies (Chappy Coins & Gems), Premium Battle Passes, Pro/Elite subscription tiers, mystery boxes, and a Study Squad referral network.
5. **Decoupled Admin Command Center:** Equip administrators with an uncluttered overview dashboard, dedicated test creation & PYQ PDF ingestion tools (`ManageTests`), and comprehensive student account & wallet monitoring (`ManageStudents`).

---

## 3. Target User Personas

### Persona A: The Competitive Aspirant (Student)
- **Profile:** 17-22 years old, preparing for high-stakes exams (JEE, NEET, UPSC, SSC).
- **Pain Points:** Lack of motivation, exam anxiety, boring static textbooks, difficulty identifying conceptual blind spots.
- **Goals:** Maintain daily study streaks, practice under real exam time pressure, get instant shortcut tricks for wrong answers.

### Persona B: The Curriculum Administrator (Admin)
- **Profile:** Coaching institute faculty or content manager.
- **Pain Points:** Tedious manual question creation, difficulty managing large student batches, lack of proctoring during online tests.
- **Goals:** Upload Previous Year Question (PYQ) PDFs for instant AI test generation, monitor live student cheating metrics (tab switching, fullscreen exits), track student subscription tiers.

---

## 4. Key Platform Features & Capabilities

### 4.1 Gamified Battle Arena (`BattleArena.tsx`, `BattleAnalysis.tsx`)
- **Real-Time Matchmaking:** Connects players based on selected subject, topic, and chapter.
- **AI Audio Host:** Text-to-speech voice commentary announcing battle start, round progression, and results.
- **Post-Battle Weakness Mapping:** Detailed question-by-question breakdown comparing player vs opponent picks, highlighting exact conceptual gaps.
- **AI Explanation & Shortcuts:** On-demand Groq Llama-3 explanations providing 10-second shortcut tricks for incorrect answers.

### 4.2 AI Adaptive Difficulty & Meme Roast Engine (`aiService.ts`, `BattleAnalysis.tsx`)
- **Dynamic Difficulty Calibration (ELO-Style):** 4 tiers (`Easy`, `Medium`, `Hard`, `Expert`).
  - **Promotion:** Answering 3 questions correctly & rapidly (<30s) automatically scales up next match difficulty.
  - **Demotion / Safety Valve:** Struggling with <50% accuracy slightly reduces difficulty to maintain balanced gameplay aur frustration prevent karna.
- **Viral Post-Battle Meme Roast:** Groq Llama-3 AI analyzes battle mistakes aur student-friendly Hinglish meme roasts generate karta hai (e.g., *"Bhai calculator bhi confuse ho gaya 😭"*, *"Lagta hai quadratic equations ne revenge le liya 💀"*).
- **Structured Post-Match Output:**
  1. New Difficulty Level
  2. Performance Analysis
  3. Weak Topics Mapping
  4. Suggested Practice & Shortcuts
  5. Funny Meme Roast
  6. High-Energy Motivational Line

### 4.3 AI Study Assistant (`StudyAssistant.tsx`, `aiService.ts`)
- **Multi-Modal Synthesis Engine:** Accepts topic names or raw text/chapter excerpts and generates a 6-part structured JSON curriculum:
  1. `summary_notes` (Smart bullet points)
  2. `key_concepts` (Memory tricks / mnemonics ke saath)
  3. `formula_sheet` (Equation, variables, SI units)
  4. `flashcards` (`[Easy] / [Medium] / [Hard]` difficulty tags)
  5. `rapid_quiz` (5 quick recall questions)
  6. `student_mistakes` (Common exam traps aur unke corrections)
- **Interactive UI:** Flip-cards for flashcards, tabbed navigation, and instant JSON-based rendering.

### 4.4 SaaS Monetization & Rewards Economy (`StoreRewards.tsx`, `saasService.ts`)
- **Dual Virtual Currencies:** 
  - **Chappy Coins (🟡):** Earned via daily logins, winning battles, and completing streaks. Used for mock test unlocks and tournament entries.
  - **Gems (💎):** Premium currency purchased via micro-transactions. Used for streak freezes, AI pro features, and premium battle passes.
- **Premium Subscription Tiers:** `Challenger (Free)`, `Pro Student (₹199/mo)`, `Elite Champion (₹499/mo)`. Unlocks unlimited AI study notes, ad-free gaming, and 2x coin multipliers.
- **Study Squad Referral Network:** Unique 6-digit referral codes rewarding both referrer and referee with +500 Coins & +10 Gems instantly upon match completion.

### 4.5 Decoupled Admin Command Center (`AdminDashboard.tsx`, `ManageTests.tsx`, `ManageStudents.tsx`)
- **Overview Dashboard (`/admin`):** 4 top-level Stat Cards (Total Tests, Registered Students, Battle Attempts, Live Proctoring Active Stream) with recent activity summary tables.
- **Dedicated Test Management (`/admin/tests`):** Self-contained command center for creating mock tests, auto-generating AI question banks from PYQ PDFs, and bulk uploading CSV/TSV/TXT question banks.
- **Dedicated Student Management (`/admin/students`):** Comprehensive table for searching students by name/email, monitoring their wallet balances (Coins/Gems), tracking active streaks, and managing subscription tiers.

---

## 5. End-to-End User Workflows

```
┌────────────────────────────────────────────────────────┐
│                   LOGIN / REGISTRATION                 │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│      STUDENT DASHBOARD (STREAK, COINS, GEMS WALLET)    │
└──────┬────────────────────┬─────────────────────┬──────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌──────────────┐    ┌──────────────┐     ┌───────────────┐
│ BATTLE ARENA │    │ AI STUDY AST │     │ STORE & REWRD │
└──────┬───────┘    └──────┬───────┘     └───────┬───────┘
       │                   │                     │
       ▼                   ▼                     ▼
┌──────────────┐    ┌──────────────┐     ┌───────────────┐
│ Matchmaking  │    │ Topic Input  │     │ Subscribe Pro │
│ AI Audio Host│    │ 6-Part JSON  │     │ Upgrade Pass  │
│ Answer MCQs  │    │ Flashcards   │     │ Claim Daily   │
└──────┬───────┘    └──────────────┘     └───────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│     POST-BATTLE ANALYSIS & AI ADAPTIVE MEME ROAST      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          LEADERBOARD RANK UP & COIN REWARDS            │
└────────────────────────────────────────────────────────┘
```

---

## 6. Technical Architecture & Hybrid Storage System

### 6.1 Technology Stack
- **Frontend:** React 18, Vite, TypeScript, Zustand (State Management), Lucide React (Icons), Vanilla CSS + Glassmorphism UI Design.
- **Backend:** Node.js, Express.js, TypeScript, Supabase JS Client, Socket.io (Real-time Battles).
- **AI & LLM:** Groq API (`llama-3.3-70b-versatile` / `llama-3-8b`) for ultra-fast, structured JSON generation.

### 6.2 Hybrid Storage Architecture (100% Crash-Proof Fallback)
To ensure the platform operates flawlessly in production environments even before database migrations are fully executed, a hybrid fallback layer is implemented:
- **Primary Storage:** Supabase PostgreSQL Cloud Database.
- **Secondary Fallback (`saas_profiles.json`):** If cloud Supabase queries for monetization columns (`coins`, `gems`, `plan`, `battle_pass`) throw schema errors (e.g., PostgreSQL error `42703`), the backend service (`saasService.ts`) automatically intercepts the failure and falls back to a local persistent JSON file. This guarantees zero application downtime.

---

## 7. Database Schema (Supabase PostgreSQL)

### `users`
```sql
id UUID PRIMARY KEY
name TEXT
email TEXT
password TEXT
role TEXT DEFAULT 'student'
points INT DEFAULT 0
streak INT DEFAULT 0
rank TEXT DEFAULT 'Bronze'
created_at TIMESTAMP

-- MONETIZATION & SAAS COLUMNS (Managed via Hybrid Architecture)
coins INT DEFAULT 500
gems INT DEFAULT 20
plan TEXT DEFAULT 'Challenger'
battle_pass TEXT DEFAULT 'Free'
last_claim_date TEXT
referral_code TEXT
referred_by TEXT
mock_purchases JSONB DEFAULT '[]'::jsonb
tournament_entries JSONB DEFAULT '[]'::jsonb
```

### `battles`
```sql
id UUID PRIMARY KEY
player1 UUID
player2 UUID
subject TEXT
topic TEXT
winner UUID
score1 INT
score2 INT
created_at TIMESTAMP
```

### `questions`
```sql
id UUID PRIMARY KEY
test_id UUID -- Foreign key linking to tests table
subject TEXT
topic TEXT
question TEXT
option_a TEXT
option_b TEXT
option_c TEXT
option_d TEXT
correct_answer TEXT
difficulty TEXT DEFAULT 'Medium'
```

### `tests`
```sql
id UUID PRIMARY KEY
title TEXT
duration INT DEFAULT 30
marks_per_question INT DEFAULT 1
negative_mark INT DEFAULT 0
assigned_to JSONB DEFAULT '[]'::jsonb
created_at TIMESTAMP
```

---

## 8. Complete API Routing Layer

### Authentication (`/api/auth`)
- `POST /login` - User login & JWT issuance
- `POST /register` - User signup

### SaaS & Monetization (`/api/saas`)
- `GET /profile` - Get user SaaS profile (Coins, Gems, Plan, Pass, Streak)
- `GET /referral` - Get unique referral code
- `POST /subscribe` - Subscribe to Pro/Elite plans
- `POST /battle-pass` - Upgrade Battle Pass to Premium
- `POST /claim-daily` - Claim daily login streak & mystery box
- `POST /buy-gems` - Purchase Gem packs (Starter, Popular, Pro, Mega)
- `POST /buy-mock` - Unlock branded mock test series
- `POST /enter-tournament` - Register for mega weekend tournaments
- `POST /watch-ad` - Watch rewarded ad for coins/streak freeze
- `POST /apply-referral` - Apply friend's invite code

### AI Engine (`/api/ai`)
- `POST /ai/generate-questions` - Generate AI Masterpiece MCQs
- `POST /ai/explain` - Generate AI Explanations & 10-second shortcut tricks
- `POST /ai/generate-notes` - Generate AI Smart Notes, Mnemonics & Flashcards
- `POST /ai/battle-roast` - Generate AI Adaptive Difficulty Calibration & Meme Roast

### Admin Control (`/api/admin`)
- `GET /admin/tests` - Fetch all mock tests
- `GET /admin/results` - Fetch student battle attempts and proctoring logs
- `GET /admin/students` - Fetch registered student accounts and wallet balances
- `POST /admin/tests` - Create a new mock test
- `PUT /admin/tests/:id` - Update test configuration
- `DELETE /admin/tests/:id` - Delete test and associated questions
- `GET /admin/questions/:testId` - Fetch questions for a specific test
- `POST /admin/questions` - Add a single question
- `PUT /admin/questions/:id` - Update a single question
- `DELETE /admin/questions/:id` - Delete a single question
- `POST /admin/questions/bulk` - Bulk insert questions from CSV/TSV/TXT
- `POST /admin/ai/generate-questions` - Auto-generate test questions from PYQ PDF context

---

## 9. Future Roadmap (Phase 4 & Beyond)
- **B2B White-Labeling Portal:** Private arena dashboards coaching institutes (Allen, PW, FIITJEE) aur schools ke internal weekly tests ke liye.
- **AI Mock Interviewer & Viva Vocé Bot:** Voice-based AI interviewer for campus placements aur UPSC viva preparation.
- **Physical Smart Study Gear:** Branded notebooks aur flashcards with QR codes launching instant customized battle arenas.

---

## 10. Success Metrics
- **Daily Active Users (DAU) & Streak Retention:** Percentage of users maintaining >7 day streaks.
- **ARPU (Average Revenue Per User):** Blended conversion across Pro subscriptions aur Gem micro-transactions.
- **Viral Coefficient (K-factor):** Number of new user registrations driven per existing user via Study Squad referral codes.
- **Student Win Rate & Accuracy:** Improvement in test scores post AI weakness mapping.