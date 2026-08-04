-- +goose Up
ALTER TABLE courses ALTER COLUMN level SET DEFAULT '';
UPDATE courses SET level = '' WHERE level IS NULL;

-- +goose Down
ALTER TABLE courses ALTER COLUMN level DROP DEFAULT;