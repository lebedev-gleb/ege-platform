package handlers

import (
	"context"
	"errors"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgconn"
)

// ---------- Курсы ----------

type courseRequest struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Order       int    `json:"order"`
}

// POST /api/admin/courses — создать курс
func (h *Handlers) AdminCreateCourse(c *fiber.Ctx) error {
	var req courseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}
	if req.ID == "" || req.Title == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Укажите ID и название курса"})
	}
	_, err := h.Pool.Exec(context.Background(),
		`INSERT INTO courses (id, title, description, ord)
		 VALUES ($1, $2, $3, $4)`,
		req.ID, req.Title, req.Description, req.Order)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return c.Status(409).JSON(fiber.Map{"error": "Курс с таким ID уже существует"})
		}
		log.Println("AdminCreateCourse ошибка:", err) // ← показать причину в терминале
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка создания курса"})
	}

	return c.JSON(fiber.Map{"status": "created"})
}

// PUT /api/admin/courses/:id — изменить курс
func (h *Handlers) AdminUpdateCourse(c *fiber.Ctx) error {
	id := c.Params("id")
	var req courseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}
	tag, err := h.Pool.Exec(context.Background(),
		`UPDATE courses SET title=$2, description=$3, ord=$4 WHERE id=$1`,
		id, req.Title, req.Description, req.Order)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка обновления курса"})
	}
	if tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Курс не найден"})
	}
	return c.JSON(fiber.Map{"status": "updated"})
}

// DELETE /api/admin/courses/:id — удалить курс (вместе с разделами)
func (h *Handlers) AdminDeleteCourse(c *fiber.Ctx) error {
	id := c.Params("id")

	ctx := context.Background()
	tx, err := h.Pool.Begin(ctx)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer tx.Rollback(ctx)

	// Нельзя удалить курс, пока в его разделах есть задачи — сообщим об этом
	var taskCount int
	_ = tx.QueryRow(ctx,
		`SELECT COUNT(*) FROM tasks WHERE course_id=$1`, id).Scan(&taskCount)
	if taskCount > 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Сначала удалите или перенесите задачи этого курса",
		})
	}

	if _, err := tx.Exec(ctx, `DELETE FROM topics WHERE course_id=$1`, id); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка удаления разделов"})
	}
	tag, err := tx.Exec(ctx, `DELETE FROM courses WHERE id=$1`, id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка удаления курса"})
	}
	if tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Курс не найден"})
	}
	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка сохранения"})
	}
	return c.JSON(fiber.Map{"status": "deleted"})
}

// ---------- Разделы (topics) ----------

type sectionRequest struct {
	ID           string `json:"id"`
	CourseID     string `json:"courseId"`
	Title        string `json:"title"`
	Order        int    `json:"order"`
	TheoryBlocks string `json:"theoryBlocks"` // JSON-строка массива блоков
}

// POST /api/admin/sections — создать раздел
func (h *Handlers) AdminCreateSection(c *fiber.Ctx) error {
	var req sectionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}
	if req.ID == "" || req.CourseID == "" || req.Title == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Укажите ID, курс и название раздела"})
	}
	blocks := req.TheoryBlocks
	if blocks == "" {
		blocks = "[]"
	}
	_, err := h.Pool.Exec(context.Background(),
		`INSERT INTO topics (id, course_id, title, ord, theory_blocks, theory)
		 VALUES ($1, $2, $3, $4, $5, '{}')`,
		req.ID, req.CourseID, req.Title, req.Order, blocks)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return c.Status(409).JSON(fiber.Map{"error": "Раздел с таким ID уже существует"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка создания раздела"})
	}
	return c.JSON(fiber.Map{"status": "created"})
}

// PUT /api/admin/sections/:id — изменить раздел (название, порядок, теорию)
func (h *Handlers) AdminUpdateSection(c *fiber.Ctx) error {
	id := c.Params("id")
	var req sectionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}
	blocks := req.TheoryBlocks
	if blocks == "" {
		blocks = "[]"
	}
	tag, err := h.Pool.Exec(context.Background(),
		`UPDATE topics SET title=$2, ord=$3, theory_blocks=$4 WHERE id=$1`,
		id, req.Title, req.Order, blocks)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка обновления раздела"})
	}
	if tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Раздел не найден"})
	}
	return c.JSON(fiber.Map{"status": "updated"})
}

// DELETE /api/admin/sections/:id — удалить раздел
func (h *Handlers) AdminDeleteSection(c *fiber.Ctx) error {
	id := c.Params("id")

	var taskCount int
	_ = h.Pool.QueryRow(context.Background(),
		`SELECT COUNT(*) FROM tasks WHERE topic_id=$1`, id).Scan(&taskCount)
	if taskCount > 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Сначала удалите или перенесите задачи этого раздела",
		})
	}

	tag, err := h.Pool.Exec(context.Background(),
		`DELETE FROM topics WHERE id=$1`, id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка удаления раздела"})
	}
	if tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Раздел не найден"})
	}
	return c.JSON(fiber.Map{"status": "deleted"})
}
