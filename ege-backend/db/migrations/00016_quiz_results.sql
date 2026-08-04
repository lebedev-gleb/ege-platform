-- +goose Up

-- К какому авторскому варианту относится попытка ('' — случайный вариант)
ALTER TABLE variant_attempts ADD COLUMN IF NOT EXISTS source_id TEXT NOT NULL DEFAULT '';

-- Результаты пройденных квизов (с разбором)
CREATE TABLE quiz_results (
    id         BIGSERIAL PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id),
    title      TEXT NOT NULL,
    source_id  TEXT NOT NULL DEFAULT '', -- id авторского квиза или ''
    total      INT  NOT NULL,
    correct    INT  NOT NULL,
    rows       JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX quiz_results_user_idx ON quiz_results(user_id, created_at DESC);

-- +goose Down
DROP TABLE quiz_results;
ALTER TABLE variant_attempts DROP COLUMN IF EXISTS source_id;