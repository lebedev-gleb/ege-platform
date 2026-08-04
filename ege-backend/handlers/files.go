package handlers

import (
	"context"
	"io"
	"net/url"

	"github.com/gofiber/fiber/v2"

	"ege-backend/models"
)

const maxFileSize = 15 * 1024 * 1024 // 15 МБ

// GET /api/tasks/:id/files — список файлов задачи (без содержимого)
func (h *Handlers) GetTaskFiles(c *fiber.Ctx) error {
	taskID := c.Params("id")
	rows, err := h.Pool.Query(context.Background(),
		`SELECT id, filename, mime, size FROM task_files
		 WHERE task_id = $1 ORDER BY id`, taskID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()

	files := []models.TaskFile{}
	for rows.Next() {
		var f models.TaskFile
		if err := rows.Scan(&f.ID, &f.Filename, &f.Mime, &f.Size); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		files = append(files, f)
	}
	return c.JSON(files)
}

// GET /api/files/:fileId — скачать файл
func (h *Handlers) DownloadFile(c *fiber.Ctx) error {
	id := c.Params("fileId")

	var filename, mime string
	var data []byte
	err := h.Pool.QueryRow(context.Background(),
		`SELECT filename, mime, data FROM task_files WHERE id = $1`, id).
		Scan(&filename, &mime, &data)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Файл не найден"})
	}
	if mime == "" {
		mime = "application/octet-stream"
	}

	c.Set("Content-Type", mime)
	// filename* с UTF-8 — чтобы кириллица в имени файла не ломалась
	c.Set("Content-Disposition",
		"attachment; filename*=UTF-8''"+url.PathEscape(filename))
	return c.Send(data)
}

// POST /api/admin/tasks/:id/files — загрузить файл (multipart, поле "file")
func (h *Handlers) AdminUploadFile(c *fiber.Ctx) error {
	taskID := c.Params("id")

	fileHeader, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Файл не передан"})
	}
	if fileHeader.Size > maxFileSize {
		return c.Status(400).JSON(fiber.Map{"error": "Файл больше 15 МБ"})
	}

	// Проверяем, что задача существует (дружелюбнее, чем ошибка внешнего ключа)
	var exists bool
	_ = h.Pool.QueryRow(context.Background(),
		`SELECT EXISTS(SELECT 1 FROM tasks WHERE id = $1)`, taskID).Scan(&exists)
	if !exists {
		return c.Status(404).JSON(fiber.Map{"error": "Задача не найдена"})
	}

	// Читаем содержимое файла в память
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
		`INSERT INTO task_files (task_id, filename, mime, size, data)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		taskID, fileHeader.Filename, mime, len(data), data).Scan(&id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка сохранения файла"})
	}

	return c.JSON(models.TaskFile{
		ID:       id,
		Filename: fileHeader.Filename,
		Mime:     mime,
		Size:     len(data),
	})
}

// DELETE /api/admin/files/:fileId — удалить файл
func (h *Handlers) AdminDeleteFile(c *fiber.Ctx) error {
	id := c.Params("fileId")
	tag, err := h.Pool.Exec(context.Background(),
		`DELETE FROM task_files WHERE id = $1`, id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка удаления"})
	}
	if tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Файл не найден"})
	}
	return c.JSON(fiber.Map{"status": "deleted"})
}
