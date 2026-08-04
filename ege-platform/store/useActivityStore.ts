import { create } from "zustand";
import type { Activity } from "@/types";

type ActivityState = {
  activity: Activity | null;
  setActivity: (activity: Activity | null) => void;
};

export const useActivityStore = create<ActivityState>((set) => ({
  activity: null,
  setActivity: (activity) => set({ activity }),
}));