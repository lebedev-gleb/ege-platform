package handlers

import (
	"context"

	"github.com/gofiber/fiber/v2"

	"ege-backend/models"
)

// GET /api/tasks/:id/hints — подсказки задачи (доступны всегда)
func (h *Handlers) GetHints(c *fiber.Ctx) error {
	taskID := c.Params("id")

	rows, err := h.Pool.Query(context.Background(),
		`SELECT ord, body FROM task_hints
		 WHERE task_id = $1 ORDER BY ord`, taskID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()

	hints := []models.Hint{}
	for rows.Next() {
		var hint models.Hint
		if err := rows.Scan(&hint.Order, &hint.Body); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		hints = append(hints, hint)
	}
	return c.JSON(hints)
}

// GET /api/tasks/:id/solution — решение. Отдаём ТОЛЬКО если пользователь
// уже пробовал решать эту задачу (есть запись в task_results).
func (h *Handlers) GetSolution(c *fiber.Ctx) error {
	uid := userID(c)
	taskID := c.Params("id")

	// Проверяем факт попытки
	var attempts int
	err := h.Pool.QueryRow(context.Background(),
		`SELECT attempts FROM task_results WHERE user_id = $1 AND task_id = $2`,
		uid, taskID).Scan(&attempts)
	if err != nil || attempts < 1 {
		// Нет записи или ноль попыток — решение пока закрыто
		return c.Status(403).JSON(fiber.Map{"error": "Сначала попробуйте решить"})
	}

	var solution string
	err = h.Pool.QueryRow(context.Background(),
		`SELECT solution FROM tasks WHERE id = $1`, taskID).Scan(&solution)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Задача не найдена"})
	}
	return c.JSON(fiber.Map{"solution": solution})
}
