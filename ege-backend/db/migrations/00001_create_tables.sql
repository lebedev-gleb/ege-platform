-- +goose Up
CREATE TABLE courses (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    description  TEXT NOT NULL,
    level        TEXT NOT NULL,
    topics_count INT  NOT NULL,
    tasks_count  INT  NOT NULL
);

CREATE TABLE topics (
    id        TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id),
    ord       INT  NOT NULL,
    title     TEXT NOT NULL,
    theory    TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE tasks (
    id           TEXT PRIMARY KEY,
    course_id    TEXT NOT NULL REFERENCES courses(id),
    topic_id     TEXT NOT NULL REFERENCES topics(id),
    ege_number   INT  NOT NULL,
    difficulty   TEXT NOT NULL,
    statement    TEXT NOT NULL,
    answer       TEXT NOT NULL,
    kind         TEXT,
    starter_code TEXT
);

-- +goose Down
DROP TABLE tasks;
DROP TABLE topics;
DROP TABLE courses;