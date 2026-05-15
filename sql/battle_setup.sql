-- SQL for Exam Prep Battle Features

-- 1. Update users table with gamification columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank INT DEFAULT 0;

-- 2. Create battles table
CREATE TABLE IF NOT EXISTS battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player1 UUID REFERENCES users(id),
    player2 UUID REFERENCES users(id), -- Null if waiting for random player
    subject TEXT,
    topic TEXT,
    winner UUID REFERENCES users(id),
    score1 INT DEFAULT 0,
    score2 INT DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, active, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create battle_answers table
CREATE TABLE IF NOT EXISTS battle_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battle_id UUID REFERENCES battles(id),
    user_id UUID REFERENCES users(id),
    question_id UUID, -- References your questions table
    selected TEXT,
    is_correct BOOLEAN,
    response_time INT, -- In milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Leaderboard view (Dynamic)
CREATE OR REPLACE VIEW battle_leaderboard AS
SELECT 
    id as user_id,
    name,
    points,
    streak,
    RANK() OVER (ORDER BY points DESC) as global_rank
FROM users
WHERE role = 'student';

-- 5. Create syllabuses table
CREATE TABLE IF NOT EXISTS syllabuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    chapter TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT, -- This stores the "Context" for AI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syllabus_user ON syllabuses(user_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_subject ON syllabuses(subject);

