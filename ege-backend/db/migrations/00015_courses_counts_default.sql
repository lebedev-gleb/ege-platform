-- +goose Up
ALTER TABLE courses ALTER COLUMN topics_count SET DEFAULT 0;
UPDATE courses SET topics_count = 0 WHERE topics_count IS NULL;

ALTER TABLE courses ALTER COLUMN tasks_count SET DEFAULT 0;
UPDATE courses SET tasks_count = 0 WHERE tasks_count IS NULL;

-- +goose Down
ALTER TABLE courses ALTER COLUMN tasks_count DROP DEFAULT;
ALTER TABLE courses ALTER COLUMN topics_count DROP DEFAULT;