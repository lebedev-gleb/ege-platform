package handlers

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
)

// Та же нормализация, что была на фронтенде: убираем пробелы по краям,
// понижаем регистр, запятую меняем на точку.
func normalizeAnswer(s string) string {
	return strings.ReplaceAll(strings.ToLower(strings.TrimSpace(s)), ",", ".")
}

// Лестница интервалов «Работы над ошибками» — переехала из браузера в Go
var reviewLadder = []int{1, 3, 7, 14, 30}

func nextIntervalDays(current int) (int, bool) {
	for _, step := range reviewLadder {
		if step > current {
			return step, true
		}
	}
	return 0, false // лестница пройдена — задание выучено
}

type submitRequest struct {
	Answer string `json:"answer"`
}

// POST /api/tasks/:id/submit — серверная проверка ответа.
// Для код-задач фронтенд присылает ВЫВОД программы — сравнение то же.
func (h *Handlers) SubmitAnswer(c *fiber.Ctx) error {
	uid := userID(c)
	taskID := c.Params("id")

	var req submitRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}

	// Правильный ответ есть только у сервера
	var correctAnswer string
	err := h.Pool.QueryRow(context.Background(),
		`SELECT answer FROM tasks WHERE id = $1`, taskID).Scan(&correctAnswer)
	if err == pgx.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "Задача не найдена"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}

	correct := normalizeAnswer(req.Answer) == normalizeAnswer(correctAnswer)

	// UPSERT: «создай строку, а если пара user+task уже есть — обнови её».
	// EXCLUDED — значения, которые мы ПЫТАЛИСЬ вставить.
	var solved bool
	var attempts int
	err = h.Pool.QueryRow(context.Background(),
		`INSERT INTO task_results (user_id, task_id, solved, attempts)
		 VALUES ($1, $2, $3, 1)
		 ON CONFLICT (user_id, task_id) DO UPDATE
		 SET attempts = task_results.attempts + 1,
		     solved   = task_results.solved OR EXCLUDED.solved
		 RETURNING solved, attempts`,
		uid, taskID, correct).Scan(&solved, &attempts)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка записи прогресса"})
	}

	h.markActivity(uid, correct)

	// Ошибся — задача попадает в колоду повторений (или сбрасывается в начало)
	if !correct {
		_, err = h.Pool.Exec(context.Background(),
			`INSERT INTO mistakes (user_id, task_id, due_at, interval_days)
			 VALUES ($1, $2, now(), 0)
			 ON CONFLICT (user_id, task_id) DO UPDATE
			 SET due_at = now(), interval_days = 0`,
			uid, taskID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка записи прогресса"})
		}
	}

	// correctAnswer возвращаем ПОСЛЕ попытки — он нужен таблице разбора варианта
	return c.JSON(fiber.Map{
		"correct":       correct,
		"solved":        solved,
		"attempts":      attempts,
		"correctAnswer": correctAnswer,
	})
}

// GET /api/me/progress — весь прогресс текущего пользователя
func (h *Handlers) GetProgress(c *fiber.Ctx) error {
	uid := userID(c)

	taskResults := map[string]map[string]any{}
	rows, err := h.Pool.Query(context.Background(),
		`SELECT task_id, solved, attempts FROM task_results WHERE user_id = $1`, uid)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()
	for rows.Next() {
		var taskID string
		var solved bool
		var attempts int
		if err := rows.Scan(&taskID, &solved, &attempts); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		taskResults[taskID] = map[string]any{"solved": solved, "attempts": attempts}
	}

	mistakes := map[string]map[string]any{}
	mrows, err := h.Pool.Query(context.Background(),
		`SELECT task_id, due_at, interval_days FROM mistakes WHERE user_id = $1`, uid)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer mrows.Close()
	for mrows.Next() {
		var taskID string
		var dueAt time.Time
		var intervalDays int
		if err := mrows.Scan(&taskID, &dueAt, &intervalDays); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		mistakes[taskID] = map[string]any{
			"taskId":       taskID,
			"dueAt":        dueAt.UnixMilli(), // фронтенд сравнивает с Date.now()
			"intervalDays": intervalDays,
		}
	}

	return c.JSON(fiber.Map{"taskResults": taskResults, "mistakes": mistakes})
}

// POST /api/review/:taskId — ответ в сессии «Работы над ошибками»
func (h *Handlers) ReviewAnswer(c *fiber.Ctx) error {
	uid := userID(c)
	taskID := c.Params("taskId")

	var req submitRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}

	var correctAnswer string
	err := h.Pool.QueryRow(context.Background(),
		`SELECT answer FROM tasks WHERE id = $1`, taskID).Scan(&correctAnswer)
	if err == pgx.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "Задача не найдена"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}

	correct := normalizeAnswer(req.Answer) == normalizeAnswer(correctAnswer)

	// Ответ на повторении тоже идёт в общую статистику
	_, err = h.Pool.Exec(context.Background(),
		`INSERT INTO task_results (user_id, task_id, solved, attempts)
		 VALUES ($1, $2, $3, 1)
		 ON CONFLICT (user_id, task_id) DO UPDATE
		 SET attempts = task_results.attempts + 1,
		     solved   = task_results.solved OR EXCLUDED.solved`,
		uid, taskID, correct)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка записи прогресса"})
	}

	h.markActivity(uid, correct)

	if !correct {
		// Ошибка на повторении — карточка в начало лестницы
		_, err = h.Pool.Exec(context.Background(),
			`INSERT INTO mistakes (user_id, task_id, due_at, interval_days)
			 VALUES ($1, $2, now(), 0)
			 ON CONFLICT (user_id, task_id) DO UPDATE
			 SET due_at = now(), interval_days = 0`,
			uid, taskID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка записи прогресса"})
		}
		return c.JSON(fiber.Map{
			"correct": false, "correctAnswer": correctAnswer,
			"nextDays": nil, "learned": false,
		})
	}

	// Верно: узнаём текущий интервал и двигаемся по лестнице
	var currentInterval int
	err = h.Pool.QueryRow(context.Background(),
		`SELECT interval_days FROM mistakes WHERE user_id = $1 AND task_id = $2`,
		uid, taskID).Scan(&currentInterval)
	if err == pgx.ErrNoRows {
		return c.JSON(fiber.Map{
			"correct": true, "correctAnswer": correctAnswer,
			"nextDays": nil, "learned": true,
		})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}

	next, hasNext := nextIntervalDays(currentInterval)
	if !hasNext {
		// Лестница пройдена — задание покидает колоду
		if _, err := h.Pool.Exec(context.Background(),
			`DELETE FROM mistakes WHERE user_id = $1 AND task_id = $2`,
			uid, taskID); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка записи прогресса"})
		}
		return c.JSON(fiber.Map{
			"correct": true, "correctAnswer": correctAnswer,
			"nextDays": nil, "learned": true,
		})
	}

	// make_interval(days => N) — прибавить N дней к текущему моменту
	if _, err := h.Pool.Exec(context.Background(),
		`UPDATE mistakes
		 SET interval_days = $3, due_at = now() + make_interval(days => $3)
		 WHERE user_id = $1 AND task_id = $2`,
		uid, taskID, next); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка записи прогресса"})
	}
	return c.JSON(fiber.Map{
		"correct": true, "correctAnswer": correctAnswer,
		"nextDays": next, "learned": false,
	})
}

// markActivity отмечает, что пользователь занимался сегодня (по часам сервера),
// и увеличивает счётчик решённого за день. Дата — сегодняшняя, серверная.
func (h *Handlers) markActivity(uid string, correct bool) {
	inc := 0
	if correct {
		inc = 1
	}
	// UPSERT по (user_id, day): создаём день или прибавляем к счётчику
	_, _ = h.Pool.Exec(context.Background(),
		`INSERT INTO activity_days (user_id, day, solved)
		 VALUES ($1, CURRENT_DATE, $2)
		 ON CONFLICT (user_id, day) DO UPDATE
		 SET solved = activity_days.solved + $2`,
		uid, inc)
}
