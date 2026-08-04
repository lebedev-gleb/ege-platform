package main

import (
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

	"ege-backend/db"
	"ege-backend/handlers"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Файл .env не найден — используем системные переменные")
	}

	pool, err := db.Connect()
	if err != nil {
		log.Fatal("Не удалось подключиться к базе: ", err)
	}
	defer pool.Close()
	log.Println("База подключена, миграции применены")

	app := fiber.New(fiber.Config{
		BodyLimit: 20 * 1024 * 1024, // до 20 МБ — под загрузку файлов
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000",
		// Authorization обязателен: в нём фронтенд передаёт токен
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Список Яндекс-ID администраторов из .env (через запятую)
	adminIDs := map[string]bool{}
	for _, id := range strings.Split(os.Getenv("ADMIN_USER_IDS"), ",") {
		id = strings.TrimSpace(id)
		if id != "" {
			adminIDs[id] = true
		}
	}

	h := &handlers.Handlers{
		Pool:               pool,
		JWTSecret:          []byte(os.Getenv("JWT_SECRET")),
		YandexClientID:     os.Getenv("YANDEX_CLIENT_ID"),
		YandexClientSecret: os.Getenv("YANDEX_CLIENT_SECRET"),
		AdminIDs:           adminIDs,
	}

	// Открытые маршруты
	app.Get("/api/health", h.Health)
	app.Get("/api/courses", h.GetCourses)
	app.Get("/api/courses/:id", h.GetCourse)
	app.Get("/api/tasks", h.GetTasks)
	app.Get("/api/tasks/:id/files", h.GetTaskFiles)
	app.Get("/api/files/:fileId", h.DownloadFile)
	app.Post("/api/auth/yandex", h.YandexLogin)
	app.Get("/api/author-variants", h.GetAuthorVariants)
	app.Get("/api/author-quizzes", h.GetAuthorQuizzes)
	app.Get("/api/theory-images/:id", h.GetTheoryImage)

	// Защищённые маршруты: сначала проверка токена, потом обработчик
	app.Get("/api/me", h.AuthRequired, h.Me)
	app.Get("/api/me/progress", h.AuthRequired, h.GetProgress)
	app.Post("/api/tasks/:id/submit", h.AuthRequired, h.SubmitAnswer)
	app.Post("/api/quiz/start", h.AuthRequired, h.StartQuiz)
	app.Post("/api/quiz/:attemptId/question/:qid", h.AuthRequired, h.CheckQuizQuestion)
	app.Post("/api/review/:taskId", h.AuthRequired, h.ReviewAnswer)
	app.Get("/api/admin/tasks", h.AuthRequired, h.AdminRequired, h.AdminListTasks)
	app.Post("/api/admin/tasks", h.AuthRequired, h.AdminRequired, h.AdminCreateTask)
	app.Post("/api/admin/tasks/:id/files", h.AuthRequired, h.AdminRequired, h.AdminUploadFile)
	app.Delete("/api/admin/files/:fileId", h.AuthRequired, h.AdminRequired, h.AdminDeleteFile)
	app.Put("/api/admin/tasks/:id", h.AuthRequired, h.AdminRequired, h.AdminUpdateTask)
	app.Delete("/api/admin/tasks/:id", h.AuthRequired, h.AdminRequired, h.AdminDeleteTask)
	app.Get("/api/me/activity", h.AuthRequired, h.GetActivity)
	app.Get("/api/tasks/:id/hints", h.GetHints)
	app.Get("/api/tasks/:id/solution", h.AuthRequired, h.GetSolution)
	app.Post("/api/variant/finish", h.AuthRequired, h.SaveVariant)
	app.Get("/api/me/variants", h.AuthRequired, h.GetVariants)
	app.Post("/api/admin/author-variants", h.AuthRequired, h.AdminRequired, h.AdminCreateAuthorVariant)
	app.Put("/api/admin/author-variants/:id", h.AuthRequired, h.AdminRequired, h.AdminUpdateAuthorVariant)
	app.Delete("/api/admin/author-variants/:id", h.AuthRequired, h.AdminRequired, h.AdminDeleteAuthorVariant)
	app.Post("/api/quiz/author/start", h.AuthRequired, h.StartAuthorQuiz)
	app.Get("/api/admin/quiz-questions", h.AuthRequired, h.AdminRequired, h.AdminListQuizQuestions)
	app.Post("/api/admin/author-quizzes", h.AuthRequired, h.AdminRequired, h.AdminCreateAuthorQuiz)
	app.Put("/api/admin/author-quizzes/:id", h.AuthRequired, h.AdminRequired, h.AdminUpdateAuthorQuiz)
	app.Delete("/api/admin/author-quizzes/:id", h.AuthRequired, h.AdminRequired, h.AdminDeleteAuthorQuiz)
	app.Post("/api/admin/courses", h.AuthRequired, h.AdminRequired, h.AdminCreateCourse)
	app.Put("/api/admin/courses/:id", h.AuthRequired, h.AdminRequired, h.AdminUpdateCourse)
	app.Delete("/api/admin/courses/:id", h.AuthRequired, h.AdminRequired, h.AdminDeleteCourse)
	app.Post("/api/admin/sections", h.AuthRequired, h.AdminRequired, h.AdminCreateSection)
	app.Put("/api/admin/sections/:id", h.AuthRequired, h.AdminRequired, h.AdminUpdateSection)
	app.Delete("/api/admin/sections/:id", h.AuthRequired, h.AdminRequired, h.AdminDeleteSection)
	app.Post("/api/admin/theory-images", h.AuthRequired, h.AdminRequired, h.AdminUploadTheoryImage)
	app.Post("/api/quiz/finish", h.AuthRequired, h.SaveQuizResult)
	app.Get("/api/me/quizzes", h.AuthRequired, h.GetQuizResults)
	app.Get("/api/me/author-progress", h.AuthRequired, h.GetAuthorProgress)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("Сервер запущен: http://localhost:" + port)
	log.Fatal(app.Listen(":" + port))
}
