package handlers

import (
	"context"
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"ege-backend/models"
)

// Handlers держит всё, что нужно обработчикам: пул БД, секрет для токенов
// и ключи приложения Яндекса.
type Handlers struct {
	Pool               *pgxpool.Pool
	JWTSecret          []byte
	YandexClientID     string
	YandexClientSecret string
	AdminIDs           map[string]bool
}

func (h *Handlers) Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "ok"})
}

// GET /api/courses — список курсов по порядку
func (h *Handlers) GetCourses(c *fiber.Ctx) error {
	rows, err := h.Pool.Query(context.Background(),
		`SELECT id, title, description, ord FROM courses ORDER BY ord, title`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()

	courses := []models.Course{}
	for rows.Next() {
		var course models.Course
		if err := rows.Scan(&course.ID, &course.Title, &course.Description, &course.Order); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		courses = append(courses, course)
	}
	return c.JSON(courses)
}

type courseWithTopics struct {
	models.Course
	Topics []models.Topic `json:"topics"`
}

// GET /api/courses/:id — курс + его разделы (с блоками теории)
func (h *Handlers) GetCourse(c *fiber.Ctx) error {
	id := c.Params("id")

	var course models.Course
	err := h.Pool.QueryRow(context.Background(),
		`SELECT id, title, description, ord FROM courses WHERE id = $1`, id).
		Scan(&course.ID, &course.Title, &course.Description, &course.Order)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Курс не найден"})
	}

	rows, err := h.Pool.Query(context.Background(),
		`SELECT id, course_id, title, ord, theory_blocks
		 FROM topics WHERE course_id = $1 ORDER BY ord, title`, id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()

	topics := []models.Topic{}
	for rows.Next() {
		var t models.Topic
		var blocks []byte
		if err := rows.Scan(&t.ID, &t.CourseID, &t.Title, &t.Order, &blocks); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		t.TheoryBlocks = json.RawMessage(blocks)
		topics = append(topics, t)
	}

	return c.JSON(fiber.Map{
		"id":          course.ID,
		"title":       course.Title,
		"description": course.Description,
		"order":       course.Order,
		"topics":      topics,
	})
}

// GET /api/tasks — задачи без ответов + процент решаемости (глобальный)
func (h *Handlers) GetTasks(c *fiber.Ctx) error {
	topicID := c.Query("topicId")

	// LEFT JOIN + агрегаты: для каждой задачи считаем сумму попыток (всего
	// отправок) и число решивших (принятые отправки). GROUP BY по первичному
	// ключу разрешён — остальные поля задачи от него функционально зависят.
	query := `
		SELECT t.id, t.course_id, t.topic_id, t.ege_number, t.difficulty,
		       t.statement, t.kind, t.starter_code,
		       COALESCE(SUM(tr.attempts), 0)               AS total,
		       COUNT(*) FILTER (WHERE tr.solved)           AS accepted
		FROM tasks t
		LEFT JOIN task_results tr ON tr.task_id = t.id`
	args := []any{}
	if topicID != "" {
		query += ` WHERE t.topic_id = $1`
		args = append(args, topicID)
	}
	query += ` GROUP BY t.id ORDER BY t.id`

	rows, err := h.Pool.Query(context.Background(), query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()

	tasks := []models.Task{}
	for rows.Next() {
		var task models.Task
		var total, accepted int64
		if err := rows.Scan(&task.ID, &task.CourseID, &task.TopicID,
			&task.EgeNumber, &task.Difficulty, &task.Statement,
			&task.Kind, &task.StarterCode, &total, &accepted); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		// Процент считаем, только если отправки были
		if total > 0 {
			a := int(accepted * 100 / total)
			task.Acceptance = &a
		}
		tasks = append(tasks, task)
	}
	return c.JSON(tasks)
}
