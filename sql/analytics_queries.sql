-- Analytics SQL Queries for Mock Test Platform

-- ===========================================
-- STUDENT PERFORMANCE TRACKING
-- ===========================================

-- 1. Student Performance Overview
CREATE OR REPLACE VIEW student_performance_overview AS
SELECT
    u.id as student_id,
    u.name as student_name,
    u.email as student_email,
    COUNT(DISTINCT a.id) as total_attempts,
    COUNT(DISTINCT t.id) as tests_attempted,
    ROUND(AVG(a.score), 2) as avg_score,
    MAX(a.score) as highest_score,
    MIN(a.score) as lowest_score,
    ROUND(AVG(a.time_taken), 2) as avg_time_taken,
    MAX(a.submitted_at) as last_attempt_date,
    COUNT(CASE WHEN ans.is_correct THEN 1 END) as total_correct_answers,
    COUNT(ans.id) as total_answers_given,
    ROUND(
        (COUNT(CASE WHEN ans.is_correct THEN 1 END)::decimal /
         NULLIF(COUNT(ans.id), 0)) * 100, 2
    ) as overall_accuracy_percentage
FROM users u
LEFT JOIN attempts a ON u.id = a.user_id
LEFT JOIN answers ans ON a.id = ans.attempt_id
LEFT JOIN tests t ON a.test_id = t.id
WHERE u.role = 'student'
GROUP BY u.id, u.name, u.email;

-- 2. Student Performance by Subject/Topic
CREATE OR REPLACE VIEW student_topic_performance AS
SELECT
    u.id as student_id,
    u.name as student_name,
    q_meta.topic,
    COUNT(DISTINCT q.id) as questions_attempted,
    COUNT(CASE WHEN ans.is_correct THEN 1 END) as correct_answers,
    ROUND(
        (COUNT(CASE WHEN ans.is_correct THEN 1 END)::decimal /
         NULLIF(COUNT(DISTINCT q.id), 0)) * 100, 2
    ) as topic_accuracy_percentage,
    ROUND(AVG(a.score), 2) as avg_score_in_topic
FROM users u
JOIN attempts a ON u.id = a.user_id
JOIN answers ans ON a.id = ans.attempt_id
JOIN questions q ON ans.question_id = q.id
JOIN LATERAL (
    SELECT
        TRIM(SPLIT_PART(SPLIT_PART(q.question, 'TOPIC:', 2), '|', 1)) as topic,
        TRIM(SPLIT_PART(SPLIT_PART(q.question, 'DIFFICULTY:', 2), '|', 1)) as difficulty
) q_meta ON true
WHERE u.role = 'student' AND q_meta.topic != ''
GROUP BY u.id, u.name, q_meta.topic;

-- 3. Student Progress Over Time
CREATE OR REPLACE VIEW student_progress_timeline AS
SELECT
    u.id as student_id,
    u.name as student_name,
    DATE_TRUNC('week', a.submitted_at) as week_start,
    COUNT(a.id) as attempts_in_week,
    ROUND(AVG(a.score), 2) as avg_score_week,
    ROUND(AVG(a.time_taken), 2) as avg_time_week,
    COUNT(CASE WHEN ans.is_correct THEN 1 END) as correct_answers_week,
    COUNT(ans.id) as total_answers_week
FROM users u
JOIN attempts a ON u.id = a.user_id
LEFT JOIN answers ans ON a.id = ans.attempt_id
WHERE u.role = 'student'
GROUP BY u.id, u.name, DATE_TRUNC('week', a.submitted_at)
ORDER BY u.id, week_start;

-- ===========================================
-- TEST-WISE ANALYTICS
-- ===========================================

-- 4. Test Performance Analytics
CREATE OR REPLACE VIEW test_performance_analytics AS
SELECT
    t.id as test_id,
    t.title as test_title,
    t.duration as test_duration,
    t.marks_per_question,
    t.negative_mark,
    COUNT(DISTINCT a.id) as total_attempts,
    COUNT(DISTINCT a.user_id) as unique_students,
    ROUND(AVG(a.score), 2) as avg_score,
    ROUND(STDDEV(a.score), 2) as score_std_dev,
    MAX(a.score) as highest_score,
    MIN(a.score) as lowest_score,
    ROUND(AVG(a.time_taken), 2) as avg_time_taken,
    ROUND(
        (AVG(a.time_taken) / t.duration) * 100, 2
    ) as avg_time_utilization_percentage,
    COUNT(q.id) as total_questions,
    ROUND(AVG(a.score) / (COUNT(q.id) * t.marks_per_question) * 100, 2) as avg_score_percentage
FROM tests t
LEFT JOIN attempts a ON t.id = a.test_id
LEFT JOIN questions q ON t.id = q.test_id
GROUP BY t.id, t.title, t.duration, t.marks_per_question, t.negative_mark;

-- 5. Test Difficulty Analysis
CREATE OR REPLACE VIEW test_difficulty_analysis AS
SELECT
    t.id as test_id,
    t.title as test_title,
    q_meta.difficulty,
    COUNT(q.id) as questions_in_difficulty,
    COUNT(CASE WHEN ans.is_correct THEN 1 END) as correct_answers,
    COUNT(ans.id) as total_attempts_on_difficulty,
    ROUND(
        (COUNT(CASE WHEN ans.is_correct THEN 1 END)::decimal /
         NULLIF(COUNT(ans.id), 0)) * 100, 2
    ) as difficulty_accuracy_percentage
FROM tests t
JOIN questions q ON t.id = q.test_id
LEFT JOIN answers ans ON q.id = ans.question_id
JOIN LATERAL (
    SELECT
        TRIM(SPLIT_PART(SPLIT_PART(q.question, 'DIFFICULTY:', 2), '|', 1)) as difficulty
) q_meta ON true
WHERE q_meta.difficulty != ''
GROUP BY t.id, t.title, q_meta.difficulty;

-- ===========================================
-- HARD QUESTIONS DETECTION
-- ===========================================

-- 6. Question Difficulty Metrics
CREATE OR REPLACE VIEW question_difficulty_metrics AS
SELECT
    q.id as question_id,
    q.question as question_text,
    q.test_id,
    t.title as test_title,
    COUNT(ans.id) as times_attempted,
    COUNT(CASE WHEN ans.is_correct THEN 1 END) as times_correct,
    COUNT(CASE WHEN ans.selected_answer IS NULL OR ans.selected_answer = '' THEN 1 END) as times_unanswered,
    ROUND(
        (COUNT(CASE WHEN ans.is_correct THEN 1 END)::decimal /
         NULLIF(COUNT(ans.id), 0)) * 100, 2
    ) as accuracy_percentage,
    ROUND(
        (COUNT(CASE WHEN ans.selected_answer IS NULL OR ans.selected_answer = '' THEN 1 END)::decimal /
         NULLIF(COUNT(ans.id), 0)) * 100, 2
    ) as skip_percentage,
    -- Difficulty score (lower accuracy = harder)
    ROUND(
        100 - (
            (COUNT(CASE WHEN ans.is_correct THEN 1 END)::decimal /
             NULLIF(COUNT(ans.id), 0)) * 100
        ), 2
    ) as difficulty_score,
    q_meta.topic,
    q_meta.difficulty as tagged_difficulty
FROM questions q
JOIN tests t ON q.test_id = t.id
LEFT JOIN answers ans ON q.id = ans.question_id
JOIN LATERAL (
    SELECT
        TRIM(SPLIT_PART(SPLIT_PART(q.question, 'TOPIC:', 2), '|', 1)) as topic,
        TRIM(SPLIT_PART(SPLIT_PART(q.question, 'DIFFICULTY:', 2), '|', 1)) as difficulty
) q_meta ON true
GROUP BY q.id, q.question, q.test_id, t.title, q_meta.topic, q_meta.difficulty
HAVING COUNT(ans.id) > 0; -- Only questions that have been attempted

-- 7. Hardest Questions Ranking
CREATE OR REPLACE VIEW hardest_questions_ranking AS
SELECT
    *,
    ROW_NUMBER() OVER (ORDER BY difficulty_score DESC, times_attempted DESC) as difficulty_rank
FROM question_difficulty_metrics
WHERE times_attempted >= 5; -- Minimum attempts for reliable data

-- ===========================================
-- LEADERBOARD SYSTEM
-- ===========================================

-- 8. Global Leaderboard
CREATE OR REPLACE VIEW global_leaderboard AS
SELECT
    u.id as student_id,
    u.name as student_name,
    u.email as student_email,
    COUNT(a.id) as total_attempts,
    ROUND(AVG(a.score), 2) as avg_score,
    MAX(a.score) as highest_score,
    COUNT(CASE WHEN ans.is_correct THEN 1 END) as total_correct_answers,
    COUNT(ans.id) as total_answers_given,
    ROUND(
        (COUNT(CASE WHEN ans.is_correct THEN 1 END)::decimal /
         NULLIF(COUNT(ans.id), 0)) * 100, 2
    ) as accuracy_percentage,
    ROW_NUMBER() OVER (
        ORDER BY
            ROUND(AVG(a.score), 2) DESC,
            ROUND(
                (COUNT(CASE WHEN ans.is_correct THEN 1 END)::decimal /
                 NULLIF(COUNT(ans.id), 0)) * 100, 2
            ) DESC,
            COUNT(a.id) DESC
    ) as global_rank
FROM users u
LEFT JOIN attempts a ON u.id = a.user_id
LEFT JOIN answers ans ON a.id = ans.attempt_id
WHERE u.role = 'student'
GROUP BY u.id, u.name, u.email
HAVING COUNT(a.id) > 0;

-- 9. Test-Specific Leaderboard
CREATE OR REPLACE VIEW test_leaderboard AS
SELECT
    t.id as test_id,
    t.title as test_title,
    a.user_id as student_id,
    u.name as student_name,
    u.email as student_email,
    a.score,
    a.time_taken,
    a.submitted_at,
    ROW_NUMBER() OVER (
        PARTITION BY t.id
        ORDER BY a.score DESC, a.time_taken ASC, a.submitted_at ASC
    ) as test_rank,
    COUNT(*) OVER (PARTITION BY t.id) as total_participants
FROM tests t
JOIN attempts a ON t.id = a.test_id
JOIN users u ON a.user_id = u.id
WHERE u.role = 'student';

-- 10. Monthly Performance Leaderboard
CREATE OR REPLACE VIEW monthly_leaderboard AS
SELECT
    DATE_TRUNC('month', a.submitted_at) as month,
    u.id as student_id,
    u.name as student_name,
    COUNT(a.id) as attempts_this_month,
    ROUND(AVG(a.score), 2) as avg_score_month,
    MAX(a.score) as best_score_month,
    ROW_NUMBER() OVER (
        PARTITION BY DATE_TRUNC('month', a.submitted_at)
        ORDER BY ROUND(AVG(a.score), 2) DESC, COUNT(a.id) DESC
    ) as monthly_rank
FROM users u
JOIN attempts a ON u.id = a.user_id
WHERE u.role = 'student'
GROUP BY DATE_TRUNC('month', a.submitted_at), u.id, u.name;

-- ===========================================
-- ADDITIONAL ANALYTICS VIEWS
-- ===========================================

-- 11. Student Engagement Metrics
CREATE OR REPLACE VIEW student_engagement_metrics AS
SELECT
    u.id as student_id,
    u.name as student_name,
    COUNT(DISTINCT DATE_TRUNC('day', a.submitted_at)) as active_days,
    COUNT(a.id) as total_attempts,
    MAX(a.submitted_at) as last_activity,
    EXTRACT(EPOCH FROM (NOW() - MAX(a.submitted_at))) / 86400 as days_since_last_attempt,
    ROUND(AVG(a.time_taken), 2) as avg_time_per_test,
    COUNT(DISTINCT t.id) as unique_tests_attempted,
    CASE
        WHEN MAX(a.submitted_at) > NOW() - INTERVAL '7 days' THEN 'Active'
        WHEN MAX(a.submitted_at) > NOW() - INTERVAL '30 days' THEN 'Recent'
        ELSE 'Inactive'
    END as engagement_status
FROM users u
LEFT JOIN attempts a ON u.id = a.user_id
LEFT JOIN tests t ON a.test_id = t.id
WHERE u.role = 'student'
GROUP BY u.id, u.name;

-- 12. Test Completion Rates
CREATE OR REPLACE VIEW test_completion_rates AS
SELECT
    t.id as test_id,
    t.title as test_title,
    COUNT(DISTINCT a.id) as total_attempts,
    COUNT(DISTINCT CASE WHEN a.score > 0 THEN a.id END) as completed_attempts,
    ROUND(
        (COUNT(DISTINCT CASE WHEN a.score > 0 THEN a.id END)::decimal /
         NULLIF(COUNT(DISTINCT a.id), 0)) * 100, 2
    ) as completion_rate_percentage,
    ROUND(AVG(a.time_taken), 2) as avg_completion_time,
    ROUND(AVG(a.score), 2) as avg_score_completed
FROM tests t
LEFT JOIN attempts a ON t.id = a.test_id
GROUP BY t.id, t.title;

-- 13. Question Performance Trends
CREATE OR REPLACE VIEW question_performance_trends AS
SELECT
    q.id as question_id,
    q.question as question_text,
    DATE_TRUNC('week', a.submitted_at) as week,
    COUNT(ans.id) as attempts_this_week,
    COUNT(CASE WHEN ans.is_correct THEN 1 END) as correct_this_week,
    ROUND(
        (COUNT(CASE WHEN ans.is_correct THEN 1 END)::decimal /
         NULLIF(COUNT(ans.id), 0)) * 100, 2
    ) as weekly_accuracy
FROM questions q
JOIN answers ans ON q.id = ans.question_id
JOIN attempts a ON ans.attempt_id = a.id
GROUP BY q.id, q.question, DATE_TRUNC('week', a.submitted_at)
ORDER BY q.id, week;</content>
<parameter name="filePath">c:\Users\hp\OneDrive\Desktop\online exm project\sql\analytics_queries.sql