package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
)

// GET /api/me/activity — сводка активности текущего пользователя
func (h *Handlers) GetActivity(c *fiber.Ctx) error {
	uid := userID(c)

	// Загружаем все дни активности пользователя (отсортированные)
	rows, err := h.Pool.Query(context.Background(),
		`SELECT day, solved FROM activity_days
		 WHERE user_id = $1 ORDER BY day`, uid)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка базы данных"})
	}
	defer rows.Close()

	// Собираем: карту "дата -> сколько решено" и множество дней
	type dayCount struct {
		Date  string `json:"date"` // YYYY-MM-DD
		Count int    `json:"count"`
	}
	days := []dayCount{}
	daySet := map[string]bool{}
	totalSolved := 0
	for rows.Next() {
		var d time.Time
		var solved int
		if err := rows.Scan(&d, &solved); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Ошибка чтения данных"})
		}
		key := d.Format("2006-01-02") // формат даты в Go — этот эталон
		days = append(days, dayCount{Date: key, Count: solved})
		daySet[key] = true
		totalSolved += solved
	}

	// Считаем стрик: идём от сегодня назад, пока есть дни подряд.
	// Если сегодня ещё не занимался, но вчера был — стрик ещё жив (считаем со вчера).
	today := time.Now()
	streak := 0
	start := today
	todayKey := today.Format("2006-01-02")
	yesterdayKey := today.AddDate(0, 0, -1).Format("2006-01-02")
	if !daySet[todayKey] {
		if daySet[yesterdayKey] {
			start = today.AddDate(0, 0, -1) // сегодня пропущен, но вчера был
		} else {
			start = time.Time{} // стрик уже прерван
		}
	}
	if !start.IsZero() {
		cur := start
		for {
			if daySet[cur.Format("2006-01-02")] {
				streak++
				cur = cur.AddDate(0, 0, -1)
			} else {
				break
			}
		}
	}

	// Рекорд стрика: самая длинная цепочка подряд идущих дней за всю историю
	best := 0
	if len(days) > 0 {
		run := 1
		best = 1
		layout := "2006-01-02"
		for i := 1; i < len(days); i++ {
			prev, _ := time.Parse(layout, days[i-1].Date)
			cur, _ := time.Parse(layout, days[i].Date)
			if cur.Sub(prev).Hours() == 24 {
				run++
			} else {
				run = 1
			}
			if run > best {
				best = run
			}
		}
	}

	return c.JSON(fiber.Map{
		"streak":      streak,      // дней без перерыва сейчас
		"best":        best,        // рекорд
		"activeDays":  len(days),   // всего дней занятий
		"totalSolved": totalSolved, // всего решено (сумма по дням)
		"days":        days,        // [{date, count}] для календаря
		"today":       todayKey,    // серверное "сегодня" (для подсветки)
	})
}
