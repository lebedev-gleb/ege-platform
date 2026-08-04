-- +goose Up
ALTER TABLE tasks ADD COLUMN solution TEXT NOT NULL DEFAULT '';

CREATE TABLE task_hints (
    id       BIGSERIAL PRIMARY KEY, -- авто-номер подсказки
    task_id  TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    ord      INT  NOT NULL,         -- порядок: 1, 2, 3...
    body     TEXT NOT NULL
);

CREATE INDEX task_hints_task_idx ON task_hints(task_id);

-- +goose Down
DROP TABLE task_hints;
ALTER TABLE tasks DROP COLUMN solution;