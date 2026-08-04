import type { Task } from "@/types";

export const tasks: Task[] = [
  // ---------- Системы счисления ----------
  {
    id: "14001",
    courseId: "ege-informatics",
    topicId: "inf-numsys",
    egeNumber: 14,
    difficulty: "easy",
    statement:
      "Переведите число 1101110 из двоичной системы счисления в десятичную. В ответе запишите полученное число.",
  },
  {
    id: "14002",
    courseId: "ege-informatics",
    topicId: "inf-numsys",
    egeNumber: 14,
    difficulty: "medium",
    statement:
      "Сколько единиц содержится в двоичной записи десятичного числа 519?",
  },
  {
    id: "14003",
    courseId: "ege-informatics",
    topicId: "inf-numsys",
    egeNumber: 14,
    difficulty: "medium",
    statement:
      "Вычислите сумму чисел 10101₂ и 17₈. Ответ запишите в десятичной системе счисления.",
  },
  {
    id: "14004",
    courseId: "ege-informatics",
    topicId: "inf-numsys",
    egeNumber: 14,
    difficulty: "hard",
    statement:
      "В некоторой системе счисления десятичное число 23 записывается как 32. Найдите основание этой системы счисления.",
  },
  {
    id: "14005",
    courseId: "ege-informatics",
    topicId: "inf-numsys",
    egeNumber: 14,
    difficulty: "hard",
    statement:
      "Укажите наименьшее основание системы счисления, в которой запись десятичного числа 30 состоит ровно из трёх цифр.",
  },

  // ---------- Алгебра логики ----------
  {
    id: "02001",
    courseId: "ege-informatics",
    topicId: "inf-logic",
    egeNumber: 2,
    difficulty: "easy",
    statement:
      "Логическая функция F = ¬(A ∨ B). При каких значениях A и B функция F истинна? В ответе запишите сначала значение A, затем значение B, без пробела (например, 01).",
  },
  {
    id: "02002",
    courseId: "ege-informatics",
    topicId: "inf-logic",
    egeNumber: 2,
    difficulty: "easy",
    statement:
      "Сколько строк (не считая заголовка) содержит полная таблица истинности логического выражения с четырьмя переменными?",
  },
  {
    id: "02003",
    courseId: "ege-informatics",
    topicId: "inf-logic",
    egeNumber: 2,
    difficulty: "hard",
    statement:
      "Известно, что логическое выражение (A → B) ∧ ¬B истинно. Определите значения A и B. В ответе запишите сначала значение A, затем значение B, без пробела.",
  },
  {
    id: "15001",
    courseId: "ege-informatics",
    topicId: "inf-logic",
    egeNumber: 15,
    difficulty: "medium",
    statement:
      "Определите значение логического выражения (1 → 0) ∨ (1 ∧ 1). В ответе запишите 1, если выражение истинно, или 0, если ложно.",
  },

  // ---------- Кодирование информации ----------
  {
    id: "07001",
    courseId: "ege-informatics",
    topicId: "inf-coding",
    egeNumber: 7,
    difficulty: "medium",
    statement:
      "Текстовый документ состоит из 2 страниц. На каждой странице 32 строки, в каждой строке 64 символа. Мощность алфавита — 256 символов. Сколько килобайт занимает документ? В ответе запишите только число.",
  },
  {
    id: "11001",
    courseId: "ege-informatics",
    topicId: "inf-coding",
    egeNumber: 11,
    difficulty: "easy",
    statement:
      "Какое минимальное количество бит потребуется, чтобы закодировать каждую из 26 букв латинского алфавита отдельным двоичным кодом одинаковой длины?",
  },

  // ---------- Анализ алгоритмов ----------
  {
    id: "23001",
    courseId: "ege-informatics",
    topicId: "inf-algo",
    egeNumber: 23,
    difficulty: "medium",
    statement:
      "Исполнитель преобразует число на экране. У него две команды: «прибавь 3» и «умножь на 2». Исходное число — 1. Какое наименьшее количество команд потребуется, чтобы получить число 16?",
  },

  // ---------- Электронные таблицы ----------
  {
    id: "09001",
    courseId: "ege-informatics",
    topicId: "inf-tables",
    egeNumber: 9,
    difficulty: "easy",
    statement:
      "В ячейки A1:A5 записаны числа 2, 4, 6, 8, 10. Какое значение вернёт формула =СРЗНАЧ(A1:A5)?",
  },

  // ---------- Python: переменные ----------
  {
    id: "06001",
    courseId: "python-ege",
    topicId: "py-vars",
    egeNumber: 6,
    difficulty: "easy",
    statement:
      "Что выведет программа?\n\na = 7\nb = 2\nprint(a // b, a % b)\n\nВ ответе запишите два числа через пробел.",
  },
  {
    id: "06002",
    courseId: "python-ege",
    topicId: "py-vars",
    egeNumber: 6,
    difficulty: "easy",
    statement: "Что выведет программа?\n\nprint(int('5') + 3)",
  },

  // ---------- Python: условия ----------
  {
    id: "06003",
    courseId: "python-ege",
    topicId: "py-if",
    egeNumber: 6,
    difficulty: "easy",
    statement:
      "Что выведет программа?\n\nx = 15\nif x % 3 == 0 and x % 5 == 0:\n    print('FizzBuzz')\nelif x % 3 == 0:\n    print('Fizz')\nelse:\n    print('Buzz')",
  },

  // ---------- Python: циклы ----------
  {
    id: "06004",
    courseId: "python-ege",
    topicId: "py-loops",
    egeNumber: 6,
    difficulty: "easy",
    statement:
      "Что выведет программа?\n\ns = 0\nfor i in range(1, 6):\n    s = s + i\nprint(s)",
  },
  {
    id: "06005",
    courseId: "python-ege",
    topicId: "py-loops",
    egeNumber: 6,
    difficulty: "medium",
    statement:
      "Что выведет программа?\n\ns = 1\nfor i in range(4):\n    s = s * 2\nprint(s)",
  },
  {
    id: "06006",
    courseId: "python-ege",
    topicId: "py-loops",
    egeNumber: 6,
    difficulty: "hard",
    statement:
      "Что выведет программа?\n\ns = 0\nfor i in range(1, 10, 2):\n    s = s + 1\nprint(s)",
  },

  // ---------- Python: написание кода ----------
  {
    id: "25001",
    courseId: "python-ege",
    topicId: "py-vars",
    egeNumber: 25,
    difficulty: "easy",
    kind: "code",
    statement:
      "Допишите программу так, чтобы она вывела сумму чисел a и b. Программа должна вывести только число.",
    starterCode: "a = 5\nb = 7\n# выведите сумму a и b\n",
  },
  {
    id: "25002",
    courseId: "python-ege",
    topicId: "py-loops",
    egeNumber: 25,
    difficulty: "medium",
    kind: "code",
    statement:
      "Напишите программу, которая считает и выводит сумму всех целых чисел от 1 до 100 включительно. Программа должна вывести только число.",
    starterCode: "# посчитайте сумму чисел от 1 до 100\n# и выведите её одной командой print\n",
  },
  {
    id: "25003",
    courseId: "python-ege",
    topicId: "py-loops",
    egeNumber: 25,
    difficulty: "hard",
    kind: "code",
    statement:
      "Дан список чисел. Напишите программу, которая выводит, сколько в нём чётных чисел. Программа должна вывести только число.",
    starterCode: "numbers = [3, 8, 15, 22, 7, 40, 13, 6]\n# выведите количество чётных чисел\n",
  },
];