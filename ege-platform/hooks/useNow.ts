"use client";

import { useSyncExternalStore } from "react";

// «Текущее время» без setState в эффектах: подписка на часы браузера
// через useSyncExternalStore. Тикаем раз в секунду — этого хватает и для
// секундомера варианта, и для обратного отсчёта квизов, и для колоды ошибок.

let now = 0;
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    now = Date.now();
    intervalId = setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, 1000);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function getSnapshot() {
  return now;
}

function getServerSnapshot() {
  return 0;
}

export function useNow() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}