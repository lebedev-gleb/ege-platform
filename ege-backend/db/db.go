package db

import (
	"context"
	"database/sql"
	"embed"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib" // регистрирует драйвер "pgx" для goose
	"github.com/pressly/goose/v3"
)

// go:embed «вшивает» файлы миграций прямо в программу:
// серверу не нужны файлы рядом — SQL лежит внутри него самого.
//
//go:embed migrations/*.sql
var migrations embed.FS

// Connect подключается к PostgreSQL, накатывает миграции
// и возвращает пул соединений для запросов.
func Connect() (*pgxpool.Pool, error) {
	url := os.Getenv("DATABASE_URL")

	pool, err := pgxpool.New(context.Background(), url)
	if err != nil {
		return nil, err
	}
	// Проверяем, что база реально отвечает
	if err := pool.Ping(context.Background()); err != nil {
		return nil, err
	}
	// Накатываем миграции при каждом старте:
	// goose сам помнит, какие уже применены, и не повторяет их
	if err := migrate(url); err != nil {
		return nil, err
	}
	return pool, nil
}

func migrate(url string) error {
	// goose работает через стандартный database/sql — открываем
	// отдельное подключение только на время миграций
	sqlDB, err := sql.Open("pgx", url)
	if err != nil {
		return err
	}
	defer sqlDB.Close()

	goose.SetBaseFS(migrations)
	if err := goose.SetDialect("postgres"); err != nil {
		return err
	}
	return goose.Up(sqlDB, "migrations")
}
