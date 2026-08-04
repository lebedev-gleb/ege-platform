"use client";

import { useSyncExternalStore } from "react";

// Официальный способ React узнать «мы уже в браузере?».
// Возвращает false на сервере и в момент гидратации, true — после того
// как страница ожила в браузере. Без useEffect и setState, поэтому
// новое правило React больше не ругается.
const subscribe = () => () => {};

export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true, // значение в браузере
    () => false // значение на сервере
  );
}