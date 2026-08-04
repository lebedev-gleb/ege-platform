// Отправляем пользователя на страницу разрешений Яндекса.
// Яндекс вернёт его на redirect_uri с временным кодом.
export function startYandexLogin() {
  const clientId = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID ?? "";
  const redirectUri = `${window.location.origin}/auth/callback`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
  });
  window.location.href = `https://oauth.yandex.ru/authorize?${params.toString()}`;
}