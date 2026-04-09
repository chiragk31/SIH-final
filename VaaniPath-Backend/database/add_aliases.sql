ALTER TABLE courses ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tutor_id TEXT;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS user_id TEXT;

-- copy data just in case
UPDATE courses SET name = title WHERE name IS NULL AND title IS NOT NULL;
UPDATE courses SET tutor_id = teacher_id WHERE tutor_id IS NULL AND teacher_id IS NOT NULL;
UPDATE enrollments SET user_id = student_id WHERE user_id IS NULL AND student_id IS NOT NULL;
