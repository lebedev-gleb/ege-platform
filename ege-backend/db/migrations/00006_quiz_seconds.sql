-- +goose Up
ALTER TABLE quiz_questions ADD COLUMN seconds INT NOT NULL DEFAULT 20;

-- Короткие фактические вопросы — меньше времени, «подумать» — больше
UPDATE quiz_questions SET seconds = 15 WHERE id IN
  ('qz-numsys-2','qz-logic-2','qz-pyvars-1','qz-pyvars-4','qz-pyloops-1','qz-pyloops-2');
UPDATE quiz_questions SET seconds = 30 WHERE id IN
  ('qz-numsys-3','qz-numsys-4','qz-logic-3','qz-logic-5','qz-pyvars-3','qz-pyloops-3');

-- +goose Down
ALTER TABLE quiz_questions DROP COLUMN seconds;