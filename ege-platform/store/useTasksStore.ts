import { create } from "zustand";
import type { Task } from "@/types";

type TasksState = {
  tasks: Task[];
  loaded: boolean;
  setTasks: (tasks: Task[]) => void;
};

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  loaded: false,
  setTasks: (tasks) => set({ tasks, loaded: true }),
}));