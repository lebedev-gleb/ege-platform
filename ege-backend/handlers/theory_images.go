package handlers

import (
	"context"
	"io"

	"github.com/gofiber/fiber/v2"
)

const maxImageSize = 8 * 1024 * 1024 // 8 МБ на картинку теории

// POST /api/admin/theory-images — загрузить картинку (multipart, поле "file")
func (h *Handlers) AdminUploadTheoryImage(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Файл не передан"})
	}
	if fileHeader.Size > maxImageSize {
		return c.Status(400).JSON(fiber.Map{"error": "Картинка больше 8 МБ"})
	}
	f, err := fileHeader.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Не удалось прочитать файл"})
	}
	defer f.Close()
	data, err := io.ReadAll(f)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Не удалось прочитать файл"})
	}
	mime := fileHeader.Header.Get("Content-Type")
	if mime == "" {
		mime = "application/octet-stream"
	}

	var id int64
	err = h.Pool.QueryRow(context.Background(),
		`INSERT INTO theory_images (mime, data) VALUES ($1, $2) RETURNING id`,
		mime, data).Scan(&id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка сохранения картинки"})
	}
	return c.JSON(fiber.Map{"id": id})
}

// GET /api/theory-images/:id — отдать картинку (для показа в теории)
func (h *Handlers) GetTheoryImage(c *fiber.Ctx) error {
	id := c.Params("id")
	var mime string
	var data []byte
	err := h.Pool.QueryRow(context.Background(),
		`SELECT mime, data FROM theory_images WHERE id=$1`, id).Scan(&mime, &data)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Картинка не найдена"})
	}
	if mime == "" {
		mime = "application/octet-stream"
	}
	c.Set("Content-Type", mime)
	return c.Send(data)
}
