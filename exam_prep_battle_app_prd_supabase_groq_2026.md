# Exam Prep Battle App – Product Requirements Document (PRD)

## Product Name
**Exam Prep Battle**

Tagline:
**"Study ko game banao."**

---

# 1. Overview

Exam Prep Battle ek gamified learning platform hoga jahan students quiz battles ke through padhai karenge.

Students:
- Friends ke saath compete kar sakte hain
- Random players ke saath battle kar sakte hain
- Daily streak maintain kar sakte hain
- AI se questions generate kar sakte hain
- Leaderboard pe rank dekh sakte hain

Goal:
Padhai ko engaging aur competitive banana.

---

# 2. Problem Statement

Current problems:

- Students consistency lose kar dete hain
- Quiz apps boring feel hoti hain
- Competitive learning experience missing hai
- Topic-wise practice difficult hai
- Motivation low ho jati hai

---

# 3. Solution

Ek real-time battle system:

Example:

Nitish vs Rahul

Topic: Quadratic Equations
Questions: 10
Time: 5 min

Score:
Nitish → 8
Rahul → 6

Winner:
+50 points
+streak increase
+badge

---

# 4. Target Users

Primary:

- School students
- College students
- Competitive exam aspirants

Secondary:

- Teachers
- Coaching institutes

---

# 5. User Roles

### Student

Can:

- Login
- Start battles
- Join battles
- Generate AI quizzes
- View rankings
- Maintain streaks

### Teacher (Future)

Can:

- Create tournaments
- Create question banks
- Track student progress

---

# 6. Core Features (MVP)

## Authentication

Use:

Supabase Auth

Methods:

- Google Login
- Email Login
- OTP Login

---

## Dashboard

Show:

- Current streak
- Points
- Today's challenge
- Recent battles
- Rank

---

## Quiz Battle

Modes:

1. Friend battle
2. Random battle
3. Group battle

Battle flow:

Create room → Join → Timer start → Questions → Result

---

## AI Question Generator

User:

Subject: Math
Topic: Quadratic Equation
Difficulty: Medium

AI generates:

- MCQ questions
- Options
- Correct answers
- Explanations

AI Provider:

Groq API

Models:

- Llama
- DeepSeek
- Mixtral

Prompt example:

Generate 10 MCQ questions on Quadratic Equations for class 10 with four options and answer key.

---

## Leaderboard

Types:

- Daily
- Weekly
- Global
- College

---

## Streak System

Examples:

7 days → Bronze
30 days → Silver
100 days → Gold

---

## Analytics

Show:

- Accuracy
- Weak topics
- Average response time
- Win ratio

---

# 7. User Flow

Login
↓
Dashboard
↓
Select Subject
↓
Select Topic
↓
Choose Battle Mode
↓
Start Quiz
↓
Result Screen
↓
Leaderboard

---

# 8. Tech Stack

Frontend:

- React
- MUI
- React Router

Backend:

- Node.js
- Express

Realtime:

- Supabase Realtime

Database:

- Supabase PostgreSQL

AI:

- Groq API

Hosting:

Frontend:
- Vercel

Backend:
- Render

Database:
- Supabase Cloud

---

# 9. Database Schema (Supabase)

## users

```sql
id uuid primary key
name text
email text
avatar text
points int
streak int
rank int
created_at timestamp
```

---

## battles

```sql
id uuid
player1 uuid
player2 uuid
subject text
topic text
winner uuid
score1 int
score2 int
created_at timestamp
```

---

## questions

```sql
id uuid
subject text
topic text
question text
optionA text
optionB text
optionC text
optionD text
answer text
difficulty text
```

---

## battle_answers

```sql
id uuid
battle_id uuid
user_id uuid
question_id uuid
selected text
correct bool
response_time int
```

---

## leaderboard

```sql
id uuid
user_id uuid
score int
week int
month int
```

---

# 10. API Endpoints

Authentication:

POST /login
POST /register

Battle:

POST /battle/create
POST /battle/join
GET /battle/:id

AI:

POST /ai/generate-questions

Leaderboard:

GET /leaderboard

Analytics:

GET /analytics/:userId

---

# 11. Groq Integration Example

Backend:

```js
const completion = await groq.chat.completions.create({
 model:"llama-3-70b",
 messages:[
 {
 role:"user",
 content:"Generate 10 MCQ questions"
 }
 ]
})
```

---

# 12. Future Roadmap

Phase 2:

- Voice quiz battle
- Teacher tournaments
- Rewards
- Referral system
- College vs college contests

Phase 3:

- Mobile app
- AI tutor
- Personalized learning paths

---

# Success Metrics

Daily active users
Average battle/day
Retention
Average study time
Win rate