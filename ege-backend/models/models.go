package models

import "encoding/json"

type Course struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Order       int    `json:"order"`
}

type Topic struct {
	ID           string          `json:"id"`
	CourseID     string          `json:"courseId"`
	Title        string          `json:"title"`
	Order        int             `json:"order"`
	TheoryBlocks json.RawMessage `json:"theoryBlocks"` // список блоков как есть
}

type Task struct {
	ID          string  `json:"id"`
	CourseID    string  `json:"courseId"`
	TopicID     string  `json:"topicId"`
	EgeNumber   int     `json:"egeNumber"`
	Difficulty  string  `json:"difficulty"`
	Statement   string  `json:"statement"`
	Answer      string  `json:"-"`
	Kind        *string `json:"kind,omitempty"`
	StarterCode *string `json:"starterCode,omitempty"`
	// Процент принятых решений (0–100). Указатель: null, если отправок ещё не было.
	Acceptance *int `json:"acceptance,omitempty"`
}

// Пользователь. id — это идентификатор из Яндекса.
type User struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatarUrl"`
	IsAdmin   bool   `json:"isAdmin"`
}

// Прогресс по одной задаче — форма совпадает с TaskResult на фронтенде
type TaskResult struct {
	Solved   bool `json:"solved"`
	Attempts int  `json:"attempts"`
}

// Карточка колоды ошибок. DueAt — в миллисекундах, как Date.now() в браузере.
type Mistake struct {
	TaskID       string `json:"taskId"`
	DueAt        int64  `json:"dueAt"`
	IntervalDays int    `json:"intervalDays"`
}

// Вопрос квиза. Correct с тегом json:"-" — верные ответы не уходят в браузер.
type QuizQuestion struct {
	ID          string   `json:"id"`
	TopicID     string   `json:"topicId"`
	Question    string   `json:"question"`
	Options     []string `json:"options"`
	Correct     []int    `json:"-"`
	Explanation string   `json:"-"`
	Seconds     int      `json:"seconds"`
}

// Попытка прохождения квиза
type QuizAttempt struct {
	ID          string   `json:"id"`
	QuestionIDs []string `json:"-"`
	Deadline    int64    `json:"deadline"` // миллисекунды, как Date.now()
}

// AdminTask — задача с ответом (только для админских эндпоинтов)
type AdminTask struct {
	ID          string  `json:"id"`
	CourseID    string  `json:"courseId"`
	TopicID     string  `json:"topicId"`
	EgeNumber   int     `json:"egeNumber"`
	Difficulty  string  `json:"difficulty"`
	Statement   string  `json:"statement"`
	Answer      string  `json:"answer"`
	Kind        *string `json:"kind,omitempty"`
	StarterCode *string `json:"starterCode,omitempty"`
	Solution    string  `json:"solution"`
	Hints       []Hint  `json:"hints"`
}

// Подсказка к задаче
type Hint struct {
	Order int    `json:"order"`
	Body  string `json:"body"`
}

// Файл-вложение к задаче (без содержимого — только описание)
type TaskFile struct {
	ID       int64  `json:"id"`
	Filename string `json:"filename"`
	Mime     string `json:"mime"`
	Size     int    `json:"size"`
}

type AuthorVariant struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	TaskIDs     []string `json:"taskIds"`
}

type AuthorQuiz struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	QuestionIDs []string `json:"questionIds"`
}
