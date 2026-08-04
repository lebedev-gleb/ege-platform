-- +goose Up
CREATE TABLE task_files (
    id         BIGSERIAL PRIMARY KEY,
    task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    filename   TEXT  NOT NULL,
    mime       TEXT  NOT NULL DEFAULT '',
    size       INT   NOT NULL DEFAULT 0,
    data       BYTEA NOT NULL,        -- содержимое файла (байты)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX task_files_task_idx ON task_files(task_id);

-- +goose Down
DROP TABLE task_files;