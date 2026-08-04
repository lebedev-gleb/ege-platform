"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useHydrated } from "@/hooks/useHydrated";

export function useAuth() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const hydrated = useHydrated();

  return {
    hydrated,
    isSignedIn: hydrated && !!token,
    user: hydrated ? user : null,
    signOut,
  };
}