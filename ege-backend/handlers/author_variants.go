package handlers

import (
	"context"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgconn"

	"ege-backend/models"
)

// GET /api/author-variants — список авторских вариантов (новые сверху)
func (h *Handlers) GetAuthorVariants(c *fiber.Ctx) error {
	rows, err := h.Pool.Query(context.Background(),
		`SELECT id, title, description, task_ids
		 FROM author_variants ORDER BY created_at DESC`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()

	variants := []models.AuthorVariant{}
	for rows.Next() {
		var v models.AuthorVariant
		if err := rows.Scan(&v.ID, &v.Title, &v.Description, &v.TaskIDs); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		variants = append(variants, v)
	}
	return c.JSON(variants)
}

type authorVariantRequest struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	TaskIDs     []string `json:"taskIds"`
}

func validateVariant(req authorVariantRequest) error {
	if req.Title == "" {
		return errors.New("Укажите название варианта")
	}
	if len(req.TaskIDs) == 0 {
		return errors.New("Добавьте хотя бы одно задание")
	}
	return nil
}

// POST /api/admin/author-variants — создать
func (h *Handlers) AdminCreateAuthorVariant(c *fiber.Ctx) error {
	var req authorVariantRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}
	if req.ID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Укажите ID варианта"})
	}
	if err := validateVariant(req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	_, err := h.Pool.Exec(context.Background(),
		`INSERT INTO author_variants (id, title, description, task_ids)
		 VALUES ($1, $2, $3, $4)`,
		req.ID, req.Title, req.Description, req.TaskIDs)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return c.Status(409).JSON(fiber.Map{"error": "Вариант с таким ID уже существует"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка создания варианта"})
	}
	return c.JSON(fiber.Map{"status": "created"})
}

// PUT /api/admin/author-variants/:id — изменить
func (h *Handlers) AdminUpdateAuthorVariant(c *fiber.Ctx) error {
	id := c.Params("id")
	var req authorVariantRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}
	if err := validateVariant(req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	tag, err := h.Pool.Exec(context.Background(),
		`UPDATE author_variants SET title=$2, description=$3, task_ids=$4 WHERE id=$1`,
		id, req.Title, req.Description, req.TaskIDs)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка обновления"})
	}
	if tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Вариант не найден"})
	}
	return c.JSON(fiber.Map{"status": "updated"})
}

// DELETE /api/admin/author-variants/:id — удалить
func (h *Handlers) AdminDeleteAuthorVariant(c *fiber.Ctx) error {
	id := c.Params("id")
	tag, err := h.Pool.Exec(context.Background(),
		`DELETE FROM author_variants WHERE id=$1`, id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка удаления"})
	}
	if tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Вариант не найден"})
	}
	return c.JSON(fiber.Map{"status": "deleted"})
}
