import type { AuthorVariant } from "@/types";

export const authorVariants: AuthorVariant[] = [
  {
    id: "av-numsys",
    title: "Системы счисления: полный разбор",
    description: "Все задачи темы — от перевода до поиска основания",
    taskIds: ["14001", "14002", "14003", "14004", "14005"],
  },
  {
    id: "av-mixed-1",
    title: "Смешанный вариант №1",
    description: "По одной задаче из пяти разных тем",
    taskIds: ["14002", "02001", "07001", "09001", "06004"],
  },
  {
    id: "av-python",
    title: "Python с кратким ответом",
    description: "Шесть задач «что выведет программа»",
    taskIds: ["06001", "06002", "06003", "06004", "06005", "06006"],
  },
];