import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile, ReviewItem, TaskResult } from "@/types";

type AppState = {
  // ---- локальные настройки устройства (сохраняются на диск) ----
  myCourses: string[];
  addCourse: (courseId: string) => void;
  removeCourse: (courseId: string) => void;

  profile: Profile;
  updateProfile: (changes: Partial<Profile>) => void;

  variantTaskIds: string[];
  variantTitle: string;
  variantSourceId: string;
  setVariant: (taskIds: string[], title: string, sourceId?: string) => void;

  // ---- прогресс с сервера (только в памяти) ----
  taskResults: Record<string, TaskResult>;
  mistakes: Record<string, ReviewItem>;
  setProgress: (
    taskResults: Record<string, TaskResult>,
    mistakes: Record<string, ReviewItem>
  ) => void;
  clearProgress: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      myCourses: [],
      addCourse: (courseId) =>
        set((state) =>
          state.myCourses.includes(courseId)
            ? state
            : { myCourses: [...state.myCourses, courseId] }
        ),
      removeCourse: (courseId) =>
        set((state) => ({
          myCourses: state.myCourses.filter((id) => id !== courseId),
        })),

      profile: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        social: "",
        password: "",
      },
      updateProfile: (changes) =>
        set((state) => ({ profile: { ...state.profile, ...changes } })),

      variantTaskIds: [],
      variantTitle: "",
      variantSourceId: "",
      setVariant: (taskIds, title, sourceId = "") =>
        set({
          variantTaskIds: taskIds,
          variantTitle: title,
          variantSourceId: sourceId,
        }),

      taskResults: {},
      mistakes: {},
      setProgress: (taskResults, mistakes) => set({ taskResults, mistakes }),
      clearProgress: () => set({ taskResults: {}, mistakes: {} }),
    }),
    {
      name: "ege-app-storage",
      // partialize: что сохранять на диск. Прогресс НЕ сохраняем —
      // его источник теперь сервер, он подгружается при каждом входе.
      partialize: (state) => ({
        myCourses: state.myCourses,
        profile: state.profile,
        variantTaskIds: state.variantTaskIds,
        variantTitle: state.variantTitle,
        variantSourceId: state.variantSourceId,
      }),
    }
  )
);