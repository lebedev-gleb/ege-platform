import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

type AuthState = {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      // Обновить только пользователя (например, свежий isAdmin с сервера)
      setUser: (user) => set((state) => ({ ...state, user })),
      signOut: () => set({ token: null, user: null }),
    }),
    { name: "ege-auth" }
  )
);