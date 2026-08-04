// Pyodide — Python, скомпилированный в WebAssembly.
// Среда качается один раз (~10 МБ) и живёт в памяти вкладки до перезагрузки.

type PyodideApi = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (line: string) => void }) => void;
  setStderr: (options: { batched: (line: string) => void }) => void;
};

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<PyodideApi>;
  }
}

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

let pyodidePromise: Promise<PyodideApi> | null = null;

// Ленивая загрузка: среда качается только при первом запуске кода,
// а не при открытии сайта. Повторные вызовы получают уже готовую среду.
export function loadPython(): Promise<PyodideApi> {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = new Promise<PyodideApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PYODIDE_URL + "pyodide.js";
    script.onload = () => {
      if (!window.loadPyodide) {
        reject(new Error("Pyodide не инициализировался"));
        return;
      }
      window.loadPyodide({ indexURL: PYODIDE_URL }).then(resolve).catch(reject);
    };
    script.onerror = () =>
      reject(
        new Error(
          "Не удалось скачать среду Python. Проверьте интернет и попробуйте ещё раз."
        )
      );
    document.head.appendChild(script);
  });

  // Если загрузка провалилась — забываем попытку, чтобы можно было повторить
  pyodidePromise.catch(() => {
    pyodidePromise = null;
  });

  return pyodidePromise;
}

// Запускает код и возвращает всё, что программа вывела, плюс ошибку, если была
export async function runPython(
  code: string
): Promise<{ output: string; error: string | null }> {
  const pyodide = await loadPython();
  let output = "";
  pyodide.setStdout({ batched: (line) => (output += line + "\n") });
  pyodide.setStderr({ batched: (line) => (output += line + "\n") });
  try {
    await pyodide.runPythonAsync(code);
    return { output, error: null };
  } catch (err) {
    return {
      output,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}