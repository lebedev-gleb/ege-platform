import { useAuthStore } from "@/store/useAuthStore";
import type {
  AdminTask,
  AuthorQuiz,
  AdminQuizQuestion,
  Activity,
  Course,
  QuizCheckResponse,
  QuizStartResponse,
  ReviewItem,
  ReviewResult,
  SubmitResult,
  TaskFile,
  Task,
  Topic,
  TaskResult,
  User,
  AuthorVariant,
  VariantAttempt,
  VariantRow,
  QuizResult,
  QuizResultRow,
  AuthorProgress,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function fetchCourses(): Promise<Course[]> {
  const res = await fetch(`${API_URL}/api/courses`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Сервер ответил ошибкой: ${res.status}`);
  return res.json();
}

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${API_URL}/api/tasks`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Сервер ответил ошибкой: ${res.status}`);
  return res.json();
}

// Обмен кода Яндекса на наш токен и данные пользователя
export async function loginWithYandexCode(
  code: string
): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_URL}/api/auth/yandex`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error("auth failed");
  return res.json();
}

// Запрос с токеном. getState() читает токен вне React — так можно.
async function authFetch(path: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  // Токен протух или недействителен — выходим из аккаунта
  if (res.status === 401) {
    useAuthStore.getState().signOut();
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    // Пытаемся достать текст ошибки из тела ответа
    let message = `Сервер ответил ошибкой: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // тело не JSON — оставим общее сообщение
    }
    throw new Error(message);
  }
  return res.json();
}

export function submitAnswerApi(
  taskId: string,
  answer: string
): Promise<SubmitResult> {
  return authFetch(`/api/tasks/${taskId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

export function reviewAnswerApi(
  taskId: string,
  answer: string
): Promise<ReviewResult> {
  return authFetch(`/api/review/${taskId}`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

export function fetchProgress(): Promise<{
  taskResults: Record<string, TaskResult>;
  mistakes: Record<string, ReviewItem>;
}> {
  return authFetch(`/api/me/progress`);
}

export function startQuizApi(
  topicId: string,
  count: number
): Promise<QuizStartResponse> {
  return authFetch(`/api/quiz/start`, {
    method: "POST",
    body: JSON.stringify({ topicId, count }),
  });
}

export function checkQuizQuestionApi(
  attemptId: string,
  questionId: string,
  startedAt: number,
  picked: number[]
): Promise<QuizCheckResponse> {
  return authFetch(`/api/quiz/${attemptId}/question/${questionId}`, {
    method: "POST",
    body: JSON.stringify({ attemptId, startedAt, picked }),
  });
}

// Курс вместе с темами — для выпадающих списков в админке
export async function fetchCourse(
  id: string
): Promise<Course & { topics: Topic[] }> {
  const res = await fetch(`${API_URL}/api/courses/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Сервер ответил ошибкой: ${res.status}`);
  return res.json();
}

type AdminTaskPayload = {
  id: string;
  topicId: string;
  egeNumber: number;
  difficulty: string;
  statement: string;
  answer: string;
  kind: string;
  starterCode: string;
  solution: string;
  hints: string[]; // тексты подсказок по порядку
};

export function adminListTasksApi(): Promise<AdminTask[]> {
  return authFetch(`/api/admin/tasks`);
}

export function adminCreateTaskApi(task: AdminTaskPayload) {
  return authFetch(`/api/admin/tasks`, {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export function adminUpdateTaskApi(id: string, task: AdminTaskPayload) {
  return authFetch(`/api/admin/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(task),
  });
}

export function adminDeleteTaskApi(id: string) {
  return authFetch(`/api/admin/tasks/${id}`, { method: "DELETE" });
}

export function fetchActivity(): Promise<Activity> {
  return authFetch(`/api/me/activity`);
}

export function fetchHints(
  taskId: string
): Promise<{ order: number; body: string }[]> {
  return fetch(`${API_URL}/api/tasks/${taskId}/hints`, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : []))
    .catch(() => []);
}

export function fetchSolution(taskId: string): Promise<string> {
  // authFetch подставит токен; 403 (нет попытки) вернёт ошибку — обработаем в UI
  return authFetch(`/api/tasks/${taskId}/solution`).then(
    (data: { solution: string }) => data.solution
  );
}

// Список файлов задачи (открытый эндпоинт)
export function fetchFiles(taskId: string): Promise<TaskFile[]> {
  return fetch(`${API_URL}/api/tasks/${taskId}/files`, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : []))
    .catch(() => []);
}

// Прямая ссылка на скачивание файла
export function fileDownloadUrl(fileId: number): string {
  return `${API_URL}/api/files/${fileId}`;
}

// Загрузка файла админом (multipart). Content-Type НЕ ставим —
// браузер сам добавит границу multipart с нужным заголовком.
export async function adminUploadFileApi(
  taskId: string,
  file: File
): Promise<TaskFile> {
  const token = useAuthStore.getState().token;
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/admin/tasks/${taskId}/files`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    let message = "Не удалось загрузить файл";
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // тело не JSON
    }
    throw new Error(message);
  }
  return res.json();
}

export function adminDeleteFileApi(fileId: number) {
  return authFetch(`/api/admin/files/${fileId}`, { method: "DELETE" });
}

export function saveVariantApi(payload: {
  title: string;
  seconds: number;
  sourceId: string;
  rows: VariantRow[];
}) {
  return authFetch(`/api/variant/finish`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchVariants(): Promise<VariantAttempt[]> {
  return authFetch(`/api/me/variants`);
}

export function fetchAuthorVariants(): Promise<AuthorVariant[]> {
  return fetch(`${API_URL}/api/author-variants`, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : []))
    .catch(() => []);
}

type AuthorVariantPayload = {
  id: string;
  title: string;
  description: string;
  taskIds: string[];
};

export function adminCreateVariantApi(payload: AuthorVariantPayload) {
  return authFetch(`/api/admin/author-variants`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function adminUpdateVariantApi(id: string, payload: AuthorVariantPayload) {
  return authFetch(`/api/admin/author-variants/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function adminDeleteVariantApi(id: string) {
  return authFetch(`/api/admin/author-variants/${id}`, { method: "DELETE" });
}

export function fetchAuthorQuizzes(): Promise<AuthorQuiz[]> {
  return fetch(`${API_URL}/api/author-quizzes`, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : []))
    .catch(() => []);
}

export function startAuthorQuizApi(quizId: string): Promise<QuizStartResponse> {
  return authFetch(`/api/quiz/author/start`, {
    method: "POST",
    body: JSON.stringify({ quizId }),
  });
}

export function fetchAdminQuizQuestions(): Promise<AdminQuizQuestion[]> {
  return authFetch(`/api/admin/quiz-questions`);
}

type AuthorQuizPayload = {
  id: string;
  title: string;
  description: string;
  questionIds: string[];
};

export function adminCreateQuizApi(payload: AuthorQuizPayload) {
  return authFetch(`/api/admin/author-quizzes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function adminUpdateQuizApi(id: string, payload: AuthorQuizPayload) {
  return authFetch(`/api/admin/author-quizzes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function adminDeleteQuizApi(id: string) {
  return authFetch(`/api/admin/author-quizzes/${id}`, { method: "DELETE" });
}

export function theoryImageUrl(id: number): string {
  return `${API_URL}/api/theory-images/${id}`;
}

type CoursePayload = {
  id: string;
  title: string;
  description: string;
  order: number;
};

export function adminCreateCourseApi(payload: CoursePayload) {
  return authFetch(`/api/admin/courses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function adminUpdateCourseApi(id: string, payload: CoursePayload) {
  return authFetch(`/api/admin/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function adminDeleteCourseApi(id: string) {
  return authFetch(`/api/admin/courses/${id}`, { method: "DELETE" });
}

type SectionPayload = {
  id: string;
  courseId: string;
  title: string;
  order: number;
  theoryBlocks: string; // JSON-строка массива блоков
};

export function adminCreateSectionApi(payload: SectionPayload) {
  return authFetch(`/api/admin/sections`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function adminUpdateSectionApi(id: string, payload: SectionPayload) {
  return authFetch(`/api/admin/sections/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function adminDeleteSectionApi(id: string) {
  return authFetch(`/api/admin/sections/${id}`, { method: "DELETE" });
}

export async function adminUploadTheoryImageApi(file: File): Promise<{ id: number }> {
  const token = useAuthStore.getState().token;
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/admin/theory-images`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    let message = "Не удалось загрузить картинку";
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // тело не JSON
    }
    throw new Error(message);
  }
  return res.json();
}

export function fetchMe(): Promise<User> {
  return authFetch(`/api/me`);
}

export function saveQuizApi(payload: {
  title: string;
  sourceId: string;
  rows: QuizResultRow[];
}) {
  return authFetch(`/api/quiz/finish`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchQuizResults(): Promise<QuizResult[]> {
  return authFetch(`/api/me/quizzes`);
}

export function fetchAuthorProgress(): Promise<AuthorProgress> {
  return authFetch(`/api/me/author-progress`);
}