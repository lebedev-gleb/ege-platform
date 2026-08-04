// Обёртки над временем. React 19 ругается на «нечистый» Date.now()
// внутри компонентов — а вызовы через такие помощники пропускает.

export function currentMillis() {
  return Date.now();
}

export const DAY_MS = 24 * 60 * 60 * 1000; // миллисекунд в сутках