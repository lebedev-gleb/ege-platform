-- +goose Up
CREATE TABLE variant_attempts (
    id         BIGSERIAL PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id),
    title      TEXT NOT NULL,
    total      INT  NOT NULL,
    correct    INT  NOT NULL,
    seconds    INT  NOT NULL,
    rows       JSONB NOT NULL DEFAULT '[]', -- разбор по заданиям
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX variant_attempts_user_idx
    ON variant_attempts(user_id, created_at DESC);

-- +goose Down
DROP TABLE variant_attempts;