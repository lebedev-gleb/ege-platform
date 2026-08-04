package handlers

import (
	"context"
	"encoding/json"
	"time"

	"github.com/gofiber/fiber/v2"
)

// Строка разбора одного вопроса квиза
type quizRowReq struct {
	Question    string   `json:"question"`
	Options     []string `json:"options"`
	Picked      []int    `json:"picked"`
	Correct     []int    `json:"correct"`
	Explanation string   `json:"explanation"`
	IsCorrect   bool     `json:"isCorrect"`
	Expired     bool     `json:"expired"`
}

type saveQuizReq struct {
	Title    string       `json:"title"`
	SourceID string       `json:"sourceId"`
	Rows     []quizRowReq `json:"rows"`
}

// POST /api/quiz/finish — сохранить пройденный квиз
func (h *Handlers) SaveQuizResult(c *fiber.Ctx) error {
	uid := userID(c)

	var req saveQuizReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}
	if req.Title == "" {
		req.Title = "Квиз"
	}

	total := len(req.Rows)
	correct := 0
	for _, r := range req.Rows {
		if r.IsCorrect {
			correct++
		}
	}

	rowsJSON, err := json.Marshal(req.Rows)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка данных"})
	}

	var id int64
	err = h.Pool.QueryRow(context.Background(),
		`INSERT INTO quiz_results (user_id, title, source_id, total, correct, rows)
		 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
		uid, req.Title, req.SourceID, total, correct, string(rowsJSON)).Scan(&id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка сохранения"})
	}
	return c.JSON(fiber.Map{"id": id})
}

// GET /api/me/quizzes — история квизов (новые сверху)
func (h *Handlers) GetQuizResults(c *fiber.Ctx) error {
	uid := userID(c)

	rows, err := h.Pool.Query(context.Background(),
		`SELECT id, title, source_id, total, correct, rows, created_at
		 FROM quiz_results WHERE user_id = $1 ORDER BY created_at DESC`, uid)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()

	type out struct {
		ID        int64           `json:"id"`
		Title     string          `json:"title"`
		SourceID  string          `json:"sourceId"`
		Total     int             `json:"total"`
		Correct   int             `json:"correct"`
		CreatedAt int64           `json:"createdAt"`
		Rows      json.RawMessage `json:"rows"`
	}

	list := []out{}
	for rows.Next() {
		var o out
		var rawRows []byte
		var created time.Time
		if err := rows.Scan(&o.ID, &o.Title, &o.SourceID, &o.Total,
			&o.Correct, &rawRows, &created); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		o.CreatedAt = created.UnixMilli()
		o.Rows = json.RawMessage(rawRows)
		list = append(list, o)
	}
	return c.JSON(list)
}

// GET /api/me/author-progress — лучший процент по каждому авторскому
// варианту и квизу (для пометок «решено»)
func (h *Handlers) GetAuthorProgress(c *fiber.Ctx) error {
	uid := userID(c)
	ctx := context.Background()

	variants := map[string]int{}
	vrows, err := h.Pool.Query(ctx,
		`SELECT source_id, correct, total FROM variant_attempts
		 WHERE user_id = $1 AND source_id <> ''`, uid)
	if err == nil {
		for vrows.Next() {
			var sid string
			var correct, total int
			if vrows.Scan(&sid, &correct, &total) == nil {
				percent := 0
				if total > 0 {
					percent = correct * 100 / total
				}
				if cur, ok := variants[sid]; !ok || percent > cur {
					variants[sid] = percent
				}
			}
		}
		vrows.Close()
	}

	quizzes := map[string]int{}
	qrows, err := h.Pool.Query(ctx,
		`SELECT source_id, correct, total FROM quiz_results
		 WHERE user_id = $1 AND source_id <> ''`, uid)
	if err == nil {
		for qrows.Next() {
			var sid string
			var correct, total int
			if qrows.Scan(&sid, &correct, &total) == nil {
				percent := 0
				if total > 0 {
					percent = correct * 100 / total
				}
				if cur, ok := quizzes[sid]; !ok || percent > cur {
					quizzes[sid] = percent
				}
			}
		}
		qrows.Close()
	}

	return c.JSON(fiber.Map{"variants": variants, "quizzes": quizzes})
}
