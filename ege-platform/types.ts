export type Course = {
  id: string;
  title: string;
  description: string;
  order: number;
};

export type Topic = {
  id: string;
  courseId: string;
  title: string;
  order: number;
  theoryBlocks: TheoryBlock[];
};

export type Difficulty = "easy" | "medium" | "hard";

// Поля answer больше нет: правильные ответы живут только на сервере
export type Task = {
  id: string;
  courseId: string;
  topicId: string;
  egeNumber: number;
  difficulty: Difficulty;
  statement: string;
  kind?: "code";
  starterCode?: string;
  acceptance?: number; // процент решаемости, если есть отправки
};

export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  social: string;
  password: string;
};

export type QuizQuestion = {
  id: string;
  topicId: string;
  question: string;
  options: string[];
  correct: number[];
  explanation: string;
};

export type AuthorVariant = {
  id: string;
  title: string;
  description: string;
  taskIds: string[];
};

export type AuthorQuiz = {
  id: string;
  title: string;
  description: string;
  questionIds: string[];
};

// Вопрос квиза для админки (с правильными ответами)
export type AdminQuizQuestion = {
  id: string;
  topicId: string;
  question: string;
  options: string[];
  correct: number[];
  seconds: number;
};

// ---------- Пользователь и ответы сервера ----------

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  isAdmin: boolean;
};

export type TaskResult = {
  solved: boolean;
  attempts: number;
};

export type ReviewItem = {
  taskId: string;
  dueAt: number; // миллисекунды, как Date.now()
  intervalDays: number;
};

export type SubmitResult = {
  correct: boolean;
  solved: boolean;
  attempts: number;
  correctAnswer: string;
};

export type ReviewResult = {
  correct: boolean;
  correctAnswer: string;
  nextDays: number | null;
  learned: boolean;
};

// ---------- Квизы с сервера ----------

// Вопрос в игре — без верных ответов, но со своим лимитом секунд
export type QuizPlayQuestion = {
  id: string;
  topicId: string;
  question: string;
  options: string[];
  seconds: number;
};

export type QuizStartResponse = {
  attemptId: string;
  questions: QuizPlayQuestion[];
};

// Ответ сервера на проверку одного вопроса
export type QuizCheckResponse = {
  isCorrect: boolean;
  expired: boolean;
  correct: number[];
  explanation: string;
};

export type AdminTask = {
  id: string;
  courseId: string;
  topicId: string;
  egeNumber: number;
  difficulty: Difficulty;
  statement: string;
  answer: string;
  kind?: "code";
  starterCode?: string;
  solution: string;
  hints: { order: number; body: string }[];
};

// ---------- Активность и стрик ----------

export type ActivityDay = {
  date: string; // YYYY-MM-DD
  count: number;
};

export type Activity = {
  streak: number;
  best: number;
  activeDays: number;
  totalSolved: number;
  days: ActivityDay[];
  today: string; // серверное «сегодня»
};

export type TaskFile = {
  id: number;
  filename: string;
  mime: string;
  size: number;
};

export type VariantRow = {
  taskId: string;
  egeNumber: number;
  draft: string;
  correct: boolean;
  correctAnswer: string | null;
};

export type VariantAttempt = {
  id: number;
  title: string;
  total: number;
  correct: number;
  seconds: number;
  createdAt: number; // миллисекунды
  rows: VariantRow[];
};

export type TheoryBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "image"; imageId: number; caption?: string };

  export type QuizResultRow = {
  question: string;
  options: string[];
  picked: number[];
  correct: number[];
  explanation: string;
  isCorrect: boolean;
  expired: boolean;
};

export type QuizResult = {
  id: number;
  title: string;
  sourceId: string;
  total: number;
  correct: number;
  createdAt: number;
  rows: QuizResultRow[];
};

export type AuthorProgress = {
  variants: Record<string, number>; // id варианта -> лучший %
  quizzes: Record<string, number>; // id квиза -> лучший %
};