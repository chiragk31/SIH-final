-- Grant full access since backend will handle security
CREATE POLICY "Full access videos" ON videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access transcriptions" ON transcriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access translations" ON translations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access subtitles" ON subtitles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access quiz_questions" ON quiz_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access quiz_responses" ON quiz_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access glossary_terms" ON glossary_terms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access processing_jobs" ON processing_jobs FOR ALL USING (true) WITH CHECK (true);

-- Drop old read-only policies to avoid confusion
DROP POLICY IF EXISTS "Anyone can read translations" ON translations;
DROP POLICY IF EXISTS "Anyone can read transcriptions" ON transcriptions;
DROP POLICY IF EXISTS "Anyone can read videos" ON videos;

-- For users, we need full access for inserts/updates
CREATE POLICY "Full access users" ON users FOR ALL USING (true) WITH CHECK (true);

-- courses and enrollments
CREATE POLICY "Full access courses" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access enrollments" ON enrollments FOR ALL USING (true) WITH CHECK (true);
