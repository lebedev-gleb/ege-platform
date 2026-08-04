-- +goose Up

-- Порядок курсов на странице «Мои курсы»
ALTER TABLE courses ADD COLUMN IF NOT EXISTS ord INT NOT NULL DEFAULT 0;

-- Порядок разделов внутри курса + теория как список блоков (JSONB)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS ord INT NOT NULL DEFAULT 0;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS theory_blocks JSONB NOT NULL DEFAULT '[]';

-- Картинки для блоков теории (храним байты, как файлы заданий)
CREATE TABLE theory_images (
    id         BIGSERIAL PRIMARY KEY,
    mime       TEXT  NOT NULL DEFAULT '',
    data       BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE theory_images;
ALTER TABLE topics DROP COLUMN IF EXISTS theory_blocks;
ALTER TABLE topics DROP COLUMN IF EXISTS ord;
ALTER TABLE courses DROP COLUMN IF EXISTS ord;