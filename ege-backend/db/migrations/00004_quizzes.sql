-- +goose Up
CREATE TABLE quiz_questions (
    id          TEXT PRIMARY KEY,
    topic_id    TEXT NOT NULL,
    question    TEXT NOT NULL,
    options     TEXT[] NOT NULL,
    correct     INT[] NOT NULL,   -- индексы верных вариантов
    explanation TEXT NOT NULL
);

-- Одна строка = одна начатая попытка квиза.
-- questions_json — какие вопросы выпали (порядок фиксирован при старте).
-- deadline — момент, после которого ответы не принимаются (часы СЕРВЕРА).
CREATE TABLE quiz_attempts (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id),
    question_ids TEXT[] NOT NULL,
    answers      JSONB NOT NULL DEFAULT '{}',
    deadline     TIMESTAMPTZ NOT NULL,
    finished     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE quiz_attempts;
DROP TABLE quiz_questions;