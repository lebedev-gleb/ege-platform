"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, LogIn, RotateCcw, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { topics } from "@/data/topics";
import {
  checkQuizQuestionApi,
  saveQuizApi,
  startAuthorQuizApi,
  startQuizApi,
} from "@/lib/api";
import AuthorQuizzesCarousel from "@/components/AuthorQuizzesCarousel";
import { useAuth } from "@/hooks/useAuth";
import { useNow } from "@/hooks/useNow";
import { startYandexLogin } from "@/lib/auth";
import type { QuizCheckResponse, QuizPlayQuestion } from "@/types";

type Phase = "setup" | "running" | "result";

const quizTopicIds = ["inf-numsys", "inf-logic", "py-vars", "py-loops"];
const availableTopics = topics.filter((t) => quizTopicIds.includes(t.id));

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function QuizPage() {
  const { isSignedIn } = useAuth();
  const nowTs = useNow();

  const [phase, setPhase] = useState<Phase>("setup");
  const [topicId, setTopicId] = useState(availableTopics[0]?.id ?? "");
  const [count, setCount] = useState(5);
  const [starting, setStarting] = useState(false);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizPlayQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);

  // Название и источник текущего квиза (для сохранения)
  const [quizTitle, setQuizTitle] = useState("Квиз");
  const [quizSource, setQuizSource] = useState("");

  const [startedAt, setStartedAt] = useState(0);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<QuizCheckResponse | null>(null);
  const [saved, setSaved] = useState(false);

  type Outcome = {
    question: QuizPlayQuestion;
    picked: number[];
    correct: number[];
    explanation: string;
    isCorrect: boolean;
    expired: boolean;
  };
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);

  const currentQuestion = questions[currentIndex];
  const inFeedback = feedback !== null;

  const questionDeadline =
    startedAt === 0 || !currentQuestion
      ? 0
      : startedAt + currentQuestion.seconds * 1000;
  const secondsLeft =
    questionDeadline === 0 || nowTs === 0
      ? 0
      : Math.max(0, Math.ceil((questionDeadline - nowTs) / 1000));
  const expired =
    phase === "running" &&
    !inFeedback &&
    questionDeadline !== 0 &&
    nowTs >= questionDeadline;

  function beginAttempt(
    data: { attemptId: string; questions: QuizPlayQuestion[] },
    title: string,
    source: string
  ) {
    setAttemptId(data.attemptId);
    setQuestions(data.questions);
    setQuizTitle(title);
    setQuizSource(source);
    setCurrentIndex(0);
    setSelected([]);
    setFeedback(null);
    setOutcomes([]);
    setSaved(false);
    setStartedAt(Date.now());
    setPhase("running");
  }

  async function handleStart() {
    if (!topicId || starting) return;
    setStarting(true);
    try {
      const data = await startQuizApi(topicId, count);
      const topicTitle =
        availableTopics.find((t) => t.id === topicId)?.title ?? "Квиз";
      beginAttempt(data, `Квиз: ${topicTitle}`, "");
    } catch {
      toast.error("Не удалось начать квиз", {
        description: "Проверьте, запущен ли бэкенд (go run .)",
      });
    } finally {
      setStarting(false);
    }
  }

  async function handleStartAuthor(quizId: string, title: string) {
    if (starting) return;
    setStarting(true);
    try {
      const data = await startAuthorQuizApi(quizId);
      beginAttempt(data, title, quizId);
    } catch {
      toast.error("Не удалось начать квиз");
    } finally {
      setStarting(false);
    }
  }

  async function check(picked: number[]) {
    if (!attemptId || !currentQuestion || checking) return;
    setChecking(true);
    try {
      const res = await checkQuizQuestionApi(
        attemptId,
        currentQuestion.id,
        startedAt,
        picked
      );
      setFeedback(res);
      setOutcomes((prev) => [
        ...prev,
        {
          question: currentQuestion,
          picked: res.expired ? [] : picked,
          correct: res.correct,
          explanation: res.explanation,
          isCorrect: res.isCorrect,
          expired: res.expired,
        },
      ]);
    } catch {
      toast.error("Не удалось проверить ответ");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (expired && !checking && !inFeedback) {
      queueMicrotask(() => check([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  // Сохраняем результат квиза, когда дошли до экрана итога
  useEffect(() => {
    if (phase !== "result" || saved || outcomes.length === 0) return;
    // queueMicrotask — чтобы setState не шёл синхронно в теле эффекта
    queueMicrotask(() => {
      setSaved(true);
      saveQuizApi({
        title: quizTitle,
        sourceId: quizSource,
        rows: outcomes.map((o) => ({
          question: o.question.question,
          options: o.question.options,
          picked: o.picked,
          correct: o.correct,
          explanation: o.explanation,
          isCorrect: o.isCorrect,
          expired: o.expired,
        })),
      }).catch(() => {
        // не критично для показа результата
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function toggleOption(index: number) {
    if (inFeedback) return;
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  function handleNext() {
    setFeedback(null);
    setSelected([]);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setStartedAt(Date.now());
    } else {
      setPhase("result");
    }
  }

  const score = outcomes.filter((o) => o.isCorrect).length;
  const total = questions.length;
  const scorePercent = total === 0 ? 0 : Math.round((score / total) * 100);

  return (
    <div className="py-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Квизы</h1>
        <p className="mt-2 text-muted">
          Случайные вопросы по теме или авторский квиз. Таймер серверный.
        </p>
      </div>

      {!isSignedIn ? (
        <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-dashed border-border p-14 text-center">
          <p className="font-medium">Войдите, чтобы проходить квизы</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Вопросы и таймер выдаёт сервер — для этого нужен аккаунт.
          </p>
          <button
            onClick={startYandexLogin}
            className="mx-auto mt-6 flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-white transition-all hover:opacity-90"
          >
            <LogIn size={15} /> Войти
          </button>
        </div>
      ) : (
        <>
          {phase === "setup" && (
            <div className="mx-auto mt-8 max-w-2xl">
              <p className="text-sm font-medium">Тема</p>
              <div className="mt-3 flex flex-col gap-2">
                {availableTopics.map((topic) => {
                  const isActive = topic.id === topicId;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setTopicId(topic.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                        isActive
                          ? "border-accent bg-accent/5"
                          : "border-border bg-surface hover:border-muted"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          isActive ? "border-accent bg-accent" : "border-border"
                        }`}
                      >
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <span className="text-sm font-medium">{topic.title}</span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-6 text-sm font-medium">Количество вопросов</p>
              <div className="mt-3 flex gap-2">
                {[3, 5, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`h-10 flex-1 rounded-xl text-sm font-medium transition-all ${
                      count === n
                        ? "bg-accent text-white"
                        : "border border-border bg-surface text-muted hover:text-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                Если вопросов в теме меньше — возьмём столько, сколько есть. На
                каждый вопрос свой таймер.
              </p>

              <button
                onClick={handleStart}
                disabled={!topicId || starting}
                className="mx-auto mt-8 flex h-11 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
              >
                {starting ? "Загружаем…" : "Начать квиз"}
              </button>

              {/* Авторские квизы — карусель под конструктором */}
              <div className="mx-auto mt-2 max-w-2xl">
                <AuthorQuizzesCarousel onStart={handleStartAuthor} />
              </div>
            </div>
          )}

          {phase === "running" && currentQuestion && (
            <div className="mx-auto mt-8 max-w-2xl">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted">
                  Вопрос {currentIndex + 1} из {questions.length}
                </p>
                {!inFeedback ? (
                  <span
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium tabular-nums ${
                      secondsLeft <= 5
                        ? "border-red-500/50 bg-red-500/10 text-red-500"
                        : "border-border bg-surface"
                    }`}
                  >
                    <Clock3 size={14} /> {secondsLeft} с
                  </span>
                ) : (
                  <span
                    className={`rounded-full border px-3 py-1 text-sm font-medium ${
                      feedback.expired
                        ? "border-red-500/50 bg-red-500/10 text-red-500"
                        : feedback.isCorrect
                          ? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400"
                          : "border-red-500/50 bg-red-500/10 text-red-500"
                    }`}
                  >
                    {feedback.expired
                      ? "Время вышло"
                      : feedback.isCorrect
                        ? "Верно"
                        : "Неверно"}
                  </span>
                )}
              </div>
              <div className="mt-3 flex gap-1.5">
                {questions.map((q, index) => (
                  <div
                    key={q.id}
                    className={`h-1.5 flex-1 rounded-full ${
                      index < currentIndex
                        ? "bg-accent"
                        : index === currentIndex
                          ? "bg-accent/40"
                          : "bg-border"
                    }`}
                  />
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-border bg-surface p-8">
                <p className="text-lg font-medium leading-relaxed">
                  {currentQuestion.question}
                </p>
                <p className="mt-2 text-xs text-muted">
                  Можно выбрать один или несколько вариантов
                </p>

                <div className="mt-5 flex flex-col gap-2">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selected.includes(index);
                    const isRight =
                      inFeedback && feedback.correct.includes(index);

                    let cls = "border-border bg-background hover:border-muted";
                    let markCls = "border-2 border-border";
                    let markIcon = null;

                    if (!inFeedback && isSelected) {
                      cls = "border-accent bg-accent/5";
                      markCls = "border-2 border-accent bg-accent text-white";
                      markIcon = <Check size={12} />;
                    }
                    if (inFeedback) {
                      if (isRight) {
                        cls = "border-green-500/60 bg-green-500/10";
                        markCls = "bg-green-500 text-white";
                        markIcon = <Check size={12} />;
                      } else if (isSelected) {
                        cls = "border-red-500/60 bg-red-500/10";
                        markCls = "bg-red-500 text-white";
                        markIcon = <X size={12} />;
                      } else {
                        cls = "border-border bg-background opacity-60";
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => toggleOption(index)}
                        disabled={inFeedback}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm transition-colors ${cls}`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${markCls}`}
                        >
                          {markIcon}
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>

                {inFeedback && (
                  <div
                    className={`mt-4 rounded-2xl border p-4 text-sm ${
                      feedback.isCorrect
                        ? "border-green-500/40 bg-green-500/5"
                        : "border-red-500/40 bg-red-500/5"
                    }`}
                  >
                    <p
                      className={`font-medium ${
                        feedback.isCorrect
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-500"
                      }`}
                    >
                      {feedback.expired
                        ? "Время вышло — засчитано как неверный"
                        : feedback.isCorrect
                          ? "Верно!"
                          : "Неверно"}
                    </p>
                    <p className="mt-1 text-muted">{feedback.explanation}</p>
                  </div>
                )}

                {!inFeedback ? (
                  <button
                    onClick={() => check(selected)}
                    disabled={selected.length === 0 || checking}
                    className="mt-6 flex h-11 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                  >
                    {checking ? "Проверяем…" : "Проверить"}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="mt-6 flex h-11 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  >
                    {currentIndex + 1 < questions.length
                      ? "Далее"
                      : "К результатам"}
                  </button>
                )}
              </div>
            </div>
          )}

          {phase === "result" && (
            <div className="mx-auto mt-8 max-w-2xl">
              <div className="rounded-3xl border border-border bg-surface p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Trophy size={22} />
                </div>
                <p className="mt-4 text-4xl font-semibold tracking-tight">
                  {score} из {total}
                </p>
                <p className="mt-1 text-muted">{scorePercent}% верных ответов</p>
                <button
                  onClick={() => setPhase("setup")}
                  className="mx-auto mt-6 flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-8 text-sm font-medium text-white transition-all hover:opacity-90"
                >
                  <RotateCcw size={16} /> К темам
                </button>
              </div>

              <h2 className="mt-10 text-center text-2xl font-semibold tracking-tight">
                Разбор
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {outcomes.map((o, index) => {
                  const pickedText =
                    o.picked.length > 0
                      ? o.picked.map((i) => o.question.options[i]).join(", ")
                      : o.expired
                        ? "Не успел ответить"
                        : "Без ответа";
                  const correctText = o.correct
                    .map((i) => o.question.options[i])
                    .join(", ");
                  return (
                    <div
                      key={o.question.id}
                      className={`rounded-3xl border p-6 ${
                        o.isCorrect
                          ? "border-green-500/40 bg-green-500/5"
                          : "border-red-500/40 bg-red-500/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
                            o.isCorrect ? "bg-green-500" : "bg-red-500"
                          }`}
                        >
                          {o.isCorrect ? <Check size={13} /> : <X size={13} />}
                        </span>
                        <p className="font-medium leading-relaxed">
                          {index + 1}. {o.question.question}
                        </p>
                      </div>
                      <div className="mt-3 pl-9 text-sm">
                        <p
                          className={o.isCorrect ? "text-muted" : "text-red-500"}
                        >
                          Ваш ответ: {pickedText}
                        </p>
                        {!o.isCorrect && (
                          <p className="mt-1 text-green-600 dark:text-green-400">
                            Верный ответ: {correctText}
                          </p>
                        )}
                        <p className="mt-2 text-muted">{o.explanation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}