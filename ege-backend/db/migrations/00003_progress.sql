-- +goose Up
CREATE TABLE users (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE task_results (
    user_id  TEXT NOT NULL REFERENCES users(id),
    task_id  TEXT NOT NULL REFERENCES tasks(id),
    solved   BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, task_id)
);

CREATE TABLE mistakes (
    user_id       TEXT NOT NULL REFERENCES users(id),
    task_id       TEXT NOT NULL REFERENCES tasks(id),
    due_at        TIMESTAMPTZ NOT NULL,
    interval_days INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, task_id)
);

-- +goose Down
DROP TABLE mistakes;
DROP TABLE task_results;
DROP TABLE users;