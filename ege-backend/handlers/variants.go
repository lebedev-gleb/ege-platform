package handlers

import (
	"context"
	"encoding/json"
	"time"

	"github.com/gofiber/fiber/v2"
)

// Одна строка разбора: задание, ответ ученика, верный ответ
type variantRowReq struct {
	TaskID        string  `json:"taskId"`
	EgeNumber     int     `json:"egeNumber"`
	Draft         string  `json:"draft"`
	Correct       bool    `json:"correct"`
	CorrectAnswer *string `json:"correctAnswer"` // null — если задание без ответа
}

type saveVariantReq struct {
	Title    string          `json:"title"`
	Seconds  int             `json:"seconds"`
	SourceID string          `json:"sourceId"`
	Rows     []variantRowReq `json:"rows"`
}

// POST /api/variant/finish — сохранить пройденный вариант
func (h *Handlers) SaveVariant(c *fiber.Ctx) error {
	uid := userID(c)

	var req saveVariantReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}
	if req.Title == "" {
		req.Title = "Вариант"
	}

	total := len(req.Rows)
	correct := 0
	for _, r := range req.Rows {
		if r.Correct {
			correct++
		}
	}

	// Массив разбора превращаем в JSON-текст — Postgres положит его в jsonb
	rowsJSON, err := json.Marshal(req.Rows)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка данных"})
	}

	var id int64
	err = h.Pool.QueryRow(context.Background(),
		`INSERT INTO variant_attempts (user_id, title, total, correct, seconds, rows, source_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
		uid, req.Title, total, correct, req.Seconds, string(rowsJSON), req.SourceID).Scan(&id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка сохранения"})
	}
	return c.JSON(fiber.Map{"id": id})
}

// GET /api/me/variants — история вариантов (новые сверху)
func (h *Handlers) GetVariants(c *fiber.Ctx) error {
	uid := userID(c)

	rows, err := h.Pool.Query(context.Background(),
		`SELECT id, title, total, correct, seconds, rows, created_at
		 FROM variant_attempts WHERE user_id = $1
		 ORDER BY created_at DESC`, uid)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()

	type out struct {
		ID        int64           `json:"id"`
		Title     string          `json:"title"`
		Total     int             `json:"total"`
		Correct   int             `json:"correct"`
		Seconds   int             `json:"seconds"`
		CreatedAt int64           `json:"createdAt"` // миллисекунды
		Rows      json.RawMessage `json:"rows"`      // разбор как есть
	}

	list := []out{}
	for rows.Next() {
		var o out
		var rawRows []byte
		var created time.Time
		if err := rows.Scan(&o.ID, &o.Title, &o.Total, &o.Correct,
			&o.Seconds, &rawRows, &created); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		o.CreatedAt = created.UnixMilli()
		o.Rows = json.RawMessage(rawRows) // отдаём JSON разбора без переупаковки
		list = append(list, o)
	}
	return c.JSON(list)
}
