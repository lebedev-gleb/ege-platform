-- +goose Up
CREATE TABLE activity_days (
    user_id TEXT NOT NULL REFERENCES users(id),
    day     DATE NOT NULL,           -- дата без времени
    solved  INT  NOT NULL DEFAULT 0, -- сколько верных решений в этот день
    PRIMARY KEY (user_id, day)
);

-- +goose Down
DROP TABLE activity_days;