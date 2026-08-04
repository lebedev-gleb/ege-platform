package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"

	"ege-backend/models"
)

// ---------- Наши JWT-токены ----------

// issueToken выписывает подписанный токен с id пользователя внутри
func (h *Handlers) issueToken(userID string) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   userID, // кто это — попадёт в поле "sub"
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * 24 * time.Hour)), // 30 дней
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(h.JWTSecret)
}

// AuthRequired — middleware: пропускает дальше только с нашим действительным токеном.
// Токен приходит в заголовке: Authorization: Bearer <токен>.
func (h *Handlers) AuthRequired(c *fiber.Ctx) error {
	header := c.Get("Authorization")
	raw := strings.TrimPrefix(header, "Bearer ")
	if raw == "" || raw == header {
		return c.Status(401).JSON(fiber.Map{"error": "Требуется вход"})
	}

	token, err := jwt.Parse(raw, func(t *jwt.Token) (any, error) {
		// Убеждаемся, что подпись именно HMAC (наш метод) — защита от подмены
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("неверный метод подписи")
		}
		return h.JWTSecret, nil
	})
	if err != nil || !token.Valid {
		return c.Status(401).JSON(fiber.Map{"error": "Недействительный токен"})
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Недействительный токен"})
	}
	sub, _ := claims["sub"].(string)
	if sub == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Недействительный токен"})
	}

	c.Locals("userID", sub) // кладём id пользователя для обработчиков
	return c.Next()
}

// userID достаёт id пользователя, положенный middleware’ом
func userID(c *fiber.Ctx) string {
	id, _ := c.Locals("userID").(string)
	return id
}

// ---------- Вход через Яндекс ----------

type yandexTokenResponse struct {
	AccessToken string `json:"access_token"`
}

type yandexUserInfo struct {
	ID              string `json:"id"`
	DisplayName     string `json:"display_name"`
	RealName        string `json:"real_name"`
	Login           string `json:"login"`
	DefaultEmail    string `json:"default_email"`
	DefaultAvatarID string `json:"default_avatar_id"`
	IsAvatarEmpty   bool   `json:"is_avatar_empty"`
}

type yandexLoginRequest struct {
	Code string `json:"code"`
}

// POST /api/auth/yandex — обмен кода на пользователя и выдача НАШЕГО токена
func (h *Handlers) YandexLogin(c *fiber.Ctx) error {
	var req yandexLoginRequest
	if err := c.BodyParser(&req); err != nil || req.Code == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Код не передан"})
	}

	// 1) Меняем code на access_token Яндекса
	form := url.Values{}
	form.Set("grant_type", "authorization_code")
	form.Set("code", req.Code)
	form.Set("client_id", h.YandexClientID)
	form.Set("client_secret", h.YandexClientSecret)

	tokenResp, err := http.PostForm("https://oauth.yandex.ru/token", form)
	if err != nil {
		return c.Status(502).JSON(fiber.Map{"error": "Яндекс недоступен"})
	}
	defer tokenResp.Body.Close()

	var yt yandexTokenResponse
	if err := json.NewDecoder(tokenResp.Body).Decode(&yt); err != nil {
		return c.Status(502).JSON(fiber.Map{"error": "Ошибка ответа Яндекса"})
	}
	if yt.AccessToken == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Не удалось авторизоваться в Яндексе"})
	}

	// 2) Спрашиваем у Яндекса, кто это
	infoReq, _ := http.NewRequest("GET", "https://login.yandex.ru/info?format=json", nil)
	infoReq.Header.Set("Authorization", "OAuth "+yt.AccessToken)
	infoResp, err := http.DefaultClient.Do(infoReq)
	if err != nil {
		return c.Status(502).JSON(fiber.Map{"error": "Яндекс недоступен"})
	}
	defer infoResp.Body.Close()

	var info yandexUserInfo
	if err := json.NewDecoder(infoResp.Body).Decode(&info); err != nil {
		return c.Status(502).JSON(fiber.Map{"error": "Ошибка данных пользователя"})
	}
	if info.ID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Пустой профиль Яндекса"})
	}

	// Имя: берём отображаемое, иначе реальное, иначе логин
	name := info.DisplayName
	if name == "" {
		name = info.RealName
	}
	if name == "" {
		name = info.Login
	}
	// Аватар: собираем URL, если он есть
	avatarURL := ""
	if !info.IsAvatarEmpty && info.DefaultAvatarID != "" {
		avatarURL = "https://avatars.yandex.net/get-yapic/" + info.DefaultAvatarID + "/islands-200"
	}

	// 3) Создаём или обновляем пользователя (id из Яндекса — наш user_id)
	user := models.User{
		ID:        info.ID,
		Name:      name,
		Email:     info.DefaultEmail,
		AvatarURL: avatarURL,
	}
	user.IsAdmin = h.AdminIDs[user.ID]
	_, err = h.Pool.Exec(context.Background(),
		`INSERT INTO users (id, name, email, avatar_url)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (id) DO UPDATE
		 SET name = EXCLUDED.name, email = EXCLUDED.email, avatar_url = EXCLUDED.avatar_url`,
		user.ID, user.Name, user.Email, user.AvatarURL)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка сохранения пользователя"})
	}

	// 4) Выдаём НАШ токен
	token, err := h.issueToken(user.ID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка выдачи токена"})
	}

	return c.JSON(fiber.Map{"token": token, "user": user})
}

// GET /api/me — данные текущего пользователя
func (h *Handlers) Me(c *fiber.Ctx) error {
	uid := userID(c)
	var u models.User
	err := h.Pool.QueryRow(context.Background(),
		`SELECT id, name, email, avatar_url FROM users WHERE id = $1`, uid).
		Scan(&u.ID, &u.Name, &u.Email, &u.AvatarURL)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Пользователь не найден"})
	}
	u.IsAdmin = h.AdminIDs[uid]
	return c.JSON(u)
}
