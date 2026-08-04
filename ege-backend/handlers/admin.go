package handlers

import (
	"context"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"ege-backend/models"
)

// AdminRequired — пускает дальше только администратора.
// Ставится ПОСЛЕ AuthRequired: тот кладёт userID, мы сверяем со списком.
func (h *Handlers) AdminRequired(c *fiber.Ctx) error {
	if !h.AdminIDs[userID(c)] {
		return c.Status(403).JSON(fiber.Map{"error": "Доступ только для администратора"})
	}
	return c.Next()
}

// GET /api/admin/tasks — все задачи С ответами, решением и подсказками
func (h *Handlers) AdminListTasks(c *fiber.Ctx) error {
	rows, err := h.Pool.Query(context.Background(),
		`SELECT id, course_id, topic_id, ege_number, difficulty,
		        statement, answer, kind, starter_code, solution
		 FROM tasks ORDER BY id`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()

	tasks := []models.AdminTask{}
	for rows.Next() {
		var t models.AdminTask
		if err := rows.Scan(&t.ID, &t.CourseID, &t.TopicID, &t.EgeNumber,
			&t.Difficulty, &t.Statement, &t.Answer, &t.Kind, &t.StarterCode,
			&t.Solution); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		t.Hints = []models.Hint{}
		tasks = append(tasks, t)
	}

	// Догружаем подсказки для всех задач одним запросом
	hintRows, err := h.Pool.Query(context.Background(),
		`SELECT task_id, ord, body FROM task_hints ORDER BY task_id, ord`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer hintRows.Close()

	hintsByTask := map[string][]models.Hint{}
	for hintRows.Next() {
		var taskID string
		var hint models.Hint
		if err := hintRows.Scan(&taskID, &hint.Order, &hint.Body); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		hintsByTask[taskID] = append(hintsByTask[taskID], hint)
	}
	for i := range tasks {
		if hs, ok := hintsByTask[tasks[i].ID]; ok {
			tasks[i].Hints = hs
		}
	}
	return c.JSON(tasks)
}

type adminTaskRequest struct {
	ID          string   `json:"id"`
	TopicID     string   `json:"topicId"`
	EgeNumber   int      `json:"egeNumber"`
	Difficulty  string   `json:"difficulty"`
	Statement   string   `json:"statement"`
	Answer      string   `json:"answer"`
	Kind        string   `json:"kind"`
	StarterCode string   `json:"starterCode"`
	Solution    string   `json:"solution"`
	Hints       []string `json:"hints"` // тексты подсказок по порядку
}

// Проверка обязательных полей и вычисление course_id по теме
func (h *Handlers) validateTask(req adminTaskRequest) (string, error) {
	if req.TopicID == "" || req.Statement == "" || req.Answer == "" {
		return "", errors.New("Заполните тему, условие и ответ")
	}
	if req.Difficulty != "easy" && req.Difficulty != "medium" && req.Difficulty != "hard" {
		return "", errors.New("Некорректная сложность")
	}
	var courseID string
	err := h.Pool.QueryRow(context.Background(),
		`SELECT course_id FROM topics WHERE id = $1`, req.TopicID).Scan(&courseID)
	if err != nil {
		return "", errors.New("Тема не найдена")
	}
	return courseID, nil
}

// Готовим значения kind/starter_code: пустые превращаем в NULL
func kindArgs(req adminTaskRequest) (any, any) {
	var kind any = nil
	var starter any = nil
	if req.Kind == "code" {
		kind = "code"
		if req.StarterCode != "" {
			starter = req.StarterCode
		}
	}
	return kind, starter
}

// POST /api/admin/tasks — создать задачу (с решением и подсказками)
func (h *Handlers) AdminCreateTask(c *fiber.Ctx) error {
	var req adminTaskRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}
	if req.ID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Укажите ID задания"})
	}
	courseID, err := h.validateTask(req)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	kind, starter := kindArgs(req)

	ctx := context.Background()
	tx, err := h.Pool.Begin(ctx)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx,
		`INSERT INTO tasks (id, course_id, topic_id, ege_number, difficulty,
		                    statement, answer, kind, starter_code, solution)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		req.ID, courseID, req.TopicID, req.EgeNumber, req.Difficulty,
		req.Statement, req.Answer, kind, starter, req.Solution)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return c.Status(409).JSON(fiber.Map{"error": "Задание с таким ID уже существует"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка создания задачи"})
	}
	if err := replaceHints(ctx, tx, req.ID, req.Hints); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка сохранения подсказок"})
	}
	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка сохранения"})
	}
	return c.JSON(fiber.Map{"status": "created"})
}

// PUT /api/admin/tasks/:id — изменить задачу (с решением и подсказками)
func (h *Handlers) AdminUpdateTask(c *fiber.Ctx) error {
	id := c.Params("id")
	var req adminTaskRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}
	courseID, err := h.validateTask(req)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	kind, starter := kindArgs(req)

	ctx := context.Background()
	tx, err := h.Pool.Begin(ctx)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer tx.Rollback(ctx)

	tag, err := tx.Exec(ctx,
		`UPDATE tasks SET course_id=$2, topic_id=$3, ege_number=$4,
		        difficulty=$5, statement=$6, answer=$7, kind=$8,
		        starter_code=$9, solution=$10
		 WHERE id=$1`,
		id, courseID, req.TopicID, req.EgeNumber, req.Difficulty,
		req.Statement, req.Answer, kind, starter, req.Solution)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка обновления задачи"})
	}
	if tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Задача не найдена"})
	}
	if err := replaceHints(ctx, tx, id, req.Hints); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка сохранения подсказок"})
	}
	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка сохранения"})
	}
	return c.JSON(fiber.Map{"status": "updated"})
}

// DELETE /api/admin/tasks/:id — удалить задачу вместе с прогрессом по ней.
// Транзакция: либо всё удалится, либо ничего (без «наполовину»).
func (h *Handlers) AdminDeleteTask(c *fiber.Ctx) error {
	id := c.Params("id")

	tx, err := h.Pool.Begin(context.Background())
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer tx.Rollback(context.Background())

	// Сначала зависимые записи (иначе внешние ключи не дадут удалить задачу)
	if _, err := tx.Exec(context.Background(),
		`DELETE FROM task_results WHERE task_id=$1`, id); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка удаления"})
	}
	if _, err := tx.Exec(context.Background(),
		`DELETE FROM mistakes WHERE task_id=$1`, id); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка удаления"})
	}
	tag, err := tx.Exec(context.Background(),
		`DELETE FROM tasks WHERE id=$1`, id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка удаления"})
	}
	if tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Задача не найдена"})
	}

	if err := tx.Commit(context.Background()); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка сохранения"})
	}
	return c.JSON(fiber.Map{"status": "deleted"})
}

// Внутри переданной транзакции: удаляем старые подсказки и вставляем новые
// (пустые строки пропускаем). Порядок — по позиции в массиве.
func replaceHints(ctx context.Context, tx pgx.Tx, taskID string, hints []string) error {
	if _, err := tx.Exec(ctx, `DELETE FROM task_hints WHERE task_id=$1`, taskID); err != nil {
		return err
	}
	ord := 1
	for _, body := range hints {
		if body == "" {
			continue
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO task_hints (task_id, ord, body) VALUES ($1, $2, $3)`,
			taskID, ord, body); err != nil {
			return err
		}
		ord++
	}
	return nil
}

// GET /api/admin/quiz-questions — все вопросы квизов (для сборки авторских квизов)
func (h *Handlers) AdminListQuizQuestions(c *fiber.Ctx) error {
	rows, err := h.Pool.Query(context.Background(),
		`SELECT id, topic_id, question, options, correct, explanation, seconds
		 FROM quiz_questions ORDER BY topic_id, id`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()

	type adminQuestion struct {
		ID       string   `json:"id"`
		TopicID  string   `json:"topicId"`
		Question string   `json:"question"`
		Options  []string `json:"options"`
		Correct  []int    `json:"correct"`
		Seconds  int      `json:"seconds"`
	}
	list := []adminQuestion{}
	for rows.Next() {
		var q adminQuestion
		var explanation string
		if err := rows.Scan(&q.ID, &q.TopicID, &q.Question, &q.Options,
			&q.Correct, &explanation, &q.Seconds); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		list = append(list, q)
	}
	return c.JSON(list)
}
