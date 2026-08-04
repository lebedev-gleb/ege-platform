package handlers

import (
	"context"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgconn"

	"ege-backend/models"
)

// GET /api/author-quizzes — список авторских квизов (новые сверху)
func (h *Handlers) GetAuthorQuizzes(c *fiber.Ctx) error {
	rows, err := h.Pool.Query(context.Background(),
		`SELECT id, title, description, question_ids
		 FROM author_quizzes ORDER BY created_at DESC`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()

	quizzes := []models.AuthorQuiz{}
	for rows.Next() {
		var q models.AuthorQuiz
		if err := rows.Scan(&q.ID, &q.Title, &q.Description, &q.QuestionIDs); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		quizzes = append(quizzes, q)
	}
	return c.JSON(quizzes)
}

type authorQuizRequest struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	QuestionIDs []string `json:"questionIds"`
}

func validateQuiz(req authorQuizRequest) error {
	if req.Title == "" {
		return errors.New("Укажите название квиза")
	}
	if len(req.QuestionIDs) == 0 {
		return errors.New("Добавьте хотя бы один вопрос")
	}
	return nil
}

// POST /api/admin/author-quizzes — создать
func (h *Handlers) AdminCreateAuthorQuiz(c *fiber.Ctx) error {
	var req authorQuizRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}
	if req.ID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Укажите ID квиза"})
	}
	if err := validateQuiz(req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	_, err := h.Pool.Exec(context.Background(),
		`INSERT INTO author_quizzes (id, title, description, question_ids)
		 VALUES ($1, $2, $3, $4)`,
		req.ID, req.Title, req.Description, req.QuestionIDs)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return c.Status(409).JSON(fiber.Map{"error": "Квиз с таким ID уже существует"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка создания квиза"})
	}
	return c.JSON(fiber.Map{"status": "created"})
}

// PUT /api/admin/author-quizzes/:id — изменить
func (h *Handlers) AdminUpdateAuthorQuiz(c *fiber.Ctx) error {
	id := c.Params("id")
	var req authorQuizRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}
	if err := validateQuiz(req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	tag, err := h.Pool.Exec(context.Background(),
		`UPDATE author_quizzes SET title=$2, description=$3, question_ids=$4 WHERE id=$1`,
		id, req.Title, req.Description, req.QuestionIDs)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка обновления"})
	}
	if tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Квиз не найден"})
	}
	return c.JSON(fiber.Map{"status": "updated"})
}

// DELETE /api/admin/author-quizzes/:id — удалить
func (h *Handlers) AdminDeleteAuthorQuiz(c *fiber.Ctx) error {
	id := c.Params("id")
	tag, err := h.Pool.Exec(context.Background(),
		`DELETE FROM author_quizzes WHERE id=$1`, id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка удаления"})
	}
	if tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Квиз не найден"})
	}
	return c.JSON(fiber.Map{"status": "deleted"})
}
