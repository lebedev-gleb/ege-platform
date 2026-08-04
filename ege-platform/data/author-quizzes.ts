import type { AuthorQuiz } from "@/types";

export const authorQuizzes: AuthorQuiz[] = [
  {
    id: "aq-basics",
    title: "База, без которой никуда",
    description: "Опорные вопросы по системам счисления и логике",
    questionIds: [
      "qz-numsys-1",
      "qz-numsys-2",
      "qz-numsys-4",
      "qz-numsys-5",
      "qz-logic-1",
      "qz-logic-2",
      "qz-logic-4",
      "qz-logic-5",
    ],
  },
  {
    id: "aq-python",
    title: "Python: проверь себя",
    description: "Все вопросы по переменным и циклам",
    questionIds: [
      "qz-pyvars-1",
      "qz-pyvars-2",
      "qz-pyvars-3",
      "qz-pyvars-4",
      "qz-pyloops-1",
      "qz-pyloops-2",
      "qz-pyloops-3",
      "qz-pyloops-4",
    ],
  },
];