-- ════════════════════════════════════════════════════════════════
-- The Ma'na Initiative — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New Query)
-- ════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Sessions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  date            DATE,
  time            TIME,
  medium          TEXT CHECK (medium IN ('in_person', 'online', 'hybrid')),
  location        TEXT,
  zoom_url        TEXT,
  recording_url   TEXT,
  book_title      TEXT,
  book_author     TEXT,
  book_cover_url  TEXT,
  is_upcoming     BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Books ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  author          TEXT,
  cover_url       TEXT,
  category        TEXT,
  status          TEXT CHECK (status IN ('completed', 'reading', 'upcoming')) NOT NULL DEFAULT 'upcoming',
  supplier_note   TEXT,
  related_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Registrations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registrations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  ihl             TEXT,
  medium_pref     TEXT,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Subscribers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  consent         BOOLEAN NOT NULL DEFAULT TRUE,
  source          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Join interest ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS join_interest (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  ihl             TEXT,
  motivation      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Engagements ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS engagements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT,
  caption         TEXT,
  image_url       TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── FAQs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question        TEXT NOT NULL,
  answer          TEXT NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE
);

-- ── Committee members ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS committee_members (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  role                TEXT NOT NULL,
  department          TEXT,
  photo_url           TEXT,
  consent_to_publish  BOOLEAN NOT NULL DEFAULT FALSE,
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Contact messages ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  message         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════

ALTER TABLE sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE books            ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_interest    ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Public can read published sessions
CREATE POLICY "public_read_sessions" ON sessions
  FOR SELECT USING (is_published = true);

-- Public can read published books
CREATE POLICY "public_read_books" ON books
  FOR SELECT USING (is_published = true);

-- Public can read published engagements
CREATE POLICY "public_read_engagements" ON engagements
  FOR SELECT USING (is_published = true);

-- Public can read published FAQs
CREATE POLICY "public_read_faqs" ON faqs
  FOR SELECT USING (is_published = true);

-- Public can read published committee members (consent required)
CREATE POLICY "public_read_committee" ON committee_members
  FOR SELECT USING (is_published = true AND consent_to_publish = true);

-- Public can insert registrations, subscribers, join_interest, contact_messages
CREATE POLICY "public_insert_registrations"    ON registrations    FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_subscribers"      ON subscribers      FOR INSERT WITH CHECK (true);
CREATE POLICY "public_upsert_subscribers"      ON subscribers      FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public_insert_join_interest"    ON join_interest     FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_contact_messages" ON contact_messages FOR INSERT WITH CHECK (true);

-- Authenticated admin has full access to all tables
CREATE POLICY "admin_all_sessions"          ON sessions          FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_all_books"             ON books             FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_all_registrations"     ON registrations     FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_subscribers"       ON subscribers       FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_join_interest"     ON join_interest      FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_engagements"       ON engagements       FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_all_faqs"              ON faqs              FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_all_committee"         ON committee_members FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_all_contact_messages"  ON contact_messages  FOR ALL USING (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- Run in Supabase Dashboard → Storage → Create bucket
-- ════════════════════════════════════════════════════════════════
-- Create these two public buckets in Storage:
--   1. "book-covers"   — for book cover images
--   2. "engagements"   — for engagement gallery images
--
-- Or run via SQL if storage extension is enabled:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('engagements', 'engagements', true);

-- ════════════════════════════════════════════════════════════════
-- SAMPLE DATA (optional — remove before production)
-- ════════════════════════════════════════════════════════════════
INSERT INTO sessions (slug, title, description, date, time, medium, is_upcoming, is_featured, is_published, book_title, book_author)
VALUES (
  'concept-of-education-in-islam',
  'The Concept of Education in Islam',
  'A close reading of Syed Muhammad Naquib Al-Attas''s seminal work — exploring the Islamic concept of education, the nature of man, and the role of knowledge in the formation of a complete human being.',
  CURRENT_DATE + INTERVAL '14 days',
  '14:00',
  'hybrid',
  true,
  true,
  true,
  'The Concept of Education in Islam',
  'Syed Muhammad Naquib Al-Attas'
);

INSERT INTO faqs (question, answer, sort_order, is_published) VALUES
('How often are sessions held?',           'Roughly once a month. Recordings are provided so you can catch up if you miss one.',                               1, true),
('Do I need prior Islamic knowledge?',     'No — sessions are designed to be accessible to all. You don''t need to read ahead to follow along.',              2, true),
('Are sessions free?',                     'Yes. Sessions are free to attend. You only pay for books you personally choose to order.',                         3, true);

INSERT INTO engagements (title, caption, sort_order, is_published) VALUES
('Completed reading: The Concept of Education in Islam', 'An 8-session deep reading of Al-Attas''s foundational work on Islamic education and the concept of ta''dib.', 1, true),
('Rihlah Ilmiah to Kuala Lumpur',                        'A knowledge journey to KL for the Royal Conference and Prof Al-Attas''s extempore lecture.',              2, true),
('International Scholar Engagement',                      'Hosting Dr. Mesut Idriz for a scholar engagement with IHL students.',                                    3, true),
('Habib Abdul Rahman Ali Engagement',                     'A special engagement with IHL students hosted by Ma''na.',                                               4, true);
