-- ════════════════════════════════════════════════════
--  TaskFlow — Database Schema
--  PostgreSQL
-- ════════════════════════════════════════════════════

-- Create database (run this separately as a superuser)
-- CREATE DATABASE task_manager;

-- ── Users table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(80)  UNIQUE NOT NULL,
    email         VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ── Tasks table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    priority    VARCHAR(20)  NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low', 'medium', 'high')),
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- ── Auto-update updated_at on row change ──────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Indexes for faster queries ────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_user_id  ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
