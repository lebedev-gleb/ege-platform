import type { QuizQuestion } from "@/types";

export const quizQuestions: QuizQuestion[] = [
  // ---------- Системы счисления ----------
  {
    id: "qz-numsys-1",
    topicId: "inf-numsys",
    question: "Чему равно двоичное число 1010 в десятичной системе счисления?",
    options: ["8", "10", "12", "20"],
    correct: [1],
    explanation: "1·8 + 0·4 + 1·2 + 0·1 = 10.",
  },
  {
    id: "qz-numsys-2",
    topicId: "inf-numsys",
    question: "Сколько различных цифр используется в восьмеричной системе счисления?",
    options: ["7", "8", "9", "16"],
    correct: [1],
    explanation: "Цифры от 0 до 7 — всего восемь.",
  },
  {
    id: "qz-numsys-3",
    topicId: "inf-numsys",
    question: "Какие из чисел могут быть корректной записью в двоичной системе?",
    options: ["101", "210", "1101", "1023"],
    correct: [0, 2],
    explanation: "В двоичной записи допустимы только цифры 0 и 1.",
  },
  {
    id: "qz-numsys-4",
    topicId: "inf-numsys",
    question: "Чему равно шестнадцатеричное число 1F в десятичной системе?",
    options: ["15", "25", "31", "33"],
    correct: [2],
    explanation: "1·16 + F (то есть 15) = 31.",
  },
  {
    id: "qz-numsys-5",
    topicId: "inf-numsys",
    question: "Скольким двоичным разрядам соответствует одна шестнадцатеричная цифра?",
    options: ["2", "3", "4", "8"],
    correct: [2],
    explanation: "16 = 2⁴, поэтому одна цифра — это тетрада из четырёх двоичных разрядов.",
  },

  // ---------- Алгебра логики ----------
  {
    id: "qz-logic-1",
    topicId: "inf-logic",
    question: "Конъюнкция (И) двух высказываний истинна, когда…",
    options: [
      "истинно хотя бы одно из них",
      "истинны оба",
      "оба ложны",
      "их значения различны",
    ],
    correct: [1],
    explanation: "Конъюнкция истинна только при двух истинных операндах.",
  },
  {
    id: "qz-logic-2",
    topicId: "inf-logic",
    question: "Чему равно значение выражения ¬0?",
    options: ["0", "1", "Зависит от контекста", "Не определено"],
    correct: [1],
    explanation: "Инверсия меняет значение на противоположное: ¬0 = 1.",
  },
  {
    id: "qz-logic-3",
    topicId: "inf-logic",
    question: "Какие из выражений истинны?",
    options: ["1 ∨ 0", "1 ∧ 0", "¬0", "0 → 1"],
    correct: [0, 2, 3],
    explanation:
      "Ложна только конъюнкция 1 ∧ 0. Дизъюнкция с единицей, инверсия нуля и импликация из лжи истинны.",
  },
  {
    id: "qz-logic-4",
    topicId: "inf-logic",
    question: "Импликация A → B ложна, когда…",
    options: ["A = 0, B = 0", "A = 0, B = 1", "A = 1, B = 0", "A = 1, B = 1"],
    correct: [2],
    explanation: "Единственный ложный случай — когда из истины следует ложь.",
  },
  {
    id: "qz-logic-5",
    topicId: "inf-logic",
    question: "Сколько строк в таблице истинности выражения с тремя переменными?",
    options: ["3", "6", "8", "9"],
    correct: [2],
    explanation: "2³ = 8 комбинаций значений переменных.",
  },

  // ---------- Python: переменные ----------
  {
    id: "qz-pyvars-1",
    topicId: "py-vars",
    question: "Что выведет print(type(5))?",
    options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "5"],
    correct: [0],
    explanation: "5 — целое число, его тип int.",
  },
  {
    id: "qz-pyvars-2",
    topicId: "py-vars",
    question: "Какие из значений имеют тип str?",
    options: ["'привет'", "5", "'5'", "True"],
    correct: [0, 2],
    explanation: "Строка — всё, что записано в кавычках. Даже '5' — строка, а не число.",
  },
  {
    id: "qz-pyvars-3",
    topicId: "py-vars",
    question: "Что вернёт выражение int('7') + 1?",
    options: ["71", "8", "'8'", "Ошибку"],
    correct: [1],
    explanation: "int('7') превращает строку в число 7, затем 7 + 1 = 8.",
  },
  {
    id: "qz-pyvars-4",
    topicId: "py-vars",
    question: "Функция input() всегда возвращает…",
    options: ["число", "строку", "логическое значение", "список"],
    correct: [1],
    explanation: "Всё введённое приходит строкой — числа нужно преобразовывать через int() или float().",
  },

  // ---------- Python: циклы ----------
  {
    id: "qz-pyloops-1",
    topicId: "py-loops",
    question: "Сколько раз выполнится тело цикла for i in range(5)?",
    options: ["4", "5", "6", "Бесконечно"],
    correct: [1],
    explanation: "range(5) — это 0, 1, 2, 3, 4: пять значений.",
  },
  {
    id: "qz-pyloops-2",
    topicId: "py-loops",
    question: "Какие числа перебирает range(2, 6)?",
    options: ["2, 3, 4, 5, 6", "2, 3, 4, 5", "3, 4, 5, 6", "2, 4, 6"],
    correct: [1],
    explanation: "Левая граница входит в диапазон, правая — нет.",
  },
  {
    id: "qz-pyloops-3",
    topicId: "py-loops",
    question:
      "Что выведет программа: s = 0, затем for i in range(3): s = s + 2, затем print(s)?",
    options: ["2", "4", "6", "8"],
    correct: [2],
    explanation: "Тело выполнится три раза: 0 → 2 → 4 → 6.",
  },
  {
    id: "qz-pyloops-4",
    topicId: "py-loops",
    question: "Какие конструкции циклов есть в Python?",
    options: ["for", "while", "repeat", "loop"],
    correct: [0, 1],
    explanation: "В Python два цикла: for и while. repeat и loop — из других языков.",
  },
];