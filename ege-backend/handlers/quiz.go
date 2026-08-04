package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/gofiber/fiber/v2"
)

func newID() string {
	b := make([]byte, 12)
	rand.Read(b)
	return hex.EncodeToString(b)
}

type startQuizRequest struct {
	TopicID string `json:"topicId"`
	Count   int    `json:"count"`
}

// Вопрос для ученика: без верных ответов, но со своим лимитом секунд
type publicQuestion struct {
	ID       string   `json:"id"`
	TopicID  string   `json:"topicId"`
	Question string   `json:"question"`
	Options  []string `json:"options"`
	Seconds  int      `json:"seconds"`
}

// POST /api/quiz/start — сервер выбирает вопросы и открывает попытку
func (h *Handlers) StartQuiz(c *fiber.Ctx) error {
	uid := userID(c)

	var req startQuizRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}
	if req.Count <= 0 {
		req.Count = 5
	}

	rows, err := h.Pool.Query(context.Background(),
		`SELECT id, topic_id, question, options, seconds
		 FROM quiz_questions
		 WHERE topic_id = $1
		 ORDER BY random()
		 LIMIT $2`, req.TopicID, req.Count)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()

	questions := []publicQuestion{}
	questionIDs := []string{}
	for rows.Next() {
		var q publicQuestion
		if err := rows.Scan(&q.ID, &q.TopicID, &q.Question, &q.Options, &q.Seconds); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		questions = append(questions, q)
		questionIDs = append(questionIDs, q.ID)
	}
	if len(questions) == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Нет вопросов по теме"})
	}

	attemptID := newID()
	_, err = h.Pool.Exec(context.Background(),
		`INSERT INTO quiz_attempts (id, user_id, question_ids, deadline)
		 VALUES ($1, $2, $3, now())`,
		attemptID, uid, questionIDs)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка создания попытки"})
	}

	return c.JSON(fiber.Map{
		"attemptId": attemptID,
		"questions": questions,
	})
}

type checkQuestionRequest struct {
	AttemptID string `json:"attemptId"`
	// Момент, когда сервер отдал вопрос ученику (мы вернём его на старте
	// вопроса), плюс лимит секунд — так сервер проверяет, не опоздал ли ответ.
	StartedAt int64 `json:"startedAt"` // миллисекунды
	Picked    []int `json:"picked"`
}

// sameIndexSet: выбранные индексы совпадают с верными как множества
func sameIndexSet(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	seen := map[int]bool{}
	for _, x := range a {
		seen[x] = true
	}
	for _, x := range b {
		if !seen[x] {
			return false
		}
	}
	return true
}

// POST /api/quiz/:attemptId/question/:qid — проверка ОДНОГО вопроса
func (h *Handlers) CheckQuizQuestion(c *fiber.Ctx) error {
	uid := userID(c)
	attemptID := c.Params("attemptId")
	qid := c.Params("qid")

	var req checkQuestionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}

	// Проверяем, что попытка принадлежит пользователю и что вопрос из неё
	var questionIDs []string
	err := h.Pool.QueryRow(context.Background(),
		`SELECT question_ids FROM quiz_attempts WHERE id = $1 AND user_id = $2`,
		attemptID, uid).Scan(&questionIDs)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Попытка не найдена"})
	}
	belongs := false
	for _, id := range questionIDs {
		if id == qid {
			belongs = true
			break
		}
	}
	if !belongs {
		return c.Status(400).JSON(fiber.Map{"error": "Вопрос не из этой попытки"})
	}

	// Достаём правильные ответы, пояснение и лимит секунд
	var options []string
	var correct []int
	var explanation string
	var seconds int
	err = h.Pool.QueryRow(context.Background(),
		`SELECT options, correct, explanation, seconds
		 FROM quiz_questions WHERE id = $1`, qid).
		Scan(&options, &correct, &explanation, &seconds)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Вопрос не найден"})
	}

	// ЧЕСТНЫЙ ТАЙМЕР ВОПРОСА: сервер сам считает дедлайн от startedAt.
	// Прибавляем 1 секунду форы на задержку сети.
	deadline := time.UnixMilli(req.StartedAt).Add(
		time.Duration(seconds+1) * time.Second)
	expired := time.Now().After(deadline)

	picked := req.Picked
	if expired {
		picked = []int{} // опоздал — ответ не засчитываем
	}
	isCorrect := len(picked) > 0 && sameIndexSet(picked, correct)

	return c.JSON(fiber.Map{
		"isCorrect":   isCorrect,
		"expired":     expired,
		"correct":     correct,
		"explanation": explanation,
	})
}

type startAuthorQuizRequest struct {
	QuizID string `json:"quizId"`
}

// POST /api/quiz/author/start — начать авторский квиз (фиксированный набор)
func (h *Handlers) StartAuthorQuiz(c *fiber.Ctx) error {
	uid := userID(c)

	var req startAuthorQuizRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректное тело запроса"})
	}

	// Берём список вопросов квиза
	var questionIDs []string
	err := h.Pool.QueryRow(context.Background(),
		`SELECT question_ids FROM author_quizzes WHERE id = $1`, req.QuizID).
		Scan(&questionIDs)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Квиз не найден"})
	}
	if len(questionIDs) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "В квизе нет вопросов"})
	}

	// Достаём вопросы в порядке квиза, БЕЗ правильных ответов
	rows, err := h.Pool.Query(context.Background(),
		`SELECT id, topic_id, question, options, seconds
		 FROM quiz_questions WHERE id = ANY($1)`, questionIDs)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()

	byID := map[string]publicQuestion{}
	for rows.Next() {
		var q publicQuestion
		if err := rows.Scan(&q.ID, &q.TopicID, &q.Question, &q.Options, &q.Seconds); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		byID[q.ID] = q
	}

	// Собираем в исходном порядке (как задал админ)
	questions := []publicQuestion{}
	orderedIDs := []string{}
	for _, id := range questionIDs {
		if q, ok := byID[id]; ok {
			questions = append(questions, q)
			orderedIDs = append(orderedIDs, id)
		}
	}
	if len(questions) == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Вопросы не найдены"})
	}

	attemptID := newID()
	_, err = h.Pool.Exec(context.Background(),
		`INSERT INTO quiz_attempts (id, user_id, question_ids, deadline)
		 VALUES ($1, $2, $3, now())`,
		attemptID, uid, orderedIDs)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка создания попытки"})
	}

	return c.JSON(fiber.Map{
		"attemptId": attemptID,
		"questions": questions,
	})
}
