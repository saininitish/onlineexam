# Online Mock Test Platform 🚀

A premium, full-stack online examination platform built with React, Node.js, and Supabase.

## ✨ Features
- **Secure Authentication**: JWT-based login and registration for Students and Admins.
- **Admin Dashboard**: Create tests, manage questions, and monitor student results.
- **Student Dashboard**: Browse available tests and track performance history.
- **Advanced Test Engine**:
  - Live real-time timer.
  - Question navigation system.
  - Auto-submission on time-out.
  - Instant score calculation with negative marking support.
- **Premium Design**: Sleek dark mode UI with Glassmorphism and smooth animations.

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Framer Motion, Lucide React, Zustand, Axios.
- **Backend**: Node.js, Express, TypeScript, JWT, Bcrypt.
- **Database**: Supabase (PostgreSQL).

## 🚀 Setup Instructions

### 1. Database Setup (Supabase)
Create the following tables in your Supabase SQL Editor:

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tests Table
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  marks_per_question INTEGER NOT NULL,
  negative_mark FLOAT DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions Table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL, -- 'a', 'b', 'c', or 'd'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attempts Table
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  test_id UUID REFERENCES tests(id),
  score INTEGER NOT NULL,
  time_taken INTEGER NOT NULL, -- in seconds
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers Table
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id),
  selected_answer TEXT,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Backend Setup
1. Navigate to the `server` directory.
2. Create a `.env` file based on `.env.example`.
3. Add your Supabase URL, Anon Key, and a JWT Secret.
4. Install dependencies: `npm install`
5. Start development server: `npm run dev`

### 3. Frontend Setup
1. Navigate to the `client` directory.
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## 🔐 Security
- Password hashing using Bcrypt.
- Protected API routes using JWT middleware.
- Role-based access control (Admin vs Student).
- ✅ Real-time tracking of Time Spent per question
- ✅ Auto-detection of Question Topic & Difficulty
- ✅ Weak Topics highlighting for targeted improvement

## 🎯 Future Scalability
- Real-time leaderboard using Supabase Realtime.
- Image support for questions.
